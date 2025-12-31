import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

export async function setupTestDb() {
  // Set test database URL
  process.env.DATABASE_URL = 'file:./test.db'
  
  prisma = new PrismaClient()
  await prisma.$connect()
  
  // Clean all tables
  await prisma.gameAction.deleteMany()
  await prisma.gamePlayer.deleteMany()
  await prisma.game.deleteMany()

  return prisma
}

export async function teardownTestDb() {
  await prisma.$disconnect()
}

export function getTestDb() {
  return prisma
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

