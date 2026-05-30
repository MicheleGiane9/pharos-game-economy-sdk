# Security — Pharos Game Economy SDK

## Smart Contract Security

### Reentrancy Protection

`RewardEngine.claimReward()` and `claimDailyReward()` both use:
1. `nonReentrant` modifier (OpenZeppelin ReentrancyGuard) — prevents same-call reentrancy.
2. **Checks-Effects-Interactions** pattern:
   ```solidity
   uint256 pending = rewards.pendingRewards;
   require(pending > 0, ...);           // CHECK
   rewards.pendingRewards = 0;          // EFFECT (zeroed before mint)
   rewardToken.mint(msg.sender, pending); // INTERACTION
   ```

### Access Control

All privileged functions are gated by OpenZeppelin's `AccessControl`:

| Attack vector | Protection |
|---|---|
| Unauthorised minting | Only `MINTER_ROLE` (held by RewardEngine) can mint |
| Arbitrary reward granting | Only `OPERATOR_ROLE` (game servers) can call rewardPlayer |
| Parameter manipulation | Only `REWARD_MANAGER_ROLE` can update reward amounts |
| Emergency pause bypass | Only `PAUSER_ROLE` / `DEFAULT_ADMIN_ROLE` |

### Supply Cap

`GameRewardToken.mint()` reverts with `ExceedsMaxSupply` if minting would exceed `MAX_SUPPLY`. This is an immutable value set at deploy time.

### Anti-Double-Reward

`processedRewardIds[rewardId] = true` is set atomically before emitting the event. A replay of the same `rewardId` reverts immediately with `RewardAlreadyProcessed`.

Game servers should use deterministic `rewardId` generation:
```typescript
const rewardId = ethers.id(`${chainId}:${eventType}:${playerId}:${eventId}`);
```

### Input Validation

- Zero address inputs revert with `ZeroAddress()`.
- Zero amount inputs revert with `ZeroAmount()`.
- Batch size > 100 reverts with `BatchTooLarge`.

---

## Key Management

- The `OPERATOR_ROLE` private key lives **only on your game server**. Never include it in client code, Unity builds, or browser bundles.
- Use a dedicated hot wallet for the operator role — do not reuse your personal wallet.
- Store the `PRIVATE_KEY` in environment variables (`.env`), never in source code.
- For production, use a hardware wallet or KMS for `DEFAULT_ADMIN_ROLE`.
- Rotate the operator key immediately if you suspect compromise — call `revokeRole(OPERATOR_ROLE, compromisedAddress)`.

---

## Recommended Production Hardening

1. **Multisig for admin**: Transfer `DEFAULT_ADMIN_ROLE` to a Gnosis Safe after deployment.
2. **Rate-limit the operator API**: Your game server should throttle reward granting per player per interval.
3. **Validate player identity server-side**: Authenticate players (JWT, session token) before granting rewards.
4. **Monitor events**: Index `RewardGranted` events to detect anomalous reward volumes.
5. **Circuit breaker**: Keep `pause()` access on a 2-of-3 multisig. If an exploit is detected, pause the token and engine immediately.
6. **Audit**: Have contracts independently audited before mainnet deployment with real economic value.
7. **Time-lock upgrades**: If you add upgradeability later, use a TimelockController.

---

## Known Limitations

- **No on-chain anti-cheat**: The engine trusts the operator. Cheat prevention must happen in your game server before calling `rewardPlayer()`.
- **Token price not enforced**: The economy is inflationary by design. Implement burn mechanics in your game to create deflationary pressure.
- **No dispute resolution**: Incorrect rewards can only be corrected by reducing future rewards server-side (reducing `pendingRewards` requires admin action).
