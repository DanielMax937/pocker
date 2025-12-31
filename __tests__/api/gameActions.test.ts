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

    it('should return actions in sequence order', async () => {
      const game = await createTestGame()
      const prisma = getTestDb()

      const player = await prisma.gamePlayer.create({
        data: {
          gameId: game.id,
          playerId: 'p1',
          name: 'Player 1',
          position: 0,
          startingChips: 1000,
        },
      })

      // Create multiple actions out of order
      await prisma.gameAction.create({
        data: {
          gameId: game.id,
          playerId: player.id,
          actionType: 'RAISE',
          amount: 200,
          sequenceNumber: 2,
          gameState: {},
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
      expect(data).toHaveLength(2)
      expect(data[0].sequenceNumber).toBe(1)
      expect(data[1].sequenceNumber).toBe(2)
    })

    it('should return empty array for game with no actions', async () => {
      const game = await createTestGame()

      const request = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions?gameId=${game.id}`
      )
      const response = await GET(request)
      const { status, data } = await parseResponse(response)

      expect(status).toBe(200)
      expect(data).toEqual([])
    })
  })

  describe('POST /api/games/:gameId/actions', () => {
    it('should create action with auto-increment sequence', async () => {
      const game = await createTestGame()

      const request = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions?gameId=${game.id}`,
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
      expect(data.actionType).toBe('FOLD')
    })

    it('should increment sequence number for subsequent actions', async () => {
      const game = await createTestGame()

      // First action
      const request1 = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions?gameId=${game.id}`,
        {
          method: 'POST',
          body: {
            gameId: game.id,
            playerId: 'p1',
            actionType: 'CALL',
            amount: 100,
            gameState: {
              players: [{ id: 'p1', name: 'Player 1', chips: 1000, position: 0 }],
            },
          },
        }
      )
      await POST(request1)

      // Second action
      const request2 = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions?gameId=${game.id}`,
        {
          method: 'POST',
          body: {
            gameId: game.id,
            playerId: 'p2',
            actionType: 'RAISE',
            amount: 200,
            gameState: {
              players: [
                { id: 'p1', name: 'Player 1', chips: 900, position: 0 },
                { id: 'p2', name: 'Player 2', chips: 1000, position: 1 },
              ],
            },
          },
        }
      )
      const response = await POST(request2)
      const { status, data } = await parseResponse(response)

      expect(status).toBe(200)
      expect(data.sequenceNumber).toBe(2)
    })

    it('should create player if not exists', async () => {
      const game = await createTestGame()

      const request = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions?gameId=${game.id}`,
        {
          method: 'POST',
          body: {
            gameId: game.id,
            playerId: 'new-player',
            actionType: 'BET',
            amount: 50,
            gameState: {
              players: [{ id: 'new-player', name: 'New Player', chips: 1000, position: 0 }],
            },
          },
        }
      )

      const response = await POST(request)
      const { status, data } = await parseResponse(response)

      expect(status).toBe(200)
      expect(data.player.playerId).toBe('new-player')
      expect(data.player.name).toBe('New Player')
    })

    it('should store action with reason', async () => {
      const game = await createTestGame()

      const request = createMockRequest(
        `http://localhost:3000/api/games/${game.id}/actions?gameId=${game.id}`,
        {
          method: 'POST',
          body: {
            gameId: game.id,
            playerId: 'p1',
            actionType: 'CALL',
            amount: 100,
            reason: 'Good pot odds',
            gameState: {
              players: [{ id: 'p1', name: 'Player 1', chips: 1000, position: 0 }],
            },
          },
        }
      )

      const response = await POST(request)
      const { status, data } = await parseResponse(response)

      expect(status).toBe(200)
      expect(data.actionReason).toBe('Good pot odds')
    })
  })
})

