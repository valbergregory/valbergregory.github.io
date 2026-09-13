#!/usr/bin/env node
/**
 * Ledger de primeira publicação (src/data/first-published.json): registra, por
 * arquivo, o firstPublishedAt de cada publicação da seção Conteúdos.
 *
 * - Só ACRESCENTA entradas novas; nunca altera as existentes (sem backdating).
 * - Se um arquivo tiver firstPublishedAt diferente do ledger, o script falha e
 *   tests/dates.test.ts também: a correção é manual e explícita (edite o ledger
 *   com justificativa no commit), nunca automática.
 *
 * Uso: npm run ledger:sync
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContents } from './lib/contents.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(root, 'src/data/first-published.json');

let ledger = { note: '', entries: {} };
try {
  ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
} catch {
  /* primeiro uso */
}
ledger.note =
  'Primeira publicação de cada texto da seção Conteúdos. Só cresce; entradas existentes nunca mudam (tests/dates.test.ts). Correções exigem edição manual justificada.';
ledger.entries ??= {};

const contents = await loadContents(root);
let added = 0;
const conflicts = [];
for (const c of contents) {
  if (!c.firstPublishedAt) continue;
  const known = ledger.entries[c.file];
  if (!known) {
    ledger.entries[c.file] = c.firstPublishedAt;
    added += 1;
  } else if (known !== c.firstPublishedAt) {
    conflicts.push(`${c.file}: ledger ${known} ≠ frontmatter ${c.firstPublishedAt}`);
  }
}
const sorted = Object.fromEntries(
  Object.entries(ledger.entries).sort(([a], [b]) => a.localeCompare(b)),
);
await writeFile(
  ledgerPath,
  JSON.stringify({ note: ledger.note, entries: sorted }, null, 2) + '\n',
  'utf8',
);

console.log(`${Object.keys(sorted).length} entradas no ledger (${added} novas).`);
if (conflicts.length) {
  for (const c of conflicts) console.error(`ERRO firstPublishedAt alterado: ${c}`);
  process.exit(1);
}
