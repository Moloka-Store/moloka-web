import { defineCollection, z } from 'astro:content';

// Colección de guías del blog (/guias).
// Publicar una guía nueva = crear un archivo .md en src/content/guias/
// con esta cabecera (frontmatter) y el cuerpo en Markdown. Escala solo.
const guias = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    fecha: z.string(),
    resumen: z.string().optional(),
    imagen: z.string().optional(),
  }),
});

export const collections = { guias };
