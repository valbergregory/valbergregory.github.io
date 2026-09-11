import { describe, expect, it } from 'vitest';
import { buildRepoRecord, normalizeFullName, syncGithub } from '../scripts/lib/github-sync.mjs';

type FetchLike = typeof fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fakeApi(repos: Record<string, Record<string, unknown>>): FetchLike {
  return async (input) => {
    const path = String(input).replace('https://api.github.com', '');
    const m = path.match(/^\/repos\/([^/]+\/[^/]+)(\/.*)?$/);
    if (!m) return jsonResponse({ message: 'not found' }, 404);
    const repo = repos[m[1]!.toLowerCase()];
    if (!repo) return jsonResponse({ message: 'not found' }, 404);
    if (!m[2]) return jsonResponse(repo);
    if (m[2].startsWith('/releases/latest')) return jsonResponse({ message: 'none' }, 404);
    if (m[2].startsWith('/commits')) {
      return jsonResponse([{ commit: { committer: { date: '2026-09-10T10:00:00Z' } } }]);
    }
    return jsonResponse({ message: 'not found' }, 404);
  };
}

const publicRepo = {
  full_name: 'valbergregory/exemplo-publico',
  name: 'exemplo-publico',
  html_url: 'https://github.com/valbergregory/exemplo-publico',
  description: 'Exemplo',
  homepage: '',
  language: 'R',
  topics: ['r', 'brazil'],
  license: { spdx_id: 'MIT' },
  pushed_at: '2026-09-10T11:00:00Z',
  created_at: '2026-09-01T00:00:00Z',
  default_branch: 'main',
  private: false,
  archived: false,
};

describe('normalizeFullName', () => {
  it('aceita "owner/repo" e URLs completas', () => {
    expect(normalizeFullName('valbergregory/x')).toBe('valbergregory/x');
    expect(normalizeFullName('https://github.com/valbergregory/x.git/')).toBe('valbergregory/x');
  });
});

describe('buildRepoRecord', () => {
  it('extrai apenas metadados técnicos públicos', () => {
    const rec = buildRepoRecord(publicRepo, null, {
      commit: { committer: { date: '2026-09-10T10:00:00Z' } },
    });
    expect(rec).toMatchObject({
      fullName: 'valbergregory/exemplo-publico',
      language: 'R',
      license: 'MIT',
      topics: ['brazil', 'r'],
      latestRelease: null,
      latestCommitAt: '2026-09-10T10:00:00Z',
      isPublic: true,
      stale: false,
    });
    // Nada de campos científicos.
    expect(rec).not.toHaveProperty('status');
    expect(rec).not.toHaveProperty('findings');
  });

  it('descarta repositórios privados', () => {
    expect(buildRepoRecord({ ...publicRepo, private: true }, null, null)).toBeNull();
  });
});

describe('syncGithub', () => {
  it('consulta só a whitelist e ignora repositórios privados', async () => {
    const fetchImpl = fakeApi({
      'valbergregory/exemplo-publico': publicRepo,
      'valbergregory/privado': { ...publicRepo, full_name: 'valbergregory/privado', private: true },
    });
    const result = await syncGithub({
      whitelist: ['valbergregory/exemplo-publico', 'valbergregory/privado'],
      cache: null,
      fetchImpl,
      now: () => new Date('2026-09-11T00:00:00Z'),
    });
    expect(result.source).toBe('github-api');
    expect(result.repositories.map((r) => r.fullName)).toEqual(['valbergregory/exemplo-publico']);
    expect(result.generatedAt).toBe('2026-09-11T00:00:00.000Z');
  });

  it('mantém o último cache válido quando a API falha', async () => {
    const failing: FetchLike = async () => {
      throw new Error('rede indisponível');
    };
    const cache = {
      generatedAt: '2026-09-01T00:00:00.000Z',
      source: 'github-api' as const,
      repositories: [buildRepoRecord(publicRepo, null, null)!],
    };
    const result = await syncGithub({
      whitelist: ['valbergregory/exemplo-publico'],
      cache,
      fetchImpl: failing,
    });
    expect(result.source).toBe('cache');
    expect(result.generatedAt).toBe(cache.generatedAt);
    expect(result.repositories[0]).toMatchObject({
      fullName: 'valbergregory/exemplo-publico',
      stale: true,
    });
    expect(result.errors).toHaveLength(1);
  });

  it('não deixa passar repositório do cache que saiu da whitelist', async () => {
    const failing: FetchLike = async () => {
      throw new Error('rede indisponível');
    };
    const cache = {
      generatedAt: '2026-09-01T00:00:00.000Z',
      source: 'github-api' as const,
      repositories: [
        buildRepoRecord({ ...publicRepo, full_name: 'valbergregory/antigo' }, null, null)!,
      ],
    };
    const result = await syncGithub({
      whitelist: ['valbergregory/novo'],
      cache,
      fetchImpl: failing,
    });
    expect(result.repositories).toHaveLength(0);
    expect(result.source).toBe('empty');
  });

  it('nunca envia o token para fora do cabeçalho Authorization', async () => {
    const seen: string[] = [];
    const fetchImpl: FetchLike = async (input, init) => {
      seen.push(String(input));
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer segredo');
      return fakeApi({ 'valbergregory/exemplo-publico': publicRepo })(input, init);
    };
    const result = await syncGithub({
      whitelist: ['valbergregory/exemplo-publico'],
      cache: null,
      fetchImpl,
      token: 'segredo',
    });
    expect(seen.every((u) => !u.includes('segredo'))).toBe(true);
    expect(JSON.stringify(result)).not.toContain('segredo');
  });
});
