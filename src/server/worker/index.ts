import { startBoss, stopBoss, registerWorker } from '@/src/server/queue/boss'

// Automatically load local .env if DATABASE_URL is not yet set in environment
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env')
  } catch (err) {
    console.warn('[Worker] Notice: .env file not loaded via process.loadEnvFile:', err)
  }
}

async function bootstrapWorker() {
  console.log('[Worker] Booting JobFlow AI background worker...')

  try {
    await startBoss()
    console.log('[Worker] pg-boss queue successfully connected to PostgreSQL.')

    // Register probe/health job handler
    await registerWorker('system-probe', async (jobs) => {
      for (const job of jobs) {
        console.log('[Worker] Executing system-probe task:', job.id, job.data)
      }
    })

    console.log('[Worker] Handlers registered. Listening for jobs...')

    // Graceful shutdown handlers
    let isShuttingDown = false
    const handleShutdown = async (signal: string) => {
      if (isShuttingDown) return
      isShuttingDown = true

      console.log(`[Worker] Received ${signal}. Shutting down worker gracefully...`)
      try {
        await stopBoss(10000)
        console.log('[Worker] pg-boss successfully stopped. Exiting process.')
        process.exit(0)
      } catch (err) {
        console.error('[Worker] Error during shutdown:', err)
        process.exit(1)
      }
    }

    process.on('SIGINT', () => handleShutdown('SIGINT'))
    process.on('SIGTERM', () => handleShutdown('SIGTERM'))
  } catch (err) {
    console.error('[Worker] Failed to start background worker:', err)
    process.exit(1)
  }
}

// Only execute bootstrap when run directly as a script
if (process.argv[1]?.includes('worker')) {
  bootstrapWorker()
}

export { bootstrapWorker }
