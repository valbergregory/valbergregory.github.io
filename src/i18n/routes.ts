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
  | 'contents'
  | 'contentsSeries'
  | 'contentsItem'
  | 'search'
  | 'cv'
  | 'contact'
  | 'independent'
  | 'scienceOutreach'
  | 'scienceOutreachSemester'
  | 'academic'
  | 'legal'
  | 'privacy'
  | 'editorial';

export const ROUTES: Record<RouteKey, Record<Lang, string>> = {
  home: { 'pt-br': '/', en: '/en/' },
  about: { 'pt-br': '/sobre/', en: '/en/about/' },
  research: { 'pt-br': '/pesquisa/', en: '/en/research/' },
  researchItem: { 'pt-br': '/pesquisa/', en: '/en/research/' },
  teaching: { 'pt-br': '/ensino/', en: '/en/teaching/' },
  outreach: { 'pt-br': '/extensao/', en: '/en/outreach/' },
  publications: { 'pt-br': '/publicacoes/', en: '/en/publications/' },
  contents: { 'pt-br': '/conteudos/', en: '/en/content/' },
  contentsSeries: { 'pt-br': '/conteudos/', en: '/en/content/' },
  contentsItem: { 'pt-br': '/conteudos/', en: '/en/content/' },
  search: { 'pt-br': '/busca/', en: '/en/search/' },
  cv: { 'pt-br': '/curriculo/', en: '/en/cv/' },
  contact: { 'pt-br': '/contato/', en: '/en/contact/' },
  /** Rota secundária, fora da navegação institucional principal. */
  independent: { 'pt-br': '/projetos-independentes/', en: '/en/independent-projects/' },
  /** Sítio especializado: arquivo editorial por semestre (Etapa 5). */
  scienceOutreach: { 'pt-br': '/divulgacao-cientifica/', en: '/en/science-outreach/' },
  scienceOutreachSemester: { 'pt-br': '/divulgacao-cientifica/', en: '/en/science-outreach/' },
  academic: { 'pt-br': '/atuacao-academica/', en: '/en/academic-activity/' },
  legal: { 'pt-br': '/avisos-legais/', en: '/en/legal-notice/' },
  privacy: { 'pt-br': '/privacidade/', en: '/en/privacy/' },
  editorial: { 'pt-br': '/politica-editorial/', en: '/en/editorial-policy/' },
};

/**
 * Itens da navegação principal, na ordem de exibição (Etapa 2 da auditoria de
 * 13/09/2026): Início, Sobre, Ensino, Pesquisa, Extensão universitária, Produção
 * intelectual, Divulgação científica, Currículo, Contato. "Projetos independentes"
 * fica em área secundária (rodapé e páginas), não entre os itens institucionais.
 */
export const NAV_ORDER: RouteKey[] = [
  'home',
  'about',
  'teaching',
  'research',
  // 'outreach' — Extensão universitária FORA DO AR desde 22/09/2026 (pedido do Valber;
  // páginas em src/pages/_extensao.astro e en/_outreach.astro — tirar o "_" e voltar este item).
  'publications',
  'scienceOutreach',
  'cv',
  'contact',
];

/** Item de navegação a destacar para cada rota (subpáginas apontam para a seção). */
export const NAV_PARENT: Partial<Record<RouteKey, RouteKey>> = {
  researchItem: 'research',
  contents: 'scienceOutreach',
  contentsSeries: 'scienceOutreach',
  contentsItem: 'scienceOutreach',
  scienceOutreachSemester: 'scienceOutreach',
};

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
