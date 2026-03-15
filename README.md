# Space Invaders Duel

A turn-based multiplayer battleship game built on the **Usion platform** using **platform mode** (Socket.IO relay).

Each player deploys a fleet of ships on an 8x6 grid, then takes turns firing shots at the opponent's grid. Destroy all enemy ships to win. Retro Sega-style pixel aesthetic.

## Quick Start

```bash
npm install

# Configure environment
cp .env.example .env
# Edit .env with your SERVICE_ID

# Start the Next.js client
npm run dev
```

## Architecture

```
Usion App ──Socket.IO──> Usion Backend ──Socket.IO──> Opponent's App
                (platform mode relay)
```

This game uses **platform mode** — all game messages are relayed through the Usion backend via Socket.IO. No custom server needed.

## How It Works

1. Player opens game in Usion app
2. SDK initializes with `Usion.init(callback)`
3. Client connects via `Usion.game.connect()` (platform mode)
4. Client joins room via `Usion.game.join(roomId)`
5. **Setup phase**: Players place ships on their grid
6. `Usion.game.action('ready', { ships })` signals deployment complete
7. **Battle phase**: Players take turns firing at opponent's grid
8. `Usion.game.action('fire', { row, col })` sends each shot
9. `Usion.game.onAction()` receives opponent's actions
10. Game ends when all ships of one player are destroyed

## SDK Methods Used

| Method | Purpose |
|--------|---------|
| `Usion.init(callback)` | Initialize SDK, receive userId and roomId |
| `Usion.game.connect()` | Connect to Usion platform (Socket.IO) |
| `Usion.game.join(roomId)` | Join the game room |
| `Usion.game.action(type, data)` | Send turn-based actions (ready, fire) |
| `Usion.game.onAction(callback)` | Receive opponent's actions |
| `Usion.game.onPlayerJoined(cb)` | Detect when opponent joins |
| `Usion.game.onStateUpdate(cb)` | Receive full state snapshots |
| `Usion.game.onGameFinished(cb)` | Match completion |
| `Usion.game.requestRematch()` | Request a rematch |
| `Usion.game.requestSync()` | Re-sync state after reconnect |

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Game client with all logic and rendering |
| `lib/types.ts` | TypeScript type definitions |
| `lib/constants.ts` | Grid size, ship sizes, color palette |
| `public/usion-sdk.js` | Usion SDK browser bundle |

## Game Phases

1. **Connecting** — SDK initializing
2. **Waiting** — Waiting for opponent to join
3. **Setup** — Place your ships (3-cell, 2-cell, 2-cell). Press R to rotate.
4. **Battle** — Take turns firing at opponent's grid
5. **Finished** — All ships destroyed, winner declared

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SERVICE_ID` | Your game's service ID on Usion |
| `NEXT_PUBLIC_API_URL` | Usion backend URL |

## npm Packages

- [`@usions/sdk`](https://www.npmjs.com/package/@usions/sdk) — Usion Mini App SDK

## License

MIT
