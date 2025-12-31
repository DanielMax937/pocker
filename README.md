# Texas Hold'em Poker Game

This is a Next.js application that implements a Texas Hold'em poker game using Prisma ORM with SQLite as the database.

## Tech Stack

- **Next.js 15.3.1**: React framework with App Router
- **Prisma**: ORM for database interactions
- **SQLite**: Lightweight database
- **TypeScript**: Type-safe JavaScript

## Features

- User management (registration, login)
- Game creation and management
- Chip tracking for players
- Full Texas Hold'em gameplay:
  - Dealing pocket cards to players
  - Betting rounds (preflop, flop, turn, river)
  - Hand evaluation and winner determination
  - Pot distribution

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. The Prisma schema is already set up. If you want to reset the database:

```bash
npx prisma migrate reset
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

### Games

- `GET /api/games` - Get all games
- `POST /api/games` - Create a new game (specify blinds, max players, buy-in)
- `GET /api/games/:id` - Get a specific game
- `PATCH /api/games/:id` - Update a game
- `DELETE /api/games/:id` - Delete a game
- `POST /api/games/:id/start` - Start a Texas Hold'em game

### Rounds and Actions

- `GET /api/games/:gameId/rounds/:roundId/actions` - Get all actions for a round
- `POST /api/games/:gameId/rounds/:roundId/actions` - Make a poker action (fold, check, call, bet, raise, all-in)

## Game Flow

1. Create a user with initial chips
2. Create a game with buy-in amount and blinds
3. Add players to the game
4. Start the game
   - Initial dealing of pocket cards
   - Small blind and big blind are posted
5. Players take actions in turn:
   - Fold, Check, Call, Bet, Raise, or All-in
6. After betting rounds, the game progresses through:
   - Preflop → Flop → Turn → River → Showdown
7. Winner is determined by the best poker hand
8. Pot is awarded to the winner

## Database Schema

The database includes the following models:

- **User**: Player information and chip count
- **Game**: Texas Hold'em game sessions with blinds and buy-in
- **Round**: Individual rounds with community cards and pot
- **PlayerHand**: Player's pocket cards
- **Action**: Betting actions with amounts

## Testing

This project includes comprehensive API test coverage using Jest.

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Test Coverage

**37 test cases** covering all 14 API endpoints:

- ✅ **Games API** (5 tests): Create, list, and manage games
- ✅ **Game Details API** (7 tests): Get, update, and delete specific games
- ✅ **Game Actions API** (7 tests): Create and retrieve game actions with auto-sequencing
- ✅ **Game Rounds API** (6 tests): Group actions by game phase
- ✅ **Human Player API** (4 tests): Process human actions with AI analysis
- ✅ **AI Decision API** (8 tests): Get AI recommendations for poker decisions

All tests use an in-memory SQLite database for fast, isolated testing.

## Development

### Generate Prisma Client

After making changes to the Prisma schema, run:

```bash
npx prisma generate
```

### Push Schema Changes

To update the database schema without migrations:

```bash
npx prisma db push
```

## License

[MIT License](LICENSE)
