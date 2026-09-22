import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { parse } from 'yaml';
import ui from '../src/i18n/ui';
import { NAV_ORDER, ROUTES } from '../src/i18n/routes';

/**
 * Regras transversais da auditoria de 13/09/2026 que não dependem do build:
 * linguagem sobre pontuação/blindagem, navegação, manifesto privado, calendário e
 * atuação acadêmica. As verificações no HTML gerado ficam em scripts/check-compliance.mjs.
 */
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('linguagem sobre progressão e conformidade', () => {
  const forbidden = [
    /gera\s+pontos/i,
    /pontos\s+garantidos/i,
    /guaranteed\s+points/i,
    /blindagem\s+jur[ií]dica/i,
    /legally\s+shielded/i,
    /juridicamente\s+blindad/i,
  ];
  const files = [
    ...walk('src/content/pages').filter((f) => f.endsWith('.md')),
    'src/data/academic-activity.yml',
    'src/data/legal-review-needed.yml',
    'README.md',
  ];
  it('interface, páginas de conformidade e dados nunca prometem pontos nem "blindagem"', () => {
    const uiText = JSON.stringify(ui);
    for (const re of forbidden) expect(uiText, String(re)).not.toMatch(re);
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      for (const re of forbidden) expect(text, `${f}: ${re}`).not.toMatch(re);
    }
  });

  it('todo item da atuação acadêmica usa "possível enquadramento" e aponta evidência', () => {
    const data = parse(readFileSync('src/data/academic-activity.yml', 'utf8')) as {
      groups: {
        number: number;
        items: {
          id: string;
          fit: { pt: string; en: string };
          evidence: unknown[];
          evidenceStatus: string;
        }[];
      }[];
    };
    expect(data.groups.map((g) => g.number).sort()).toEqual([1, 2, 3, 4, 5]);
    for (const g of data.groups) {
      for (const item of g.items) {
        expect(item.fit.pt.toLowerCase(), item.id).toContain('possível enquadramento');
        expect(item.fit.en.toLowerCase(), item.id).toContain('possible fit');
        expect(item.fit.pt, item.id).not.toMatch(/\d+\s*pontos/i);
        expect(item.evidence.length, `${item.id} sem evidência`).toBeGreaterThan(0);
        expect(['public', 'private-only', 'pending']).toContain(item.evidenceStatus);
      }
    }
  });
});

describe('navegação', () => {
  it('segue a ordem da auditoria e deixa Projetos independentes fora do menu principal', () => {
    expect(NAV_ORDER).toEqual([
      'home',
      'about',
      'teaching',
      'research',
      'publications',
      'scienceOutreach',
      'cv',
      'contact',
    ]);
    expect(NAV_ORDER).not.toContain('independent');
    expect(NAV_ORDER).not.toContain('outreach'); // seção suspensa em 22/09/2026
    expect(ROUTES.independent['pt-br']).toBe('/projetos-independentes/');
    expect(ROUTES.legal.en).toBe('/en/legal-notice/');
  });

  it('rotula Extensão universitária, Produção intelectual e Divulgação científica', () => {
    expect(ui['pt-br']['nav.outreach']).toBe('Extensão universitária');
    expect(ui['pt-br']['nav.publications']).toBe('Produção intelectual');
    expect(ui['pt-br']['nav.scienceOutreach']).toBe('Divulgação científica');
  });
});

describe('manifesto privado (data/private/)', () => {
  it('está no .gitignore e é ignorado pelo Git', () => {
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^data\/private\/$/m);
    const out = execFileSync('git', ['check-ignore', 'data/private/manifest.yml'], {
      encoding: 'utf8',
    });
    expect(out.trim()).toBe('data/private/manifest.yml');
  });

  it('nunca é importado por código do site', () => {
    for (const f of walk('src').filter((f) => /\.(astro|ts|mjs)$/.test(f))) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/data\/private\//);
    }
  });

  it('não entra no build (comparação por hash quando dist/ e data/private/ existem)', async () => {
    if (!existsSync('dist') || !existsSync('data/private')) return;
    const { createHash } = await import('node:crypto');
    const hashes = new Set(
      walk('data/private').map((f) => createHash('sha256').update(readFileSync(f)).digest('hex')),
    );
    for (const f of walk('dist')) {
      const h = createHash('sha256').update(readFileSync(f)).digest('hex');
      expect(hashes.has(h), `${f} é cópia de arquivo privado`).toBe(false);
    }
  });
});

describe('calendário editorial', () => {
  it('aceita arquivo vazio e nunca traz datas inventadas', () => {
    const cal = parse(readFileSync('src/data/editorial-calendar.yml', 'utf8')) as {
      semesters: { semester: string; source: string; weeks: { start: unknown; end: unknown }[] }[];
    };
    expect(Array.isArray(cal.semesters)).toBe(true);
    for (const s of cal.semesters) {
      expect(s.semester).toMatch(/^\d{4}\.[12]$/);
      expect(s.source, `${s.semester} sem fonte`).toBeTruthy();
      for (const w of s.weeks) expect(String(w.start) <= String(w.end)).toBe(true);
    }
  });
});
