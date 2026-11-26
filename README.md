# TapeGuard Receipts

Verifiable risk checks for AI agents and trading bots, evaluated by TapeOut
circuits on X Layer mainnet and anchored as on-chain receipts.

## Problem

AI agents and small trading bots increasingly act on their own: they place
trades, move funds and call paid APIs. Their operators need a cheap,
independent way to prove that a given action passed a fixed set of guard
rules at a specific moment — without trusting the bot's own logs.

## Solution

TapeGuard Receipts turns four TapeOut guard circuits into a public check:

1. The operator encodes a risk profile as 16 input bits.
2. The app evaluates TapeOut circuits 1–4 on X Layer mainnet through
   `eval(circuitId, input)` on the TapeOut processor
   `0xb57b56034e2dc25161e2512CfC40b24EA3bee1Fb` (ViperX Risk Guardian).
3. Each evaluation is anchored as a receipt in `TapeGuardRegistry` on
   X Layer testnet. The receipt hash binds processor, circuit, input,
   output and the mainnet block of the read, so anyone can re-run the same
   `eth_call` and verify the result.

## How it uses TapeOut and X Layer

- **TapeOut circuits (mainnet):** read-only `eval()` calls against circuits
  1–4 of processor `0xb57b56034e2dc25161e2512CfC40b24EA3bee1Fb`. Outputs
  are single bytes: `0x01` = pass, `0x00` = block. Verified behavior:
  input `0x0000` → circuits 1–3 pass, circuit 4 blocks; input `0xffff` →
  circuits 1–3 block, circuit 4 passes.
- **X Layer contracts (testnet 1952):** `TapeGuardRegistry` stores receipts
  and exposes `computeReceiptHash` so any third party can recompute a
  receipt hash from its fields.
- **Demo app:** `index.html` — a single static page that runs the live
  mainnet evaluations from the browser with no wallet and no gas.

## Target users and revenue model

- Target users: AI-agent platforms, trading-bot operators and small funds
  that need auditable guard checks before an agent acts.
- Revenue model: a small per-receipt anchoring fee and a paid API tier for
  platforms that want batch verification. Operators keep paying because the
  receipt is independent evidence their agent followed its rules.

## Run locally

```bash
node compile-and-test.js   # compiles the registry and runs local tests
node deploy.js             # deploys to X Layer testnet and anchors samples
```

Open `index.html` in a browser to run the live circuit checks.

## Addresses

- TapeOut processor (X Layer mainnet): `0xb57b56034e2dc25161e2512CfC40b24EA3bee1Fb`
- TapeGuardRegistry (X Layer testnet): `0x576Eab718361Bc9a26EEC4BAe1eAe4Cf043DC806`
- Sample receipts anchored at X Layer mainnet block 76964320: circuit 1 with input `0x0000` → `0x01`, circuit 4 with input `0xffff` → `0x01` (testnet txs `0xca8bb54ea4b2421baa58a43ab7f48056561701f0540f83c1952cb51d040c1e89`, `0x01ccd8480f1349575637601f82058a9bc2dcb690fc07dd822928b12cd207fa48`)
