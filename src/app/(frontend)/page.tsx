import type { Metadata } from 'next'
import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

import { landingSeed } from '@/seed/landing'
import './styles.css'

export const dynamic = 'force-dynamic'

type LandingData = typeof landingSeed & { _status?: string | null }

const loadLanding = cache(async (): Promise<LandingData> => {
  // Keep `next build` off D1/getPayload — deterministic HTML from seed.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return { ...landingSeed, flowSteps: [...landingSeed.flowSteps] }
  }

  try {
    const payload = await getPayload({ config })
    const doc = await payload.findGlobal({
      slug: 'landing',
      depth: 0,
      draft: false,
      overrideAccess: false,
    })
    if (doc?.heroTitle) {
      return {
        metaTitle: doc.metaTitle || landingSeed.metaTitle,
        metaDescription: doc.metaDescription || landingSeed.metaDescription,
        mark: doc.mark || landingSeed.mark,
        navFlowLabel: doc.navFlowLabel || landingSeed.navFlowLabel,
        navGithubLabel: doc.navGithubLabel || landingSeed.navGithubLabel,
        navGithubUrl: doc.navGithubUrl || landingSeed.navGithubUrl,
        kicker: doc.kicker || landingSeed.kicker,
        heroTitle: doc.heroTitle || landingSeed.heroTitle,
        lede: doc.lede || landingSeed.lede,
        ctaLabel: doc.ctaLabel || landingSeed.ctaLabel,
        ctaHref: doc.ctaHref || landingSeed.ctaHref,
        ghostLabel: doc.ghostLabel || landingSeed.ghostLabel,
        ghostHref: doc.ghostHref || landingSeed.ghostHref,
        flowSteps:
          doc.flowSteps?.length
            ? doc.flowSteps.map((s) => ({ step: s.step, label: s.label }))
            : [...landingSeed.flowSteps],
        footer: doc.footer || landingSeed.footer,
        _status: doc._status,
      }
    }
  } catch {
    // D1 ainda não migrado / seed — fallback pixel-igual ao HTML estático
  }
  return { ...landingSeed, flowSteps: [...landingSeed.flowSteps] }
})

export async function generateMetadata(): Promise<Metadata> {
  const landing = await loadLanding()
  return {
    title: landing.metaTitle,
    description: landing.metaDescription,
  }
}

export default async function HomePage() {
  const landing = await loadLanding()
  const titleLines = landing.heroTitle.split('\n')

  return (
    <>
      <header className="top">
        <span className="mark">{landing.mark}</span>
        <nav>
          <a href="#fluxo">{landing.navFlowLabel}</a>
          <a href={landing.navGithubUrl}>{landing.navGithubLabel}</a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <p className="kicker">{landing.kicker}</p>
          <h1 id="hero-title">
            {titleLines.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </React.Fragment>
            ))}
          </h1>
          <p className="lede">{landing.lede}</p>
          <div className="actions">
            <a className="cta" href={landing.ctaHref}>
              {landing.ctaLabel}
            </a>
            <a className="ghost" href={landing.ghostHref}>
              {landing.ghostLabel}
            </a>
          </div>
        </section>

        <section id="fluxo" className="flow" aria-label="Pipeline">
          <ol>
            {landing.flowSteps.map((item) => (
              <li key={item.step}>
                <span>{item.step}</span> {item.label}
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer>
        <p>{landing.footer}</p>
      </footer>
    </>
  )
}
