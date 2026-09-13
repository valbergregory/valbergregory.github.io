import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadContents } from '../scripts/lib/contents.mjs';

/**
 * Datas das publicações (Etapa 9 da auditoria de 13/09/2026):
 *  - firstPublishedAt é obrigatória, nunca posterior a date e IMUTÁVEL: qualquer
 *    divergência em relação ao ledger src/data/first-published.json é ERRO
 *    (backdating não é corrigido automaticamente — a correção é manual e justificada);
 *  - publicação ausente do ledger é AVISO (rode npm run ledger:sync);
 *  - datas futuras (agendamento) e datas repetidas em massa geram AVISO auditável.
 */
type Ledger = { note: string; entries: Record<string, string> };
const ledger = JSON.parse(readFileSync('src/data/first-published.json', 'utf8')) as Ledger;
const contents = await loadContents(process.cwd());
const today = new Date().toISOString().slice(0, 10);

describe('firstPublishedAt', () => {
  it('existe em toda publicação, no formato YYYY-MM-DD, e não é posterior a date', () => {
    for (const c of contents) {
      expect(c.firstPublishedAt, `${c.file} sem firstPublishedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.firstPublishedAt <= c.date, `${c.file}: firstPublishedAt > date`).toBe(true);
      if (c.updatedAt) {
        expect(c.updatedAt >= c.firstPublishedAt, `${c.file}: updatedAt < firstPublishedAt`).toBe(
          true,
        );
      }
    }
  });

  it('semestre confere com a data de primeira publicação', () => {
    for (const c of contents) {
      const [y, m] = c.firstPublishedAt.split('-').map(Number);
      const expected = `${y}.${m! <= 6 ? 1 : 2}`;
      expect(c.semester, `${c.file}: semester ${c.semester} ≠ ${expected}`).toBe(expected);
    }
  });

  it('nunca diverge do ledger (backdating detectado = erro; ausência = aviso)', () => {
    const missing: string[] = [];
    for (const c of contents) {
      const known = ledger.entries[c.file];
      if (!known) {
        missing.push(c.file);
        continue;
      }
      expect(c.firstPublishedAt, `${c.file}: firstPublishedAt alterada (ledger ${known})`).toBe(
        known,
      );
    }
    if (missing.length) {
      console.warn(
        `AVISO: ${missing.length} publicação(ões) fora do ledger — rode "npm run ledger:sync":\n  ${missing.join('\n  ')}`,
      );
    }
    // Entradas do ledger cujo arquivo sumiu: aviso (renomeações precisam ser explícitas).
    const files = new Set(contents.map((c) => c.file));
    const orphans = Object.keys(ledger.entries).filter((f) => !files.has(f));
    if (orphans.length) {
      console.warn(
        `AVISO: entradas do ledger sem arquivo correspondente:\n  ${orphans.join('\n  ')}`,
      );
    }
  });
});

describe('avisos auditáveis de datas', () => {
  it('lista publicações com data futura (agendadas) sem corrigi-las', () => {
    const future = contents.filter((c) => c.date > today);
    if (future.length) {
      console.warn(
        `AVISO: ${future.length} publicação(ões) agendada(s) para o futuro:\n  ${future
          .map((c) => `${c.date} ${c.file}`)
          .join('\n  ')}`,
      );
    }
    expect(Array.isArray(future)).toBe(true);
  });

  it('lista datas de primeira publicação repetidas em massa (≥ 6 textos no mesmo dia)', () => {
    const byDate = new Map<string, number>();
    for (const c of contents)
      byDate.set(c.firstPublishedAt, (byDate.get(c.firstPublishedAt) ?? 0) + 1);
    const mass = [...byDate.entries()].filter(([, n]) => n >= 6);
    if (mass.length) {
      console.warn(
        `AVISO: datas repetidas em massa (verdade histórica preservada; não redistribuir):\n  ${mass
          .map(([d, n]) => `${d}: ${n} textos`)
          .join('\n  ')}`,
      );
    }
    expect(Array.isArray(mass)).toBe(true);
  });
});
