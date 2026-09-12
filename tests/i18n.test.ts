import { describe, expect, it } from 'vitest';
import ui, { type UiKey } from '../src/i18n/ui';
import { alternates, langFromPath, NAV_ORDER, ROUTES, route } from '../src/i18n/routes';

describe('i18n/routes', () => {
  it('detecta o idioma pela URL', () => {
    expect(langFromPath('/')).toBe('pt-br');
    expect(langFromPath('/pesquisa/')).toBe('pt-br');
    expect(langFromPath('/en')).toBe('en');
    expect(langFromPath('/en/research/x/')).toBe('en');
    expect(langFromPath('/ensino/')).toBe('pt-br'); // "en" dentro de palavra não conta
  });

  it('gera rotas com barra final e prefixo /en/ apenas em inglês', () => {
    for (const key of Object.keys(ROUTES) as (keyof typeof ROUTES)[]) {
      expect(route(key, 'pt-br')).toMatch(/\/$/);
      expect(route(key, 'en')).toMatch(/^\/en\/.*\/$|^\/en\/$/);
      expect(route(key, 'pt-br').startsWith('/en/')).toBe(false);
    }
    expect(route('researchItem', 'en', 'abc')).toBe('/en/research/abc/');
    expect(alternates('about')).toEqual({ 'pt-br': '/sobre/', en: '/en/about/' });
  });

  it('tem rótulos de navegação para todos os itens em ambos os idiomas', () => {
    for (const key of NAV_ORDER) {
      const uiKey = `nav.${key}` as UiKey;
      expect(ui['pt-br'][uiKey]).toBeTruthy();
      expect(ui.en[uiKey]).toBeTruthy();
    }
  });
});

describe('i18n/ui — tipos e áreas dos conteúdos', () => {
  it('tem rótulo para todo tipo de conteúdo e área em ambos os idiomas', async () => {
    const { parse } = await import('yaml');
    const { readFileSync } = await import('node:fs');
    const tax = parse(readFileSync('src/data/taxonomies.yml', 'utf8')) as {
      contentTypes: string[];
      contentAreas: string[];
    };
    for (const c of tax.contentTypes) {
      const key = `contentType.${c}` as UiKey;
      expect(ui['pt-br'][key], `pt ${c}`).toBeTruthy();
      expect(ui.en[key], `en ${c}`).toBeTruthy();
    }
    for (const a of tax.contentAreas) {
      const key = `area.${a}` as UiKey;
      expect(ui['pt-br'][key], `pt ${a}`).toBeTruthy();
      expect(ui.en[key], `en ${a}`).toBeTruthy();
    }
  });
});

describe('i18n/ui', () => {
  it('mantém as mesmas chaves em pt-br e en', () => {
    const pt = Object.keys(ui['pt-br']).sort();
    const en = Object.keys(ui.en).sort();
    expect(en).toEqual(pt);
  });

  it('não contém frases proibidas pelo guia de tom', () => {
    const banned = ['apaixonado por tecnologia', 'transformando o mundo', 'disruptiv'];
    const text = JSON.stringify(ui).toLowerCase();
    for (const phrase of banned) expect(text).not.toContain(phrase);
  });
});
