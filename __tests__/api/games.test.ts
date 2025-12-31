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
    expect(data.players[0].name).toBe('Player 1')
    expect(data.players[1].name).toBe('Player 2')
  })

  it('should create a game with multiple AI players', async () => {
    const request = createMockRequest('http://localhost:3000/api/games', {
      method: 'POST',
      body: {
        players: [
          { playerId: 'user-1', name: 'Human', position: 0, startingChips: 1000 },
          { playerId: 'ai-1', name: 'AI 1', position: 1, startingChips: 1000 },
          { playerId: 'ai-2', name: 'AI 2', position: 2, startingChips: 1000 },
          { playerId: 'ai-3', name: 'AI 3', position: 3, startingChips: 1000 },
        ],
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    if (status !== 200) {
      console.error('Error response:', data)
    }

    expect(status).toBe(200)
    expect(data.players).toHaveLength(4)
  })

  it('should create game with custom starting chips', async () => {
    const request = createMockRequest('http://localhost:3000/api/games', {
      method: 'POST',
      body: {
        players: [
          { playerId: 'p1', name: 'Player 1', position: 0, startingChips: 5000 },
        ],
      },
    })

    const response = await POST(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data.players[0].startingChips).toBe(5000)
  })
})

