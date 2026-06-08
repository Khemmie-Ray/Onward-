# Onward

**Most learn-to-earn platforms gate rewards behind verification, locking out the people who need them most.** Onward inverts that: anyone can earn from day one. Rewards are paid directly to verified GoodID users; unverified earners' G$ accrues onchain into a `pendingClaim` mapping, claimable the moment they complete face verification — gas-free, signer-triggered.

A learn-to-earn loop for the GoodDollar ecosystem with two surfaces: five-minute modules that teach how GoodDollar works (UBI, verification, the wallet, the economics) and mint a soulbound badge for each one completed, plus a 60-second daily Whack-a-Scam game that builds the reflexes to spot phishing and fake-claim sites before they cost you. Free rounds keep your streak alive; premium rounds let you stake G$ for higher rewards. UBI claim is integrated directly into the dashboard.

Built on Celo. Contracts are UUPS upgradeable, hardened with ReentrancyGuard, SafeERC20, CEI pattern, and pausability. The result: every new GoodDollar user gets an on-ramp to understanding the ecosystem and a daily drill to stay safe inside it — and no one is shut out of earning because they haven't verified yet.

Submitted to the GoodDollar × Dev3pack buildathon (June 2026).

---

## What it does

- **Modules** — Bite-sized lessons on GoodDollar fundamentals (what UBI is, how face verification works, how to spot scams). Pass the quiz, mint a soulbound badge, earn G$.
- **Whack-a-Scam** — Sixty-second daily game training scam recognition. Free rounds with daily streak; premium rounds where you stake G$ for higher rewards.
- **UBI claim** — Daily GoodDollar UBI claimable from the dashboard.
- **Pending balance** — Unverified users still earn rewards; G$ accrues onchain and unlocks when they verify with GoodID.

## Architecture

- **Frontend**: Next.js 16, TypeScript, Tailwind, Reown AppKit, wagmi/viem
- **Backend**: Next.js API routes, Supabase (Postgres + RLS)
- **Contracts**: Solidity 0.8.20, Foundry, Openzeppellin UUPS upgradeable
- **Identity**: GoodDollar citizen-sdk + identity-sdk
- **Chain**: Celo mainnet

### Two contracts (UUPS proxies)

- **OnwardBadges** — Soulbound ERC-721 badges + G$ reward distribution. Routes payments directly to verified users or accrues to `pendingClaim[user]` for unverified, releasable later by signer.
- **WhackStake** — Premium round escrow. Stake refunded + bonus on win; forfeited stake refills the rewards reserve on loss.

### Trust model

Verification status is determined off-chain via citizen-sdk on the frontend. The frontend passes `isVerified` through the backend signer to the contract. The contract trusts the signer's flag rather than running an on-chain check — a deliberate trade-off for shipping speed. Direct payouts on verified, accruals on unverified, with claims released later when verification flips.

### Security

- ReentrancyGuard on every state-mutating function
- SafeERC20 for all token transfers
- Checks-Effects-Interactions pattern
- Pausable
- Owner cannot withdraw G$ earmarked for pending claims
- Soulbound enforcement at `_update`, `approve`, `setApprovalForAll`
- claimId-based idempotency (no double-payouts on retries)
- UUPS upgrade, owner-controlled, permanently renouncable

## Mainnet deployment

- **OnwardBadges (proxy)**: `0x5B6C4CC464fb14Ed2fa78090924186d5F057875B`
- **WhackStake (proxy)**: `0x09c44C654653187B480aBDdfdB48AbA11FB38765`
- **G$ (Celo mainnet)**: `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A`

## Local setup

```bash
# Install
npm install / yarn

# Environment
cp .env.example .env.local
# Fill in Supabase, contract addresses, Reown project ID

# Run
npm run dev / yarn dev
```

Contract repo (separate):

```bash
cd contract
forge install
forge test          # ~30 tests, all passing
forge script script/Deploy.s.sol:Deploy --rpc-url https://forno.celo.org --account deployer --legacy --broadcast
```

## What's next

- Move verification check server-side (backend re-checks via citizen-sdk before signing)
- Owner → Gnosis Safe multisig
- Separate signer key from owner key
- Leaderboard
- More module content
- More ecosystem project highlights

## Team

[@Khemmie-Ray](https://github.com/Khemmie-Ray) — design, frontend, smart contracts, content
