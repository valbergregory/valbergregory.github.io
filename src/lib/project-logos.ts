import type { ImageMetadata } from 'astro';
import patacidada from '@/assets/projetos/patacidada.png';
import smartmap from '@/assets/projetos/smartmap.svg';
import liquidajus from '@/assets/projetos/liquidajus.svg';
import portajus from '@/assets/projetos/portajus.svg';

/**
 * Marcas dos projetos independentes (src/assets/projetos), por slug.
 * PataCidadã: ícone oficial do app; SmartMap, LiquidaJus e PortaJus: reprodução
 * estática dos símbolos usados nos próprios produtos.
 */
export const PROJECT_LOGOS: Record<string, ImageMetadata> = {
  patacidada,
  'smartmap-educacao': smartmap,
  liquidajus,
  portajus,
};
