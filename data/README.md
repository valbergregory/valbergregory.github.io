# Manifesto privado de evidências

`data/private/` é **ignorado pelo Git** e **nunca entra no build** (`npm run check:secrets`
e `tests/private-manifest.test.ts` falham se algo de lá aparecer em `dist/`).

Use a pasta para o titular relacionar, fora do repositório público, as provas que
sustentam o que o site apresenta: portarias, certificados, atas, protocolos de
consulta, termos de autorização de imagem, cadastros PROPEP/PROEX/SIGAA.

1. Copie `data/private-manifest.example.yml` para `data/private/manifest.yml`.
2. Guarde os PDFs em `data/private/docs/` (ou fora do disco compartilhado).
3. Referencie cada registro pelo `id` nos campos `privateEvidenceId`
   (`src/data/academic-activity.yml`) e `consentRecordPrivateId` (`src/data/images.yml`).
   O id é só um rótulo — o conteúdo do manifesto não é lido pelo site.

Nunca copie SIAPE, CPF, assinaturas, documentos funcionais completos, número de
processo restrito, dados de alunos ou autos sigilosos para `src/`, `public/` ou `docs/`.
