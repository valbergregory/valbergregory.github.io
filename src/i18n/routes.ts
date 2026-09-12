/**
 * Mapa de rotas entre os idiomas. Os slugs são traduzidos, por isso o
 * mapeamento é explícito (e não apenas um prefixo de idioma).
 */
export type Lang = 'pt-br' | 'en';

export const LANGS: readonly Lang[] = ['pt-br', 'en'] as const;
export const DEFAULT_LANG: Lang = 'pt-br';

/** Código BCP 47 usado em <html lang> e hreflang. */
export const HTML_LANG: Record<Lang, string> = {
  'pt-br': 'pt-BR',
  en: 'en',
};

export type RouteKey =
  | 'home'
  | 'about'
  | 'research'
  | 'researchItem'
  | 'teaching'
  | 'outreach'
  | 'publications'
  | 'writing'
  | 'writingItem'
  | 'search'
  | 'cv'
  | 'contact';

export const ROUTES: Record<RouteKey, Record<Lang, string>> = {
  home: { 'pt-br': '/', en: '/en/' },
  about: { 'pt-br': '/sobre/', en: '/en/about/' },
  research: { 'pt-br': '/pesquisa/', en: '/en/research/' },
  researchItem: { 'pt-br': '/pesquisa/', en: '/en/research/' },
  teaching: { 'pt-br': '/ensino/', en: '/en/teaching/' },
  outreach: { 'pt-br': '/extensao/', en: '/en/outreach/' },
  publications: { 'pt-br': '/publicacoes/', en: '/en/publications/' },
  writing: { 'pt-br': '/textos/', en: '/en/writing/' },
  writingItem: { 'pt-br': '/textos/', en: '/en/writing/' },
  search: { 'pt-br': '/busca/', en: '/en/search/' },
  cv: { 'pt-br': '/curriculo/', en: '/en/cv/' },
  contact: { 'pt-br': '/contato/', en: '/en/contact/' },
};

/** Itens da navegação principal, na ordem de exibição. */
export const NAV_ORDER: RouteKey[] = [
  'home',
  'about',
  'research',
  'teaching',
  'outreach',
  'publications',
  'writing',
  'cv',
  'contact',
];

export function route(key: RouteKey, lang: Lang, slug?: string): string {
  const base = ROUTES[key][lang];
  return slug ? `${base}${slug}/` : base;
}

/** Descobre o idioma a partir do caminho da URL. */
export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt-br';
}

/** Retorna as URLs equivalentes em cada idioma para a página atual. */
export function alternates(key: RouteKey, slug?: string): Record<Lang, string> {
  return {
    'pt-br': route(key, 'pt-br', slug),
    en: route(key, 'en', slug),
  };
}
