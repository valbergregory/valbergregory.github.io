import type { CollectionEntry } from 'astro:content';
import { getProfile, pick, label, repoMetaFor } from './data';
import { route, type Lang } from '@/i18n/routes';

const SITE = 'https://valbergregory.github.io';

export function personJsonLd(lang: Lang) {
  const p = getProfile();
  return {
    '@type': 'Person',
    '@id': `${SITE}/#person`,
    name: p.name,
    alternateName: p.shortName,
    url: SITE,
    image: `${SITE}/images/valber-portrait-square.jpg`,
    email: `mailto:${p.email}`,
    jobTitle: lang === 'en' ? 'Professor and Economist' : 'Professor e Economista',
    description: pick(p.positioning, lang),
    affiliation: [
      {
        '@type': 'CollegeOrUniversity',
        name: 'Universidade Federal de Alagoas',
        url: 'https://ufal.br/',
      },
      {
        '@type': 'GovernmentOrganization',
        name: 'Tribunal de Justiça do Estado de Alagoas',
        url: 'https://www.tjal.jus.br/',
      },
    ],
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Universidade Federal da Paraíba' },
      { '@type': 'CollegeOrUniversity', name: 'Universidade Federal de Alagoas' },
      { '@type': 'CollegeOrUniversity', name: 'Centro Universitário CESMAC' },
    ],
    knowsAbout: p.researchLines.map((l) => pick(l.label, lang)),
    knowsLanguage: ['pt-BR', 'en', 'fr', 'it', 'de', 'es'],
    sameAs: [p.links.orcid, p.links.lattes, p.links.github, p.links.linkedin],
  };
}

export function websiteJsonLd(lang: Lang) {
  return {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: SITE,
    name: 'Valber Gregory',
    inLanguage: lang === 'en' ? 'en' : 'pt-BR',
    author: { '@id': `${SITE}/#person` },
  };
}

export function profilePageJsonLd(lang: Lang, path: string) {
  return {
    '@type': 'ProfilePage',
    url: `${SITE}${path}`,
    inLanguage: lang === 'en' ? 'en' : 'pt-BR',
    mainEntity: { '@id': `${SITE}/#person` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

/**
 * Manuscritos em andamento são marcados como CreativeWork com status explícito,
 * nunca como ScholarlyArticle publicado. Repositórios públicos ganham um nó
 * SoftwareSourceCode; dados abertos, um nó Dataset.
 */
export function researchJsonLd(project: CollectionEntry<'research'>, lang: Lang) {
  const p = project.data;
  const path = route('researchItem', lang, p.slug);
  const status = label('statuses', p.status, lang);
  const meta = p.allowAutomaticMetadata ? repoMetaFor(p.repository) : undefined;
  const nodes: Record<string, unknown>[] = [
    {
      '@type': 'CreativeWork',
      '@id': `${SITE}${path}#work`,
      additionalType: 'https://schema.org/ScholarlyArticle',
      name: p.title,
      alternateName: p.alternativeTitle,
      headline: p.title,
      url: `${SITE}${path}`,
      inLanguage: lang === 'en' ? 'en' : 'pt-BR',
      creativeWorkStatus: status,
      abstract: pick(p.summary, lang),
      about: label('tracks', p.track, lang),
      author: p.authors.map((name) => ({ '@type': 'Person', name })),
      dateModified: p.lastEditorialReview,
      isAccessibleForFree: true,
      ...(p.repository ? { codeRepository: p.repository } : {}),
    },
  ];
  if (p.repository && p.repositoryVisibility === 'public') {
    nodes.push({
      '@type': 'SoftwareSourceCode',
      name: p.repository.split('/').pop(),
      codeRepository: p.repository,
      programmingLanguage: p.languages.length ? p.languages : undefined,
      license: meta?.license ? `https://spdx.org/licenses/${meta.license}.html` : undefined,
      dateModified: meta?.latestCommitAt ?? undefined,
      author: { '@id': `${SITE}/#person` },
      isPartOf: { '@id': `${SITE}${path}#work` },
    });
  }
  if (p.dataAvailable && p.repository) {
    nodes.push({
      '@type': 'Dataset',
      name: `${p.title} — ${lang === 'en' ? 'data' : 'dados'}`,
      url: p.repository,
      license: meta?.license ? `https://spdx.org/licenses/${meta.license}.html` : undefined,
      creator: { '@id': `${SITE}/#person` },
      isPartOf: { '@id': `${SITE}${path}#work` },
    });
  }
  return nodes;
}

export function publicationJsonLd(pub: CollectionEntry<'publications'>) {
  const d = pub.data;
  if (d.type === 'article') {
    return {
      '@type': 'ScholarlyArticle',
      headline: d.title,
      author: d.authors.map((name) => ({ '@type': 'Person', name })),
      datePublished: String(d.year),
      isPartOf: { '@type': 'Periodical', name: d.venue },
      ...(d.doi
        ? { identifier: `https://doi.org/${d.doi}`, sameAs: `https://doi.org/${d.doi}` }
        : {}),
      ...(d.url ? { url: d.url } : {}),
      inLanguage: d.language === 'en' ? 'en' : 'pt-BR',
    };
  }
  if (d.type === 'chapter') {
    return {
      '@type': 'Chapter',
      name: d.title,
      author: d.authors.map((name) => ({ '@type': 'Person', name })),
      datePublished: String(d.year),
      pagination: d.pages,
      isPartOf: {
        '@type': 'Book',
        name: d.bookTitle,
        editor: (d.editors ?? []).map((name) => ({ '@type': 'Person', name })),
        publisher: { '@type': 'Organization', name: d.publisher },
        isbn: d.isbn,
      },
      ...(d.url ? { url: d.url } : {}),
      inLanguage: 'pt-BR',
    };
  }
  return null;
}
