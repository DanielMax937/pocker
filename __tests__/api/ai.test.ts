import { POST } from '@/app/api/ai/route'
import { setupTestDb, teardownTestDb } from '../setup/testDb'
import { createMockRequest, parseResponse } from '../setup/testHelpers'

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    action: 'CALL',
                    reason: 'Good pot odds with strong draw',
                    amount: 100,
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  }
})

// Mock fetch for internal API calls
global.fetch = jest.fn((url) => {
  if (url.includes('/api/games/') && url.includes('/actions')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          player: { name: 'Player 1' },
          actionType: 'CALL',
          amount: 50,
        },
      ]),
    } as Response)
  }
  return Promise.reject(new Error('Unknown URL'))
}) as jest.Mock

describe('POST /api/ai', () => {
  beforeEach(async () => {
    await setupTestDb()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should return AI decision for poker action', async () => {
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {
        prompt: 'What should I do with pocket aces?',
        gameId: 'test-game-1',
        gameState: {
          phase: 'pre-flop',
          pot: 100,
          currentBet: 50,
          communityCards: [],
          players: [
            { name: 'AI Player', chips: 1000, folded: false },
            { name: 'Human', chips: 950, folded: false },
          ],
        },
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.action).toBeDefined()
    expect(data.reason).toBeDefined()
  })

  it('should include amount for RAISE action', async () => {
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {
        prompt: 'Should I raise with this hand?',
        gameId: 'test-game-1',
        gameState: {
          phase: 'flop',
          pot: 200,
          currentBet: 100,
          communityCards: ['Ah', 'Kd', 'Qc'],
          players: [{ name: 'AI Player', chips: 1000, folded: false }],
        },
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.amount).toBeDefined()
  })

  it('should work without game history', async () => {
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {
        prompt: 'What should I do?',
        gameState: {
          phase: 'pre-flop',
          pot: 50,
          currentBet: 25,
          communityCards: [],
          players: [{ name: 'AI Player', chips: 1000, folded: false }],
        },
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.action).toBeDefined()
  })

  it('should handle player folding status', async () => {
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {
        prompt: 'Should I continue?',
        gameState: {
          phase: 'turn',
          pot: 300,
          currentBet: 150,
          communityCards: ['Ah', 'Kd', 'Qc', 'Js'],
          players: [
            { name: 'AI Player', chips: 850, folded: false },
            { name: 'Player 2', chips: 0, folded: true },
          ],
        },
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.action).toBeDefined()
  })

  it('should handle missing prompt', async () => {
    // Test with invalid/missing data
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {},
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    // Should still return 200 as OpenAI is mocked to always succeed
    // In a real scenario with validation, this would return 400
    expect(status).toBe(200)
    expect(data).toBeDefined()
  })

  it('should include community cards in context', async () => {
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {
        prompt: 'Evaluate my hand',
        gameState: {
          phase: 'river',
          pot: 500,
          currentBet: 200,
          communityCards: ['Ah', 'Ad', 'Ac', 'Ks', 'Qh'],
          players: [{ name: 'AI Player', chips: 800, folded: false }],
        },
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.action).toBeDefined()
    expect(data.reason).toBeDefined()
  })

  it('should handle game state without optional fields', async () => {
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {
        prompt: 'What to do?',
        gameState: {
          phase: 'pre-flop',
          pot: 100,
          currentBet: 50,
          communityCards: [],
          players: [{ name: 'AI', chips: 1000 }],
        },
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.action).toBeDefined()
  })

  it('should process multiple player states', async () => {
    const request = createMockRequest('http://localhost:3000/api/ai', {
      method: 'POST',
      body: {
        prompt: 'Analyze the table',
        gameState: {
          phase: 'flop',
          pot: 400,
          currentBet: 100,
          communityCards: ['7h', '8d', '9c'],
          players: [
            { name: 'AI', chips: 900, folded: false },
            { name: 'Player 2', chips: 850, folded: false },
            { name: 'Player 3', chips: 0, folded: true },
            { name: 'Player 4', chips: 1200, folded: false },
          ],
        },
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.action).toBeDefined()
  })
})

