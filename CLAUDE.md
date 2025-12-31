# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocker is a web-based Texas Hold'em poker game with AI opponents. Players can play against rule-based or LLM-powered AI, with game history and replay features.

## Tech Stack

- **Framework**: Next.js 15.3 (App Router) with React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **Database**: Prisma 6 with SQLite
- **AI**: OpenAI API (optional) + poker-odds-calc for probability

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint

npx prisma generate      # Generate Prisma Client after schema changes
npx prisma db push       # Push schema changes to database
npx prisma migrate reset # Reset database
```

## Architecture

### Core Libraries (`/app/lib/`)
- `poker.ts` - Hand evaluation, deck operations, winner determination
- `ai-player.ts` - Rule-based AI with 3 difficulty levels (EASY/MEDIUM/HARD)
- `ai-player-llm.ts` - OpenAI-powered AI decisions, falls back to rule-based
- `types.ts` - TypeScript interfaces for game state
- `poker-probability.ts` - Win probability calculations
- `action-analyzer.ts` - Game action analysis

### Game Flow
Poker phases: Preflop → Flop → Turn → River → Showdown

Actions supported: fold, check, call, bet, raise, all-in

### API Routes (`/app/api/`)
- `/api/games` - Game CRUD
- `/api/games/:gameId/start` - Start game
- `/api/games/:gameId/actions` - Record actions
- `/api/games/:gameId/human` - Human player action
- `/api/ai` - AI decision endpoint

### Frontend Routes
- `/` - Home page
- `/play` - Main game interface
- `/games` - Game history

## Database Schema

Three main models in `prisma/schema.prisma`:
- `Game` - Game sessions
- `GamePlayer` - Player participation
- `GameAction` - Individual actions (fold, check, call, bet, raise, all-in)

## Environment Variables

For LLM-powered AI (optional):
- `OPENAI_API_KEY` - API key
- `OPENAI_BASE_URL` - API base URL
- `OPENAI_MODEL` - Model to use
