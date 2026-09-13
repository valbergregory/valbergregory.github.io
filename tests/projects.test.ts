import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * Regras da separação entre extensão registrada (extension.yml) e projetos
 * independentes/em revisão (independent-projects.yml) — Etapas 1 e 6 da auditoria
 * de 13/09/2026. O esquema Zod (src/content.config.ts) bloqueia o build; estes
 * testes explicam a regra antes do build e cobrem o que o esquema não vê.
 */
type Project = {
  slug: string;
  nature: string;
  relationshipToUfal: string;
  relationshipToTjal: string;
  institutionalRegistration: null | { publicId?: string; issuer?: string; date?: unknown };
  resourcesUsed: string;
  ipStatus: string;
  commercialStatus: string;
  disclaimer: null | { pt: string; en: string };
  evidencePublic: { label: string; url: string }[];
  summary: { pt: string; en: string };
  status: { pt: string; en: string };
  role: { pt: string; en: string };
};

const load = (file: string) => (parse(readFileSync(file, 'utf8')) ?? []) as Project[];
const extension = load('src/data/extension.yml');
const independent = load('src/data/independent-projects.yml');
const profile = parse(readFileSync('src/data/profile.yml', 'utf8')) as {
  email: string;
  independentProjectEmail?: string;
  founder?: unknown;
  positioning: { pt: string; en: string };
};

describe('extension.yml — extensão universitária', () => {
  it('só contém ações registradas (nature institutional-extension com registro público)', () => {
    for (const p of extension) {
      expect(p.nature, p.slug).toBe('institutional-extension');
      expect(p.relationshipToUfal, p.slug).toBe('extension');
      expect(p.institutionalRegistration, `${p.slug} sem registro`).toBeTruthy();
      expect(p.institutionalRegistration?.publicId, p.slug).toBeTruthy();
      expect(p.institutionalRegistration?.issuer, p.slug).toBeTruthy();
      expect(String(p.institutionalRegistration?.date), p.slug).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });
});

describe('independent-projects.yml — projetos independentes ou em revisão', () => {
  it('nunca contém ação de extensão nem pesquisa institucional sem registro', () => {
    for (const p of independent) {
      expect(p.nature, p.slug).not.toBe('institutional-extension');
      if (p.nature.startsWith('institutional-')) {
        expect(p.institutionalRegistration, `${p.slug} sem registro`).toBeTruthy();
      }
    }
  });

  it('só marca "independent" com vínculos, recursos, PI e status comercial definidos e evidência pública', () => {
    for (const p of independent.filter((p) => p.nature === 'independent')) {
      expect(p.ipStatus, p.slug).not.toBe('under-review');
      expect(p.relationshipToUfal, p.slug).not.toBe('under-review');
      expect(p.relationshipToTjal, p.slug).not.toBe('under-review');
      expect(p.resourcesUsed, p.slug).not.toBe('under-review');
      expect(p.commercialStatus, p.slug).not.toBe('unknown');
      expect(p.evidencePublic.length, `${p.slug} sem evidência pública`).toBeGreaterThan(0);
    }
  });

  it('item em revisão não tem declaração própria (recebe o texto padrão "em revisão")', () => {
    for (const p of independent.filter((p) => p.nature === 'under-review')) {
      expect(p.disclaimer, p.slug).toBeNull();
      expect(p.ipStatus, p.slug).toBe('under-review');
    }
  });

  it('não usa preços, projeções comerciais nem o e-mail institucional', () => {
    const text = readFileSync('src/data/independent-projects.yml', 'utf8');
    expect(text.toLowerCase()).not.toContain(profile.email.toLowerCase());
    for (const phrase of ['R$', 'assinatura mensal', 'faturamento', 'investidores', 'valuation']) {
      expect(text, `contém "${phrase}"`).not.toContain(phrase);
    }
  });

  it('descreve o papel como informado, sem esconder a atividade real', () => {
    // A auditoria veda maquiar ou renomear a atividade para contornar impedimentos.
    for (const p of independent) {
      expect(p.role.pt.length, p.slug).toBeGreaterThan(3);
      expect(p.role.en.length, p.slug).toBeGreaterThan(3);
    }
  });
});

describe('profile.yml — posicionamento e canais', () => {
  it('não tem mais o destaque "fundador das startups" nem startups no posicionamento', () => {
    expect(profile.founder).toBeUndefined();
    for (const v of [profile.positioning.pt, profile.positioning.en]) {
      expect(v.toLowerCase()).not.toMatch(/startup|legaltech|fundador|founder/);
    }
  });

  it('canal dos projetos independentes é vazio ou diferente do e-mail institucional', () => {
    const own = profile.independentProjectEmail ?? '';
    expect(own === '' || own.toLowerCase() !== profile.email.toLowerCase()).toBe(true);
  });
});
