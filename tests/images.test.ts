import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/**
 * Registro de imagens com pessoas (src/data/images.yml) — Etapa 7 da auditoria de
 * 13/09/2026. Fotografia com pessoa identificável e consentimento não verificado não
 * pode ser referenciada por nada que entre no build (src/ e public/), salvo fonte
 * oficial com base de uso documentada.
 */
type ImageRecord = {
  file: string;
  creator: string;
  source: string;
  license: string;
  peopleIdentifiable: boolean;
  subjects: string[];
  consentVerified: boolean;
  consentRecordPrivateId: string | null;
  officialSource: boolean;
};
const registry = parse(readFileSync('src/data/images.yml', 'utf8')) as { images: ImageRecord[] };
const images = registry.images;

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full, exts);
    return exts.some((e) => name.toLowerCase().endsWith(e)) ? [full.replace(/\\/g, '/')] : [];
  });
}

const PHOTO_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
// O próprio registro e a lista de pendências citam o arquivo bloqueado: não são renderizados.
const NOT_RENDERED = new Set([
  'src/data/images.yml',
  'src/data/legal-review-needed.yml',
  'src/data/review-needed.yml',
]);
const sourceFiles = [
  ...walk('src', ['.astro', '.ts', '.mjs', '.md', '.yml', '.json', '.css']),
  ...walk('public', ['.json', '.webmanifest', '.svg', '.html', '.xml']),
].filter((f) => !NOT_RENDERED.has(f));
const sourceText = new Map(sourceFiles.map((f) => [f, readFileSync(f, 'utf8')]));

describe('images.yml', () => {
  it('tem os campos exigidos e arquivos existentes', () => {
    for (const img of images) {
      expect(existsSync(img.file), `${img.file} não existe`).toBe(true);
      for (const field of ['creator', 'source', 'license'] as const) {
        expect(img[field], `${img.file}: ${field}`).toBeTruthy();
      }
      expect(typeof img.peopleIdentifiable).toBe('boolean');
      expect(typeof img.consentVerified).toBe('boolean');
      expect(typeof img.officialSource).toBe('boolean');
    }
  });

  it('registra toda fotografia de src/assets e public/images (nova foto exige classificação)', () => {
    const registered = new Set(images.map((i) => i.file));
    const photos = [...walk('src/assets', PHOTO_EXT), ...walk('public/images', PHOTO_EXT)];
    for (const f of photos) expect(registered.has(f), `${f} não está em images.yml`).toBe(true);
  });

  it('não deixa foto com pessoa identificável sem consentimento entrar no build', () => {
    const blocked = images.filter(
      (i) => i.peopleIdentifiable && !i.consentVerified && !i.officialSource,
    );
    for (const img of blocked) {
      const base = img.file.split('/').pop()!;
      // Referências por caminho ou por nome de arquivo em qualquer fonte do build.
      for (const [f, text] of sourceText) {
        expect(
          text.includes(base),
          `${f} referencia ${img.file} (sem consentimento verificado)`,
        ).toBe(false);
      }
    }
    // O mosaico de 12/09/2026 continua bloqueado até haver termo arquivado.
    expect(blocked.map((i) => i.file)).toContain('src/assets/valber-mosaico.webp');
  });

  it('consentimento de terceiros exige id do registro privado', () => {
    for (const img of images.filter((i) => i.subjects.includes('terceiros') && i.consentVerified)) {
      expect(
        img.consentRecordPrivateId,
        `${img.file}: consentVerified sem consentRecordPrivateId`,
      ).toBeTruthy();
    }
  });
});
