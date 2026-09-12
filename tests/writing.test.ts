import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

/**
 * Regras dos textos (src/content/updates): nome de arquivo com data e idioma,
 * frontmatter mínimo, categoria conhecida e slugs únicos por idioma.
 */
const dir = 'src/content/updates';
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
const tax = parse(readFileSync('src/data/taxonomies.yml', 'utf8')) as {
  updateCategories: string[];
};

function frontmatter(file: string): Record<string, string> {
  const raw = readFileSync(`${dir}/${file}`, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  expect(m, `${file} sem frontmatter`).toBeTruthy();
  return parse(m![1]!) as Record<string, string>;
}

const slugOf = (file: string) =>
  file
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.(pt-br|en)$/, '');

describe('textos', () => {
  it('seguem o padrão AAAA-MM-DD-slug.<idioma>.md', () => {
    for (const f of files) expect(f).toMatch(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.(pt-br|en)\.md$/);
  });

  it('têm título, data, resumo e categoria válida', () => {
    for (const f of files) {
      const fm = frontmatter(f);
      expect(fm.title, f).toBeTruthy();
      expect(String(fm.date), f).toMatch(/^\d{4}-\d{2}-\d{2}/);
      expect(fm.summary, f).toBeTruthy();
      expect(tax.updateCategories, `${f}: categoria ${fm.category}`).toContain(fm.category);
      expect(fm.lang, f).toMatch(/^(pt-br|en)$/);
      expect(f.endsWith(`.${fm.lang}.md`), `${f}: idioma do nome difere do frontmatter`).toBe(true);
    }
  });

  it('não repete slug dentro do mesmo idioma', () => {
    for (const lang of ['pt-br', 'en']) {
      const slugs = files.filter((f) => f.endsWith(`.${lang}.md`)).map(slugOf);
      expect(new Set(slugs).size, lang).toBe(slugs.length);
    }
  });
});
