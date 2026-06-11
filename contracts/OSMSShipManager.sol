
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IOSMSShipNFT.sol";

    error InvalidDeadline();
    error InvalidSignature();
    error ShipTypeDoesNotExist();
    error ShipTypeNotActive();
    error NoEchoOwned();
    error InsufficientTokenBalance();
    error InsufficientAllowance();
    error InvalidOwner();
    error InvalidCraftingSignature();
    error SignatureAlreadyUsed();
    error ShipCanOnlyBeCrafted(uint256 shipTypeId);
    error ShipCanOnlyBeMinted(uint256 shipTypeId);
    error InvalidTreasury();
    error NothingToWithdraw();

contract OSMSShipManager is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using SafeERC20 for IERC20;
    using Address for address payable;

    IOSMSShipNFT public nftContract;
    IEchoNFT public echoNFT;
    IERC20 public paymentToken;
    address public signer;

    address public treasury;
    uint256 public constant BURN_PERCENT = 50;

    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public usedSignatures;

    uint256 public constant DEADLINE_LIMIT = 5 minutes;

    event ShipMinted(address indexed minter, uint256 tokenId, uint256 shipTypeId);
    event ShipCrafted(address indexed crafter, uint256 tokenId, uint256 shipTypeId, bytes32 indexed craftId);
    event TreasuryUpdated(address newTreasury);

    constructor(
        address _nftContract,
        address _signer,
        address _echoNFT,
        address _paymentToken,
        address _treasury
    ) Ownable(msg.sender) {
        nftContract = IOSMSShipNFT(_nftContract);
        signer = _signer;
        echoNFT = IEchoNFT(_echoNFT);
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
    }



    function _processPayment(address payer, uint256 amount) internal {
        if (amount == 0) return;

        if (paymentToken.balanceOf(payer) < amount) revert InsufficientTokenBalance();
        if (paymentToken.allowance(payer, address(this)) < amount) revert InsufficientAllowance();

        uint256 toBurn = (amount * BURN_PERCENT) / 100;
        uint256 toTreasury = amount - toBurn;

        if (toBurn > 0) {

            ERC20Burnable(address(paymentToken)).burnFrom(payer, toBurn);
        }

        if (toTreasury > 0) {
            paymentToken.safeTransferFrom(payer, treasury, toTreasury);
        }
    }



    function mintShip(uint256 shipTypeId, uint256 deadline, bytes calldata signature)
    external
    nonReentrant
    {
        IOSMSShipNFT.ShipType memory ship = nftContract.getShipType(shipTypeId);


        if (shipTypeId >= nftContract.shipTypeCount()) revert ShipTypeDoesNotExist();
        if (ship.craftableOnly) revert ShipCanOnlyBeCrafted(shipTypeId);
        if (!ship.isActive) revert ShipTypeNotActive();
        if (!echoNFT.hasAnyToken(msg.sender)) revert NoEchoOwned();

        if (block.timestamp > deadline || deadline > block.timestamp + DEADLINE_LIMIT)
            revert InvalidDeadline();


        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, shipTypeId, nonces[msg.sender]++, deadline));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recovered = ethSignedMessageHash.recover(signature);
        if (recovered != signer) revert InvalidSignature();




        bool alreadyMintedFree = nftContract.hasMintedFreeNebular(msg.sender);


        bool isFreeCondition = (shipTypeId == 0 && !alreadyMintedFree && echoNFT.isEchoMinter(msg.sender));

        if (isFreeCondition) {
            nftContract.setFreeNebularMinted(msg.sender);
        } else {
            _processPayment(msg.sender, ship.mintPrice);
        }

        uint256 tokenId = nftContract.managerMint(msg.sender, shipTypeId);
        emit ShipMinted(msg.sender, tokenId, shipTypeId);
    }

    function craftShip(uint256 shipTypeId, bytes32 craftId, uint256 deadline, bytes calldata signature)
    external
    nonReentrant
    {
        IOSMSShipNFT.ShipType memory ship = nftContract.getShipType(shipTypeId);

        if (shipTypeId >= nftContract.shipTypeCount()) revert ShipTypeDoesNotExist();
        if (!ship.craftableOnly) revert ShipCanOnlyBeMinted(shipTypeId);
        if (!ship.isActive) revert ShipTypeNotActive();
        if (!echoNFT.hasAnyToken(msg.sender)) revert NoEchoOwned();

        if (block.timestamp > deadline || deadline > block.timestamp + DEADLINE_LIMIT)
            revert InvalidDeadline();

        bytes32 messageHash = keccak256(abi.encodePacked(
            "CRAFT_SHIP",
            msg.sender,
            shipTypeId,
            craftId,
            deadline
        ));

        if (usedSignatures[messageHash]) {
            revert SignatureAlreadyUsed();
        }

        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        if (recoveredSigner != signer) revert InvalidCraftingSignature();

        usedSignatures[messageHash] = true;


        _processPayment(msg.sender, ship.craftPrice);

        uint256 tokenId = nftContract.managerMint(msg.sender, shipTypeId);
        emit ShipCrafted(msg.sender, tokenId, shipTypeId, craftId);
    }



    function setNftContract(address _nftContract) external onlyOwner {
        nftContract = IOSMSShipNFT(_nftContract);
    }

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidOwner();
        signer = newSigner;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidTreasury();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function withdraw(address assetAddress) external onlyOwner {
        if (assetAddress == address(0)) {
            uint256 balance = address(this).balance;
            if (balance == 0) revert NothingToWithdraw();
            payable(owner()).sendValue(balance);
        } else {
            IERC20 token = IERC20(assetAddress);
            uint256 balance = token.balanceOf(address(this));
            if (balance == 0) revert NothingToWithdraw();
            token.safeTransfer(owner(), balance);
        }
    }


    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
}