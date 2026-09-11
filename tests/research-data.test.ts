import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * Regras editoriais do cadastro de pesquisas. Estes testes protegem contra
 * erros que o build não pegaria: repositório privado linkado, estágio
 * inventado, achados exibidos sem autorização, whitelist inconsistente.
 */
const research = parse(readFileSync('src/data/research.yml', 'utf8')) as Record<string, unknown>[];
const taxonomies = parse(readFileSync('src/data/taxonomies.yml', 'utf8')) as {
  tracks: Record<string, unknown>;
  statuses: Record<string, unknown>;
  methods: Record<string, unknown>;
  languages: Record<string, unknown>;
  outputs: Record<string, unknown>;
};
const whitelist = JSON.parse(readFileSync('src/data/github-whitelist.json', 'utf8')) as {
  repositories: string[];
};

const PRIVATE_REPO = 'Port-Network-Resilience';

describe('research.yml', () => {
  it('tem 15 projetos com slugs únicos', () => {
    expect(research).toHaveLength(15);
    const slugs = research.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('usa apenas áreas, estágios, métodos, linguagens e resultados do vocabulário', () => {
    for (const p of research) {
      expect(taxonomies.tracks, `track de ${p.slug}`).toHaveProperty(p.track as string);
      expect(taxonomies.statuses, `status de ${p.slug}`).toHaveProperty(p.status as string);
      for (const m of (p.methodTags as string[]) ?? []) {
        expect(taxonomies.methods, `método ${m} em ${p.slug}`).toHaveProperty(m);
      }
      for (const l of (p.languages as string[]) ?? []) {
        expect(taxonomies.languages, `linguagem ${l} em ${p.slug}`).toHaveProperty(l);
      }
      for (const o of (p.outputTypes as string[]) ?? []) {
        expect(taxonomies.outputs, `resultado ${o} em ${p.slug}`).toHaveProperty(o);
      }
    }
  });

  it('nunca marca manuscrito como publicado', () => {
    // Nenhum dos projetos cadastrados foi publicado até a última revisão editorial.
    expect(research.filter((p) => p.status === 'publicado')).toHaveLength(0);
  });

  it('não expõe o repositório privado nem URLs de repositórios não públicos', () => {
    const text = readFileSync('src/data/research.yml', 'utf8');
    expect(text).not.toMatch(new RegExp(`github\\.com/valbergregory/${PRIVATE_REPO}`, 'i'));
    for (const p of research) {
      if (p.repositoryVisibility !== 'public') {
        expect(p.repository, `${p.slug} não pode ter URL`).toBeNull();
        expect(p.allowAutomaticMetadata, `${p.slug} não pode ter metadados automáticos`).toBe(
          false,
        );
      } else {
        expect(p.repository, `${p.slug} precisa de URL`).toMatch(/^https:\/\/github\.com\//);
      }
    }
  });

  it('só permite metadados automáticos para repositórios da whitelist', () => {
    const allowed = new Set(whitelist.repositories.map((r) => r.toLowerCase()));
    for (const p of research) {
      if (p.allowAutomaticMetadata) {
        const full = String(p.repository).replace('https://github.com/', '').toLowerCase();
        expect(allowed.has(full), `${full} fora da whitelist`).toBe(true);
      }
    }
  });

  it('exibe achados preliminares apenas quando autorizado e preenchido', () => {
    for (const p of research) {
      const findings = p.preliminaryFindings as { pt: string[] } | undefined;
      if (p.showPreliminaryFindings) {
        expect(findings?.pt.length, `${p.slug} sem achados`).toBeGreaterThan(0);
      }
    }
  });

  it('tem entre seis e oito projetos em destaque, com ordem única', () => {
    const featured = research.filter((p) => p.featured);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    expect(featured.length).toBeLessThanOrEqual(8);
    const orders = featured.map((p) => p.featuredOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('não usa a expressão "detecção de fraudadores"', () => {
    const text = readFileSync('src/data/research.yml', 'utf8').toLowerCase();
    expect(text).not.toContain('fraudador');
  });

  it('tem textos em português e inglês para todos os campos bilíngues', () => {
    for (const p of research) {
      for (const key of ['summary', 'researchQuestion', 'motivation'] as const) {
        const v = p[key] as { pt: string; en: string };
        expect(v.pt.length, `${p.slug}.${key}.pt`).toBeGreaterThan(20);
        expect(v.en.length, `${p.slug}.${key}.en`).toBeGreaterThan(20);
      }
    }
  });
});

describe('github-whitelist.json', () => {
  it('lista apenas repositórios do proprietário e nunca o privado', () => {
    for (const r of whitelist.repositories) {
      expect(r.startsWith('valbergregory/')).toBe(true);
      expect(r.toLowerCase()).not.toContain(PRIVATE_REPO.toLowerCase());
    }
    expect(new Set(whitelist.repositories).size).toBe(whitelist.repositories.length);
  });
});
