import { POST } from '@/app/api/games/[gameId]/human/route'
import { setupTestDb, teardownTestDb, createTestGame, getTestDb } from '../setup/testDb'
import { createMockRequest, parseResponse } from '../setup/testHelpers'

// Mock the action analyzer
jest.mock('@/app/lib/action-analyzer', () => ({
  analyzePlayerAction: jest.fn().mockResolvedValue({
    isGoodAction: true,
    reason: 'Good call with pot odds',
    suggestedAction: {
      action: 'CALL',
      amount: 100,
    },
  }),
}))

// Mock prisma to use test DB
jest.mock('@/app/lib/prisma', () => {
  const { getTestDb } = require('../setup/testDb')
  return {
    __esModule: true,
    default: {
      get gameAction() {
        return getTestDb()?.gameAction
      },
    },
  }
})

// Mock fetch for internal API calls
global.fetch = jest.fn((url) => {
  if (url.includes('/api/games/') && url.includes('/actions')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)
  }
  if (url.includes('/api/games/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-game',
        status: 'active',
        players: [],
      }),
    } as Response)
  }
  return Promise.reject(new Error('Unknown URL'))
}) as jest.Mock

describe('POST /api/games/:gameId/human', () => {
  beforeEach(async () => {
    await setupTestDb()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should process human player action with analysis', async () => {
    const game = await createTestGame()
    const prisma = getTestDb()

    const player = await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        playerId: 'human',
        name: 'Human Player',
        position: 0,
        startingChips: 1000,
      },
    })

    const action = await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'CALL',
        amount: 100,
        sequenceNumber: 1,
        gameState: {
          phase: 'flop',
          pot: 100,
          currentBet: 100,
          communityCards: ['Ah', 'Kd', 'Qc'],
        },
      },
    })

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/human`,
      {
        method: 'POST',
        body: {
          actionId: action.id,
          actionType: 'CALL',
          amount: 100,
        },
      }
    )

    const response = await POST(request, { params: Promise.resolve({ gameId: game.id }) })
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.analysis).toBeDefined()
    expect(data.analysis.isGoodAction).toBe(true)
  })

  it('should include game ID in response', async () => {
    const game = await createTestGame()
    const prisma = getTestDb()

    const player = await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        playerId: 'human',
        name: 'Human Player',
        position: 0,
        startingChips: 1000,
      },
    })

    const action = await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'FOLD',
        sequenceNumber: 1,
        gameState: {},
      },
    })

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/human`,
      {
        method: 'POST',
        body: {
          actionId: action.id,
          actionType: 'FOLD',
        },
      }
    )

    const response = await POST(request, { params: Promise.resolve({ gameId: game.id }) })
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.gameId).toBe(game.id)
  })

  it('should add timestamp to action data', async () => {
    const game = await createTestGame()
    const prisma = getTestDb()

    const player = await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        playerId: 'human',
        name: 'Human Player',
        position: 0,
        startingChips: 1000,
      },
    })

    const action = await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'CHECK',
        sequenceNumber: 1,
        gameState: {},
      },
    })

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/human`,
      {
        method: 'POST',
        body: {
          actionId: action.id,
          actionType: 'CHECK',
        },
      }
    )

    const response = await POST(request, { params: Promise.resolve({ gameId: game.id }) })
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
  })

  it('should handle errors gracefully', async () => {
    const request = createMockRequest(
      'http://localhost:3000/api/games/invalid/human',
      {
        method: 'POST',
        body: {
          actionId: 'invalid',
          actionType: 'CALL',
        },
      }
    )

    const response = await POST(request, { params: Promise.resolve({ gameId: 'invalid' }) })
    const { status, data } = await parseResponse(response)

    expect(status).toBe(500)
    expect(data.error).toContain('Failed to process action')
  })
})

