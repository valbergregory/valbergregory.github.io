import { parse as parseYaml } from 'yaml';
import { z } from 'astro/zod';
import academicRaw from '@/data/academic-activity.yml?raw';

/**
 * Atuação acadêmica (src/data/academic-activity.yml): cinco grupos do Anexo 5 da
 * Resolução CONSUNI/UFAL 119/2025, com itens factuais, evidência pública e
 * "possível enquadramento" — nunca pontuação.
 */
const bilingual = z.object({ pt: z.string().min(1), en: z.string().min(1) });
const evidence = z
  .object({
    label: z.string().min(1),
    url: z.url().optional(),
    /** Chave de rota interna (src/i18n/routes.ts). */
    path: z.string().optional(),
  })
  .refine((e) => Boolean(e.url) !== Boolean(e.path), {
    message: 'evidência precisa de url OU path',
  });

export const DYNAMIC_BLOCKS = [
  'publications',
  'research',
  'site-archive',
  'public-repositories',
  'extension',
] as const;

const academicSchema = z.object({
  groups: z.array(
    z.object({
      key: z.string().min(1),
      number: z.number().int().min(1).max(5),
      title: bilingual,
      dynamic: z.array(z.enum(DYNAMIC_BLOCKS)).default([]),
      items: z
        .array(
          z.object({
            id: z.string().min(1),
            label: bilingual,
            detail: bilingual.optional(),
            fit: bilingual,
            evidence: z.array(evidence).default([]),
            evidenceStatus: z.enum(['public', 'private-only', 'pending']),
            privateEvidenceId: z.string().optional(),
          }),
        )
        .default([]),
    }),
  ),
});
export type AcademicActivity = z.infer<typeof academicSchema>;

let cache: AcademicActivity | undefined;
export function getAcademicActivity(): AcademicActivity {
  cache ??= academicSchema.parse(parseYaml(academicRaw));
  return cache;
}
