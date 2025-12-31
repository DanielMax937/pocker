import { GET } from '@/app/api/games/[gameId]/rounds/route'
import { setupTestDb, teardownTestDb, createTestGame, getTestDb } from '../setup/testDb'
import { createMockRequest, parseResponse } from '../setup/testHelpers'

describe('GET /api/games/:gameId/rounds', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('should return 404 for non-existent game', async () => {
    const request = createMockRequest(
      'http://localhost:3000/api/games/invalid/rounds?gameId=invalid'
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(404)
    expect(data.error).toContain('not found')
  })

  it('should return empty array for game with no actions', async () => {
    const game = await createTestGame()

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/rounds?gameId=${game.id}`
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data).toEqual([])
  })

  it('should group actions by game phase', async () => {
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

    // Create actions for pre-flop phase
    await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'CALL',
        amount: 50,
        sequenceNumber: 1,
        gameState: {
          gamePhase: 'pre-flop',
          pot: 50,
          communityCards: [],
        },
      },
    })

    // Create actions for flop phase
    await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'BET',
        amount: 100,
        sequenceNumber: 2,
        gameState: {
          gamePhase: 'flop',
          pot: 150,
          communityCards: ['Ah', 'Kd', 'Qc'],
        },
      },
    })

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/rounds?gameId=${game.id}`
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].phase).toBe('pre-flop')
    expect(data[1].phase).toBe('flop')
  })

  it('should include pot and community cards for each round', async () => {
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

    await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'BET',
        amount: 100,
        sequenceNumber: 1,
        gameState: {
          gamePhase: 'flop',
          pot: 100,
          communityCards: ['Ah', 'Kd', 'Qc'],
        },
      },
    })

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/rounds?gameId=${game.id}`
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data[0].pot).toBe(100)
    expect(data[0].communityCards).toEqual(['Ah', 'Kd', 'Qc'])
  })

  it('should group multiple actions in same phase', async () => {
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

    // Create multiple actions in flop phase
    await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'BET',
        amount: 50,
        sequenceNumber: 1,
        gameState: {
          gamePhase: 'flop',
          pot: 50,
          communityCards: ['Ah', 'Kd', 'Qc'],
        },
      },
    })

    await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'CALL',
        amount: 50,
        sequenceNumber: 2,
        gameState: {
          gamePhase: 'flop',
          pot: 100,
          communityCards: ['Ah', 'Kd', 'Qc'],
        },
      },
    })

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/rounds?gameId=${game.id}`
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].actions).toHaveLength(2)
  })

  it('should update pot as actions progress in same phase', async () => {
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

    await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'BET',
        amount: 50,
        sequenceNumber: 1,
        gameState: {
          gamePhase: 'flop',
          pot: 50,
          communityCards: ['Ah', 'Kd', 'Qc'],
        },
      },
    })

    await prisma.gameAction.create({
      data: {
        gameId: game.id,
        playerId: player.id,
        actionType: 'RAISE',
        amount: 150,
        sequenceNumber: 2,
        gameState: {
          gamePhase: 'flop',
          pot: 200,
          communityCards: ['Ah', 'Kd', 'Qc'],
        },
      },
    })

    const request = createMockRequest(
      `http://localhost:3000/api/games/${game.id}/rounds?gameId=${game.id}`
    )
    const response = await GET(request)
    const { status, data } = await parseResponse(response)

    expect(status).toBe(200)
    expect(data[0].pot).toBe(200) // Should reflect final pot after all actions
  })
})

