import type { GlobalConfig } from 'payload'

export const Landing: GlobalConfig = {
  slug: 'landing',
  label: 'Landing',
  access: {
    // Anônimo só vê published; admin autenticado lê drafts também.
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },
    update: ({ req: { user } }) => Boolean(user),
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      required: true,
      label: 'Meta title',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      required: true,
      label: 'Meta description',
    },
    {
      name: 'mark',
      type: 'text',
      required: true,
      label: 'Marca (header)',
    },
    {
      name: 'navFlowLabel',
      type: 'text',
      required: true,
      label: 'Nav — Fluxo',
    },
    {
      name: 'navGithubLabel',
      type: 'text',
      required: true,
      label: 'Nav — GitHub label',
    },
    {
      name: 'navGithubUrl',
      type: 'text',
      required: true,
      label: 'Nav — GitHub URL',
    },
    {
      name: 'kicker',
      type: 'text',
      required: true,
    },
    {
      name: 'heroTitle',
      type: 'textarea',
      required: true,
      label: 'Hero title (Enter = quebra de linha)',
    },
    {
      name: 'lede',
      type: 'textarea',
      required: true,
    },
    {
      name: 'ctaLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'ctaHref',
      type: 'text',
      required: true,
    },
    {
      name: 'ghostLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'ghostHref',
      type: 'text',
      required: true,
    },
    {
      name: 'flowSteps',
      type: 'array',
      required: true,
      labels: { singular: 'Passo', plural: 'Fluxo' },
      fields: [
        { name: 'step', type: 'text', required: true, label: 'Número' },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'footer',
      type: 'textarea',
      required: true,
    },
  ],
}
