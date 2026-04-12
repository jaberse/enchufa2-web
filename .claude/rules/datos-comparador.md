# Reglas para datos del comparador

Estas reglas se aplican al trabajar con archivos en `data/coches/` y `scripts/data-pipeline/`.

## Principio fundamental

Cada dato del comparador tiene trazabilidad: valor, unidad, fuente y nivel de confianza. Un dato sin fuente no se publica.

## Flujo de edición

1. Modificar el JSON fuente en `data/coches/{marca}-{modelo}.json`
2. Ejecutar `npm run data:build` para regenerar `src/data/comparador.json`
3. Verificar con `npm run data:audit` que no hay campos vacíos nuevos

**Nunca editar `src/data/comparador.json` directamente.** Es un archivo generado.

## Campos obligatorios por modelo

- `id`, `marca`, `modelo`, `variante`, `slug` — identificación
- `segmento` — uno de: A, B, B-SUV, C, C-SUV, D, D-SUV, E, E-SUV, F
- `specs` — cada spec con `{ valor, unidad, fuente, confianza }`
- `filtros` — campos derivados precalculados para la tabla

## Niveles de confianza

- `alta` — dato oficial del fabricante o estudio con DOI
- `media` — dato de prensa especializada o calculado a partir de fuentes oficiales
- `baja` — estimación o dato no verificado de forma independiente

## Imágenes del comparador

- Ruta: `public/comparador/fotos/{marca}-{modelo}.webp`
- Normalizar: fondo blanco/transparente, orientación lateral 3/4, sin marcas de agua
- Fuente preferida: press kits oficiales de fabricante

## Variantes y model years

- Cada variante significativa (diferente motorización, batería o tracción) es una entrada separada
- Los cambios menores de model year no generan entrada nueva — se actualiza la existente con fecha
