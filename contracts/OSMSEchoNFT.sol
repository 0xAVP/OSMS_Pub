
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

    error PriceMustBeGreaterThanZero();
    error MaxMintMustBeGreaterThanZero();
    error InvalidEchoId(uint256 sentId);
    error InvalidPriceFeedAddress();
    error WhitelistOnlyMint(uint256 id);
    error PriceFeedIsInvalid();
    error PriceFeedDataTooOld(uint256 lastUpdateTimestamp);
    error MintLimitExceeded(uint256 echoId);
    error InsufficientPayment(uint256 required, uint256 sent);
    error InvalidTreasury();

interface IWhitelistManager {
    function isWhitelistedForEcho(uint256 echoId, address user) external view returns (bool);
    function recordEchoClaim(uint256 echoId, address user) external;
}

contract OSMSEchoNFT is ERC1155Pausable, ERC2981, Ownable, ReentrancyGuard {
    IWhitelistManager public whitelistManager;
    using Address for address payable;
    using Strings for uint256;
    uint256 private constant PRICE_FEED_STALENESS_THRESHOLD = 1 hours;
    uint256 public echoCount;
    mapping(uint256 => uint256) public usdPricesById;
    mapping(uint256 => uint256) public maxMints;
    mapping(uint256 => uint256) public mintedSupply;
    string public serverURI;
    mapping(address => bool) public hasMintedEchoMap;
    mapping(uint256 => bool) public whitelistOnlyById;
    mapping(address => uint256) public uniqueTokensOwned;
    AggregatorV3Interface public priceFeed;

    address public treasury;

    event EchoAdded(uint256 indexed id, uint256 priceInUsdWei, uint256 maxMint, bool whitelistOnly);
    event EchoMinted(address indexed minter, uint256 id);
    event ServerURIUpdated(string newServerURI);
    event TreasuryUpdated(address newTreasury);

    constructor(address _priceFeed, string memory _serverURI, address _treasury) ERC1155("") Ownable(msg.sender) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        serverURI = _serverURI;
        treasury = _treasury;
        _setDefaultRoyalty(_treasury, 100);
    }

    function initializeEchoes() external onlyOwner {
        require(echoCount == 0, "Echoes already initialized");
        addEcho(1 * 10**18, 500, false);
        addEcho(1 * 10**18, 500, false);
        addEcho(10 * 10**18, 250, false);
        addEcho(10 * 10**18, 250, false);
        addEcho(50 * 10**18, 50, false);
        addEcho(50 * 10**18, 50, false);
        addEcho(100 * 10**18, 25, false);
        addEcho(100 * 10**18, 25, false);
        addEcho(0, 5, true);
        addEcho(0, 1, true);
    }

    function addEcho(uint256 priceInUsdWei, uint256 maxMint, bool _whitelistOnly) public onlyOwner {
        if (priceInUsdWei == 0 && !_whitelistOnly) revert PriceMustBeGreaterThanZero();
        if (maxMint == 0) revert MaxMintMustBeGreaterThanZero();
        uint256 newId = echoCount++;
        usdPricesById[newId] = priceInUsdWei;
        maxMints[newId] = maxMint;
        whitelistOnlyById[newId] = _whitelistOnly;
        emit EchoAdded(newId, priceInUsdWei, maxMint, _whitelistOnly);
    }

    function setEchoPrice(uint256 id, uint256 priceInUsdWei) external onlyOwner {
        if (id >= echoCount) revert InvalidEchoId(id);
        if (priceInUsdWei == 0 && !whitelistOnlyById[id]) revert PriceMustBeGreaterThanZero();
        usdPricesById[id] = priceInUsdWei;
    }

    function setWhitelistOnly(uint256 id, bool _isWhitelistOnly) external onlyOwner {
        if (id >= echoCount) revert InvalidEchoId(id);
        if (_isWhitelistOnly == false && usdPricesById[id] == 0) {
            revert PriceMustBeGreaterThanZero();
        }
        whitelistOnlyById[id] = _isWhitelistOnly;
    }

    function setServerURI(string memory newServerURI) external onlyOwner {
        serverURI = newServerURI;
        emit ServerURIUpdated(newServerURI);
    }

    function setWhitelistManager(address _managerAddress) external onlyOwner {
        whitelistManager = IWhitelistManager(_managerAddress);
    }

    function setPriceFeed(address newPriceFeed) external onlyOwner {
        if (newPriceFeed == address(0)) revert InvalidPriceFeedAddress();
        priceFeed = AggregatorV3Interface(newPriceFeed);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidTreasury();
        treasury = newTreasury;
        _setDefaultRoyalty(newTreasury, 100);
        emit TreasuryUpdated(newTreasury);
    }

    function mintEcho(uint256 id) public payable nonReentrant {
        if (id >= echoCount) revert InvalidEchoId(id);
        if (mintedSupply[id] + 1 > maxMints[id]) revert MintLimitExceeded(id);
        bool isWhitelisted = false;

        if (address(whitelistManager) != address(0)) {
            isWhitelisted = whitelistManager.isWhitelistedForEcho(id, msg.sender);
        }

        if (isWhitelisted) {
            _refundETH(msg.value);
        } else {
            if (whitelistOnlyById[id]) {
                revert WhitelistOnlyMint(id);
            }

            uint256 usdPrice = usdPricesById[id];
            uint256 ethPriceInWei = usdToEth(usdPrice);
            if (msg.value < ethPriceInWei) revert InsufficientPayment(ethPriceInWei, msg.value);

            if (ethPriceInWei > 0) {
                payable(treasury).sendValue(ethPriceInWei);
            }

            _refundETH(msg.value - ethPriceInWei);
        }

        _mint(msg.sender, id, 1, "");
        mintedSupply[id] += 1;
        hasMintedEchoMap[msg.sender] = true;

        if (isWhitelisted) {
            whitelistManager.recordEchoClaim(id, msg.sender);
        }

        emit EchoMinted(msg.sender, id);
    }

    function _refundETH(uint256 amount) internal {
        if (amount > 0) {
            payable(msg.sender).sendValue(amount);
        }
    }

    function decimals() public view returns (uint8) {
        return priceFeed.decimals();
    }

    function getLatestPrice() public view returns (int) {
        (, int price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        if (price <= 0) revert PriceFeedIsInvalid();
        if (block.timestamp - updatedAt >= PRICE_FEED_STALENESS_THRESHOLD) revert PriceFeedDataTooOld(updatedAt);
        return price;
    }

    function usdToEth(uint256 usdAmount) public view returns (uint256) {
        int ethUsdPriceInt = getLatestPrice();
        uint256 ethUsdPrice = uint256(ethUsdPriceInt);
        return (usdAmount * 10**18) / (ethUsdPrice * 10**(18 - decimals()));
    }

    function uri(uint256 id) public view override returns (string memory) {
        if (id >= echoCount) revert InvalidEchoId(id);
        return string(abi.encodePacked(serverURI, "/", id.toString()));
    }

    function hasAnyToken(address user) public view returns (bool) {
        return uniqueTokensOwned[user] > 0;
    }

    function isEchoMinter(address user) public view returns (bool) {
        return hasMintedEchoMap[user];
    }

    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual override {
        if (from != address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                if (balanceOf(from, ids[i]) == amounts[i]) {
                    uniqueTokensOwned[from]--;
                }
            }
        }
        if (to != address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                if (balanceOf(to, ids[i]) == 0) {
                    uniqueTokensOwned[to]++;
                }
            }
        }
        super._update(from, to, ids, amounts);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(treasury).sendValue(balance);
    }
}