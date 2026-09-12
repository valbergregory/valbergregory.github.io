import { parse as parseYaml } from 'yaml';
import { z } from 'astro/zod';
import type { Lang } from '@/i18n/routes';
// Arquivos de dados embutidos no build (Vite `?raw`): funcionam no dev e no
// diretório de pré-renderização, sem depender de caminhos em tempo de execução.
import profileRaw from '@/data/profile.yml?raw';
import taxonomiesRaw from '@/data/taxonomies.yml?raw';
import generatedRaw from '@/generated/github-projects.json?raw';

/* ------------------------------------------------------------------ */
/* Tipos utilitários                                                   */
/* ------------------------------------------------------------------ */

export type Bilingual = { pt: string; en: string };
export type LangKey = 'pt' | 'en';

/** Converte o idioma da URL ('pt-br' | 'en') para a chave dos dados ('pt' | 'en'). */
export function lk(lang: Lang): LangKey {
  return lang === 'en' ? 'en' : 'pt';
}

/** Lê um campo bilíngue no idioma pedido, com fallback para português. */
export function pick(value: Bilingual | string | undefined, lang: Lang): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  return value[lk(lang)] || value.pt;
}

export function pickList(value: { pt: string[]; en: string[] } | undefined, lang: Lang): string[] {
  if (!value) return [];
  const list = value[lk(lang)];
  return list && list.length > 0 ? list : value.pt;
}

/* ------------------------------------------------------------------ */
/* profile.yml                                                         */
/* ------------------------------------------------------------------ */

const bilingual = z.object({ pt: z.string(), en: z.string() });

const profileSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  citationName: z.string(),
  location: bilingual,
  positioning: bilingual,
  tagline: bilingual,
  intro: bilingual,
  email: z.email(),
  links: z.object({
    github: z.url(),
    linkedin: z.url(),
    lattes: z.url(),
    orcid: z.url(),
    googleScholar: z.url().optional(),
  }),
  founder: z.object({
    lead: bilingual,
    items: z.array(z.object({ name: z.string(), url: z.url().optional(), note: bilingual })),
  }),
  linkedinNote: bilingual,
  /** Descrição curta usada na assinatura dos conteúdos. */
  authorBio: bilingual,
  cvPdf: z.string(),
  cvPdfEn: z.string(),
  photo: z.object({ alt: bilingual }),
  roles: z.array(
    z.object({
      org: z.string(),
      unit: bilingual,
      title: bilingual,
      since: z.string(),
      detail: bilingual.optional(),
      url: z.url().optional(),
    }),
  ),
  education: z.array(
    z.object({
      degree: bilingual,
      institution: z.string(),
      years: z.string(),
      note: bilingual.optional(),
    }),
  ),
  researchLines: z.array(
    z.object({
      key: z.string(),
      label: bilingual,
      blurb: bilingual,
      transversal: z.boolean().optional(),
    }),
  ),
  tools: z.array(z.string()),
  publicExamsIntro: bilingual,
  publicExams: z.array(
    z.object({
      place: z.number().int().positive(),
      role: bilingual,
      institution: z.string(),
      notice: z.string(),
    }),
  ),
  bio: z.record(
    z.string(),
    z.object({ lang: z.string(), label: z.string(), paragraphs: z.array(z.string()) }),
  ),
});

export type Profile = z.infer<typeof profileSchema>;

function loadYaml<T>(raw: string, schema: z.ZodType<T>): T {
  return schema.parse(parseYaml(raw));
}

let profileCache: Profile | undefined;
export function getProfile(): Profile {
  profileCache ??= loadYaml(profileRaw, profileSchema);
  return profileCache;
}

/* ------------------------------------------------------------------ */
/* taxonomies.yml                                                      */
/* ------------------------------------------------------------------ */

const labelMap = z.record(z.string(), bilingual);
const taxonomiesSchema = z.object({
  tracks: labelMap,
  statuses: z.record(z.string(), bilingual.extend({ order: z.number() })),
  methods: labelMap,
  languages: labelMap,
  outputs: labelMap,
  contentTypes: z.array(z.string()),
  contentAreas: z.array(z.string()),
});
export type Taxonomies = z.infer<typeof taxonomiesSchema>;

let taxCache: Taxonomies | undefined;
export function getTaxonomies(): Taxonomies {
  taxCache ??= loadYaml(taxonomiesRaw, taxonomiesSchema);
  return taxCache;
}

export function label(
  group: 'tracks' | 'methods' | 'languages' | 'outputs' | 'statuses',
  key: string,
  lang: Lang,
): string {
  const entry = getTaxonomies()[group][key];
  return entry ? pick(entry, lang) : key;
}

/* ------------------------------------------------------------------ */
/* github-projects.json (gerado por scripts/sync-github.mjs)           */
/* ------------------------------------------------------------------ */

const repoSchema = z.object({
  fullName: z.string(),
  name: z.string(),
  url: z.url(),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  license: z.string().nullable(),
  latestRelease: z
    .object({ tag: z.string(), name: z.string().nullable(), publishedAt: z.string() })
    .nullable(),
  pushedAt: z.string(),
  latestCommitAt: z.string().nullable(),
  createdAt: z.string().nullable(),
  isPublic: z.literal(true),
  archived: z.boolean(),
  stale: z.boolean().default(false),
});

const generatedSchema = z.object({
  generatedAt: z.string(),
  source: z.enum(['github-api', 'cache', 'empty']),
  repositories: z.array(repoSchema),
});

export type RepoMeta = z.infer<typeof repoSchema>;
export type GeneratedProjects = z.infer<typeof generatedSchema>;

let genCache: GeneratedProjects | undefined;
export function getGithubProjects(): GeneratedProjects {
  if (genCache) return genCache;
  try {
    genCache = generatedSchema.parse(JSON.parse(generatedRaw));
  } catch {
    genCache = { generatedAt: new Date(0).toISOString(), source: 'empty', repositories: [] };
  }
  return genCache;
}

/** Metadados públicos de um repositório da whitelist, se houver. */
export function repoMetaFor(repositoryUrl: string | null | undefined): RepoMeta | undefined {
  if (!repositoryUrl) return undefined;
  const fullName = repositoryUrl.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  return getGithubProjects().repositories.find(
    (r) => r.fullName.toLowerCase() === fullName.toLowerCase(),
  );
}

/* ------------------------------------------------------------------ */
/* Datas                                                               */
/* ------------------------------------------------------------------ */

export function formatDate(
  value: string | Date | null | undefined,
  lang: Lang,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'pt-BR', {
    timeZone: 'UTC',
    ...opts,
  }).format(d);
}

export function isoDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}
