# Background Music Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add looping background music to the main poker Play screen while a game is active, with a simple mute/unmute toggle.

**Architecture:** Use a single HTML `<audio>` element rendered by `app/play/page.tsx` that plays a track from `public/background-music.mp3`, controlled via React state. Audio should start when the user starts a new game and run while `isGameActive` is true (and not in review mode), with a header-level button to mute/unmute without persisting preference.

**Tech Stack:** Next.js App Router (client component), React hooks (`useState`, `useEffect`, `useRef`), HTML5 audio element, static asset in `public/`.

---

### Task 1: Add audio asset

**Files:**
- Create/Place: `public/background-music.mp3` (small looping track)

**Steps:**
1. Add a suitable small background music file to `public/background-music.mp3`.

### Task 2: Wire audio element into Play page

**Files:**
- Modify: `app/play/page.tsx`

**Steps:**
1. Add React state for `isMusicMuted` (default `false`) and an `audioRef` via `useRef<HTMLAudioElement | null>`.
2. Render an `<audio>` element near the top of the JSX tree, pointing to `/background-music.mp3`, with `loop` enabled and `ref={audioRef}`.
3. Use a `useEffect` to start playback (`audioRef.current.play()`) when `isGameActive` transitions to true and `!isReviewMode && !isMusicMuted`, and to pause when the game ends or review mode is active.
4. Add a click handler `toggleMusic` that flips `isMusicMuted` and pauses/plays the audio element accordingly.
5. Add a small button in the Play page header (next to title / Back to Games link) to toggle music, showing text like `Music: On` / `Music: Off` based on `isMusicMuted`.

### Task 3: Manual verification

**Steps:**
1. Run `npm run dev`.
2. Navigate to `/play` and confirm that no music plays before starting a game.
3. Click `Start New Game` and confirm music begins playing.
4. Use the toggle button to mute/unmute and verify it only affects the current session (no persistence across page reloads).
5. Play until a winner is declared and confirm music stops when the game is no longer active.
6. Open a game in review mode (with `mode=review`) and confirm that background music does not play.
