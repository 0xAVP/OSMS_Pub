
pragma solidity ^0.8.30;

interface IOSMSShipNFT {
    struct ShipType {
        uint256 mintPrice;
        uint256 craftPrice;
        bool isActive;
        bool craftableOnly;
    }

    function managerMint(address to, uint256 shipTypeId) external returns (uint256);
    function getShipType(uint256 shipTypeId) external view returns (ShipType memory);
    function shipTypeCount() external view returns (uint256);
    function hasMintedFreeNebular(address user) external view returns (bool);
    function setFreeNebularMinted(address user) external;
}

interface IEchoNFT {
    function hasAnyToken(address user) external view returns (bool);
    function isEchoMinter(address user) external view returns (bool);
    function balanceOf(address account, uint256 id) external view returns (uint256);
}