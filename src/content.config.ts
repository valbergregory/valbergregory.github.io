import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';

/** Texto bilíngue obrigatório. */
const bilingual = z.object({ pt: z.string().min(1), en: z.string().min(1) });
/** Lista bilíngue (pode ser vazia). */
const bilingualList = z.object({
  pt: z.array(z.string().min(1)).default([]),
  en: z.array(z.string().min(1)).default([]),
});

export const TRACKS = [
  'economia-politicas-publicas',
  'economia-direito-jurimetria',
  'ia-governo-digital-seguranca',
  'economia-turismo',
  'economia-maritima-portos',
  'economia-pesqueira',
  'economia-digital-direito-digital',
] as const;

export const STATUSES = [
  'estruturacao',
  'em-desenvolvimento',
  'redacao',
  'pre-submissao',
  'submetido',
  'publicado',
] as const;

export const UPDATE_CATEGORIES = [
  'opiniao',
  'nota',
  'leitura',
  'aula',
  'codigo',
  'versao',
  'documentacao',
  'dados',
  'painel',
  'texto',
  'evento',
  'site',
  'publicacao',
] as const;

const githubRepo = z
  .string()
  .regex(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/, 'URL de repositório GitHub inválida');

/** Parser genérico: YAML com lista de objetos, `id` derivado do campo indicado. */
function yamlList(idField: string) {
  return (text: string) => {
    const data = parseYaml(text) as Record<string, unknown>[];
    return data.map((entry) => ({ id: String(entry[idField]), ...entry }));
  };
}

const research = defineCollection({
  loader: file('src/data/research.yml', { parser: yamlList('slug') }),
  schema: z
    .object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string().min(1),
      alternativeTitle: z.string().optional(),
      titlePending: z.boolean().default(false),
      titleProvisional: z.boolean().default(false),
      authors: z.array(z.string().min(1)).min(1),
      track: z.enum(TRACKS),
      subtrack: bilingual.optional(),
      status: z.enum(STATUSES),
      summary: bilingual,
      researchQuestion: bilingual,
      motivation: bilingual,
      dataSources: bilingualList,
      methods: bilingualList,
      methodTags: z.array(z.string()).default([]),
      showPreliminaryFindings: z.boolean().default(false),
      preliminaryFindings: bilingualList.optional(),
      limitations: bilingualList,
      implications: bilingualList,
      extensionProducts: bilingualList,
      repository: githubRepo.nullable(),
      repositoryVisibility: z.enum(['public', 'private', 'none']),
      languages: z.array(z.enum(['R', 'Python', 'SQL', 'LaTeX'])).default([]),
      outputTypes: z.array(z.string()).default([]),
      codeAvailable: z.boolean().default(false),
      dataAvailable: z.boolean().default(false),
      featured: z.boolean().default(false),
      featuredOrder: z.number().int().positive().optional(),
      allowAutomaticMetadata: z.boolean().default(false),
      lastEditorialReview: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      materials: z.array(z.object({ label: bilingual, url: z.url() })).default([]),
    })
    .superRefine((p, ctx) => {
      if (p.repositoryVisibility === 'public' && !p.repository) {
        ctx.addIssue({
          code: 'custom',
          message: `${p.slug}: repositório público exige URL`,
        });
      }
      if (p.repositoryVisibility !== 'public' && p.repository) {
        ctx.addIssue({
          code: 'custom',
          message: `${p.slug}: repositório não público não pode ter URL`,
        });
      }
      if (p.repositoryVisibility !== 'public' && p.allowAutomaticMetadata) {
        ctx.addIssue({
          code: 'custom',
          message: `${p.slug}: metadados automáticos só para repositórios públicos`,
        });
      }
      if (p.showPreliminaryFindings && !(p.preliminaryFindings?.pt.length ?? 0)) {
        ctx.addIssue({
          code: 'custom',
          message: `${p.slug}: showPreliminaryFindings exige preliminaryFindings`,
        });
      }
      if (p.featured && !p.featuredOrder) {
        ctx.addIssue({ code: 'custom', message: `${p.slug}: featured exige featuredOrder` });
      }
    }),
});

const publications = defineCollection({
  loader: file('src/data/publications.yml', { parser: yamlList('id') }),
  schema: z.object({
    id: z.string(),
    type: z.enum(['article', 'chapter', 'presented', 'abstract']),
    title: z.string().min(1),
    authors: z.array(z.string()).min(1),
    venue: z.string().optional(),
    venueShort: z.string().optional(),
    bookTitle: z.string().optional(),
    editors: z.array(z.string()).optional(),
    publisher: z.string().optional(),
    place: z.string().optional(),
    volume: z.string().optional(),
    pages: z.string().optional(),
    year: z.number().int(),
    doi: z.string().optional(),
    isbn: z.string().optional(),
    url: z.url().optional(),
    pdf: z.url().optional(),
    language: z.enum(['pt', 'en', 'es']).default('pt'),
    track: z.string().optional(),
    note: bilingual.optional(),
  }),
});

const outreach = defineCollection({
  loader: file('src/data/outreach.yml', { parser: yamlList('slug') }),
  schema: z.object({
    slug: z.string(),
    name: z.union([z.string(), bilingual]),
    kind: bilingual,
    status: bilingual,
    summary: bilingual,
    role: bilingual,
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    research: z.string().optional(),
    tracks: z.array(z.enum(TRACKS)).default([]),
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/updates' }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    lang: z.enum(['pt-br', 'en']).default('pt-br'),
    project: z.string().optional(),
    summary: z.string().min(1),
    category: z.enum(UPDATE_CATEGORIES),
    link: z.url().optional(),
    /** Slug da URL (padrão: nome do arquivo sem a data e sem o idioma). */
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    /** Link do mesmo texto no LinkedIn, quando publicado lá. */
    linkedin: z.url().optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** Textos longos das páginas (Sobre, Ensino), em Markdown, um arquivo por idioma. */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    key: z.enum(['about', 'teaching', 'outreach-intro', 'cv-summary']),
    lang: z.enum(['pt-br', 'en']),
    title: z.string().min(1),
    description: z.string().min(1),
  }),
});

export const collections = { research, publications, outreach, updates, pages };
