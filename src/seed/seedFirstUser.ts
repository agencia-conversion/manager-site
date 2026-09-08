import type { Payload } from 'payload'

/** Cria o primeiro admin se o D1 estiver vazio. Sem isso o /admin fica aberto. */
export async function seedFirstUserIfEmpty(payload: Payload): Promise<void> {
  const email = process.env.PAYLOAD_FIRST_USER_EMAIL
  const password = process.env.PAYLOAD_FIRST_USER_PASSWORD
  if (!email || !password) {
    payload.logger.warn('PAYLOAD_FIRST_USER_EMAIL/PASSWORD ausentes; /admin pode ficar aberto')
    return
  }
  try {
    const existing = await payload.find({
      collection: 'users',
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) return

    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email, password },
    })
    payload.logger.info('Seeded first admin user')
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    payload.logger.warn({ err: message }, 'First user seed skipped')
  }
}
