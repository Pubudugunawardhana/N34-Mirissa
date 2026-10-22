import { Prisma, PrismaClient } from '@prisma/client'

// The database (Neon) goes to sleep when idle and the first connection after that can time out
// with "Can't reach database server". These codes all mean "never got to run the query",
// so trying again is safe: P1001 unreachable, P1002 timed out, P1017 connection closed,
// P2024 every pooled connection was busy (or still being opened) for too long.
const CONNECTION_ERROR_CODES = ['P1001', 'P1002', 'P1017', 'P2024']
const RETRY_DELAYS_MS = [500, 1500]

function isConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true
  return error instanceof Prisma.PrismaClientKnownRequestError && CONNECTION_ERROR_CODES.includes(error.code)
}

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args)
          } catch (error) {
            if (!isConnectionError(error) || attempt >= RETRY_DELAYS_MS.length) throw error
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
          }
        }
      },
    },
  })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
