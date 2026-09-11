#!/usr/bin/env node
/**
 * Garante que nenhum token, segredo ou referência a repositório privado
 * entrou no código-fonte ou no site gerado.
 *
 * Uso: node scripts/check-secrets.mjs [--dist-only]
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distOnly = process.argv.includes('--dist-only');

const PATTERNS = [
  { name: 'GitHub token (ghp_)', re: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { name: 'GitHub token (gho_/ghs_/ghu_/ghr_)', re: /\bgh[osur]_[A-Za-z0-9]{20,}\b/ },
  { name: 'GitHub fine-grained token', re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'OpenAI API key', re: /\bsk-[A-Za-z0-9]{32,}\b/ },
  { name: 'Chave privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    name: 'Repositório privado exposto',
    re: /github\.com\/valbergregory\/Port-Network-Resilience/i,
  },
  { name: 'Telefone celular (formato +55)', re: /\+55\s?\(?\d{2}\)?\s?9\d{4}-?\d{4}/ },
];

const SKIP_DIRS = new Set(['node_modules', '.git', '.astro', 'dist']);
const TEXT_EXT = new Set([
  '.html',
  '.js',
  '.mjs',
  '.ts',
  '.astro',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.css',
  '.xml',
  '.txt',
  '.svg',
]);

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (TEXT_EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const targets = distOnly
  ? [path.join(root, 'dist')]
  : [
      path.join(root, 'dist'),
      path.join(root, 'src'),
      path.join(root, 'scripts'),
      path.join(root, 'docs'),
      path.join(root, '.github'),
    ];
const findings = [];
let scanned = 0;

for (const dir of targets) {
  let files = [];
  try {
    files = await walk(dir);
  } catch {
    continue; // diretório inexistente (ex.: dist antes do build)
  }
  for (const file of files) {
    // O próprio verificador e a documentação descrevem os padrões: ignorar.
    if (file.endsWith('check-secrets.mjs')) continue;
    const text = await readFile(file, 'utf8');
    scanned += 1;
    for (const p of PATTERNS) {
      if (p.re.test(text)) findings.push(`${path.relative(root, file)}: ${p.name}`);
    }
  }
}

console.log(`${scanned} arquivos verificados.`);
if (findings.length > 0) {
  for (const f of findings) console.error(`ERRO ${f}`);
  process.exit(1);
}
console.log('Nenhum segredo ou dado privado encontrado.');
