/**
 * Sincronização de metadados públicos do GitHub para os repositórios da whitelist.
 *
 * Regras:
 *  - só repositórios listados em src/data/github-whitelist.json são consultados;
 *  - só metadados técnicos públicos são gravados (nunca estágio científico,
 *    resultados, autoria ou título definitivo);
 *  - repositórios privados são descartados mesmo que apareçam na whitelist;
 *  - se a API falhar, o último cache válido é mantido (com marca `stale`).
 *
 * Este módulo não lê variáveis de ambiente nem escreve em disco: o CLI em
 * scripts/sync-github.mjs cuida disso. Assim as funções são testáveis.
 */

const API = 'https://api.github.com';

/**
 * @typedef {object} RepoRecord
 * @property {string} fullName
 * @property {string} name
 * @property {string} url
 * @property {string|null} description
 * @property {string|null} homepage
 * @property {string|null} language
 * @property {string[]} topics
 * @property {string|null} license
 * @property {{tag:string,name:string|null,publishedAt:string}|null} latestRelease
 * @property {string} pushedAt
 * @property {string|null} latestCommitAt
 * @property {string|null} createdAt
 * @property {true} isPublic
 * @property {boolean} archived
 * @property {boolean} stale
 */

/** Normaliza "owner/repo" (aceita URL completa também). */
export function normalizeFullName(input) {
  return String(input)
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
}

/** Constrói o registro público a partir das respostas da API. */
export function buildRepoRecord(repo, release, latestCommit) {
  if (!repo || repo.private === true || repo.visibility === 'private') return null;
  return {
    fullName: repo.full_name,
    name: repo.name,
    url: repo.html_url,
    description: repo.description ?? null,
    homepage: repo.homepage ? String(repo.homepage) : null,
    language: repo.language ?? null,
    topics: Array.isArray(repo.topics) ? [...repo.topics].sort() : [],
    license:
      repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : null,
    latestRelease: release
      ? {
          tag: release.tag_name,
          name: release.name ?? null,
          publishedAt: release.published_at ?? release.created_at,
        }
      : null,
    pushedAt: repo.pushed_at,
    latestCommitAt:
      latestCommit?.commit?.committer?.date ?? latestCommit?.commit?.author?.date ?? null,
    createdAt: repo.created_at ?? null,
    isPublic: true,
    archived: Boolean(repo.archived),
    stale: false,
  };
}

/**
 * @typedef {object} SyncOptions
 * @property {typeof fetch} [fetchImpl] implementação de fetch (injetável nos testes)
 * @property {string} [token] token do GitHub, usado apenas no cabeçalho Authorization
 * @property {(msg: string) => void} [log] função de log
 */

/**
 * Busca um repositório. Retorna { record } ou { error }.
 * Nunca lança para falhas de rede: o chamador decide o fallback.
 * @param {string} fullName
 * @param {SyncOptions} [options]
 */
export async function fetchRepo(fullName, { fetchImpl = fetch, token, log = () => {} } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'valbergregory.github.io portfolio sync',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const get = async (path, { allow404 = false } = {}) => {
    const res = await fetchImpl(`${API}${path}`, { headers });
    if (res.status === 404 && allow404) return null;
    if (!res.ok) {
      const remaining = res.headers?.get?.('x-ratelimit-remaining');
      throw new Error(
        `GitHub API ${res.status} em ${path}${remaining === '0' ? ' (rate limit)' : ''}`,
      );
    }
    return res.json();
  };

  try {
    const repo = await get(`/repos/${fullName}`);
    if (!repo || repo.private) {
      log(`  · ${fullName}: privado ou indisponível — ignorado`);
      return { record: null, skipped: true };
    }
    const [release, commits] = await Promise.all([
      get(`/repos/${fullName}/releases/latest`, { allow404: true }),
      get(`/repos/${fullName}/commits?sha=${encodeURIComponent(repo.default_branch)}&per_page=1`, {
        allow404: true,
      }),
    ]);
    const latestCommit = Array.isArray(commits) ? commits[0] : null;
    return { record: buildRepoRecord(repo, release, latestCommit) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Sincroniza a whitelist inteira, mesclando com o cache anterior.
 * @param {SyncOptions & { whitelist: string[], cache?: {generatedAt?: string, repositories?: Array<{fullName: string} & Record<string, unknown>>} | null, now?: () => Date }} options
 * @returns {Promise<{generatedAt:string, source:'github-api'|'cache'|'empty', repositories:RepoRecord[], errors:string[]}>}
 */
export async function syncGithub({
  whitelist,
  cache,
  fetchImpl = fetch,
  token,
  now = () => new Date(),
  log = () => {},
}) {
  const wanted = [...new Set(whitelist.map(normalizeFullName))];
  const cached = new Map((cache?.repositories ?? []).map((r) => [r.fullName.toLowerCase(), r]));
  const errors = [];
  const repositories = [];
  let fetchedAny = false;

  for (const fullName of wanted) {
    const result = await fetchRepo(fullName, { fetchImpl, token, log });
    if (result.record) {
      fetchedAny = true;
      repositories.push(result.record);
      log(`  ✓ ${fullName}`);
      continue;
    }
    if (result.skipped) continue;
    errors.push(`${fullName}: ${result.error}`);
    const previous = cached.get(fullName.toLowerCase());
    if (previous) {
      repositories.push({ ...previous, stale: true });
      log(`  ! ${fullName}: falha na API, mantendo cache`);
    } else {
      log(`  ! ${fullName}: falha na API e sem cache`);
    }
  }

  // Defesa extra: nunca deixar passar um repositório fora da whitelist ou privado.
  const allowed = new Set(wanted.map((w) => w.toLowerCase()));
  const clean = repositories
    .filter((r) => r.isPublic === true && allowed.has(r.fullName.toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const source = fetchedAny ? 'github-api' : clean.length > 0 ? 'cache' : 'empty';
  const generatedAt = fetchedAny
    ? now().toISOString()
    : (cache?.generatedAt ?? now().toISOString());
  return { generatedAt, source, repositories: clean, errors };
}
