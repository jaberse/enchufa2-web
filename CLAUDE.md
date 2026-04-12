# CLAUDE.md

Instrucciones de contexto para Claude Code y Cowork al trabajar en este repositorio.

## Qué es esto

enchufa2.com es una publicación técnica en español sobre movilidad eléctrica. No es un blog de noticias: es una referencia basada en datos, estudios científicos y fuentes verificables. El nombre siempre se escribe en minúsculas: **enchufa2** (nunca "Enchufa2").

## Stack técnico

- **Framework:** Astro 4.x (SSG, zero JS by default)
- **Deploy:** Cloudflare Pages (auto-deploy en push a `main`)
- **Estilos:** CSS puro con variables (no Tailwind), en `src/styles/global.css`
- **Fuentes:** Inter 300 (cuerpo) + Instrument Serif italic (acento editorial)
- **Datos:** JSON con schema propio en `src/data/`
- **Pipeline:** `npm run data:build` genera `comparador.json` desde `data/coches/*.json`

## Estructura del proyecto

```
src/
├── pages/
│   ├── index.astro              ← Homepage (hero + 5 bloques de categoría)
│   ├── comparador.astro         ← Comparador EV (61 modelos, filtros dinámicos)
│   ├── metodologia.astro        ← Cómo trabajamos los datos
│   ├── categoria/               ← Páginas de categoría (generadas con CategoryLayout)
│   └── articulos/               ← Cada artículo es un .astro
├── components/
│   ├── Header.astro             ← Nav fija + búsqueda + dark mode
│   ├── Search.astro             ← Overlay de búsqueda
│   ├── Hero.astro, About.astro, Articles.astro, Contact.astro, Footer.astro
├── layouts/
│   ├── Layout.astro             ← Base HTML
│   ├── ArticleLayout.astro      ← Plantilla de artículos (h1, deck, stats, body, refs)
│   └── CategoryLayout.astro     ← Plantilla de categorías
├── styles/
│   └── global.css               ← Tokens de diseño, reset, utilidades
├── data/
│   ├── comparador.json          ← Build output (no editar a mano)
│   └── comparador-schema.json   ← JSON Schema del comparador
scripts/
└── data-pipeline/               ← migrate, build, audit, set-field, walkback
public/
└── articulos/[slug]/            ← Imágenes por artículo
```

## Cómo crear un artículo

1. Crear `src/pages/articulos/nombre-articulo.astro`
2. Importar `ArticleLayout` y pasar props: `title`, `description`, `readingTime`, `publishDate`, `references`
3. Elementos disponibles dentro del slot: `.article-deck`, `.article-stats` (grid 3 cols), `.tldr` (con `<strong>` + `<ul>`), `<h2>` (usar numeración "01 —"), `<figure>` + `<figcaption>`, `<blockquote>`, `.comparison-table`, `.references`
4. Imágenes en `public/articulos/[slug]/`, formato WebP preferido, alt text descriptivo en español
5. Añadir tarjeta en la categoría correspondiente

## Pipeline de datos del comparador

Los datos de cada coche viven en `data/coches/{marca}-{modelo}.json` con trazabilidad por campo (valor, unidad, fuente, confianza). El pipeline:

- `npm run data:migrate` — migra campos nuevos del schema
- `npm run data:build` — genera `src/data/comparador.json` para el frontend
- `npm run data:audit` — audita campos vacíos o inconsistentes
- `npm run data:set` — modifica un campo individual con trazabilidad

**Nunca editar `src/data/comparador.json` a mano.** Siempre modificar los JSON fuente y ejecutar `data:build`.

## Convenciones de código

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Archivo artículo | kebab-case | `carga-rapida-espana.astro` |
| Carpeta imágenes | mismo nombre | `public/articulos/carga-rapida-espana/` |
| Imágenes | snake_case | `comparativa_tiempos.webp` |
| Componentes | PascalCase | `ArticleLayout.astro` |
| Variables CSS | kebab-case `--` | `--page-gutter` |

## Paleta de color

```css
--black: #111111    --yellow: #F5C518    --white: #FAFAF8
--cream: #F8F6F1    --gray-50: #F2F1ED   --gray-600: #555550
```

Dark mode override en `[data-theme="dark"]`. Acento amarillo constante en ambos temas.

## Criterios editoriales

- **Fuentes siempre citadas.** Estudios con DOI, datos de fabricante con enlace, estadísticas con fuente.
- **No publicar datos sin verificar.** Flujo: borrador → revisión → publicación.
- **No generar imágenes con código.** Usar fotos reales (Unsplash/Pexels) y citar fuente.
- **Tono:** rigor técnico + accesibilidad. Como un ingeniero que sabe explicar. Humor puntual, nunca forzado.
- **Longitud:** 2.000–4.000 palabras por artículo.

## Deploy

Push a `main` → Cloudflare Pages redespliega en ~2 min. No hay CI adicional.

## Equipo

Javi Bernal (fundador, editorial + técnico) y Jose (cofundador, contenido + operaciones). Ambos usan Cowork. Archivos compartidos en Google Drive > Enchufa2/.
