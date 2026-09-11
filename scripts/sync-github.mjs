#!/usr/bin/env node
/**
 * CLI: atualiza src/generated/github-projects.json com metadados públicos dos
 * repositórios autorizados. Usa GITHUB_TOKEN se existir (apenas para elevar o
 * limite de requisições); o token nunca é impresso nem gravado.
 *
 * Uso: node scripts/sync-github.mjs [--strict]
 *   --strict  falha (exit 1) se nenhum repositório puder ser obtido nem do cache.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { syncGithub } from './lib/github-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const whitelistPath = path.join(root, 'src/data/github-whitelist.json');
const outputPath = path.join(root, 'src/generated/github-projects.json');
const strict = process.argv.includes('--strict');

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

const whitelistFile = await readJson(whitelistPath);
if (!whitelistFile || !Array.isArray(whitelistFile.repositories)) {
  console.error(`Whitelist inválida em ${whitelistPath}`);
  process.exit(1);
}

const cache = await readJson(outputPath);
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined;

console.log(
  `Sincronizando ${whitelistFile.repositories.length} repositórios autorizados${token ? ' (autenticado)' : ''}…`,
);

const result = await syncGithub({
  whitelist: whitelistFile.repositories,
  cache,
  token,
  log: (msg) => console.log(msg),
});

if (result.errors.length > 0) {
  console.warn(`Avisos (${result.errors.length}):`);
  for (const e of result.errors) console.warn(`  - ${e}`);
}

if (result.source === 'empty') {
  console.error('Nenhum metadado obtido e nenhum cache disponível.');
  if (strict) process.exit(1);
}

await mkdir(path.dirname(outputPath), { recursive: true });
const output = {
  generatedAt: result.generatedAt,
  source: result.source,
  repositories: result.repositories,
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(
  `Gravado ${path.relative(root, outputPath)} — fonte: ${result.source}, ${result.repositories.length} repositórios.`,
);
