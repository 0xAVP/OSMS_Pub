
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";

    error ZeroAddress();
    error UnauthorizedCaller();
    error NoClaimsLeft();

contract OSMSWLManager is Ownable {

    address public echoNFTContract;
    address public shipNFTContract;
    mapping(uint256 => mapping(address => uint256)) public echoWhitelists;
    mapping(uint256 => mapping(address => uint256)) public shipWhitelists;
    mapping(uint256 => mapping(address => uint256)) public echoWhitelistClaims;
    mapping(uint256 => mapping(address => uint256)) public shipWhitelistClaims;

    event WhitelistUpdated(address indexed user, uint256 indexed id, bool isWhitelisted, bool isEcho);
    event WhitelistClaimed(address indexed user, uint256 indexed id, bool isEcho);

    constructor(address _echoNFT, address _shipNFT) Ownable(msg.sender) {
        if (_echoNFT == address(0) || _shipNFT == address(0)) revert ZeroAddress();
        echoNFTContract = _echoNFT;
        shipNFTContract = _shipNFT;
    }

    function setContracts(address _echoNFT, address _shipNFT) external onlyOwner {
        if (_echoNFT == address(0) || _shipNFT == address(0)) revert ZeroAddress();
        echoNFTContract = _echoNFT;
        shipNFTContract = _shipNFT;
    }

    function addAddressesToEchoWhitelist(uint256 echoId, address[] calldata users, uint256 quantity) external onlyOwner {
        require(quantity > 0, "Quantity must be greater than zero");
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == address(0)) revert ZeroAddress();
            echoWhitelists[echoId][users[i]] = quantity;
            emit WhitelistUpdated(users[i], echoId, true, true);
        }
    }

    function removeAddressesFromEchoWhitelist(uint256 echoId, address[] calldata users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            echoWhitelists[echoId][users[i]] = 0;
            emit WhitelistUpdated(users[i], echoId, false, true);
        }
    }

    function addAddressesToShipWhitelist(uint256 shipTypeId, address[] calldata users, uint256 quantity) external onlyOwner {
        require(quantity > 0, "Quantity must be greater than zero");
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == address(0)) revert ZeroAddress();
            shipWhitelists[shipTypeId][users[i]] = quantity;
            emit WhitelistUpdated(users[i], shipTypeId, true, false);
        }
    }

    function removeAddressesFromShipWhitelist(uint256 shipTypeId, address[] calldata users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            shipWhitelists[shipTypeId][users[i]] = 0;
            emit WhitelistUpdated(users[i], shipTypeId, false, false);
        }
    }

    function isWhitelistedForEcho(uint256 echoId, address user) external view returns (bool) {
        return echoWhitelists[echoId][user] > echoWhitelistClaims[echoId][user];
    }

    function isWhitelistedForShip(uint256 shipTypeId, address user) external view returns (bool) {
        return shipWhitelists[shipTypeId][user] > shipWhitelistClaims[shipTypeId][user];
    }

    function getEchoClaimStatus(uint256 echoId, address user)
    external
    view
    returns (uint256 allowed, uint256 claimed)
    {
        allowed = echoWhitelists[echoId][user];
        claimed = echoWhitelistClaims[echoId][user];
    }

    function getShipClaimStatus(uint256 shipTypeId, address user)
    external
    view
    returns (uint256 allowed, uint256 claimed)
    {
        allowed = shipWhitelists[shipTypeId][user];
        claimed = shipWhitelistClaims[shipTypeId][user];
    }

    function recordEchoClaim(uint256 echoId, address user) external {
        if (msg.sender != echoNFTContract) revert UnauthorizedCaller();
        if (echoWhitelists[echoId][user] <= echoWhitelistClaims[echoId][user]) revert NoClaimsLeft();
        echoWhitelistClaims[echoId][user]++;
        emit WhitelistClaimed(user, echoId, true);
    }

    function recordShipClaim(uint256 shipTypeId, address user) external {
        if (msg.sender != shipNFTContract) revert UnauthorizedCaller();
        if (shipWhitelists[shipTypeId][user] <= shipWhitelistClaims[shipTypeId][user]) revert NoClaimsLeft();
        shipWhitelistClaims[shipTypeId][user]++;
        emit WhitelistClaimed(user, shipTypeId, false);
    }
}