# Metodología — Métricas de fiabilidad y garantía enchufa2

> Documento interno de trabajo. Define cómo producimos, agregamos y mostramos los datos de fiabilidad y garantía en el comparador. Está pensado para ser nuestra regla de decisión ante casos dudosos, no para ser publicado tal cual — aunque una versión resumida vivirá en `/comparador/metodologia`.

**Versión:** 0.3 (validado tras piloto) · **Fecha:** 2026-04-12 · **Responsable:** Javi Bernal

---

## 1. Objetivo

Responder con rigor y transparencia a dos preguntas que los portales de EV en español no responden bien:

1. *"¿Es este coche fiable según datos independientes?"*
2. *"¿Qué garantía me ofrece el fabricante?"*

El comparador muestra **dos métricas independientes** junto a cada modelo:

- **Fiabilidad** — qué dicen los informes técnicos independientes sobre incidencias reales de ese modelo.
- **Garantía** — qué compromisos objetivos ofrece el fabricante sobre el vehículo y la batería.

La separación es clave: un coche puede ser muy fiable pero tener garantía corta, o viceversa. Mezclarlas sería engañar al usuario.

## 2. Principios innegociables

Estos principios mandan sobre cualquier decisión posterior. Si una propuesta los incumple, se descarta.

- **Solo fuentes públicas y gratuitas.** Todo dato tiene una URL citable accesible sin suscripción. No usamos datos de pago, anecdóticos, foros, redes sociales ni rumores.
- **Cada dato lleva su fuente, fecha y tipo.** Aplica la misma estructura de la biblia de datos: `{ valor, fuente_tipo, fuente_nombre, fuente_url, fuente_fecha, verificado }`.
- **La ausencia de dato es información.** Si no hay datos, se muestra explícitamente *"Sin datos"* con el motivo al expandir. Nunca se rellena ni se asume.
- **Modelo, no marca.** Si solo hay dato a nivel marca, no se muestra en la ficha del modelo. Los datos de marca pueden aparecer en guías editoriales, nunca en el comparador.
- **Transparencia total.** Cada estrella es trazable: el usuario puede expandir para ver exactamente qué fuentes se usaron, qué dato aportó cada una, y cómo se calculó la nota. Sin cajas negras.
- **Metodología abierta.** Si actualizamos los umbrales o las fuentes, dejamos un changelog fechado. Cualquier cambio se publica.

## 3. Métrica 1 — Fiabilidad (★)

### 3.1 Qué mide

La frecuencia y gravedad de defectos e incidencias registradas en informes independientes de inspección técnica y asistencia en carretera. Es una foto retrospectiva basada en datos agregados de cientos de miles de vehículos.

**Qué NO mide:** experiencia personal, foros, YouTube, ni predicciones de fiabilidad futura.

### 3.2 Fuentes (solo gratuitas)

Usamos dos fuentes canónicas complementarias. No son sustitutas — miden cosas distintas:

| Fuente | Qué mide | Método | Acceso | Frecuencia |
|---|---|---|---|---|
| **TÜV Report** | Defectos detectados en inspección técnica (ITV alemana) | % de vehículos con defectos significativos, por modelo y clase de edad | Público y gratuito (tuev-verband.de) | Anual (enero) |
| **ADAC Pannenstatistik** | Averías en carretera que requieren asistencia | Índice de averías por cada 1.000 vehículos, por modelo | Público y gratuito (presse.adac.de) | Anual (marzo-abril) |

**Por qué estas dos y no otras:**
- TÜV mide defectos mecánicos objetivos (suspensiones, frenos, iluminación) detectados en inspección profesional. Un coche puede tener defectos y seguir funcionando.
- ADAC mide averías graves que dejan el coche parado. Un coche puede ser "defectuoso" en TÜV pero jamás dejarte tirado (exactamente lo que pasa con Model Y).
- Juntas cubren todo el espectro: defectos latentes + fallos graves.

**Validadores secundarios (cuando hay dato público disponible):**

| Fuente | Alcance | Notas |
|---|---|---|
| Consumer Reports (dato publicado en prensa) | EE.UU. | Solo modelos que también se venden allí. Útil como contraste cultural. |
| OCU (nota de prensa anual) | España | Datos de marca + modelos destacados publicados en prensa generalista. No el informe completo (es de pago). |
| What Car? Reliability Survey | Reino Unido | Cuando hay dato en artículo gratuito. |

Los validadores no participan en el cálculo de estrellas — solo se mencionan en el tooltip para dar contexto.

### 3.3 Cálculo de estrellas

Cada fuente canónica aporta una puntuación de 1 a 5. La nota final es la **media aritmética** de las fuentes disponibles, redondeada al medio punto más cercano.

**TÜV Report — tasa de defectos (clase 2-3 años):**

| Tasa de defectos | Estrellas | Lectura |
|---|---|---|
| ≤ 3 % | ★★★★★ | Excelente — muy por debajo de la media |
| 3,1 – 5 % | ★★★★☆ | Bueno — por debajo de la media |
| 5,1 – 8 % | ★★★☆☆ | Normal — en la media |
| 8,1 – 12 % | ★★☆☆☆ | Por debajo de la media |
| > 12 % | ★☆☆☆☆ | Problemático — muy por encima |

**ADAC Pannenstatistik — índice de averías por 1.000 vehículos:**

| Índice averías | Estrellas | Lectura |
|---|---|---|
| ≤ 1,0 | ★★★★★ | Excelente — apenas averías |
| 1,1 – 3,0 | ★★★★☆ | Bueno |
| 3,1 – 5,0 | ★★★☆☆ | Normal |
| 5,1 – 8,0 | ★★☆☆☆ | Por debajo de la media |
| > 8,0 | ★☆☆☆☆ | Problemático |

**Nota:** los umbrales están calibrados con los datos del TÜV Report 2026 (media general ~5-6 % para 2-3 años) y ADAC 2025 (media EVs 3,8). Se revisan anualmente cuando salen los nuevos informes.

**Ejemplo — Tesla Model Y:**
- TÜV 2026: 17,3 % → ★☆☆☆☆ (1)
- ADAC 2025: 0,9 → ★★★★★ (5)
- Media: (1 + 5) / 2 = 3,0 → **★★★☆☆**

### 3.4 Cuando falta una fuente

- Si solo hay TÜV pero no ADAC (o viceversa): la nota se basa en la fuente disponible, sin promediar. Se indica en el tooltip: *"Basado únicamente en TÜV Report [año]"*.
- Si el dato disponible es de un informe anterior (no el más reciente): se usa igualmente pero se marca con *"Dato de [año]"* en el tooltip para que el usuario sepa la antigüedad.
- Si no hay ninguna de las dos: se muestra **"Sin datos"** con el motivo: *"Modelo sin cobertura en TÜV ni ADAC. Primer informe esperado hacia [fecha]"*.
- Nunca se rellena con datos de validadores. Los validadores son contexto, no input.

### 3.5 Cuando ADAC da calificación cualitativa sin cifra exacta

ADAC no siempre publica el índice numérico para todos los modelos. Cuando solo hay calificación cualitativa, se mapea así:

| Calificación ADAC | Estrellas equivalentes |
|---|---|
| "sehr niedrig" (muy bajo) | ★★★★★ |
| "niedrig" (bajo) | ★★★★☆ |
| "durchschnittlich" (medio) | ★★★☆☆ |
| "hoch" (alto) | ★★☆☆☆ |
| "sehr hoch" (muy alto) | ★☆☆☆☆ |

Se indica en el tooltip: *"Dato cualitativo de ADAC (sin cifra exacta publicada)"*.

### 3.6 Discrepancias entre fuentes canónicas

Cuando TÜV y ADAC difieren en ≥ 3 estrellas (como Model Y: 1 vs 5), se añade una **nota editorial obligatoria** en el tooltip que explica la discrepancia. La media aritmética ya captura el matiz numéricamente; la nota explica el porqué en lenguaje humano.

**Ejemplo Model Y:**
> TÜV detecta un 17,3 % de defectos en inspección (suspensiones, iluminación, frenos) — el peor de 110 modelos. Sin embargo, ADAC reporta apenas 0,9 averías/1.000 en carretera. Interpretación: defectos mecánicos latentes que no inmovilizan el coche pero que aparecen en ITV.

## 4. Métrica 2 — Garantía (★)

### 4.1 Qué mide

Los compromisos objetivos que el fabricante ofrece por escrito. Son datos de hoy, no retrospectivos — se pueden rellenar desde el día del lanzamiento.

### 4.2 Fuente

Una sola: **la web oficial del fabricante en España.** Se captura URL y fecha de consulta. Se revisa anualmente o cuando el fabricante anuncia cambios.

No usamos fuentes secundarias para garantías. Si la web del fabricante no lo publica claramente, se marca como *"Sin datos — no publicado en web oficial"*.

### 4.3 Componentes y cálculo de estrellas

Dos inputs, media aritmética:

**Input A: Garantía del vehículo**

| Años | Estrellas |
|---|---|
| ≥ 7 | ★★★★★ |
| 5 – 6 | ★★★★☆ |
| 4 | ★★★☆☆ |
| 3 | ★★☆☆☆ |
| ≤ 2 | ★☆☆☆☆ |

**Input B: Garantía de batería**

| Condición | Estrellas |
|---|---|
| ≥ 10 años o ≥ 200.000 km | ★★★★★ |
| 8 años y ≥ 160.000 km | ★★★★☆ |
| 8 años y < 160.000 km | ★★★☆☆ |
| 5–7 años | ★★☆☆☆ |
| < 5 años | ★☆☆☆☆ |

**Ejemplo — Tesla Model Y:**
- Vehículo: 4 años / 80.000 km → ★★★☆☆ (3)
- Batería: 8 años / 160.000 km / 70 % → ★★★★☆ (4)
- Media: (3 + 4) / 2 = 3,5 → **★★★½☆**

**Ejemplo — Hyundai Kona Eléctrico:**
- Vehículo: 5 años / sin límite km → ★★★★☆ (4)
- Batería: 8 años / 160.000 km → ★★★★☆ (4)
- Media: (4 + 4) / 2 = 4,0 → **★★★★☆**

### 4.4 Datos adicionales (no puntúan, sí se muestran)

Se incluyen en el tooltip como información complementaria sin contribuir a la nota:
- Umbral mínimo de capacidad garantizado (ej: 70 %)
- Kilometraje de garantía del vehículo (si aplica)
- Existencia de extensión de garantía (ej: Tesla suscripción 2026)
- Garantías condicionales (ej: Nissan+ extiende a 7 años si se mantiene en taller oficial)

### 4.5 Garantías condicionales

Algunos fabricantes ofrecen extensiones de garantía condicionadas (mantenimiento en red oficial, suscripciones, etc.). Para el comparador se usa siempre la **garantía de fábrica incondicional** como base para las estrellas. La extensión condicional se muestra en el tooltip como dato adicional: *"Extensible a [X] años con [programa] (condicionado a mantenimiento en taller oficial)"*.

### 4.6 Cuando falta un dato

- Si falta garantía de batería (muy raro): se calcula solo con vehículo.
- Si falta garantía de vehículo (raro): se calcula solo con batería.
- Si no hay ninguno: *"Sin datos"*.

## 5. Presentación en el comparador

### 5.1 En las tarjetas (modo fichas)

Dos badges compactos junto a los ya existentes:

```
★★★ Fiabilidad    ★★★½ Garantía
```

Las estrellas se muestran con relleno parcial (media estrella posible). Color: amarillo (#F5C518) sobre fondo oscuro, coherente con la marca.

### 5.2 En el modo listado

Dos columnas nuevas, filtrables y ordenables como cualquier otra.

### 5.3 Tooltip / panel expandible (transparencia)

Al hacer clic en cualquiera de las dos métricas, se abre un panel que muestra:

**Para Fiabilidad:**
```
★★★ Fiabilidad
─────────────────────────────────
TÜV Report 2026          ★☆☆☆☆
  17,3 % defectos (2-3 años)
  Peor de 110 modelos analizados
  tuev-verband.de · Enero 2026

ADAC Pannenstatistik 2025 ★★★★★
  Índice 0,9 averías/1.000
  presse.adac.de · Marzo 2025

⚠️ Discrepancia notable entre fuentes:
  TÜV detecta defectos en suspensiones,
  iluminación y frenos que no inmovilizan
  el coche pero aparecen en inspección.

Validadores (no puntúan):
  · Consumer Reports 2025: 81/100
  · OCU 2026: 96 pts (nota de prensa)

Cómo calculamos → [Metodología]
Última revisión: abril 2026
```

**Para Garantía:**
```
★★★½ Garantía
─────────────────────────────────
Vehículo                  ★★★☆☆
  4 años / 80.000 km

Batería                   ★★★★☆
  8 años / 160.000 km
  Mínimo garantizado: 70 % capacidad

Fuente: tesla.com/es · Abril 2026

Cómo calculamos → [Metodología]
```

### 5.4 Estado "Sin datos"

Cuando no hay información suficiente, se muestra `— Sin datos` (sin estrellas, sin color) con tooltip explicativo:
- *"Modelo lanzado en [fecha]. Primer informe TÜV esperado hacia [fecha+2 años]."*
- *"No incluido en TÜV ni ADAC. Si tienes información sobre este modelo, escríbenos."*

## 6. Casos especiales

### 6.1 Modelo con menos de 2 años en mercado
Fiabilidad → *"Sin datos"*. Garantía → se rellena normalmente.

### 6.2 Datos solo a nivel marca
No se usan en el comparador. El dato de marca puede aparecer en guías.

### 6.3 Restyling / facelift
- **Actualización menor** (misma plataforma, mismo tren motriz): se hereda el dato con etiqueta *"Dato de generación anterior"*.
- **Generación nueva** (plataforma distinta): se trata como modelo nuevo → *"Sin datos"* en fiabilidad.

### 6.4 Múltiples variantes (ej: RWD vs Long Range vs Performance)
Los informes no desagregan por variante. Se aplica al modelo base con marca *"Aplicado al modelo, no a variante específica"*.

### 6.5 Modelo discontinuado
Se mantiene con los últimos datos y marca *"Discontinuado en [año]"*. Útil para ocasión.

### 6.6 Discrepancias entre TÜV y ADAC
Si difieren ≥ 3 estrellas: nota editorial obligatoria en el tooltip (ver sección 3.6). La media sigue siendo la nota — la nota editorial explica el porqué.

### 6.7 Datos de informe anterior (no el más reciente)
Si un modelo no aparece en el TÜV/ADAC más reciente pero sí en uno anterior, se usa el dato disponible con marca *"Dato de [año]"* en el tooltip. Es preferible un dato algo antiguo a "Sin datos".

## 7. Estructura de datos

Los datos se añaden al JSON de cada modelo en `data/coches/<slug>.json`:

```json
{
  "fiabilidad": {
    "estrellas": 3.0,
    "fuentes": [
      {
        "nombre": "TÜV Report 2026",
        "tipo": "canonica",
        "url": "https://www.tuev-verband.de/...",
        "fecha": "2026-01",
        "metrica": "17.3% defectos",
        "clase_edad": "2-3 años",
        "estrellas": 1,
        "detalle": "Peor de 110 modelos. Defectos: suspensiones eje (2.9%), iluminación (5.9%), frenos (2.8%)"
      },
      {
        "nombre": "ADAC Pannenstatistik 2025",
        "tipo": "canonica",
        "url": "https://presse.adac.de/...",
        "fecha": "2025-03",
        "metrica": "0.9 averías/1000",
        "estrellas": 5,
        "detalle": "Primer año en estadística. Apenas averías en carretera."
      }
    ],
    "validadores": [
      {
        "nombre": "Consumer Reports 2025",
        "metrica": "81/100",
        "url": "..."
      },
      {
        "nombre": "OCU 2026 (nota de prensa)",
        "metrica": "96 pts categoría grandes eléctricos",
        "url": "https://www.ocu.org/organizacion/prensa/..."
      }
    ],
    "nota_editorial": "TÜV detecta defectos mecánicos latentes que no inmovilizan el coche pero aparecen en inspección técnica.",
    "discrepancia": true,
    "ultima_revision": "2026-04-12"
  },
  "garantia": {
    "estrellas": 3.5,
    "vehiculo": {
      "anos": 4,
      "km": 80000,
      "estrellas": 3,
      "fuente_url": "https://www.tesla.com/es/support/vehicle-warranty",
      "fuente_fecha": "2026-04"
    },
    "bateria": {
      "anos": 8,
      "km": 160000,
      "umbral_capacidad_pct": 70,
      "estrellas": 4,
      "fuente_url": "https://www.tesla.com/es/support/vehicle-warranty",
      "fuente_fecha": "2026-04"
    },
    "extension_disponible": "Suscripción ~100$/mes (2026)",
    "ultima_revision": "2026-04-12"
  }
}
```

El comparador calcula las estrellas totales automáticamente desde los datos crudos. Si mañana cambiamos los umbrales, la UI se actualiza sola.

## 8. Qué NO hacemos

- **No agregamos datos de marca al modelo.**
- **No extrapolamos entre generaciones.**
- **No promediamos metodologías incompatibles.** TÜV y ADAC se promedian porque ambas producen una escala de 1-5 propia; no mezclamos sus métricas crudas.
- **No usamos foros, redes sociales, reviews ni YouTube.**
- **No publicamos datos sin URL citable y fecha.**
- **No ocultamos la incertidumbre.** Preferimos *"Sin datos"* a estrellas inventadas.
- **No usamos fuentes de pago.** Todo dato debe ser verificable por cualquier lector sin suscripción.
- **No actualizamos la metodología sin changelog.**

## 9. Ciclo de actualización

- **Anual (enero-marzo):** revisión completa tras publicarse TÜV Report (enero) y ADAC Pannenstatistik (marzo-abril). Se actualizan umbrales si la media del sector ha cambiado significativamente.
- **Al lanzar modelo nuevo en España:** se añade al comparador con Garantía rellena y Fiabilidad en *"Sin datos"*.
- **Cuando un modelo cumple 2 años:** primera búsqueda de datos de fiabilidad.
- **Cuando un fabricante cambia garantías:** se actualiza Garantía inmediatamente.

Cada actualización queda registrada en el changelog de este documento y en `ultima_revision` de cada modelo.

## 10. Piloto

**Objetivo:** validar que la metodología produce salidas defendibles, que los tooltips comunican bien la información, y que el trabajo de recolección es sostenible.

**Modelos del piloto (5):**
1. Tesla Model Y
2. Tesla Model 3
3. Hyundai Kona Eléctrico
4. Renault Zoe (discontinuado)
5. Nissan Leaf

**Criterios de éxito:**
- Los 5 tienen al menos una fuente canónica en Fiabilidad (no *"Sin datos"* en todos).
- Las Garantías están rellenas al 100%.
- La discrepancia TÜV/ADAC aparece al menos en 1 modelo (validar regla 6.6 y el tooltip).
- Un usuario nuevo entiende qué significa cada nota sin leer la metodología completa.

**Criterios de fracaso:**
- Más del 30% de los campos en *"Sin datos"* entre los 5.
- Casos no contemplados por la metodología.
- El tooltip confunde más que aclara.

Si el piloto pasa, escalamos progresivamente al resto del comparador.

**Resultado del piloto (2026-04-12):** APROBADO. Los 5 modelos tienen datos, las estrellas discriminan (rango 3,0–4,0), las discrepancias generan contenido editorial valioso, 0 % de campos "Sin datos". Documento completo en `docs/fiabilidad-piloto-datos.md`.

---

## Changelog

- **2026-04-10 — v0.1:** borrador inicial. Dos dimensiones (fiabilidad reportada + condiciones de propiedad), semáforo verde/amarillo/rojo, OCU como fuente canónica, degradación como métrica.
- **2026-04-12 — v0.2:** reescritura mayor tras validación con Javi. Cambios:
  - Dos métricas separadas (Fiabilidad + Garantía) en lugar de dos dimensiones combinadas.
  - Escala de 5 estrellas en lugar de semáforo de colores — más granularidad, menos estigma.
  - Degradación de batería eliminada como métrica (depende de variables del usuario, no del coche).
  - Solo fuentes gratuitas: TÜV + ADAC como canónicas, OCU degradada a validador (informe completo es de pago).
  - Umbrales concretos para cada input con tablas de mapeo.
  - Diseño del tooltip/panel expandible para transparencia total.
  - Ejemplos calculados con datos reales del piloto Model Y.
- **2026-04-12 — v0.3:** decisiones del piloto incorporadas. Cambios:
  - Regla 3.5: mapeo de calificaciones cualitativas ADAC a estrellas (cuando no hay cifra exacta).
  - Regla 3.4: datos de informes anteriores se usan con marca de antigüedad.
  - Regla 4.5: garantías condicionales (ej: Nissan+) no puntúan — se usa garantía base incondicional, extensión en tooltip.
  - Regla 6.7: datos de informe anterior permitidos con etiqueta "Dato de [año]".
  - Model 3 batería 192k km → 4 estrellas (no llega al umbral de ≥200k para 5★).
  - Resultado del piloto documentado: APROBADO.
