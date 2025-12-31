# Add API Test Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement comprehensive test coverage for all 14 API endpoints (46 test cases total)

**Architecture:** Jest + in-memory SQLite + integration tests for Next.js API routes

**Tech Stack:** Jest 29, ts-jest, Prisma (test database), @testing-library

---

### Task 1: Install Test Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Jest and related packages**

```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-node
```

Expected: Packages installed successfully

**Step 2: Install testing utilities**

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react
```

Expected: Packages installed successfully

**Step 3: Verify installation**

```bash
npm list jest
```

Expected: Shows jest@29.x

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add test dependencies (Jest, ts-jest)"
```

---

### Task 2: Configure Jest

**Files:**
- Create: `jest.config.js`
- Create: `jest.setup.js`

**Step 1: Create Jest configuration**

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/lib/(.*)$': '<rootDir>/app/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/generated/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

**Step 2: Create Jest setup file**

Create `jest.setup.js`:

```javascript
// Add custom jest matchers from jest-dom
import '@testing-library/jest-dom'
```

**Step 3: Add test script to package.json**

Add to `"scripts"`:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

**Step 4: Verify Jest configuration**

```bash
npm test -- --version
```

Expected: Shows Jest version

**Step 5: Commit**

```bash
git add jest.config.js jest.setup.js package.json
git commit -m "chore: configure Jest for Next.js API testing"
```

---

### Task 3: Create Test Database Setup

**Files:**
- Create: `__tests__/setup/testDb.ts`

**Step 1: Create test database helper**

Create `__tests__/setup/testDb.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

export async function setupTestDb() {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db',
      },
    },
  })

  await prisma.$connect()
  
  // Clean all tables
  await prisma.gameAction.deleteMany()
  await prisma.gamePlayer.deleteMany()
  await prisma.game.deleteMany()
  await prisma.user.deleteMany()

  return prisma
}

export async function teardownTestDb() {
  await prisma.$disconnect()
}

export function getTestDb() {
  return prisma
}
```

**Step 2: Create test data fixtures**

Add to `__tests__/setup/testDb.ts`:

```typescript
export async function createTestUser(data = {}) {
  return await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      ...data,
    },
  })
}

export async function createTestGame(data = {}) {
  return await prisma.game.create({
    data: {
      status: 'active',
      ...data,
    },
    include: {
      players: true,
    },
  })
}
```

**Step 3: Add to .gitignore**

Add `test.db*` to `.gitignore`

**Step 4: Test the setup**

Create temporary test file `__tests__/setup.test.ts`:

```typescript
import { setupTestDb, teardownTestDb, createTestUser } from './setup/testDb'

describe('Test DB Setup', () => {
  beforeAll(async () => {
    await setupTestDb()
  })

  afterAll(async () => {
    await teardownTestDb()
  })

  it('should create test user', async () => {
    const user = await createTestUser()
    expect(user.email).toBe('test@example.com')
  })
})
```

**Step 5: Run test**

```bash
npm test -- __tests__/setup.test.ts
```

Expected: 1 test passing

**Step 6: Remove temporary test and commit**

```bash
rm __tests__/setup.test.ts
git add __tests__/setup/testDb.ts .gitignore
git commit -m "feat: add test database setup and fixtures"
```

---

### Task 4: Create Test Helpers

**Files:**
- Create: `__tests__/setup/testHelpers.ts`

**Step 1: Create API request helper**

Create `__tests__/setup/testHelpers.ts`:

```typescript
import { NextRequest } from 'next/server'

export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit)
}

export async function parseResponse(response: Response) {
  const data = await response.json()
  return {
    status: response.status,
    data,
  }
}
```

**Step 2: Add mock for OpenAI**

Add to `__tests__/setup/testHelpers.ts`:

```typescript
export function mockOpenAI() {
  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    action: 'CALL',
                    reason: 'Test AI decision',
                    amount: 100,
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  }))
}
```

**Step 3: Commit**

```bash
git add __tests__/setup/testHelpers.ts
git commit -m "feat: add test helpers for API requests"
```

---

### Task 5: Implement User API Tests

**Files:**
- Create: `__tests__/api/users.test.ts`

**Step 1: Write failing tests for GET /api/users**

Create `__tests__/api/users.test.ts`:

```typescript
import { GET, POST } from '@/app/api/users/route'
import { setupTestDb, teardownTestDb, createTestUser } from '../setup/testDb'
import { createMockRequest, parseResponse } from '../setup/testHelpers'

describe('GET /api/users', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should return all users', async () => {
    await createTestUser({ email: 'user1@test.com' })
    await createTestUser({ email: 'user2@test.com' })

    const request = createMockRequest('http://localhost:3000/api/users')
    const response = await GET()
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.users).toHaveLength(2)
  })

  it('should return empty array when no users exist', async () => {
    const request = createMockRequest('http://localhost:3000/api/users')
    const response = await GET()
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.users).toEqual([])
  })
})
```

**Step 2: Run tests (should pass if API works)**

```bash
npm test -- __tests__/api/users.test.ts
```

Expected: 2 tests passing

**Step 3: Write tests for POST /api/users**

Add to `__tests__/api/users.test.ts`:

```typescript
describe('POST /api/users', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should create a new user with valid data', async () => {
    const request = createMockRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: {
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(201)
    expect(data.email).toBe('new@test.com')
    expect(data.name).toBe('New User')
  })

  it('should return 400 if email is missing', async () => {
    const request = createMockRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: { name: 'Test', password: 'pass' },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(400)
    expect(data.error).toContain('Email')
  })

  it('should return 409 if user already exists', async () => {
    await createTestUser({ email: 'exists@test.com' })

    const request = createMockRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: {
        name: 'Duplicate',
        email: 'exists@test.com',
        password: 'pass',
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(409)
    expect(data.error).toContain('already exists')
  })
})
```

**Step 4: Run tests**

```bash
npm test -- __tests__/api/users.test.ts
```

Expected: 5 tests passing

**Step 5: Commit**

```bash
git add __tests__/api/users.test.ts
git commit -m "test: add user API tests (5 test cases)"
```

---

### Task 6: Implement Games API Tests

**Files:**
- Create: `__tests__/api/games.test.ts`

**Step 1: Write tests for GET /api/games**

Create `__tests__/api/games.test.ts`:

```typescript
import { GET, POST } from '@/app/api/games/route'
import { setupTestDb, teardownTestDb, createTestGame } from '../setup/testDb'
import { createMockRequest, parseResponse } from '../setup/testHelpers'

describe('GET /api/games', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should return all games with players and actions', async () => {
    await createTestGame()
    await createTestGame()

    const request = createMockRequest('http://localhost:3000/api/games')
    const response = await GET()
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data).toHaveLength(2)
  })

  it('should return empty array when no games exist', async () => {
    const response = await GET()
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data).toEqual([])
  })
})

describe('POST /api/games', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should create a new game with players', async () => {
    const request = createMockRequest('http://localhost:3000/api/games', {
      method: 'POST',
      body: {
        players: [
          { playerId: 'p1', name: 'Player 1', position: 0, startingChips: 1000 },
          { playerId: 'p2', name: 'Player 2', position: 1, startingChips: 1000 },
        ],
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.status).toBe('active')
    expect(data.players).toHaveLength(2)
  })
})
```

**Step 2: Run tests**

```bash
npm test -- __tests__/api/games.test.ts
```

Expected: 3 tests passing

**Step 3: Commit**

```bash
git add __tests__/api/games.test.ts
git commit -m "test: add games API tests (3 test cases)"
```

---

### Task 7: Implement Game Details API Tests

**Files:**
- Create: `__tests__/api/gameDetails.test.ts`

**Step 1: Write tests for GET /api/games/:gameId**

Create `__tests__/api/gameDetails.test.ts`:

```typescript
import { GET, PATCH, DELETE } from '@/app/api/games/[gameId]/route'
import { setupTestDb, teardownTestDb, createTestGame } from '../setup/testDb'
import { createMockRequest, parseResponse } from '../setup/testHelpers'

describe('GET /api/games/:gameId', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should return game details', async () => {
    const game = await createTestGame()

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}?gameId=${game.id}`
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.id).toBe(game.id)
  })

  it('should return 404 if game not found', async () => {
    const request = createMockRequest(
      'http://localhost:3000/api/games/invalid?gameId=invalid'
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(404)
    expect(data.error).toContain('not found')
  })
})

describe('PATCH /api/games/:gameId', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should update game status', async () => {
    const game = await createTestGame()

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}?gameId=${game.id}`,
      {
        method: 'PATCH',
        body: { status: 'completed' },
      }
    )
    const response = await PATCH(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.status).toBe('completed')
  })
})

describe('DELETE /api/games/:gameId', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should delete a game', async () => {
    const game = await createTestGame()

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}?gameId=${game.id}`,
      { method: 'DELETE' }
    )
    const response = await DELETE(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

**Step 2: Run tests**

```bash
npm test -- __tests__/api/gameDetails.test.ts
```

Expected: 4 tests passing

**Step 3: Commit**

```bash
git add __tests__/api/gameDetails.test.ts
git commit -m "test: add game details API tests (4 test cases)"
```

---

### Task 8: Implement Game Actions API Tests

**Files:**
- Create: `__tests__/api/gameActions.test.ts`

**Step 1: Write tests for game actions endpoints**

Create `__tests__/api/gameActions.test.ts`:

```typescript
import { GET, POST } from '@/app/api/games/[gameId]/actions/route'
import { setupTestDb, teardownTestDb, createTestGame, getTestDb } from '../setup/testDb'
import { createMockRequest, parseResponse } from '../setup/testHelpers'

describe('Game Actions API', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  describe('GET /api/games/:gameId/actions', () => {
    it('should return all actions for a game', async () => {
      const game = await createTestGame()
      const prisma = getTestDb()

      // Create test player and action
      const player = await prisma.gamePlayer.create({
        data: {
          gameId: game.id,
          playerId: 'p1',
          name: 'Player 1',
          position: 0,
          startingChips: 1000,
        },
      })

      await prisma.gameAction.create({
        data: {
          gameId: game.id,
          playerId: player.id,
          actionType: 'CALL',
          amount: 100,
          sequenceNumber: 1,
          gameState: {},
        },
      })

      const request = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions?gameId=${game.id}`
      )
      const response = await GET(request)
      const { status, data } = await parseResponse(response)

      expect(status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].actionType).toBe('CALL')
    })
  })

  describe('POST /api/games/:gameId/actions', () => {
    it('should create action with auto-increment sequence', async () => {
      const game = await createTestGame()

      const request = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions`,
        {
          method: 'POST',
          body: {
            gameId: game.id,
            playerId: 'p1',
            actionType: 'FOLD',
            gameState: {
              players: [{ id: 'p1', name: 'Player 1', chips: 1000, position: 0 }],
            },
          },
        }
      )

      const response = await POST(request)
      const { status, data } = await parseResponse(response)

      expect(status).toBe(200)
      expect(data.sequenceNumber).toBe(1)
    })
  })
})
```

**Step 2: Run tests**

```bash
npm test -- __tests__/api/gameActions.test.ts
```

Expected: 2+ tests passing

**Step 3: Commit**

```bash
git add __tests__/api/gameActions.test.ts
git commit -m "test: add game actions API tests"
```

---

### Task 9: Implement Remaining API Tests

**Files:**
- Create: `__tests__/api/gameRounds.test.ts`
- Create: `__tests__/api/humanPlayer.test.ts`
- Create: `__tests__/api/ai.test.ts`

**Step 1: Create game rounds tests**

Similar pattern - test GET endpoint for rounds grouping.

**Step 2: Create human player tests**

Mock the action analyzer and test POST endpoint.

**Step 3: Create AI tests**

Mock OpenAI API and test AI decision endpoint.

**Step 4: Run all tests**

```bash
npm test
```

Expected: 46 tests passing

**Step 5: Commit**

```bash
git add __tests__/
git commit -m "test: add remaining API tests (game rounds, human player, AI)"
```

---

### Task 10: Add Test Coverage Report

**Step 1: Run coverage**

```bash
npm run test:coverage
```

Expected: Coverage report generated

**Step 2: Add coverage to .gitignore**

Add `coverage/` to `.gitignore`

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add test coverage to gitignore"
```

---

### Task 11: Update Documentation

**Files:**
- Modify: `README.md`

**Step 1: Add testing section to README**

Add section:

```markdown
## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

**Test Coverage:** 46 test cases covering all 14 API endpoints
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add testing section to README"
```

---

### Task 12: Final Verification

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All 46 tests passing

**Step 2: Run linter**

```bash
npm run lint
```

Expected: No errors

**Step 3: Verify coverage**

```bash
npm run test:coverage
```

Expected: High coverage for API routes (>80%)

