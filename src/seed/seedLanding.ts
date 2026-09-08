import type { Payload } from 'payload'

import { landingSeed } from '@/seed/landing'

/** Publica o copy estático se o global landing ainda estiver vazio. */
export async function seedLandingIfEmpty(payload: Payload): Promise<void> {
  try {
    const existing = await payload.findGlobal({
      slug: 'landing',
      draft: true,
      overrideAccess: true,
    })
    if (existing?.heroTitle) return

    await payload.updateGlobal({
      slug: 'landing',
      draft: false,
      overrideAccess: true,
      data: {
        ...landingSeed,
        flowSteps: landingSeed.flowSteps.map((s) => ({ ...s })),
        _status: 'published',
      },
    })
    payload.logger.info('Seeded landing global from static copy')
  } catch (err) {
    payload.logger.warn({ err }, 'Landing seed skipped (DB not ready?)')
  }
}
