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

/** Séries temáticas publicadas (slug em português = id da série). */
export const SERIES = ['economia-da-informacao-e-redes', 'economia-maritima-e-pesqueira'] as const;

/** Tipos de conteúdo da seção "Conteúdos e Séries Temáticas". */
export const CONTENT_TYPES = ['serie', 'nota', 'opiniao', 'leitura', 'aula', 'evento'] as const;

/** Natureza editorial de cada publicação (Etapa 5 da auditoria de 13/09/2026). */
export const CONTENT_NATURES = [
  'scientific-outreach',
  'academic',
  'teaching',
  'opinion',
  'work-in-progress',
] as const;
export const REVIEW_STATUSES = [
  'editorial',
  'peer-reviewed',
  'preprint',
  'not-peer-reviewed',
] as const;
export const CONTENT_INSTITUTIONAL_RELATIONS = [
  'none',
  'teaching',
  'research',
  'extension',
  'under-review',
] as const;
/** Semestre no formato YYYY.1 | YYYY.2. */
export const SEMESTER_RE = /^\d{4}\.[12]$/;

/** Áreas de conhecimento usadas como filtro. */
export const CONTENT_AREAS = [
  'economia',
  'direito',
  'sistemas-de-informacao',
  'dados-econometria',
  'inovacao-publica',
  'desenvolvimento-territorial',
  'economia-maritima',
  'economia-pesqueira',
] as const;

const githubRepo = z
  .string()
  .regex(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/, 'URL de repositório GitHub inválida');

/** Parser genérico: YAML com lista de objetos, `id` derivado do campo indicado. */
function yamlList(idField: string) {
  return (text: string) => {
    const data = (parseYaml(text) ?? []) as Record<string, unknown>[];
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

/* ------------------------------------------------------------------ */
/* Projetos (extensão registrada × independentes/em revisão)            */
/* ------------------------------------------------------------------ */

export const PROJECT_NATURES = [
  'institutional-research',
  'institutional-extension',
  'teaching',
  'independent',
  'under-review',
] as const;
export const INSTITUTIONAL_RELATIONS = [
  'none',
  'teaching',
  'research',
  'extension',
  'under-review',
] as const;
export const IP_STATUSES = ['institutional', 'shared', 'independent', 'under-review'] as const;
export const COMMERCIAL_STATUSES = ['none', 'precommercial', 'commercial', 'unknown'] as const;
export const RESOURCES_USED = ['under-review', 'none-declared', 'declared'] as const;

const institutionalRegistration = z.object({
  /** Número/cadastro público não sensível (ex.: código do SIGAA). */
  publicId: z.string().min(1),
  issuer: z.string().min(1),
  date: z.coerce.date(),
  publicUrl: z.url().optional(),
});

const projectSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    /** Ordem de exibição (o loader devolve por id; sem `order`, ordem alfabética). */
    order: z.number().int().positive().optional(),
    name: z.union([z.string(), bilingual]),
    kind: bilingual,
    /** Descrição curta e neutra para o cartão da página inicial (sem "startup"/"legaltech"). */
    tagline: bilingual.optional(),
    status: bilingual,
    summary: bilingual,
    role: bilingual,
    period: z.string().optional(),
    url: z.url().nullable().default(null),
    repository: githubRepo.nullable().default(null),
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    research: z.string().optional(),
    tracks: z.array(z.enum(TRACKS)).default([]),
    nature: z.enum(PROJECT_NATURES),
    relationshipToUfal: z.enum(INSTITUTIONAL_RELATIONS),
    relationshipToTjal: z.enum(INSTITUTIONAL_RELATIONS),
    institutionalRegistration: institutionalRegistration.nullable().default(null),
    resourcesUsed: z.enum(RESOURCES_USED),
    ipStatus: z.enum(IP_STATUSES),
    commercialStatus: z.enum(COMMERCIAL_STATUSES),
    /** Declaração específica; se ausente, a interface usa o texto padrão da natureza. */
    disclaimer: bilingual.nullable().default(null),
    evidencePublic: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  })
  .superRefine((p, ctx) => {
    const institutional = p.nature.startsWith('institutional-');
    if (institutional && !p.institutionalRegistration) {
      ctx.addIssue({
        code: 'custom',
        message: `${p.slug}: nature "${p.nature}" exige institutionalRegistration (publicId, issuer, date)`,
      });
    }
    if (p.nature === 'institutional-extension' && p.relationshipToUfal !== 'extension') {
      ctx.addIssue({
        code: 'custom',
        message: `${p.slug}: extensão institucional exige relationshipToUfal: extension`,
      });
    }
    if (p.nature === 'institutional-research' && p.relationshipToUfal !== 'research') {
      ctx.addIssue({
        code: 'custom',
        message: `${p.slug}: pesquisa institucional exige relationshipToUfal: research`,
      });
    }
    if (p.nature === 'independent') {
      const pending =
        p.ipStatus === 'under-review' ||
        p.relationshipToUfal === 'under-review' ||
        p.relationshipToTjal === 'under-review' ||
        p.resourcesUsed === 'under-review' ||
        p.commercialStatus === 'unknown';
      if (pending || p.evidencePublic.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: `${p.slug}: nature "independent" exige ipStatus, vínculos, recursos e status comercial definidos e evidencePublic não vazio`,
        });
      }
    }
    if (p.nature === 'under-review' && p.disclaimer) {
      ctx.addIssue({
        code: 'custom',
        message: `${p.slug}: projeto em revisão não pode ter declaração própria (use o texto padrão)`,
      });
    }
  });

/** Extensão universitária: só ações registradas/aprovadas (extension.yml). */
const extension = defineCollection({
  loader: file('src/data/extension.yml', { parser: yamlList('slug') }),
  schema: projectSchema.refine((p) => p.nature === 'institutional-extension', {
    message: 'extension.yml aceita apenas nature: institutional-extension',
  }),
});

/** Projetos independentes ou ainda não classificados (independent-projects.yml). */
const independentProjects = defineCollection({
  loader: file('src/data/independent-projects.yml', { parser: yamlList('slug') }),
  schema: projectSchema.refine((p) => p.nature !== 'institutional-extension', {
    message: 'ações de extensão registradas devem ficar em extension.yml',
  }),
});

const langSchema = z.enum(['pt-br', 'en']);
const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

/**
 * Séries temáticas: um arquivo Markdown por idioma em src/content/series
 * (apresentação da série no corpo; metadados no frontmatter).
 */
const series = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/series' }),
  schema: ({ image }) =>
    z.object({
      series: z.enum(SERIES),
      lang: langSchema,
      /** Slug público neste idioma (o id da série é o slug em português). */
      slug: slugSchema,
      title: z.string().min(1),
      tagline: z.string().min(1),
      description: z.string().min(1),
      /** Imagem larga usada no topo da série e no compartilhamento. */
      banner: image().optional(),
      bannerAlt: z.string().optional(),
      /** Capa quadrada/vertical usada nos cartões da seção. */
      cover: image().optional(),
      coverAlt: z.string().optional(),
      palette: z.enum(['green', 'ocean']).default('green'),
      tags: z.array(z.string().min(1)).default([]),
      areas: z.array(z.enum(CONTENT_AREAS)).default([]),
      /** Slugs de pesquisas relacionadas (src/data/research.yml). */
      research: z.array(z.string()).default([]),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    }),
});

/**
 * Publicações da seção "Conteúdos e Séries Temáticas": cartões de série, notas,
 * opiniões, leituras, registros de aula e eventos. Um arquivo por idioma.
 */
const contents = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/conteudos' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        subtitle: z.string().optional(),
        summary: z.string().min(1),
        lang: langSchema,
        type: z.enum(CONTENT_TYPES).default('nota'),
        series: z.enum(SERIES).optional(),
        /** Posição dentro da série (1, 2, 3…). */
        order: z.number().int().positive().optional(),
        /** Slug público neste idioma (padrão: nome do arquivo sem número e idioma). */
        slug: slugSchema.optional(),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        tags: z.array(z.string().min(1)).default([]),
        areas: z.array(z.enum(CONTENT_AREAS)).default([]),
        /** Slug de pesquisa relacionada (src/data/research.yml). */
        project: z.string().optional(),
        date: z.coerce.date(),
        updated: z.coerce.date().optional(),
        author: z.string().default('Valber Gregory Barbosa Costa Bezerra Santos'),
        /** Link do mesmo texto no LinkedIn, quando publicado lá. */
        linkedin: z.url().optional(),
        link: z.url().optional(),
        draft: z.boolean().default(false),
        /* --- Rastreabilidade editorial (imutável: tests/dates.test.ts) --- */
        /** Data da primeira publicação; nunca alterada depois de lançada. */
        firstPublishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        /** Semestre letivo de referência (YYYY.1 | YYYY.2). */
        semester: z.string().regex(SEMESTER_RE),
        contentNature: z.enum(CONTENT_NATURES).default('scientific-outreach'),
        knowledgeArea: z.string().min(1),
        institutionalRelation: z.enum(CONTENT_INSTITUTIONAL_RELATIONS).default('none'),
        reviewStatus: z.enum(REVIEW_STATUSES).default('editorial'),
        /** Fontes principais (as referências completas ficam no corpo, em "Para aprofundar"). */
        sources: z.array(z.string().min(1)).default([]),
        doi: z.string().optional(),
        issn: z.string().optional(),
        license: z.string().default('all-rights-reserved'),
        studentCoauthors: z.array(z.string().min(1)).default([]),
        dataEthics: z.string().optional(),
        conflictDisclosure: z.string().optional(),
      })
      .superRefine((c, ctx) => {
        if (c.firstPublishedAt.getTime() > c.date.getTime()) {
          ctx.addIssue({
            code: 'custom',
            message: `${c.title}: firstPublishedAt não pode ser posterior a date`,
          });
        }
        if (c.updatedAt && c.updatedAt.getTime() < c.firstPublishedAt.getTime()) {
          ctx.addIssue({
            code: 'custom',
            message: `${c.title}: updatedAt anterior a firstPublishedAt`,
          });
        }
        if (c.type === 'serie' && (!c.series || !c.order)) {
          ctx.addIssue({
            code: 'custom',
            message: `${c.title}: tipo "serie" exige series e order`,
          });
        }
        if (c.cover && !c.coverAlt) {
          ctx.addIssue({ code: 'custom', message: `${c.title}: cover exige coverAlt` });
        }
      }),
});

/** Textos longos das páginas (Sobre, Ensino), em Markdown, um arquivo por idioma. */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    key: z.enum([
      'about',
      'teaching',
      'outreach-intro',
      'cv-summary',
      'legal',
      'privacy',
      'editorial',
    ]),
    /** Data da última revisão do texto (obrigatória nas páginas de conformidade). */
    lastReviewed: z.coerce.date().optional(),
    lang: z.enum(['pt-br', 'en']),
    title: z.string().min(1),
    description: z.string().min(1),
  }),
});

export const collections = {
  research,
  publications,
  extension,
  independentProjects,
  series,
  contents,
  pages,
};
