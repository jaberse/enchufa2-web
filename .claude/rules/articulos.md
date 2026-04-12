# Reglas para artículos

Estas reglas se aplican al trabajar con archivos en `src/pages/articulos/`.

## Estructura obligatoria

Todo artículo debe usar `ArticleLayout` con estos props:
- `title` — único, <60 caracteres (para SEO)
- `description` — <155 caracteres, para meta description
- `readingTime` — formato "X min de lectura"
- `publishDate` — formato "Mes Año"
- `references` — formato "X referencias" (opcional)

## Contenido mínimo

1. `.article-deck` — subtítulo editorial (1-2 frases, mencionar datos clave)
2. `.article-stats` — exactamente 3 badges con datos cuantitativos y fuente
3. `.tldr` — resumen con 3-5 bullets ejecutivos
4. Mínimo 3 secciones `<h2>` numeradas ("01 —", "02 —"...)
5. `.references` — sección final con todas las fuentes citadas en el texto

## Fuentes

- Toda afirmación cuantitativa debe citar fuente (estudio DOI, dato fabricante, estadística oficial)
- Fuentes válidas: papers científicos, datos oficiales fabricante, organismos (ANFAC, Deloitte, McKinsey, IEA), divulgadores técnicos (Sandy Munro, Engineering Explained)
- Fuentes NO válidas: blogs de motor generalistas, comparadores de precios, contenido sin respaldo técnico

## Imágenes

- Carpeta: `public/articulos/[mismo-slug-que-archivo]/`
- Formato preferido: WebP (fotos), PNG (gráficos con transparencia)
- Alt text siempre descriptivo y en español
- Nunca generar imágenes hero con código — usar fotos reales de Unsplash/Pexels y citar autor
- Mínimo 2-3 imágenes reales por artículo

## Gráficos

- Datos siempre reales y verificados — nunca inventar fórmulas ni aproximaciones
- Incluir tabla de validación con los datos fuente junto al gráfico
- Consistencia visual entre artículos (misma paleta, tipografía, estilo de ejes)
