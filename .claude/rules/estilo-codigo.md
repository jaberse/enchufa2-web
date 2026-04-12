# Reglas de estilo de código

## Astro

- Componentes estáticos siempre en `.astro` — no usar React/Vue para markup estático
- Estilos scoped con `<style>` dentro de cada componente
- Variables CSS globales en `src/styles/global.css` — nunca hardcodear colores o fuentes

## CSS

- Variables con `--` prefijo, kebab-case: `--page-gutter`, `--text-muted`
- Tamaños responsivos con `clamp()` siempre que sea posible
- Dark mode via `[data-theme="dark"]` — no usar `@media (prefers-color-scheme)` directamente (la detección la hace el script del header)
- Transiciones hover: 0.2s–0.3s (rango óptimo según auditoría UX)

## Accesibilidad (WCAG 2.1 AA)

- Todo `<main>` lleva `id="main"` (para skip link del header)
- Imágenes funcionales: alt text descriptivo en español
- Imágenes decorativas: `alt=""` + `aria-hidden="true"`
- Formularios: `<label for="">` explícito (no solo `aria-label`)
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande
- `prefers-reduced-motion` respetado globalmente (ver global.css)
- Focus visible: outline amarillo 2px via `:focus-visible` global

## Commits

- Formato: `tipo(ámbito): descripción` — ejemplo: `fix(comparador): corregir filtro de precio`
- Tipos: `feat`, `fix`, `refactor`, `docs`, `style`, `data`
- Ámbitos comunes: `comparador`, `articulo`, `home`, `a11y`, `datos`, `seo`
