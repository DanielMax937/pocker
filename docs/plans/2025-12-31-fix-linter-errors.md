# Fix Linter Errors Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 38 linter errors across 12 files by adding proper TypeScript types and removing dead code

**Architecture:** Systematic file-by-file fixes grouped by error type (type safety, unused variables, React hooks, JSX)

**Tech Stack:** TypeScript 5, Next.js 15, Prisma 6, ESLint

---

### Task 1: Add TypeScript Types for API Routes - AI Route

**Files:**
- Modify: `app/api/ai/route.ts:19,33`

**Step 1: Define type interfaces at top of file**

Add after imports:

```typescript
interface GameAction {
  player: {
    name: string;
  };
  actionType: string;
  amount?: number;
}

interface GameStatePlayer {
  name: string;
  chips: number;
  folded?: boolean;
}
```

**Step 2: Replace `any` on line 19**

Replace:
```typescript
gameHistory = actions.map((action: any, index: number) => {
```

With:
```typescript
gameHistory = actions.map((action: GameAction, index: number) => {
```

**Step 3: Replace `any` on line 33**

Replace:
```typescript
${gameState.players.map((p: any) => `  * ${p.name}: ${p.chips} chips${p.folded ? ' (folded)' : ''}`).join('\n')}
```

With:
```typescript
${gameState.players.map((p: GameStatePlayer) => `  * ${p.name}: ${p.chips} chips${p.folded ? ' (folded)' : ''}`).join('\n')}
```

**Step 4: Run linter to verify**

```bash
npm run lint -- --file app/api/ai/route.ts
```

Expected: 0 errors in this file

**Step 5: Commit**

```bash
git add app/api/ai/route.ts
git commit -m "fix: add TypeScript types to AI route"
```

---

### Task 2: Add TypeScript Types for API Routes - Actions Route

**Files:**
- Modify: `app/api/games/[gameId]/actions/route.ts:52`

**Step 1: Define type interface**

Add after imports:

```typescript
interface PlayerInfo {
  id: string;
  name: string;
  position?: number;
  chips: number;
}

interface GameStateWithPlayers {
  players: PlayerInfo[];
}
```

**Step 2: Replace `any` on line 52**

Replace:
```typescript
const playerInfo = gameState.players.find((p: any) => p.id === playerId);
```

With:
```typescript
const playerInfo = (gameState as GameStateWithPlayers).players.find((p: PlayerInfo) => p.id === playerId);
```

**Step 3: Run linter**

```bash
npm run lint -- --file app/api/games/[gameId]/actions/route.ts
```

Expected: 0 errors in this file

**Step 4: Commit**

```bash
git add app/api/games/[gameId]/actions/route.ts
git commit -m "fix: add TypeScript types to actions route"
```

---

### Task 3: Add TypeScript Types for API Routes - Human Route

**Files:**
- Modify: `app/api/games/[gameId]/human/route.ts:20`

**Step 1: Define type interface**

Add after imports:

```typescript
interface GameActionRecord {
  player: {
    name: string;
  };
  actionType: string;
  amount?: number;
}
```

**Step 2: Replace `any` on line 20**

Replace:
```typescript
const gameHistory = actions.map((action: any, index: number) =>
```

With:
```typescript
const gameHistory = actions.map((action: GameActionRecord, index: number) =>
```

**Step 3: Run linter**

```bash
npm run lint -- --file app/api/games/[gameId]/human/route.ts
```

Expected: 0 errors in this file

**Step 4: Commit**

```bash
git add app/api/games/[gameId]/human/route.ts
git commit -m "fix: add TypeScript types to human route"
```

---

### Task 4: Add TypeScript Types for API Routes - Rounds Route

**Files:**
- Modify: `app/api/games/[gameId]/rounds/route.ts:34,35`

**Step 1: Define type interfaces**

Add after imports:

```typescript
interface GameAction {
  gameState: unknown;
}

interface Round {
  phase: string;
  actions: GameAction[];
  pot: number;
  communityCards: string[];
}

interface GameStateData {
  gamePhase: string;
  pot: number;
  communityCards: string[];
}
```

**Step 2: Replace `any` on lines 34-35**

Replace:
```typescript
const rounds = game.actions.reduce((acc: any[], action) => {
  const gameState = action.gameState as any;
```

With:
```typescript
const rounds = game.actions.reduce((acc: Round[], action) => {
  const gameState = action.gameState as GameStateData;
```

**Step 3: Run linter**

```bash
npm run lint -- --file app/api/games/[gameId]/rounds/route.ts
```

Expected: 0 errors in this file

**Step 4: Commit**

```bash
git add app/api/games/[gameId]/rounds/route.ts
git commit -m "fix: add TypeScript types to rounds route"
```

---

### Task 5: Add TypeScript Types for API Routes - Games Route

**Files:**
- Modify: `app/api/games/route.ts:40`

**Step 1: Define type interface**

Add after imports:

```typescript
interface PlayerCreateData {
  playerId: string;
  name: string;
  position: number;
  startingChips: number;
}
```

**Step 2: Replace `any` on line 40**

Replace:
```typescript
create: players.map((player: any) => ({
```

With:
```typescript
create: players.map((player: PlayerCreateData) => ({
```

**Step 3: Run linter**

```bash
npm run lint -- --file app/api/games/route.ts
```

Expected: 0 errors in this file

**Step 4: Commit**

```bash
git add app/api/games/route.ts
git commit -m "fix: add TypeScript types to games route"
```

---

### Task 6: Remove Unused Variables - ActionControls Component

**Files:**
- Modify: `app/components/ActionControls.tsx:24`

**Step 1: Remove unused variable**

Find and remove line 24:
```typescript
const canRaise = ...
```

**Step 2: Run linter**

```bash
npm run lint -- --file app/components/ActionControls.tsx
```

Expected: 0 errors in this file

**Step 3: Commit**

```bash
git add app/components/ActionControls.tsx
git commit -m "fix: remove unused variable canRaise"
```

---

### Task 7: Remove Unused Variables - ActionReplay Component

**Files:**
- Modify: `app/components/ActionReplay.tsx:4,56`

**Step 1: Remove unused import on line 4**

Remove `getHandStrength` from import statement

**Step 2: Remove unused catch parameter on line 56**

Replace:
```typescript
} catch (err) {
```

With:
```typescript
} catch {
```

**Step 3: Run linter**

```bash
npm run lint -- --file app/components/ActionReplay.tsx
```

Expected: 0 errors in this file

**Step 4: Commit**

```bash
git add app/components/ActionReplay.tsx
git commit -m "fix: remove unused variables in ActionReplay"
```

---

### Task 8: Remove Unused Variables - GameResult Component

**Files:**
- Modify: `app/components/GameResult.tsx:2,23,25`

**Step 1: Remove unused import**

Remove `Card` from line 2 import statement

**Step 2: Remove unused variables lines 23,25**

Remove:
```typescript
const handRank = ...
const bestHand = ...
```

**Step 3: Run linter**

```bash
npm run lint -- --file app/components/GameResult.tsx
```

Expected: 0 errors in this file

**Step 4: Commit**

```bash
git add app/components/GameResult.tsx
git commit -m "fix: remove unused variables in GameResult"
```

---

### Task 9: Remove Unused Variables - PlayerStatus Component

**Files:**
- Modify: `app/components/PlayerStatus.tsx:16`

**Step 1: Remove unused variable**

Remove line 16:
```typescript
const playerId = ...
```

**Step 2: Run linter**

```bash
npm run lint -- --file app/components/PlayerStatus.tsx
```

Expected: 0 errors in this file

**Step 3: Commit**

```bash
git add app/components/PlayerStatus.tsx
git commit -m "fix: remove unused variable playerId"
```

---

### Task 10: Remove Unused Variables - PlayerStatusBar Component

**Files:**
- Modify: `app/components/PlayerStatusBar.tsx:19`

**Step 1: Remove unused variable**

Remove line 19:
```typescript
const activePlayers = ...
```

**Step 2: Run linter**

```bash
npm run lint -- --file app/components/PlayerStatusBar.tsx
```

Expected: 0 errors in this file

**Step 3: Commit**

```bash
git add app/components/PlayerStatusBar.tsx
git commit -m "fix: remove unused variable activePlayers"
```

---

### Task 11: Remove Unused Variables and Fix Hook - PokerGame Component

**Files:**
- Modify: `app/components/PokerGame.tsx:5,6,7,8,58,59,62,64,65,70,76,85,165,257,313`

**Step 1: Remove unused imports (lines 5-8)**

Remove from imports:
- `dealCommunityCards`
- `makeAIDecision`
- `createAIPersonality`
- `calculateWinProbability`
- `Card`

**Step 2: Remove unused state variables (lines 58,59,62,64,65,70,76,165,257)**

Remove these lines:
```typescript
const [, setDealerIndex] = useState(0);
const [deck] = useState<Card[]>([]);
const [currentBet] = useState(0);
const [, setShowdown] = useState(false);
const [, setWinnerInfo] = useState<any>(null);
const [, setPlayerContributions] = useState<Record<string, number>>({});
const [isAIActing] = useState(false);
const handlePlayerAction = ...
const relevantActions = ...
```

**Step 3: Fix React Hook dependency warning (line 85)**

Add `loadGameHistory` to dependency array or wrap in useCallback

**Step 4: Fix unescaped entity (line 313)**

Replace `'` with `&apos;` or `'`

**Step 5: Run linter**

```bash
npm run lint -- --file app/components/PokerGame.tsx
```

Expected: 0 errors in this file

**Step 6: Commit**

```bash
git add app/components/PokerGame.tsx
git commit -m "fix: remove unused variables and fix hooks in PokerGame"
```

---

### Task 12: Remove Unused Variable - PokerTable Component

**Files:**
- Modify: `app/components/PokerTable.tsx:59`

**Step 1: Remove unused variable**

Remove line 59:
```typescript
const isUserTurn = ...
```

**Step 2: Run linter**

```bash
npm run lint -- --file app/components/PokerTable.tsx
```

Expected: 0 errors in this file

**Step 3: Commit**

```bash
git add app/components/PokerTable.tsx
git commit -m "fix: remove unused variable isUserTurn"
```

---

### Task 13: Final Verification

**Step 1: Run full linter on all files**

```bash
npm run lint
```

Expected: 0 errors in app/api and app/components directories

**Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes successfully

**Step 3: Create summary commit if needed**

If any final cleanup needed:
```bash
git add .
git commit -m "chore: final cleanup after linter fixes"
```

