# Onward Contracts — Deployment Guide

Two upgradeable UUPS contracts, both Pausable, both with renouncable upgrade authority.

```
OnwardBadges  — soulbound ERC-721 + G$ reward distribution
WhackStake    — premium-mode round stakes, forfeits flow to OnwardBadges reserve
```

## Prerequisites

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-foundry-upgrades
forge install foundry-rs/forge-std
```

Add to `foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 200
ffi = true
ast = true
build_info = true
extra_output = ["storageLayout"]

remappings = [
    "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/",
    "@openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/",
    "openzeppelin-foundry-upgrades/=lib/openzeppelin-foundry-upgrades/src/",
    "forge-std/=lib/forge-std/src/"
]
```

The `ffi = true` and `ast = true` lines are required by the OZ upgrades plugin.

## Step 1: Test locally

```bash
forge test -vvv
```

All tests should pass. If they fail, fix before deploying.

## Step 2: Set up Safe multisig (mainnet only; skip for testnet)

For testnet, use a single wallet as owner.

For mainnet:
1. Go to https://safe.global → "Create new Safe"
2. Select Celo network
3. Add 2 owner addresses (both yours: one hot wallet, one hardware wallet)
4. Set threshold to 2/2
5. Save the resulting Safe address as `OWNER_ADDRESS`

## Step 3: Configure environment

Create `.env` in the contracts folder:

```bash
PRIVATE_KEY=0x...               # deployer (any wallet with gas)
OWNER_ADDRESS=0x...             # multisig (mainnet) or your wallet (testnet)
SIGNER_ADDRESS=0x...            # backend signer wallet
GDOLLAR_ADDRESS=0x...           # see below
STAKE_AMOUNT_WEI=10000000000000000000   # 10 G$
BONUS_AMOUNT_WEI=5000000000000000000    # 5 G$
CELO_RPC=https://forno.celo.org
```

**G$ addresses by chain:**
- Celo mainnet: `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A`
- Celo Alfajores: `0x03d3dAB843e6c03b3D271eff9178e6A96c28D25f`
- Celo Sepolia: no official G$ — deploy a MockGDollar (see test file) or use Alfajores

## Step 4: Deploy

```bash
source .env

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $CELO_RPC \
  --broadcast \
  --legacy \
  --private-key $PRIVATE_KEY
```

Save the proxy addresses printed at the end. These go in:
- `constants/contracts/addresses.ts` in your Next.js project
- `.env.local` for the backend

## Step 5: Configure module URIs

After Pinata upload, set the metadata CID:

```bash
export ONWARD_BADGES_ADDRESS=0x...   # proxy address from step 4
export METADATA_CID=bafy...          # Pinata metadata folder CID

forge script script/ConfigureModuleURIs.s.sol:ConfigureModuleURIs \
  --rpc-url $CELO_RPC \
  --broadcast \
  --legacy \
  --private-key $PRIVATE_KEY
```

Note: this transaction must be sent from the owner wallet. For multisig, use the Safe UI to propose + execute the transaction with the encoded calldata.

## Step 6: Fund the reserves

**Reward reserve (OnwardBadges):**

```bash
cast send $GDOLLAR_ADDRESS \
  "transfer(address,uint256)" \
  $ONWARD_BADGES_ADDRESS \
  10000000000000000000000 \
  --rpc-url $CELO_RPC --private-key $PRIVATE_KEY --legacy
```

(10,000 G$ for the demo; scale up for production.)

**Bonus pool (WhackStake):**

```bash
cast send $GDOLLAR_ADDRESS "approve(address,uint256)" \
  $WHACK_STAKE_ADDRESS 1000000000000000000000 \
  --rpc-url $CELO_RPC --private-key $PRIVATE_KEY --legacy

cast send $WHACK_STAKE_ADDRESS "fundBonusPool(uint256)" \
  1000000000000000000000 \
  --rpc-url $CELO_RPC --private-key $PRIVATE_KEY --legacy
```

(1,000 G$ for the bonus pool — enough for 200 winning rounds at 5 G$ each.)

## Admin functions (for your admin interface)

### OnwardBadges
- `setModuleURI(slug, uri)` — configure or update a badge's metadata URI
- `setSigner(newSigner)` — rotate backend signer
- `pause()` / `unpause()` — emergency circuit breaker
- `withdraw(to, amount)` — pull G$ out (for migration)
- `renounceUpgradeability()` — permanently lock the contract (irreversible)

### WhackStake
- `setStakeAmount(amount)` — adjust required stake
- `setBonusAmount(amount)` — adjust winning bonus
- `setSigner(newSigner)` — rotate backend signer
- `setBadgesAddress(addr)` — update forfeit destination if OnwardBadges is migrated
- `pause()` / `unpause()`
- `withdraw(to, amount)`
- `renounceUpgradeability()`

### Read-only metrics (for dashboards)

**OnwardBadges:**
- `totalDistributed()` — lifetime G$ paid as rewards
- `totalReplenished()` — lifetime G$ from forfeits + manual topups
- `reserveBalance()` — current G$ available for rewards
- `nextTokenId()` — total badges minted + 1
- `claimed(claimId)` — check if a specific claim was paid

**WhackStake:**
- `totalStaked()` — lifetime stakes accepted
- `totalRefunded()` — lifetime stakes returned to winners
- `totalBonusPaid()` — lifetime bonuses paid
- `totalForfeited()` — lifetime stakes forfeited
- `bonusPoolBalance()` — G$ available to pay bonuses

## Upgrade workflow (post-launch)

When you need to upgrade:

1. Modify the contract source (e.g. `OnwardBadgesV2.sol`)
2. Run `forge test` on the new version
3. Use OZ Upgrades plugin to validate storage layout compatibility
4. Deploy the new implementation
5. Owner calls `upgradeToAndCall(newImpl, data)` on the proxy
6. Verify upgrade succeeded

For mainnet, the multisig signs the upgrade transaction via Safe.

Once you're confident the contracts are stable, the owner can call `renounceUpgradeability()` to permanently freeze the code. This is irreversible.
