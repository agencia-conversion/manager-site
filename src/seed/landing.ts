/** Copy atual da landing estática — seed + fallback se o global ainda não existir. */
export const landingSeed = {
  metaTitle: 'Manager — issues de negócio, agentes por baixo',
  metaDescription:
    'Control plane local para Claude, Codex e Cursor. Brief, QA, preview Cloudflare Pages, depois produção.',
  mark: 'MANAGER',
  navFlowLabel: 'Fluxo',
  navGithubLabel: 'GitHub',
  navGithubUrl: 'https://github.com/agencia-conversion/manager-site',
  kicker: 'Conversion · control plane',
  heroTitle: 'Issues de negócio.\nAgentes por baixo.',
  lede: 'O Manager orquestra Claude, Codex e Cursor no seu repo. Você aprova o brief e o preview. O resto — workers, QA Playwright, Cloudflare Pages — roda sozinho.',
  ctaLabel: 'Ver o fluxo',
  ctaHref: '#fluxo',
  ghostLabel: 'GitHub',
  ghostHref: 'https://github.com/agencia-conversion/manager-site',
  flowSteps: [
    { step: '01', label: 'Issue de negócio' },
    { step: '02', label: 'Briefing agents' },
    { step: '03', label: 'Você aprova o brief' },
    { step: '04', label: 'Workers + QA' },
    { step: '05', label: 'Preview Cloudflare' },
    { step: '06', label: 'Você aprova → prod' },
  ],
  footer:
    'Manager fica no Docker local. Sites vão pro Pages. Daemons não cabem na edge.',
}
