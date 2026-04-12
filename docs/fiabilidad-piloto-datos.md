# Piloto de datos de fiabilidad — v0.1

**Fecha:** 2026-04-10
**Estado:** en curso
**Metodología de referencia:** `docs/metodologia-fiabilidad.md`

Este documento recoge la recolección de datos del piloto de la métrica de fiabilidad, modelo a modelo, con citas directas. El objetivo no es rellenar huecos, sino estresar la metodología contra datos reales antes de tocar una sola línea de código del comparador.

---

## Modelo 1 — Tesla Model Y

**Por qué empezamos aquí:** EV más vendido del mundo, años en mercado, cobertura de todas las fuentes canónicas. Si Model Y no tiene datos públicos suficientes, la metodología tiene un problema estructural.

### 1.1 Fiabilidad reportada — datos crudos

#### OCU 2026 (fuente canónica España)
- **Puntuación Model Y:** 96 puntos en la categoría "grandes eléctricos".
- **Marca Tesla global:** 89 puntos, 5ª posición general en fiabilidad.
- **Metodología OCU:** encuesta a 85.590 conductores en 10 países europeos; pondera número de averías, gravedad, antigüedad del vehículo y kilometraje.
- **Fuentes consultadas:** motor1.es, hibridosyelectricos.com, carwow.es, okdiario.com.
- **Pendiente:** verificar acceso directo a la tabla OCU sin paywall — punto crítico para la metodología.
- **Lectura:** verde en la dimensión "fiabilidad reportada".

#### TÜV Report 2026 (validador Alemania)
- **Defectos Model Y (2-3 años):** **17,3 %**, el **peor de los 110 vehículos** analizados.
- **Récord negativo:** valor más alto en la clase de 2-3 años de los últimos 10 años del informe.
- **Model 3:** 13,1 %, tercero peor.
- **Defectos principales Model Y:** suspensiones de eje (2,9 % vs 0,2 % media), iluminación frontal (5,9 % vs 0,9 %), discos de freno (2,8 % vs 1,1 %).
- **Fuentes:** electrek.co, tuev-verband.de, ecomento.de, infotaller.tv, t-online.de.
- **Lectura:** rojo en la dimensión "fiabilidad reportada".

#### ADAC Pannenstatistik 2025 (validador Alemania)
- **Model Y:** índice de averías 0,9 (primer año en la estadística).
- **Model 3:** 0,5, el mejor de toda la estadística.
- **Contexto:** EVs en conjunto más fiables que combustión (3,8 vs 9,4 averías/1.000).
- **Fuentes:** presse.adac.de, vision-mobility.de, ecomento.de.
- **Lectura:** verde.
- **Nota:** ADAC mide averías en carretera (no arranca, no rueda). TÜV mide defectos en inspección técnica. Son métricas complementarias, no sustitutas.

#### Consumer Reports 2025 (validador EE.UU.)
- **Model Y:** 81/100, "excellent".
- **Marca Tesla:** salto al top 10 de fabricantes.
- **Fuentes:** consumerreports.org, autoblog.com.
- **Lectura:** verde.

#### JD Power 2025 (validador EE.UU.)
- **Marca Tesla:** 209 PP100 (mejora desde 252 en 2022, 242 en 2023), ligeramente peor que la media del sector (202).
- **Model Y específico:** **no publicado**. Tesla no figura en rankings oficiales de JD Power por participación estatal insuficiente.
- **Fuentes:** jdpower.com, shop4tesla.com, torquenews.com.
- **Lectura:** dato insuficiente a nivel modelo. No utilizable por regla 2 ("nunca marca como proxy de modelo").

### 1.2 Discrepancia — se dispara la regla 5.4

| Fuente | Señal | Color |
|---|---|---|
| OCU 2026 | 96 puntos, 5º | verde |
| TÜV 2026 | 17,3 %, peor de 110 | rojo |
| ADAC 2025 | 0,9 (buena) | verde |
| Consumer Reports 2025 | 81/100 | verde |
| JD Power 2025 | solo marca | NA |

**La regla 5.4 se activa al primer modelo del piloto.** Cuando hay discrepancia ≥ 2 niveles entre fuentes comparables (TÜV rojo vs ADAC/OCU verde), la metodología manda:

1. Estado conservador: **amarillo**.
2. Nota editorial obligatoria explicando el porqué.

**Nota editorial propuesta para Model Y:**

> Model Y muestra un patrón poco común entre EVs: los propietarios están satisfechos (OCU, Consumer Reports) y apenas tiene averías que dejen el coche parado en carretera (ADAC), pero en inspección técnica acumula el mayor porcentaje de defectos mecánicos de los 110 modelos que mide TÜV — especialmente en suspensiones de eje, iluminación frontal y discos de freno. Interpretación razonable: el coche arranca y funciona, pero hay componentes mecánicos que se degradan más rápido de lo esperable en coches de 2-3 años. No es un problema de la batería ni del tren motriz eléctrico.

**Esto es exactamente el tipo de matiz que enchufa2 puede aportar y ningún comparador genérico va a ofrecer.** Valida toda la filosofía de la métrica.

### 1.3 Condiciones de propiedad — datos crudos

- **Garantía batería:** 8 años / 160.000 km, 70 % capacidad mínima garantizada (tesla.com/support/vehicle-warranty).
- **Garantía vehículo:** pendiente de verificar el dato España exacto. Los datos encontrados apuntan a 4 años / 80.000 km, pero hay que confirmarlo con la ficha oficial Tesla España antes de publicar.
- **Ampliación garantía:** Tesla lanza en 2026 ampliación por suscripción (~100 $/mes).
- **Degradación específica Model Y:** no encontrada en las búsquedas de Geotab. Los estudios citan Model S (2,3 %/año, refrigeración líquida) como referencia Tesla, pero no desglosan Model Y.
- **Media Geotab 2025:** 2,3 %/año (actualizado desde 1,8 % en 2024 por mayor uso de carga rápida).
- **Fuentes:** geotab.com, insideevs.com.

**Evaluación provisional (dimensión condiciones de propiedad) según umbrales de la metodología:**

- Garantía batería 8 años / 160.000 km → **cumple el umbral verde** (≥ 8 años y ≥ 160.000 km).
- Garantía vehículo 4 años / 80.000 km → **por debajo del umbral verde** (≥ 5 años). Si se confirma → amarillo.
- Degradación: sin dato directo Model Y → NA. No se puede afirmar verde/amarillo en esta variable.

**Resultado dimensión 2 provisional:** amarillo (limitado por garantía de vehículo).

### 1.4 Estado propuesto Model Y

| Dimensión | Estado | Confianza | Justificación |
|---|---|---|---|
| Fiabilidad reportada | **amarillo** | alta | Regla 5.4 por discrepancia TÜV vs resto |
| Condiciones de propiedad | **amarillo** | media | Garantía vehículo por confirmar; degradación modelo-específica no encontrada |

### 1.5 Huecos de datos identificados

1. **OCU paywall**: necesario verificar si la tabla completa es accesible públicamente o solo para suscriptores. Impacta directamente en la jerarquía de fuentes.
2. **Garantía vehículo Tesla España**: necesario consultar la ficha oficial en tesla.com/es en lugar de fuentes secundarias.
3. **Degradación específica Model Y**: Geotab no desglosa. Posibles alternativas: recurrentauto.com, Tesla Motors Club forum data, estudio académico específico.
4. **JD Power a nivel modelo**: simplemente no existe dato publicado. La metodología debe asumir este límite permanente para modelos Tesla.

---

## Hallazgos transversales tras modelo 1

**La metodología aguanta el primer stress test.** La regla 5.4 se activa exactamente cuando debe activarse, y produce un resultado defendible (amarillo + nota editorial) en lugar de un número inventado.

**Pero hay dos puntos críticos que resolver antes de seguir con los otros 4 modelos:**

1. **Acceso a OCU.** Si la tabla 2026 está tras paywall, no podemos usarla como fuente canónica pública. Habría que replantear la jerarquía: TÜV (pública) como canónica para España — con la incomodidad de usar un informe alemán como referencia — o citar OCU con "dato publicado en prensa generalista" y citar el artículo secundario, no el informe original.
2. **Garantía de vehículo por modelo.** La metodología pide verde ≥ 5 años. Casi ningún fabricante legacy cumple eso (2-3 años es estándar). Si Tesla, Model 3, Zoe, Leaf y Kona caen todos en amarillo en la dimensión 2 por el mismo motivo, la métrica pierde poder discriminatorio. Hay que revisar si los umbrales son realistas o si hay que calibrarlos contra el mercado real antes de escalar.

Pendiente: pilotar los otros 4 modelos (Tesla Model 3, Hyundai Kona, Renault Zoe, Nissan Leaf) solo después de que Javi valide estos dos puntos.
