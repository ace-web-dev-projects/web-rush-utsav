import 'dotenv/config'
import { prisma } from '../src/db.js'

try {
  const result = await prisma.$queryRaw`SELECT 1 AS connected`
  console.log('Database connection successful:', result)
} catch (error) {
  console.error('Database test failed:', error)
} finally {
  await prisma.$disconnect()
}