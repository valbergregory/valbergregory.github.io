import { getCollection, type CollectionEntry } from 'astro:content';
import type { UiKey } from '@/i18n/ui';

export type Project = CollectionEntry<'extension'> | CollectionEntry<'independentProjects'>;
export type ProjectData = Project['data'];

const byOrder = <T extends { data: { order?: number; slug: string } }>(a: T, b: T) =>
  (a.data.order ?? 99) - (b.data.order ?? 99) || a.data.slug.localeCompare(b.data.slug);

/** Ações de extensão registradas (extension.yml). */
export async function getExtension(): Promise<CollectionEntry<'extension'>[]> {
  return (await getCollection('extension')).sort(byOrder);
}

/** Projetos independentes ou em revisão (independent-projects.yml). */
export async function getIndependentProjects(): Promise<CollectionEntry<'independentProjects'>[]> {
  return (await getCollection('independentProjects')).sort(byOrder);
}

/**
 * Texto padrão exibido junto ao projeto, conforme a natureza comprovada.
 * "independent" só chega aqui depois de passar pelo esquema (todos os campos
 * definitivos); "under-review" nunca recebe a declaração de independência.
 */
export function projectNoticeKey(nature: ProjectData['nature']): UiKey {
  switch (nature) {
    case 'independent':
      return 'notice.independent';
    case 'teaching':
      return 'notice.teachingProject';
    case 'institutional-research':
    case 'institutional-extension':
      return 'notice.institutionalProject';
    default:
      return 'notice.underReview';
  }
}

/** Projetos ligados a Direito/Judiciário recebem o aviso de conteúdo jurídico. */
export function isLegalProject(p: ProjectData): boolean {
  return p.tracks.some((t) => t === 'economia-direito-jurimetria');
}
