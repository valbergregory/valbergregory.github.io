/**
 * Utilidades de calendário para o sítio especializado (Etapa 5): semestre letivo
 * de referência (YYYY.1 = jan–jun; YYYY.2 = jul–dez) e semanas ISO.
 * Sem calendário letivo informado (src/data/editorial-calendar.yml vazio), as
 * semanas são contadas como semanas ISO — nunca se inventam datas.
 */

export function semesterOf(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  return `${y}.${m <= 6 ? 1 : 2}`;
}

/** Slug de URL do semestre: 2026.2 → 2026-2. */
export function semesterSlug(semester: string): string {
  return semester.replace('.', '-');
}
export function semesterFromSlug(slug: string): string {
  return slug.replace('-', '.');
}

/** Semana ISO (ano-semana), ex.: 2026-W37. */
export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Ordena semestres do mais recente para o mais antigo. */
export function sortSemestersDesc(semesters: Iterable<string>): string[] {
  return Array.from(new Set(semesters)).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

export function semesterLabel(semester: string, lang: 'pt-br' | 'en'): string {
  const [year, half] = semester.split('.');
  return lang === 'en' ? `${year}, semester ${half}` : `${year}.${half}`;
}
