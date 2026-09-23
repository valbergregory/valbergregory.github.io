#!/usr/bin/env node
/**
 * Gera o currículo em PDF (pt-BR e EN) a partir dos dados do site:
 * profile.yml, research.yml, publications.yml e independent-projects.yml.
 *
 * Saídas: public/valber-cv.pdf (pt-BR) e public/valber-cv-en.pdf (EN).
 * Roda antes do build (npm run build) e do dev. Não inclui telefone, endereço
 * residencial ou documentos — só o que já é público no site.
 */
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async (rel) => parseYaml(await readFile(path.join(root, rel), 'utf8'));

const profile = await read('src/data/profile.yml');
const research = await read('src/data/research.yml');
const publications = await read('src/data/publications.yml');
const independent = (await read('src/data/independent-projects.yml')) ?? [];
const taxonomies = await read('src/data/taxonomies.yml');

const SITE = 'https://valbergregory.github.io';

/**
 * As fontes padrão do PDFKit (Helvetica/Times) só cobrem o Latim-1. Títulos com
 * trechos em grego (ex.: o resumo da ANPTUR 2024) são transliterados para o
 * PDF; no site, a fonte Source Sans 3 renderiza o grego normalmente.
 */
const GREEK = {
  α: 'a', ά: 'á', β: 'v', γ: 'g', δ: 'd', ε: 'e', έ: 'é', ζ: 'z', η: 'i', ή: 'í', θ: 'th',
  ι: 'i', ί: 'í', ϊ: 'i', ΐ: 'í', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', ό: 'ó',
  π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', ύ: 'ý', ϋ: 'y', ΰ: 'ý', φ: 'f', χ: 'ch',
  ψ: 'ps', ω: 'o', ώ: 'ó',
};
const latinize = (text) =>
  typeof text === 'string'
    ? text
        // ditongos αυ/ευ/ου → au/eu/ou (transliteração clássica, como em "Eudaimonia")
        .replace(/([αεοάέόΑΕΟΆΈΌ])([υύ])/g, (_, v, u) => `${v}${u === 'ύ' ? 'ú' : 'u'}`)
        .replace(/[\u0370-\u03ff]/g, (ch) => {
          const lower = ch.toLowerCase();
          const out = GREEK[lower] ?? '?';
          return ch === lower ? out : out[0].toUpperCase() + out.slice(1);
        })
    : text;
const NAVY = '#14284b';
const TEAL = '#1c6b73';
const OCHRE = '#a8782a';
const TEXT = '#1c2331';
const MUTED = '#4b5566';

const L = {
  pt: {
    file: 'valber-cv.pdf',
    lang: 'pt-BR',
    title: 'Currículo',
    generated: 'Gerado automaticamente a partir de',
    summary: 'Resumo',
    positions: 'Atuação',
    education: 'Formação',
    lines: 'Linhas de pesquisa',
    research: 'Pesquisas em andamento',
    publications: 'Publicações',
    exams: 'Concursos públicos',
    projects: 'Projetos independentes (classificação institucional em revisão)',
    projectsNote:
      'Classificação institucional em revisão: vínculo, registro e titularidade ainda não documentados. Não são sistemas oficiais da UFAL nem do TJAL.',
    notice:
      'Currículo pessoal de natureza acadêmica. Não constitui manifestação, serviço ou chancela da UFAL ou do TJAL; os vínculos são citados apenas para identificação profissional.',
    tools: 'Métodos e ferramentas',
    links: 'Links',
    current: 'atual',
    status: 'situação',
    repo: 'repositório',
    place: 'lugar',
    page: 'Página',
    of: 'de',
    role: (r) => r,
  },
  en: {
    file: 'valber-cv-en.pdf',
    lang: 'en',
    title: 'Curriculum vitae',
    generated: 'Generated automatically from',
    summary: 'Summary',
    positions: 'Positions',
    education: 'Education',
    lines: 'Research lines',
    research: 'Research in progress',
    publications: 'Publications',
    exams: 'Public service examinations',
    projects: 'Independent projects (institutional classification under review)',
    projectsNote:
      'Institutional classification under review: affiliation, registration and ownership not yet documented. Not official systems of UFAL or TJAL.',
    notice:
      'Personal academic CV. It is not a statement, service or endorsement of UFAL or TJAL; employment ties are cited for professional identification only.',
    tools: 'Methods and tools',
    links: 'Links',
    current: 'present',
    status: 'status',
    repo: 'repository',
    place: 'place',
    page: 'Page',
    of: 'of',
    role: (r) => r,
  },
};

const pick = (v, k) => (typeof v === 'string' ? v : (v?.[k] ?? v?.pt ?? ''));
const ordinal = (n, k) =>
  k === 'en' ? `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}` : `${n}º`;

const summaryText = {
  pt: [
    'Professor da Universidade Federal de Alagoas (Campus Arapiraca/Unidade Educacional Penedo, curso de Sistemas de Informação) desde 2023 e Analista Judiciário, área de Economia, no Tribunal de Justiça de Alagoas desde 2014, onde também atua como assessor judicial. Economista registrado no CORECON/AL, com formação em Direito e Economia, especialização em Direito 4.0 (Direito Digital, Proteção de Dados e Cibersegurança; PUC-Campinas/PUC-PR), MBA em Poder Judiciário (FGV), mestrado em Economia Aplicada (UFAL) e doutorado em Economia (UFPB). Advogado entre 2010 e 2014 (OAB/AL n. 9.788; advocacia incompatível com o cargo atual).',
    'Pesquisa em desenvolvimento regional e políticas públicas, Análise Econômica do Direito e Jurimetria, inteligência artificial no setor público, economia digital, turismo, economia marítima e pesqueira, com dados públicos e métodos reproduzíveis em R, Python e SQL.',
  ],
  en: [
    'Professor at the Federal University of Alagoas (Arapiraca Campus/Penedo Educational Unit, Information Systems programme) since 2023 and Judicial Analyst in Economics at the Alagoas State Court of Justice since 2014, where he also serves as judicial adviser. Registered economist (CORECON/AL) with degrees in Law and Economics, a graduate specialisation in Law 4.0 (Digital Law, Data Protection and Cybersecurity; PUC-Campinas/PUC-PR), an MBA in Judicial Administration (FGV), an MSc in Applied Economics (UFAL) and a PhD in Economics (UFPB). Practised law from 2010 to 2014 (Alagoas Bar no. 9,788; legal practice is incompatible with the current office).',
    'Research on regional development and public policy, economic analysis of law and jurimetrics, artificial intelligence in the public sector, the digital economy, tourism, maritime and fisheries economics, with public data and reproducible methods in R, Python and SQL.',
  ],
};

function buildPdf(k) {
  const t = L[k];
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    lang: t.lang,
    pdfVersion: '1.7',
    tagged: true,
    displayTitle: true,
    info: {
      Title: `${profile.name} — ${t.title}`,
      Author: profile.name,
      Subject: pick(profile.positioning, k),
      Keywords: profile.researchLines.map((l) => pick(l.label, k)).join(', '),
      Creator: 'valbergregory.github.io (scripts/generate-cv.mjs)',
    },
  });
  const out = path.join(root, 'public', t.file);
  const stream = createWriteStream(out);
  doc.pipe(stream);

  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bodyFont = 'Helvetica';
  const boldFont = 'Helvetica-Bold';
  const serif = 'Times-Roman';
  const today = new Date().toISOString().slice(0, 10);

  const section = (title) => {
    if (doc.y > doc.page.height - 140) doc.addPage();
    doc.moveDown(0.8);
    doc.font(serif).fontSize(14).fillColor(NAVY).text(title);
    const y = doc.y + 2;
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + W, y)
      .lineWidth(0.8)
      .strokeColor(TEAL)
      .stroke();
    doc.moveDown(0.5);
    doc.font(bodyFont).fontSize(10).fillColor(TEXT);
  };
  const para = (text, opts = {}) =>
    doc
      .font(bodyFont)
      .fontSize(10)
      .fillColor(TEXT)
      .text(text, { lineGap: 2, ...opts });
  const item = (title, meta, note) => {
    if (doc.y > doc.page.height - 100) doc.addPage();
    doc.font(boldFont).fontSize(10).fillColor(TEXT).text(latinize(title), { lineGap: 1 });
    if (meta) doc.font(bodyFont).fontSize(9.5).fillColor(MUTED).text(latinize(meta), { lineGap: 1 });
    if (note) doc.font(bodyFont).fontSize(9.5).fillColor(TEXT).text(latinize(note), { lineGap: 1 });
    doc.moveDown(0.45);
  };

  // Cabeçalho
  doc.rect(0, 0, doc.page.width, 6).fill(NAVY);
  doc.rect(0, 6, doc.page.width, 2).fill(OCHRE);
  doc.moveDown(1.2);
  doc.font(serif).fontSize(22).fillColor(NAVY).text(profile.name);
  doc
    .font(bodyFont)
    .fontSize(10.5)
    .fillColor(TEAL)
    .text(pick(profile.positioning, k), { lineGap: 2 });
  doc.moveDown(0.4);
  doc.font(bodyFont).fontSize(9.5).fillColor(MUTED);
  doc.text(`${profile.email}  ·  ${SITE}  ·  ${pick(profile.location, k)}`);
  doc.text(
    `ORCID ${profile.links.orcid.replace('https://orcid.org/', '')}  ·  Lattes ${profile.links.lattes.replace(/^https?:\/\//, '')}  ·  GitHub ${profile.links.github.replace('https://', '')}`,
  );
  if (profile.links.googleScholar) doc.text(`Google Scholar: ${profile.links.googleScholar}`);
  doc.text(`LinkedIn: ${profile.links.linkedin.replace('https://www.', '')}`);

  // Resumo
  section(t.summary);
  for (const p of summaryText[k]) {
    para(p);
    doc.moveDown(0.3);
  }

  // Atuação (com aviso institucional junto às afiliações)
  section(t.positions);
  doc.font(bodyFont).fontSize(8.5).fillColor(MUTED).text(t.notice, { width: W });
  doc.moveDown(0.4);
  for (const r of profile.roles) {
    item(
      `${pick(r.title, k)} — ${r.org}`,
      `${r.since}–${t.current} · ${pick(r.unit, k)}`,
      r.detail ? pick(r.detail, k) : undefined,
    );
  }
  item(
    k === 'en'
      ? 'Substitute lecturer — Universidade Federal de Alagoas'
      : 'Professor substituto — Universidade Federal de Alagoas',
    k === 'en' ? '2019–2021 · Tourism programme, Penedo' : '2019–2021 · curso de Turismo, Penedo',
  );
  item(
    k === 'en' ? 'Lawyer — private practice' : 'Advogado — advocacia autônoma',
    k === 'en'
      ? '2010–2014 · tax, administrative and civil law (Maceió)'
      : '2010–2014 · tributário, administrativo e cível (Maceió)',
  );

  // Formação
  section(t.education);
  for (const e of profile.education) {
    item(pick(e.degree, k), `${e.years} · ${e.institution}`, e.note ? pick(e.note, k) : undefined);
  }

  // Linhas de pesquisa
  section(t.lines);
  for (const l of profile.researchLines) {
    para(`• ${pick(l.label, k)} — ${pick(l.blurb, k)}`);
  }

  // Pesquisas em andamento
  section(t.research);
  const statusLabel = (s) => pick(taxonomies.statuses[s], k);
  const trackLabel = (s) => pick(taxonomies.tracks[s], k);
  for (const p of research) {
    const meta = [
      trackLabel(p.track),
      `${t.status}: ${statusLabel(p.status)}`,
      p.repository ? `${t.repo}: ${p.repository.replace('https://', '')}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    item(p.title, meta);
  }

  // Publicações
  section(t.publications);
  const typeOrder = { article: 0, chapter: 1, presented: 2, abstract: 3 };
  const pubs = [...publications].sort(
    (a, b) => typeOrder[a.type] - typeOrder[b.type] || b.year - a.year,
  );
  for (const p of pubs) {
    const authors = p.authors.join('; ');
    let venue = '';
    if (p.type === 'article')
      venue = `${p.venue}${p.volume ? `, ${p.volume}` : ''}${p.pages ? `, p. ${p.pages}` : ''}, ${p.year}.${p.doi ? ` DOI: ${p.doi}` : ''}`;
    else if (p.type === 'chapter')
      venue = `In: ${(p.editors ?? []).join('; ')} (org.). ${p.bookTitle}. ${p.place}: ${p.publisher}, ${p.year}${p.pages ? `, p. ${p.pages}` : ''}.${p.isbn ? ` ISBN ${p.isbn}.` : ''}`;
    else venue = `${p.venue}${p.place ? `, ${p.place}` : ''}, ${p.year}.`;
    item(p.title, `${authors}. ${venue}`, p.url && p.type !== 'abstract' ? p.url : undefined);
  }

  // Concursos
  section(t.exams);
  para(pick(profile.publicExamsIntro, k));
  doc.moveDown(0.3);
  for (const e of [...profile.publicExams].sort((a, b) => a.place - b.place)) {
    para(
      `• ${ordinal(e.place, k)} ${t.place} — ${pick(e.role, k)} — ${e.institution} — ${e.notice}`,
    );
  }

  // Projetos independentes (separados da atuação institucional; sem preços nem convite comercial)
  section(t.projects);
  para(t.projectsNote);
  doc.moveDown(0.3);
  for (const o of independent) {
    const links = (o.links ?? [])
      .map((l) => l.url.replace('https://', '').replace(/\/$/, ''))
      .join(' · ');
    item(
      pick(o.name, k),
      `${pick(o.kind, k)} · ${pick(o.status, k)}${links ? ` · ${links}` : ''}`,
      pick(o.role, k),
    );
  }

  // Ferramentas
  section(t.tools);
  para(profile.tools.join(' · '));

  // Rodapé com numeração e origem
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.font(bodyFont).fontSize(8).fillColor(MUTED);
    const footer = `${t.generated} ${SITE} — ${today}   ·   ${t.page} ${i + 1} ${t.of} ${range.count}`;
    doc.text(footer, doc.page.margins.left, doc.page.height - 40, {
      width: W,
      align: 'center',
      lineBreak: false,
    });
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(out));
    stream.on('error', reject);
  });
}

await mkdir(path.join(root, 'public'), { recursive: true });
for (const k of ['pt', 'en']) {
  const out = await buildPdf(k);
  console.log(`✓ ${path.relative(root, out)}`);
}
