
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

interface IOSMSToken is IERC20 {
    function mint(address to, uint256 amount) external;
}

    error InvalidDeadline();
    error InvalidSignature();
    error ZeroAddress();
    error InvalidSigner();
    error InvalidNonce();
    error MintLimitExceeded(uint256 requested, uint256 limit);
    error MintCooldownNotMet(uint256 nextMintTime);
    error InvalidTreasury();
    error NothingToWithdraw();
    error TimeLockNotExpired(uint256 unlockTime);
    error NoPendingUpdate();

contract OSMSTokenMinter is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using SafeERC20 for IERC20;
    using Address for address payable;

    IOSMSToken public token;
    address public signer;
    address public treasury;

    uint256 public cumulativeMinted;
    uint256 public mintingEpoch;
    uint256 public constant EPOCH_STEP = 1_000_000 * 10**18;

    uint256 public constant FEE_PERCENT = 10;
    uint256 public constant DEADLINE_LIMIT = 5 minutes;

    uint256 public maxMintAmount;
    uint256 public mintCooldown;
    uint256 public constant LIMITS_UPDATE_DELAY = 48 hours;
    uint256 public pendingMaxMintAmount;
    uint256 public pendingMintCooldown;
    uint256 public pendingLimitsTimestamp;

    mapping(address => uint256) public nonces;
    mapping(address => uint256) public lastMintTime;

    event TokensClaimed(
        address indexed user,
        uint256 totalMinted,
        uint256 userReceived,
        uint256 feeTaken,
        bytes32 indexed claimId
    );
    event EpochIncreased(uint256 newEpoch);
    event SignerUpdated(address newSigner);
    event TreasuryUpdated(address newTreasury);
    event LimitsUpdated(uint256 maxAmount, uint256 cooldown);
    event LimitsUpdateQueued(uint256 newMax, uint256 newCooldown, uint256 effectiveTime);

    constructor(
        address _token,
        address _signer,
        address _treasury,
        uint256 _initialCumulativeMinted,
        uint256 _maxMintAmount,
        uint256 _mintCooldown
    ) Ownable(msg.sender) {
        if (_token == address(0) || _signer == address(0)) revert ZeroAddress();

        token = IOSMSToken(_token);
        signer = _signer;
        treasury = _treasury;
        cumulativeMinted = _initialCumulativeMinted;

        maxMintAmount = _maxMintAmount;
        mintCooldown = _mintCooldown;

        if (_initialCumulativeMinted > 0) {
            mintingEpoch = (_initialCumulativeMinted / EPOCH_STEP) + 1;
        } else {

            mintingEpoch = 1;
        }
    }



    function queueMintConstraints(uint256 _newMaxMintAmount, uint256 _newMintCooldown) external onlyOwner {
        pendingMaxMintAmount = _newMaxMintAmount;
        pendingMintCooldown = _newMintCooldown;
        pendingLimitsTimestamp = block.timestamp + LIMITS_UPDATE_DELAY;

        emit LimitsUpdateQueued(_newMaxMintAmount, _newMintCooldown, pendingLimitsTimestamp);
    }

    /**
     * @notice Шаг 2: Применить новые лимиты после истечения таймера.
     */
    function applyMintConstraints() external onlyOwner {
        if (pendingLimitsTimestamp == 0) revert NoPendingUpdate();
        if (block.timestamp < pendingLimitsTimestamp) revert TimeLockNotExpired(pendingLimitsTimestamp);

        maxMintAmount = pendingMaxMintAmount;
        mintCooldown = pendingMintCooldown;


        delete pendingLimitsTimestamp;

        emit LimitsUpdated(maxMintAmount, mintCooldown);
    }

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidSigner();
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidTreasury();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }


    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }


    function withdraw(address assetAddress) external onlyOwner {
        if (assetAddress == address(0)) {
            uint256 balance = address(this).balance;
            if (balance == 0) revert NothingToWithdraw();
            payable(owner()).sendValue(balance);
        } else {
            IERC20 targetToken = IERC20(assetAddress);
            uint256 balance = targetToken.balanceOf(address(this));
            if (balance == 0) revert NothingToWithdraw();
            targetToken.safeTransfer(owner(), balance);
        }
    }



    function claimTokens(
        uint256 totalAmount,
        bytes32 claimId,
        uint256 deadline,
        bytes calldata signature
    )
    external
    nonReentrant
    whenNotPaused
    {
        if (block.timestamp > deadline || deadline > block.timestamp + DEADLINE_LIMIT)
            revert InvalidDeadline();

        if (totalAmount > maxMintAmount) {
            revert MintLimitExceeded(totalAmount, maxMintAmount);
        }

        if (mintCooldown > 0) {
            if (block.timestamp < lastMintTime[msg.sender] + mintCooldown) {
                revert MintCooldownNotMet(lastMintTime[msg.sender] + mintCooldown);
            }
        }

        lastMintTime[msg.sender] = block.timestamp;

        uint256 currentNonce = nonces[msg.sender];
        bytes32 messageHash = keccak256(abi.encodePacked(
            address(this),
            msg.sender,
            totalAmount,
            claimId,
            currentNonce,
            deadline
        ));

        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedMessageHash.recover(signature);

        if (recovered != signer) revert InvalidSignature();

        unchecked {
            nonces[msg.sender]++;
        }

        uint256 feeAmount = (totalAmount * FEE_PERCENT) / 100;
        uint256 userAmount = totalAmount - feeAmount;

        unchecked {
            cumulativeMinted += totalAmount;
        }

        uint256 currentEpochCalc = (cumulativeMinted / EPOCH_STEP) + 1;

        if (currentEpochCalc > mintingEpoch) {
            mintingEpoch = currentEpochCalc;
            emit EpochIncreased(currentEpochCalc);
        }

        if (userAmount > 0) token.mint(msg.sender, userAmount);
        if (feeAmount > 0) token.mint(treasury, feeAmount);

        emit TokensClaimed(msg.sender, totalAmount, userAmount, feeAmount, claimId);
    }

    function getMintingStatus(address user) external view returns (
        uint256 currentNonce,
        uint256 _maxMintAmount,
        uint256 _mintCooldown,
        uint256 _lastMintTime,
        uint256 _currentEpoch
    ) {
        return (
            nonces[user],
            maxMintAmount,
            mintCooldown,
            lastMintTime[user],
            mintingEpoch
        );
    }
}