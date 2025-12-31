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
    expect(data.status).toBe('active')
    expect(data.players).toBeDefined()
    expect(data.actions).toBeDefined()
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

  it('should include game players in response', async () => {
    const game = await createTestGame()

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}?gameId=${game.id}`
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(Array.isArray(data.players)).toBe(true)
    expect(Array.isArray(data.actions)).toBe(true)
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
    expect(data.id).toBe(game.id)
  })

  it('should maintain game ID when updating', async () => {
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
    expect(data.id).toBe(game.id)
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

  it('should return error when deleting non-existent game', async () => {
    const request = createMockRequest(
      'http://localhost:3000/api/games/invalid?gameId=invalid',
      { method: 'DELETE' }
    )
    const response = await DELETE(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(500)
    expect(data.error).toContain('Failed to delete')
  })
})

