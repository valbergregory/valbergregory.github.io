import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/**
 * Regras da seção "Conteúdos e Séries Temáticas" (src/content/conteudos e
 * src/content/series): nome de arquivo, frontmatter mínimo, tipos/áreas
 * conhecidos, ordem única por série, capa existente e par de idiomas.
 */
const contentsDir = 'src/content/conteudos';
const seriesDir = 'src/content/series';
const tax = parse(readFileSync('src/data/taxonomies.yml', 'utf8')) as {
  contentTypes: string[];
  contentAreas: string[];
};

type Fm = Record<string, unknown> & {
  title?: string;
  summary?: string;
  lang?: string;
  type?: string;
  series?: string;
  order?: number;
  date?: unknown;
  cover?: string;
  coverAlt?: string;
  areas?: string[];
  tags?: string[];
};

function frontmatter(file: string): Fm {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  expect(m, `${file} sem frontmatter`).toBeTruthy();
  return parse(m![1]!) as Fm;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  );
}

const contentFiles = walk(contentsDir);
const seriesFiles = walk(seriesDir);
const seriesKeys = new Set(seriesFiles.map((f) => frontmatter(f).series as string));

describe('séries', () => {
  it('existem em português e inglês, com slug, título, chamada e descrição', () => {
    for (const key of seriesKeys) {
      for (const lang of ['pt-br', 'en']) {
        const file = join(seriesDir, `${key}.${lang}.md`);
        expect(existsSync(file), file).toBe(true);
        const fm = frontmatter(file);
        expect(fm.lang).toBe(lang);
        expect(fm.slug, file).toMatch(/^[a-z0-9-]+$/);
        expect(fm.title, file).toBeTruthy();
        expect(fm.tagline, file).toBeTruthy();
        expect(fm.description, file).toBeTruthy();
        for (const a of (fm.areas ?? []) as string[]) expect(tax.contentAreas).toContain(a);
      }
    }
  });
});

describe('publicações', () => {
  it('seguem o padrão NN-slug.<idioma>.md dentro da pasta da série', () => {
    for (const f of contentFiles) {
      const name = f.split(/[\\/]/).pop()!;
      expect(name, f).toMatch(/^\d{2,3}-[a-z0-9-]+\.(pt-br|en)\.md$/);
    }
  });

  it('têm título, resumo, data, tipo e áreas válidos; capa com texto alternativo e arquivo existente', () => {
    for (const f of contentFiles) {
      const fm = frontmatter(f);
      expect(fm.title, f).toBeTruthy();
      expect(fm.summary, f).toBeTruthy();
      expect(String(fm.date), f).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(fm.lang, f).toMatch(/^(pt-br|en)$/);
      expect(f.endsWith(`.${fm.lang}.md`), `${f}: idioma do nome difere do frontmatter`).toBe(true);
      expect(tax.contentTypes, `${f}: tipo ${fm.type}`).toContain(fm.type ?? 'nota');
      for (const a of fm.areas ?? []) expect(tax.contentAreas, `${f}: área ${a}`).toContain(a);
      if (fm.series) {
        expect(seriesKeys, `${f}: série ${fm.series} não existe`).toContain(fm.series);
        expect(fm.order, `${f}: cartão de série sem order`).toBeGreaterThan(0);
      }
      if (fm.cover) {
        expect(fm.coverAlt, `${f}: capa sem coverAlt`).toBeTruthy();
        const coverPath = join(f, '..', fm.cover);
        expect(existsSync(coverPath), `${f}: capa ${fm.cover} não encontrada`).toBe(true);
      }
    }
  });

  it('não repete a ordem dentro da mesma série e idioma', () => {
    const seen = new Map<string, string>();
    for (const f of contentFiles) {
      const fm = frontmatter(f);
      if (!fm.series) continue;
      const key = `${fm.series}/${fm.lang}/${fm.order}`;
      expect(seen.has(key), `${f} repete ${seen.get(key)}`).toBe(false);
      seen.set(key, f);
    }
  });

  it('toda publicação em português tem a versão em inglês (mesma série e ordem)', () => {
    const keys = (lang: string) =>
      contentFiles
        .filter((f) => f.endsWith(`.${lang}.md`))
        .map((f) => {
          const fm = frontmatter(f);
          const base = f
            .split(/[\\/]/)
            .pop()!
            .replace(/\.(pt-br|en)\.md$/, '');
          return fm.series ? `${fm.series}/${fm.order}` : `${fm.type ?? 'nota'}/${base}`;
        });
    const en = new Set(keys('en'));
    for (const k of keys('pt-br')) expect(en, `sem versão em inglês: ${k}`).toContain(k);
  });
});
