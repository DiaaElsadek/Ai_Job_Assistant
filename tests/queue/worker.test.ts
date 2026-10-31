import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { isQueueHealthy, sendJob, startBoss, stopBoss, registerWorker, getBossClient } from '@/src/server/queue/boss'

describe('PostgreSQL Background Queue (pg-boss)', () => {
  beforeAll(async () => {
    // Ensure .env is loaded
    if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
      try {
        process.loadEnvFile('.env')
      } catch {
        // Ignore if already set
      }
    }
    await startBoss()
  }, 15000)

  afterAll(async () => {
    await stopBoss(5000)
  }, 10000)

  it('connects to PostgreSQL and reports queue health', async () => {
    const health = await isQueueHealthy()
    expect(health.healthy).toBe(true)
    expect(health.error).toBeUndefined()
  }, 15000)

  it('enqueues a job into pg-boss and returns a job id', async () => {
    const jobId = await sendJob('test-queue-probe', {
      timestamp: Date.now(),
      target: 'vitest-test-runner',
    })

    expect(jobId).toBeDefined()
    expect(typeof jobId).toBe('string')
    expect(jobId!.length).toBeGreaterThan(0)
  }, 15000)

  it('executes a job via worker handler', async () => {
    const testPayload = { testId: `probe-${Date.now()}` }
    let executedPayload: unknown = null

    // Register a worker handler using our queue helper
    await registerWorker('test-worker-execution', async (jobs) => {
      for (const job of jobs) {
        executedPayload = job.data
      }
    })

    await sendJob('test-worker-execution', testPayload)

    // Wait up to 3 seconds for worker to process
    for (let i = 0; i < 30; i++) {
      if (executedPayload) break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    expect(executedPayload).toEqual(testPayload)
    const boss = getBossClient()
    await boss.offWork('test-worker-execution')
  }, 15000)
})
