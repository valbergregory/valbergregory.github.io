import { parse as parseYaml } from 'yaml';
import { z } from 'astro/zod';
import calendarRaw from '@/data/editorial-calendar.yml?raw';
import { SEMESTER_RE } from '@/content.config';

/**
 * Calendário editorial semanal (src/data/editorial-calendar.yml). Vazio por padrão:
 * só o titular preenche, a partir do calendário letivo oficial. Nunca gera datas.
 */
const calendarSchema = z.object({
  semesters: z
    .array(
      z.object({
        semester: z.string().regex(SEMESTER_RE),
        source: z.string().min(1),
        weeks: z
          .array(
            z.object({
              start: z.coerce.date(),
              end: z.coerce.date(),
              planned: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});
export type EditorialCalendar = z.infer<typeof calendarSchema>;

let cache: EditorialCalendar | undefined;
export function getEditorialCalendar(): EditorialCalendar {
  cache ??= calendarSchema.parse(parseYaml(calendarRaw) ?? {});
  return cache;
}
