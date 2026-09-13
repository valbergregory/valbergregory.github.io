import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * Lista de pendências de revisão factual/jurídica (src/data/legal-review-needed.yml):
 * estrutura validada, sem dados sensíveis, ids únicos. Nada dela é publicado.
 */
type Item = {
  id: string;
  claim: string;
  publicFallback: string;
  requiredEvidence: string;
  ownerAction: string;
  status: 'pending' | 'verified' | 'rejected';
  lastReviewed: unknown;
};
const items = parse(readFileSync('src/data/legal-review-needed.yml', 'utf8')) as Item[];
const raw = readFileSync('src/data/legal-review-needed.yml', 'utf8');

describe('legal-review-needed.yml', () => {
  it('tem todos os campos, status válido e data de revisão', () => {
    expect(items.length).toBeGreaterThan(0);
    for (const it_ of items) {
      expect(it_.id, 'id').toMatch(/^[a-z0-9-]+$/);
      for (const f of ['claim', 'publicFallback', 'requiredEvidence', 'ownerAction'] as const) {
        expect(typeof it_[f], `${it_.id}.${f}`).toBe('string');
        expect(it_[f].length, `${it_.id}.${f}`).toBeGreaterThan(10);
      }
      expect(['pending', 'verified', 'rejected'], `${it_.id}.status`).toContain(it_.status);
      expect(String(it_.lastReviewed), `${it_.id}.lastReviewed`).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it('não repete ids', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('não contém dados sensíveis (CPF, SIAPE, telefone, número de portaria com assinatura)', () => {
    expect(raw).not.toMatch(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
    expect(raw).not.toMatch(/\bSIAPE\s*:?\s*\d{5,}/i);
    expect(raw).not.toMatch(/\+55\s?\(?\d{2}\)?\s?9\d{4}-?\d{4}/);
  });

  it('a lista de pendências não é importada por nenhuma página', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = `${dir}/${n}`;
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    for (const f of walk('src').filter((f) => /\.(astro|ts)$/.test(f))) {
      // Comentários podem citar o arquivo; importar (?raw / import from) é proibido.
      expect(readFileSync(f, 'utf8'), f).not.toMatch(
        /legal-review-needed\.yml\?raw|from\s+['"][^'"]*legal-review-needed/,
      );
    }
  });
});
