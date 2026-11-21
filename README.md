# ⚡ Monad Blitz Roguelike

A 2D multiplayer roguelike built for the **Monad Blitz@Guangzhou** hackathon. Real-time dungeon crawling and combat run off-chain for smooth 60fps performance, while trust-critical state (entry fees, prize pool escrow, gravestones, loot drops, player ghosts, and leaderboards) lives permanently on **Monad Testnet**.

![Monad Blitz Roguelike](https://raw.githubusercontent.com/therealharpaljadeja/monskills/main/assets/banner.png)

---

## 🎮 Core Gameplay Mechanics

- **Deterministic Dungeon Generation**: Floors are generated from a shared seed (Mulberry32 PRNG). All players exploring the same seed face the same rooms, corridors, chests, and altars.
- **Permanent Social Gravestones**: When a player dies, their gravestone, final score, and uncollected inventory are permanently recorded on-chain.
- **Ghost Spawns & Looting**: Later adventurers entering the same seed discover fallen players' gravestones. You can loot their gear (+75 score) and battle their AI-controlled Ghost (+250 score, "Ghost Slayer").
- **Prize Pool & Dynamic Payouts**: 0.1 MON entry fee is escrowed directly into the smart contract. Players who extract cash out proportional to their dungeon score (`Score / 250 MON`, capped at 5 MON).
- **Sub-Second Monad Speed**: Monad's ~600ms block time enables instant on-chain transaction feedback without interrupting game flow.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React 18 + TypeScript | High performance UI and responsive canvas wrapper |
| **Game Engine** | HTML5 Canvas + Custom 2D Roguelike Engine | Smooth 60fps movement, enemy AI, and torchlight lighting |
| **Sound FX** | Web Audio API (Synthesizer) | Zero-dependency retro 8-bit dynamic audio |
| **Smart Contract** | Solidity ^0.8.20 + Foundry | Entry escrow, gravestones, ghosts, and payouts |
| **Web3 Client** | viem | Native Monad Testnet EIP-1559 and contract interaction |
| **Dual Mode** | Live Web3 + Simulated Testnode | Works out-of-the-box in any browser with or without a wallet |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Deploy Frontend to Vercel
- Import repository into Vercel.
- Set **Root Directory** to `web` (or leave default if deploying root monorepo).
- Framework preset: **Next.js**.
- Build command: `npm run build`.

---

## 📜 Smart Contract Deployment (Foundry)

Contract: `contracts/BlitzRoguelike.sol`
Deploy Script: `script/Deploy.s.sol`

### Monad Testnet Details:
- **Network Name**: Monad Testnet
- **Chain ID**: `10143`
- **Currency Symbol**: `MON`
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Explorer**: `https://testnet.monadscan.com`

### Deploy with Foundry:
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --legacy
```

---

## 🕹️ Controls

- **W / A / S / D** or **Arrow Keys**: Move 1 tile or bump-attack adjacent enemies.
- **Spacebar** or **Period**: Skip turn / Wait (allows enemies to advance).
- **On-Screen D-Pad**: Available for touch screens / mobile play.
- **Start Run (0.1 MON)**: Escrows entry fee and descends into the dungeon.
- **Cash Out**: Extracts from the dungeon and claims prize pool winnings.

---

## 🏆 Hackathon Submission Highlights

1. **Meaningful Web3 Integration**: Blockchain is not an afterthought or gimmick; it serves as the **shared social state layer** that makes permanent player tombstones and ghosts possible.
2. **Instant Playability**: Reviewers can test immediately via **Simulated Testnode Mode** or connect MetaMask on Monad Testnet.
3. **Clean Code**: Strict TypeScript, zero UTF-8 BOM, fully typed viem contracts.
