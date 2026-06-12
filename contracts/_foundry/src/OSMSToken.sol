
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

    error CapExceeded();
    error CapAlreadySet();
    error NewCapBelowSupply();

contract OSMSToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");


    uint256 public maxSupply;
    bool public isCapSet;


    uint256 public totalBurned;

    event MaxSupplySet(uint256 newMaxSupply);

    constructor() ERC20("OneSoulManyShips", "OSMS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        if (isCapSet) {
            if (totalSupply() + amount > maxSupply) revert CapExceeded();
        }
        _mint(to, amount);
    }

    function setMaxSupply(uint256 _maxSupply) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (isCapSet) revert CapAlreadySet();
        if (_maxSupply < totalSupply()) revert NewCapBelowSupply();

        maxSupply = _maxSupply;
        isCapSet = true;

        emit MaxSupplySet(_maxSupply);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }



    function _update(address from, address to, uint256 value)
    internal
    override(ERC20, ERC20Pausable)
    {

        if (to == address(0)) {
            totalBurned += value;
        }
        super._update(from, to, value);
    }
}