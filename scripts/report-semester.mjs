#!/usr/bin/env node
/**
 * Relatório semestral público do sítio especializado (Etapa 5.6 da auditoria de
 * 13/09/2026). Gera em dist/relatorios/ os arquivos <semestre>.csv, .json e .html com
 * título, URL canônica, datas, commit SHA (quando disponível), natureza, área, relação
 * institucional, licença e fontes de cada publicação efetivamente lançada, além das
 * semanas cobertas e das lacunas. Não afirma pontuação nem contém dados pessoais.
 *
 * Uso: npm run report:semester -- 2026.2   (ou: node scripts/report-semester.mjs 2026.2)
 * Sem argumento, gera o relatório de todos os semestres encontrados.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { isoWeek, loadContents, nextIsoWeek } from './lib/contents.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://valbergregory.github.io';
const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
const outDir = path.join(root, 'dist', 'relatorios');
const today = new Date().toISOString().slice(0, 10);

function commitSha(file) {
  try {
    const sha = execFileSync('git', ['log', '-n', '1', '--format=%H', '--', file], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return sha || 'sem-commit';
  } catch {
    return 'indisponivel';
  }
}

/** Semanas de referência do semestre: calendário letivo (se informado) ou semanas ISO. */
function referenceWeeks(semester, items, calendar) {
  const cal = calendar.semesters?.find((s) => s.semester === semester);
  if (cal && cal.weeks?.length) {
    return {
      source: cal.source,
      weeks: cal.weeks.map((w) => ({
        week: isoWeek(w.start),
        start: new Date(w.start).toISOString().slice(0, 10),
        end: new Date(w.end).toISOString().slice(0, 10),
      })),
    };
  }
  // Sem calendário: da primeira publicação do semestre até hoje (ou até a última
  // publicação, se o semestre já passou), em semanas ISO.
  const dates = items.map((i) => i.firstPublishedAt).sort();
  if (dates.length === 0) return { source: null, weeks: [] };
  const [year, half] = semester.split('.');
  const semesterEnd = half === '1' ? `${year}-06-30` : `${year}-12-31`;
  const end = today < semesterEnd ? today : semesterEnd;
  const weeks = [];
  let w = isoWeek(new Date(dates[0]));
  const last = isoWeek(new Date(end));
  while (weeks.length < 60) {
    weeks.push({ week: w });
    if (w === last) break;
    w = nextIsoWeek(w);
  }
  return { source: null, weeks };
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function html(semester, rows, cover) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const tr = rows
    .map(
      (r) =>
        `<tr><td>${r.firstPublishedAt}</td><td>${r.isoWeek}</td><td>${r.lang}</td><td><a href="${r.url}">${esc(r.title)}</a></td><td>${r.contentNature}</td><td>${esc(r.knowledgeArea)}</td><td>${r.institutionalRelation}</td><td>${r.reviewStatus}</td><td>${r.license}</td><td>${esc(r.sources)}</td><td><code>${r.commit.slice(0, 12)}</code></td></tr>`,
    )
    .join('\n');
  const gaps = cover.gaps.length ? cover.gaps.join(', ') : '—';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relatório semestral ${semester} — Divulgação científica</title>
<style>body{font:14px/1.5 system-ui,sans-serif;margin:2rem;color:#1c2331}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #ddd;padding:.4rem .5rem;text-align:left;vertical-align:top}code{font-size:12px}.note{background:#fff6e0;border-left:4px solid #a8782a;padding:.6rem .8rem}</style>
</head><body>
<h1>Relatório semestral ${semester} — Divulgação científica</h1>
<p>Gerado em ${today} a partir de ${SITE}. Versão pública, sem dados pessoais ou documentos funcionais.</p>
<p class="note">Este relatório registra atividade editorial; eventual enquadramento funcional depende de avaliação institucional. Nenhuma pontuação é afirmada.</p>
<h2>Cobertura</h2>
<ul>
<li>Publicações efetivamente lançadas: <strong>${rows.length}</strong> (${cover.pt} em português, ${cover.en} em inglês)</li>
<li>Semanas de referência: <strong>${cover.reference}</strong> (${cover.source ?? 'calendário letivo não informado; semanas ISO de segunda a domingo'})</li>
<li>Semanas com publicação: <strong>${cover.covered}</strong></li>
<li>Semanas sem publicação (lacunas): ${gaps}</li>
</ul>
<h2>Publicações</h2>
<table><thead><tr><th>Primeira publicação</th><th>Semana ISO</th><th>Idioma</th><th>Título</th><th>Natureza</th><th>Área</th><th>Relação institucional</th><th>Revisão</th><th>Licença</th><th>Fontes</th><th>Commit</th></tr></thead>
<tbody>
${tr}
</tbody></table>
</body></html>
`;
}

const all = (await loadContents(root)).filter((c) => !c.draft && c.date && c.date <= today);
const calendarRaw = await readFile(path.join(root, 'src/data/editorial-calendar.yml'), 'utf8');
const calendar = parseYaml(calendarRaw) ?? { semesters: [] };
const semesters = arg ? [arg] : Array.from(new Set(all.map((c) => c.semester))).sort();
if (semesters.length === 0) {
  console.log('Nenhuma publicação encontrada.');
  process.exit(0);
}

await mkdir(outDir, { recursive: true });
for (const semester of semesters) {
  const items = all
    .filter((c) => c.semester === semester)
    .sort(
      (a, b) =>
        a.firstPublishedAt.localeCompare(b.firstPublishedAt) || a.path.localeCompare(b.path),
    );
  const rows = items.map((c) => ({
    firstPublishedAt: c.firstPublishedAt,
    updatedAt: c.updatedAt,
    isoWeek: isoWeek(new Date(c.firstPublishedAt)),
    lang: c.lang,
    title: c.title,
    url: `${SITE}${c.path}`,
    contentNature: c.contentNature,
    knowledgeArea: c.knowledgeArea,
    institutionalRelation: c.institutionalRelation,
    reviewStatus: c.reviewStatus,
    license: c.license,
    sources: c.sources.length ? c.sources.join(' | ') : 'ver seção "Para aprofundar"',
    doi: c.doi,
    commit: commitSha(c.file),
    file: c.file,
  }));
  const ref = referenceWeeks(semester, items, calendar);
  const covered = new Set(rows.map((r) => r.isoWeek));
  const gaps = ref.weeks.map((w) => w.week).filter((w) => !covered.has(w));
  const cover = {
    reference: ref.weeks.length,
    source: ref.source,
    covered: covered.size,
    gaps,
    pt: rows.filter((r) => r.lang === 'pt-br').length,
    en: rows.filter((r) => r.lang === 'en').length,
  };
  const base = path.join(outDir, semester.replace('.', '-'));
  const header = Object.keys(rows[0] ?? { firstPublishedAt: '' });
  const csv = [
    header.join(','),
    ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(',')),
  ].join('\n');
  await writeFile(`${base}.csv`, csv + '\n', 'utf8');
  await writeFile(
    `${base}.json`,
    JSON.stringify(
      {
        semester,
        generatedAt: today,
        site: SITE,
        note: 'Registro de atividade editorial; enquadramento funcional depende de avaliação institucional. Sem pontuação.',
        coverage: { ...cover, weeks: ref.weeks },
        publications: rows,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  await writeFile(`${base}.html`, html(semester, rows, cover), 'utf8');
  console.log(
    `✓ ${semester}: ${rows.length} publicações, ${cover.covered}/${cover.reference} semanas cobertas, ${gaps.length} lacunas → ${path.relative(root, base)}.{csv,json,html}`,
  );
}
