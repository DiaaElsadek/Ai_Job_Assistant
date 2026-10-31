import { PgBoss, type SendOptions, type WorkHandler, type WorkOptions } from 'pg-boss'

let bossInstance: PgBoss | null = null
const knownQueues = new Set<string>()

export function getDatabaseConnectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured in environment')
  }
  return url
}

/**
 * Returns the singleton PgBoss client instance.
 * Does not start the worker polling loop automatically.
 */
export function getBossClient(): PgBoss {
  if (!bossInstance) {
    const connectionString = getDatabaseConnectionString()
    bossInstance = new PgBoss({
      connectionString,
      schema: 'pgboss',
      max: 5, // Dedicated connection pool for queue
    })

    bossInstance.on('error', (err) => {
      console.error('[pg-boss] Queue error:', err)
    })
  }

  return bossInstance
}

/**
 * Ensures the target queue exists in pg-boss before jobs are sent or consumed.
 */
export async function ensureQueue(name: string): Promise<void> {
  if (knownQueues.has(name)) return
  const boss = getBossClient()
  try {
    await boss.createQueue(name)
    knownQueues.add(name)
  } catch {
    // Already exists or created concurrently
    knownQueues.add(name)
  }
}

/**
 * Starts the PgBoss instance (creates schema if needed, begins polling).
 */
export async function startBoss(): Promise<PgBoss> {
  const boss = getBossClient()
  await boss.start()
  return boss
}

/**
 * Gracefully stops the PgBoss worker with timeout.
 */
export async function stopBoss(timeoutMs = 10000): Promise<void> {
  if (bossInstance) {
    await bossInstance.stop({ graceful: true, timeout: timeoutMs })
    bossInstance = null
    knownQueues.clear()
  }
}

/**
 * Enqueue a job into the pg-boss queue (Producer helper).
 * Automatically ensures the queue exists and the client is started.
 */
export async function sendJob<T extends object>(
  name: string,
  data?: T | null,
  options?: SendOptions
): Promise<string | null> {
  const boss = getBossClient()
  try {
    await ensureQueue(name)
    return await boss.send(name, data ?? null, options)
  } catch {
    // If client wasn't started yet, start it and retry once
    await boss.start()
    await ensureQueue(name)
    return await boss.send(name, data ?? null, options)
  }
}

/**
 * Registers a worker handler for a queue, ensuring the queue exists first.
 */
export async function registerWorker<
  ReqData = Record<string, unknown>,
  ResData = unknown
>(
  name: string,
  handler: WorkHandler<ReqData, ResData>,
  options?: WorkOptions
): Promise<string> {
  const boss = getBossClient()
  await ensureQueue(name)
  if (options) {
    return await boss.work(name, options, handler)
  }
  return await boss.work(name, handler)
}

/**
 * Health check helper to verify database and pg-boss queue status.
 */
export async function isQueueHealthy(): Promise<{
  healthy: boolean
  schemaVersion?: number | null
  error?: string
}> {
  try {
    const boss = getBossClient()
    await boss.start()
    const version = await boss.schemaVersion()
    return { healthy: true, schemaVersion: version }
  } catch (err) {
    return { healthy: false, error: err instanceof Error ? err.message : String(err) }
  }
}
