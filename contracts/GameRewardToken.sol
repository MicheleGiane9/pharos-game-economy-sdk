// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GameRewardToken
 * @notice ERC20 reward token for Pharos game economies.
 *         Supports minting by authorised reward engines, permit-based approvals,
 *         and emergency pause. Supply is capped at MAX_SUPPLY.
 */
contract GameRewardToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public immutable MAX_SUPPLY;

    event TokensMinted(address indexed to, uint256 amount);

    error ZeroAddress();
    error ExceedsMaxSupply(uint256 requested, uint256 available);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        uint256 maxSupply,
        address owner_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        if (owner_ == address(0)) revert ZeroAddress();
        if (initialSupply > maxSupply) revert ExceedsMaxSupply(initialSupply, maxSupply);

        MAX_SUPPLY = maxSupply;

        _grantRole(DEFAULT_ADMIN_ROLE, owner_);
        _grantRole(MINTER_ROLE, owner_);
        _grantRole(PAUSER_ROLE, owner_);

        if (initialSupply > 0) {
            _mint(owner_, initialSupply);
            emit TokensMinted(owner_, initialSupply);
        }
    }

    /**
     * @notice Mint tokens to an address. Only callable by MINTER_ROLE.
     * @param to      Recipient address.
     * @param amount  Amount of tokens (in wei).
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        uint256 available = MAX_SUPPLY - totalSupply();
        if (amount > available) revert ExceedsMaxSupply(amount, available);

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Enforce pause on all transfers (including mint/burn which go through _update).
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
