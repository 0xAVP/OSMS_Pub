
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./IOSMSShipNFT.sol";

contract OSMSShipNFT is ERC721Enumerable, ERC721Pausable, ERC2981, Ownable, IOSMSShipNFT {
    using Strings for uint256;

    uint256 private _tokenIdCounter;


    address public manager;
    string public serverURI;


    mapping(uint256 => ShipType) public shipTypes;
    uint256 public override shipTypeCount;
    mapping(uint256 => uint256) public tokenShipTypes;
    mapping(address => bool) public override hasMintedFreeNebular;

    event ShipTypeAdded(uint256 indexed shipTypeId, ShipType shipType);
    event ShipTypeUpdated(uint256 indexed shipTypeId, ShipType shipType);
    event ServerURIUpdated(string newServerURI);
    event ManagerUpdated(address newManager);

    error OnlyManager();
    error TokenDoesNotExist();
    error ShipTypeDoesNotExist();
    error PriceMustBeGreaterThanZero();

    constructor(string memory _serverURI) ERC721("ShipNFT", "SHIP") Ownable(msg.sender) {
        serverURI = _serverURI;
        _setDefaultRoyalty(msg.sender, 100);
    }

    modifier onlyManager() {
        if (msg.sender != manager) revert OnlyManager();
        _;
    }



    function managerMint(address to, uint256 shipTypeId) external override onlyManager returns (uint256) {
        if (shipTypeId >= shipTypeCount) revert ShipTypeDoesNotExist();

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        tokenShipTypes[tokenId] = shipTypeId;

        return tokenId;
    }

    function getShipType(uint256 shipTypeId) external view override returns (ShipType memory) {
        return shipTypes[shipTypeId];
    }



    function setManager(address _manager) external onlyOwner {
        manager = _manager;
        emit ManagerUpdated(_manager);
    }

    function initializeShipTypes() external onlyOwner {
        require(shipTypeCount == 0, "Ship types already initialized");

        _addShipType(0.0004 ether, 0, true, false);
        _addShipType(0.0004 ether, 0, true, false);
        _addShipType(0.0004 ether, 0, true, false);
        _addShipType(0.0004 ether, 0, true, false);
        _addShipType(0.0004 ether, 0, true, false);
        _addShipType(0.0004 ether, 0, true, false);
        _addShipType(0.0004 ether, 0, true, false);
        _addShipType(0, 0, true, true);
    }

    function addShipType(
        uint256 _mintPrice,
        uint256 _craftPrice,
        bool _isActive,
        bool _craftableOnly
    ) public onlyOwner {
        _addShipType(_mintPrice, _craftPrice, _isActive, _craftableOnly);
    }

    function _addShipType(uint256 _mintPrice, uint256 _craftPrice, bool _isActive, bool _craftableOnly) internal {
        if (!_craftableOnly && _mintPrice == 0) {
            revert PriceMustBeGreaterThanZero();
        }

        uint256 newShipTypeId = shipTypeCount;
        ShipType memory newType = ShipType({
            mintPrice: _mintPrice,
            craftPrice: _craftPrice,
            isActive: _isActive,
            craftableOnly: _craftableOnly
        });

        shipTypes[newShipTypeId] = newType;
        shipTypeCount++;
        emit ShipTypeAdded(newShipTypeId, newType);
    }

    function updateShipType(
        uint256 shipTypeId,
        uint256 _mintPrice,
        uint256 _craftPrice,
        bool _isActive,
        bool _craftableOnly
    ) external onlyOwner {
        if (shipTypeId >= shipTypeCount) revert ShipTypeDoesNotExist();
        if (!_craftableOnly && _mintPrice == 0) {
            revert PriceMustBeGreaterThanZero();
        }

        ShipType storage ship = shipTypes[shipTypeId];
        ship.mintPrice = _mintPrice;
        ship.craftPrice = _craftPrice;
        ship.isActive = _isActive;
        ship.craftableOnly = _craftableOnly;

        emit ShipTypeUpdated(shipTypeId, ship);
    }

    function setFreeNebularMinted(address user) external override onlyManager {
        hasMintedFreeNebular[user] = true;
    }



    function getShipTypeId(uint256 tokenId) public view returns (uint256) {
        if (ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return tokenShipTypes[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return string(abi.encodePacked(serverURI, "/", tokenId.toString()));
    }

    function getShipsByOwner(address owner, uint256 offset, uint256 limit) external view returns (uint256[] memory tokenIds, uint256[] memory typeIds) {
        uint256 ownerBalance = balanceOf(owner);
        if (offset >= ownerBalance) {
            return (new uint256[](0), new uint256[](0));
        }
        uint256 count = limit;
        if (offset + limit > ownerBalance) {
            count = ownerBalance - offset;
        }
        tokenIds = new uint256[](count);
        typeIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, offset + i);
            tokenIds[i] = tokenId;
            typeIds[i] = getShipTypeId(tokenId);
        }
    }



    function setServerURI(string memory newServerURI) external onlyOwner {
        serverURI = newServerURI;
        emit ServerURIUpdated(newServerURI);
    }

    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function pause() external onlyOwner {
        _pause();
    }
    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721Enumerable, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount) internal virtual override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}