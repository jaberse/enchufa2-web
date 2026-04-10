# Metodología — Índice de fiabilidad enchufa2

> Documento interno de trabajo. Define cómo producimos, agregamos y mostramos los datos de fiabilidad en el comparador. Está pensado para ser nuestra regla de decisión ante casos dudosos, no para ser publicado tal cual — aunque una versión resumida vivirá en `/comparador/metodologia-fiabilidad`.

**Versión:** 0.1 (borrador) · **Fecha:** 2026-04-10 · **Responsable:** Javi Bernal

---

## 1. Objetivo

Responder con rigor y honestidad a una pregunta que los portales de EV en español no responden bien: *"¿qué tal envejece este coche y cuánto me va a costar tenerlo?"*.

Para ello, el comparador va a mostrar dos dimensiones independientes junto a cada modelo:

1. **Fiabilidad reportada** — qué dicen los informes independientes sobre la frecuencia y gravedad de las incidencias conocidas en ese modelo.
2. **Condiciones de propiedad** — qué compromisos objetivos ofrece el fabricante y qué sabemos del envejecimiento del coche: garantía del vehículo, garantía de la batería, degradación documentada, coste de mantenimiento programado.

La distinción es clave porque una dimensión (la primera) depende de que el coche lleve años en la calle, y la otra (la segunda) se puede rellenar desde el día del lanzamiento. Separarlas nos permite **no dejar en blanco a los modelos nuevos**.

## 2. Principios innegociables

Estos principios mandan sobre cualquier decisión posterior. Si una propuesta los incumple, se descarta.

- **Solo datos públicos y verificables.** Todo dato tiene una fuente citable por URL o referencia bibliográfica. No usamos datos anecdóticos, foros, redes sociales ni rumores.
- **Cada dato lleva su fuente, fecha y tipo.** Aplica la misma estructura de la biblia de datos: `{ valor, fuente_tipo, fuente_nombre, fuente_url, fuente_fecha, verificado }`.
- **La ausencia de dato es información.** Nunca se deja un campo vacío, gris ni en blanco. Si no hay datos, se muestra explícitamente *"Datos insuficientes"* con el motivo al hacer hover.
- **Dos dimensiones, no un score único.** Un único número de 1 a 5 colapsa información incompatible y crea falsa precisión. Siempre separamos "fiabilidad reportada" de "condiciones de propiedad".
- **Modelo, no marca.** Si solo hay dato a nivel marca, no se muestra en el comparador. Los datos de marca pueden aparecer en una guía editorial, nunca en la ficha del modelo.
- **Metodología abierta.** Cualquier usuario que haga click en un indicador puede ver de dónde sale el dato, qué fuente se usó y cómo se convirtió en color/nota. Sin cajas negras.
- **Estabilidad temporal.** La metodología no cambia en secreto. Si actualizamos los umbrales, dejamos un changelog fechado.

## 3. Las dos dimensiones en detalle

### 3.1 Fiabilidad reportada

**Qué mide:** la frecuencia y gravedad de incidencias registradas en informes independientes de organizaciones de consumidores, entidades de inspección técnica y publicaciones especializadas.

**Qué NO mide:** tu experiencia personal, la del foro, la del vídeo de YouTube, ni predicciones de fiabilidad futura. Es una foto retrospectiva basada en datos agregados.

**Estados visuales:**

| Estado | Símbolo | Significado |
|---|---|---|
| **Buena** | ● verde | Datos disponibles y consistentes, sin incidencias significativas por encima del promedio del segmento |
| **Aceptable** | ● amarillo | Datos disponibles pero con incidencias reportadas al nivel del segmento o ligeramente por encima |
| **Problemática** | ● rojo | Datos disponibles con incidencias significativamente por encima del segmento en al menos una fuente principal |
| **Datos insuficientes** | ○ | Modelo con menos de 2 años en el mercado, o sin cobertura suficiente en las fuentes de referencia |

**Regla de convivencia con "datos insuficientes":** un modelo nuevo no es ni bueno ni malo — es desconocido. No puede aparecer en verde por defecto ni en amarillo por precaución. Aparece en `○ Datos insuficientes` con la fecha de lanzamiento visible al hacer hover: *"Modelo lanzado en septiembre 2024 — primer informe esperado en 2026"*.

### 3.2 Condiciones de propiedad

**Qué mide:** compromisos objetivos del fabricante y datos de envejecimiento publicados. Todo rellenable desde el día del lanzamiento comercial.

**Componentes:**

- **Garantía del vehículo** — años y kilómetros, fuente: web oficial del fabricante español.
- **Garantía de la batería** — años, kilómetros, y umbral mínimo de capacidad garantizado (ej: "70% a 8 años/160.000 km"). Fuente: web oficial.
- **Degradación documentada** — cuando existe, dato de Geotab, EV Database o estudios con muestra ≥50 coches. Si no existe, se omite (no se extrapola).
- **Coste de mantenimiento programado** — si el fabricante publica listas de precios o contratos de mantenimiento, se usa. Si no, se omite.

**Estados visuales (basados en los 2-4 componentes disponibles):**

| Estado | Símbolo | Regla |
|---|---|---|
| **Favorable** | ● verde | Garantía vehículo ≥ 5 años AND garantía batería ≥ 8 años/160.000 km AND (degradación < 2% anual documentada OR degradación desconocida) |
| **Estándar** | ● amarillo | Cumple al menos 1 de las dos condiciones de garantía pero no las dos, O degradación documentada entre 2-3% anual |
| **Restrictivo** | ● rojo | Garantía vehículo < 5 años Y garantía batería < 8 años/160.000 km, O degradación documentada > 3% anual |
| **Datos insuficientes** | ○ | El fabricante no publica datos claros de garantía (caso raro, prácticamente no aplicable) |

**Por qué esos umbrales:** 5 años de garantía del vehículo es lo que ofrecen Hyundai/Kia/MG y se ha convertido en el nuevo estándar esperado por el mercado español. 8 años / 160.000 km es el mínimo legal europeo para la batería — quien lo cumple es "estándar", quien lo supera es "favorable". Estos umbrales se revisan anualmente.

## 4. Jerarquía de fuentes

### 4.1 Fiabilidad reportada — fuentes y prioridad

Usamos un sistema de **fuente canónica + validadores**. No promediamos metodologías incompatibles.

| Prioridad | Fuente | Alcance | Método | Notas |
|---|---|---|---|---|
| 1 | **OCU (España)** | España | Encuesta a socios, informe anual "Fiabilidad de coches" | Canónica para España. Idioma y mercado correctos. Muestra variable por modelo. |
| 2 | **TÜV Report** | Alemania | % de defectos en ITV alemana, informe anual | Objetivo y masivo. Mide coches de 2-3 años (primera ITV en Alemania). |
| 3 | **ADAC Pannenstatistik** | Alemania | Averías atendidas por asistencia ADAC por cada 1.000 coches | Muy sensible a fallos graves. Cubre coches de 3-12 años. |
| 4 | **What Car? Reliability Survey** | Reino Unido | Encuesta a propietarios, informe anual | Buena cobertura de modelos europeos. |
| 5 | **Consumer Reports** | EEUU | Encuesta a suscriptores | Útil solo para modelos que también se venden en EEUU. Distinta percepción cultural de "problema". |

**Regla de agregación:** para cada modelo, buscamos la **fuente de mayor prioridad disponible**. Esa es la **canónica**. Las fuentes de prioridad inferior se usan como **validadores**:

- Si la canónica y al menos 1 validador **coinciden** en el estado → **confianza alta**.
- Si la canónica existe pero no hay validadores → **confianza media**.
- Si la canónica y los validadores **discrepan en más de un nivel** (ej: canónica verde, validador rojo) → se adopta el estado más conservador (el peor) + una nota explícita *"Discrepancia entre fuentes — ver detalle"*.

**Nunca se promedian puntuaciones numéricas entre fuentes.** Cada fuente tiene su escala y su metodología; sumarlas es equivocado matemáticamente.

### 4.2 Condiciones de propiedad — fuentes

- **Garantía vehículo y batería:** web oficial del fabricante español. Se captura URL y fecha de consulta. Se revisa anualmente.
- **Degradación documentada:** por orden de preferencia:
  1. Geotab EV Battery Degradation Study (muestra masiva, actualizado anualmente)
  2. EV Database (Bjørn Nyland y equipo, datos de largo recorrido)
  3. Estudios académicos con DOI y muestra ≥50 coches
- **Coste de mantenimiento:** web oficial del fabricante o precio medio de contrato de mantenimiento en red oficial.

## 5. Casos especiales y reglas de excepción

**5.1 Modelo con menos de 2 años en el mercado español.**
Fiabilidad reportada → *"Datos insuficientes"*. Condiciones de propiedad → se rellenan normalmente. Tooltip: *"Modelo lanzado en [fecha]. Primer informe de fiabilidad esperado hacia [fecha+2 años]"*.

**5.2 Datos disponibles solo a nivel marca.**
No se usan en la columna del modelo. El comparador muestra *"Datos insuficientes"*. El dato de marca puede aparecer en la guía 1.5 *Garantías, fiabilidad y marcas* con su contexto y limitaciones.

**5.3 Restyling / facelift.**
Dos casos:
- **Actualización menor** (misma plataforma, mismo tren motriz, cambios estéticos o software): se hereda el dato de la generación anterior con etiqueta *"Dato heredado de generación anterior"*.
- **Generación nueva** (plataforma distinta, tren motriz rediseñado, batería diferente): se trata como modelo nuevo. *"Datos insuficientes"* hasta que tenga 2 años en el mercado.

Criterio de arbitraje: si el fabricante anuncia "nueva generación" y cambia la denominación interna de la plataforma, es generación nueva. Si solo es "model year X + facelift", es actualización menor.

**5.4 Discrepancia entre fuentes principales.**
Si OCU marca verde y TÜV marca rojo (o equivalente), se adopta el estado más conservador (rojo) y se añade una nota: *"OCU 2026 reporta satisfacción alta, pero TÜV 2025 detecta X% de defectos en primera ITV. Ver metodología."*. Esta honestidad es precisamente lo que nos diferencia.

**5.5 Modelo con múltiples variantes (ej: Tesla Model Y RWD vs Long Range vs Performance).**
Los informes casi nunca desagregan por variante. Se aplica el dato al modelo base y se marca en las variantes como *"Heredado del modelo"* si no hay datos específicos. Si una variante tiene una diferencia técnica relevante (ej: batería LFP vs NMC), se nota en el tooltip.

**5.6 Modelo discontinuado.**
Se mantiene en la base de datos con los últimos datos disponibles y una marca *"Discontinuado en [año]"*. Útil para mercado de ocasión.

## 6. Nivel de confianza

Además del color del estado, cada indicador muestra un nivel de confianza:

| Nivel | Cuándo | Visual |
|---|---|---|
| **Alta** | Canónica + ≥1 validador coincidiendo | Indicador sólido |
| **Media** | Solo canónica disponible, o validadores con discrepancias menores | Indicador con borde discontinuo |
| **N/A** | Datos insuficientes | Círculo vacío |

El nivel de confianza aparece en el tooltip al hacer hover: *"Confianza: Alta — OCU 2026 + TÜV 2025 + ADAC 2025 coinciden"*.

## 7. Ciclo de actualización

- **Mensual:** monitorizamos si salen informes nuevos (OCU, TÜV, ADAC, What Car? suelen publicar una vez al año; JD Power trimestralmente).
- **Anual (febrero-marzo):** revisión completa de los datos tras salir OCU España y TÜV Report alemán.
- **Al lanzar un modelo nuevo en España:** se añade al comparador en las primeras 2 semanas con Condiciones de propiedad rellenas y Fiabilidad reportada en *"Datos insuficientes"*.
- **Cuando un modelo cumple 2 años en el mercado español:** primera revisión de Fiabilidad reportada — se busca cobertura en las fuentes y se rellena si existe.

Cada actualización queda registrada en el `changelog` del archivo de metodología y en los metadatos del dato en `data/coches/`.

## 8. Ejemplos trabajados

Estos son los 5 modelos del piloto inicial con un análisis hipotético de cómo se rellenaría la metodología. Los datos concretos se verificarán al implementar el piloto; aquí se ilustra **cómo aplicamos las reglas**.

### 8.1 Tesla Model 3 (Highland, 2023→)

- **Fiabilidad reportada:**
  - Canónica: OCU 2026 — [pendiente consulta específica]
  - Validador 1: What Car? Reliability Survey 2025
  - Validador 2: Consumer Reports 2025
  - Estado: **● amarillo** (hipotético — Tesla históricamente tiene buena fiabilidad mecánica pero problemas de calidad de ensamblaje y software)
  - Confianza: Alta
  - Nota: *"Fiabilidad mecánica buena; incidencias reportadas frecuentes en calidad de acabados y software (OTA)."*

- **Condiciones de propiedad:**
  - Garantía vehículo: 4 años / 80.000 km → NO cumple ≥5 años
  - Garantía batería: 8 años / 192.000 km → cumple
  - Degradación documentada (Geotab, estudio 2024): ~1.8% anual → cumple <2%
  - Estado: **● amarillo** (cumple 2 de 3 condiciones favorables)

### 8.2 Hyundai Kona Eléctrico (segunda generación, 2023→)

- **Fiabilidad reportada:**
  - Canónica: OCU 2026
  - Validador 1: TÜV Report 2025 (primera generación disponible; segunda generación, datos insuficientes)
  - Estado: **● verde** (hipotético — Hyundai/Kia históricamente excelente en OCU y TÜV)
  - Confianza: Media (datos solo sobre primera generación como proxy → ver regla 5.3; probablemente acabaría en *"Datos insuficientes"* hasta 2025-2026)

- **Condiciones de propiedad:**
  - Garantía vehículo: 5 años / sin límite km → cumple
  - Garantía batería: 8 años / 160.000 km → cumple
  - Degradación documentada: pendiente
  - Estado: **● verde**

### 8.3 Renault Zoe (2019-2024, última generación antes de descontinuar)

- **Fiabilidad reportada:**
  - Canónica: OCU 2025 (previa a discontinuación)
  - Validadores: TÜV 2024, ADAC Pannenstatistik 2024
  - Estado: **● amarillo o rojo** (hipotético — la Zoe ha tenido problemas documentados en gestión térmica de batería y carga DC)
  - Confianza: Alta
  - Marca adicional: *"Discontinuado en 2024"*

- **Condiciones de propiedad:**
  - Garantía batería al momento de venta: 8 años / 160.000 km → cumple
  - Degradación documentada: Geotab reporta degradación mayor que el promedio del segmento → no cumple umbral
  - Estado: **● amarillo**

### 8.4 Nissan Leaf (segunda generación, 2018-2025)

- **Fiabilidad reportada:**
  - Canónica: OCU 2026
  - Validadores: TÜV 2025, ADAC 2025, What Car? 2025
  - Estado: **● amarillo** (hipotético — fiabilidad mecánica buena, pero problema conocido con sistema CHAdeMO y degradación de batería sin refrigeración activa)
  - Confianza: Alta
  - Nota destacada: *"La falta de refrigeración activa de la batería está documentada como causa de degradación acelerada en climas cálidos."*

- **Condiciones de propiedad:**
  - Garantía vehículo: 3 años / 100.000 km → NO cumple
  - Garantía batería: 8 años / 160.000 km → cumple
  - Degradación: documentada y por encima del promedio en climas cálidos → no cumple
  - Estado: **● rojo**

### 8.5 Tesla Model Y (RWD Long Range, 2022→)

- **Fiabilidad reportada:**
  - Canónica: OCU 2026
  - Validadores: What Car? 2025, Consumer Reports 2025
  - Estado: **● amarillo** (hipotético — similar al Model 3, calidad variable de ensamblaje)
  - Confianza: Alta

- **Condiciones de propiedad:**
  - Garantía vehículo: 4 años / 80.000 km → NO cumple
  - Garantía batería: 8 años / 192.000 km → cumple
  - Degradación documentada: ~1.8% anual → cumple
  - Estado: **● amarillo**

> **Importante:** estos 5 ejemplos son ilustrativos del método, no afirmaciones actuales de enchufa2. La verificación de los datos reales es la primera tarea del piloto.

## 9. Piloto

**Objetivo:** validar que la metodología produce salidas defendibles, que la UI del comparador comunica bien la información, y que el trabajo de recolección de datos es sostenible en el tiempo.

**Modelos del piloto (5):**
1. Tesla Model 3 (Highland)
2. Tesla Model Y (RWD Long Range)
3. Hyundai Kona Eléctrico (primera generación, por tener más datos históricos)
4. Renault Zoe (discontinuado, alta cobertura de fuentes)
5. Nissan Leaf (segunda generación)

**Criterios de selección:** los cinco llevan ≥2 años en el mercado, tienen cobertura en OCU, TÜV y al menos un validador más. Son suficientemente distintos entre sí para testear los estados verde/amarillo/rojo.

**Criterios de éxito:**
- Los 5 tienen datos verificados en Fiabilidad reportada (no *"Datos insuficientes"*).
- Las Condiciones de propiedad están rellenas al 100% en los 5.
- La discrepancia entre fuentes aparece al menos en 1 modelo (para validar la regla 5.4).
- Al mostrar los 5 en el comparador, un usuario nuevo entiende qué significa cada color sin leer la página de metodología (test con Javi+Jose u otro usuario).

**Criterios de fracaso (cuando replantear):**
- Más del 30% de los campos acaban en *"Datos insuficientes"* entre los 5 modelos del piloto.
- Dos o más casos en los que la metodología no sabe qué hacer (excepción no contemplada).
- La UI genera confusión entre "fiabilidad reportada" y "condiciones de propiedad" en el test con usuario.

Si el piloto pasa, escalamos a los siguientes 10 modelos con mayor cobertura de fuentes y, progresivamente, al resto del comparador.

## 10. Estructura de datos

Los datos se añaden al grupo `fiabilidad` existente en `data/coches/<slug>.json`. Propuesta de esquema:

```json
{
  "fiabilidad": {
    "fiabilidad_reportada": {
      "estado": "verde | amarillo | rojo | insuficiente",
      "confianza": "alta | media | na",
      "fuente_canonica": {
        "nombre": "OCU",
        "url": "...",
        "fecha": "2026-01",
        "metrica_cruda": "8.2/10",
        "muestra": 243
      },
      "validadores": [
        {
          "nombre": "TÜV Report 2025",
          "url": "...",
          "fecha": "2025-06",
          "metrica_cruda": "2.1% defectos en primera ITV",
          "coincide_canonica": true
        }
      ],
      "nota_editorial": "Fiabilidad mecánica buena; incidencias en calidad de acabados.",
      "fecha_primera_venta_es": "2023-09",
      "ultima_revision": "2026-04-10"
    },
    "condiciones_propiedad": {
      "estado": "verde | amarillo | rojo",
      "garantia_vehiculo_anos": 5,
      "garantia_vehiculo_km": null,
      "garantia_vehiculo_fuente_url": "...",
      "garantia_bateria_anos": 8,
      "garantia_bateria_km": 160000,
      "garantia_bateria_umbral_capacidad": "70%",
      "garantia_bateria_fuente_url": "...",
      "degradacion_anual_pct": 1.8,
      "degradacion_fuente": {
        "nombre": "Geotab EV Battery Degradation Study 2024",
        "url": "..."
      },
      "ultima_revision": "2026-04-10"
    }
  }
}
```

Este esquema respeta la biblia de datos existente (metadatos de fuente en cada campo) y permite reconstruir los estados visuales automáticamente desde los datos crudos, lo que significa que si mañana cambiamos los umbrales, la UI se actualiza sola.

## 11. Qué NO hacemos (límites explícitos)

- **No agregamos datos de marca al modelo.** *"Tesla es fiable"* no se convierte en *"el Model Y es fiable"*.
- **No extrapolamos entre generaciones.** Ver regla 5.3.
- **No promediamos metodologías incompatibles.** PP100 + %defectos + satisfacción subjetiva no se puede sumar.
- **No usamos foros, redes sociales, reviews individuales o vídeos de YouTube como fuente de fiabilidad.**
- **No publicamos datos sin URL citable y fecha.**
- **No ocultamos la incertidumbre.** Preferimos *"Datos insuficientes"* explícito a un verde de relleno.
- **No mostramos un score único de 1 a 5.** Siempre las dos dimensiones separadas.
- **No actualizamos la metodología sin dejar changelog.** Cualquier cambio en umbrales, fuentes o reglas tiene fecha y motivo.

## 12. Integración con el resto del proyecto

**En el comparador:**
- Dos nuevas columnas en el modo listado: "Fiabilidad reportada" y "Condiciones de propiedad".
- Dos nuevos pills de filtro: "Fiabilidad" y "Garantía".
- En las tarjetas del modo fichas: dos badges pequeños con el color del estado.
- Cada indicador abre un popover con: estado, confianza, fuentes citadas, nota editorial, enlace a la metodología.

**En las guías:**
- La guía 1.5 *"Garantías, fiabilidad y marcas"* (basada en OCU 85.590 conductores) es la explicación larga de esta metodología en lenguaje accesible. Cita este documento como referencia técnica.
- Otras guías (ej: *"Qué coche eléctrico comprar si buscas durabilidad"*) pueden enlazar al comparador filtrado por `Fiabilidad: verde`.

**En la página de metodología pública:**
- `/comparador/metodologia-fiabilidad` es una versión resumida y editada de este documento para el usuario final. Incluye qué fuentes usamos, por qué cada una, cómo construimos los estados y cómo se puede verificar cada dato.

---

## Changelog

- **2026-04-10 — v0.1:** borrador inicial. Propone dos dimensiones (Fiabilidad reportada + Condiciones de propiedad), jerarquía de fuentes con OCU canónica para España, reglas de casos especiales, estructura de datos JSON, y plan piloto con 5 modelos. Pendiente de validación con Javi.
