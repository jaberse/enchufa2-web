# Perfil estándar enchufa2 — Cotizaciones de seguro

Documento canónico del perfil que se usa para pedir cotizaciones de seguro en los campos `specs_tco.seguro_anual_eur` de `data/coches/*.json`. Toda cotización que se incorpore al JSON debe corresponder a este perfil — si difiere, se anota en `notas`.

Este perfil se elige para ser razonablemente representativo del comprador tipo de un coche nuevo en España (conductor experimentado, uso particular, zona urbana grande), no del comprador joven o rural.

## Perfil del conductor

| Campo | Valor |
|---|---|
| Edad del conductor principal | 43 años |
| Antigüedad de carnet | 8 años (obtenido en 2018) |
| Provincia de residencia | Madrid (28xxx) |
| Código postal ejemplo | 28045 |
| Estado civil | Indistinto (usar el que el comparador permita sin variación de prima) |
| Profesión | Empleado por cuenta ajena |
| Conductor adicional | No |
| Siniestros últimos 5 años | 0 |
| Bonus/malus | Máximo (60% bonificación) |
| Uso del vehículo | Particular — trayectos casa/trabajo |
| Kilometraje anual declarado | 15.000 km |
| Aparcamiento habitual | Garaje cerrado (propio/alquilado) |

## Perfil de la póliza

| Campo | Valor |
|---|---|
| Modalidad | **Todo riesgo con franquicia 500 €** |
| Cobertura por daños materiales | Sí, sin límite |
| Asistencia en carretera | Desde el kilómetro 0 |
| Vehículo de sustitución | Sí, hasta 15 días |
| Cobertura de lunas | Sí, sin franquicia en lunas |
| Robo e incendio | Sí |
| Defensa jurídica | Sí |
| Retirada de carnet | Sí |
| Cobertura de batería de tracción | Sí (importante para BEV) |
| Daños al cargador portátil | Sí si el comparador lo permite |
| Antigüedad del vehículo | 0 años (vehículo nuevo recién matriculado) |

## Aseguradoras de referencia

Para que una cotización sea válida como fuente `tres_cotizaciones_reales`, debe haberse pedido en al menos **3 de las siguientes 5 aseguradoras**, y al menos una de ellas debe ser una aseguradora tradicional (no únicamente comparadores):

1. **Mapfre** (directo, no comparador)
2. **Mutua Madrileña** (directo)
3. **Rastreator** (comparador — anotar el mejor precio devuelto y la aseguradora)
4. **Línea Directa**
5. **Allianz** (directo, mediador o Allianz Direct)

El valor final que va al campo `valor` del JSON es la **mediana de las 3 cotizaciones**, no la media ni el mínimo. Esto evita sesgos por ofertas puntuales y refleja el precio realista que paga un consumidor medio.

## Formato de almacenamiento en el JSON

```json
"seguro_anual_eur": {
  "valor": 672,
  "unidad": "€/año",
  "fuente_tipo": "tres_cotizaciones_reales",
  "fuente_fecha": "2026-04-20",
  "verificado": true,
  "confianza": "alta",
  "fuente_detalle": "Mediana de 3 cotizaciones reales con perfil estándar enchufa2 (43 años, Madrid, 8 años carnet, 0 siniestros, garaje, TR franquicia 500€, 15.000 km/año). Ver docs/perfil-estandar-seguro.md.",
  "seguro_cotizaciones": [
    { "aseguradora": "Mapfre", "prima_eur": 689, "modalidad": "TR franquicia 500€", "fuente_fecha": "2026-04-20" },
    { "aseguradora": "Mutua Madrileña", "prima_eur": 672, "modalidad": "TR franquicia 500€", "fuente_fecha": "2026-04-20" },
    { "aseguradora": "Rastreator (mejor: Línea Directa)", "prima_eur": 655, "modalidad": "TR franquicia 500€", "fuente_fecha": "2026-04-20" }
  ]
}
```

## Reglas de uso en artículos

Cuando un artículo cite una cifra de seguro, debe siempre anclarse a este perfil con una nota explícita, por ejemplo: *"672 €/año es la prima mediana de tres cotizaciones reales con el perfil estándar enchufa2 (43 años, Madrid, garaje, sin siniestros). Otros perfiles pueden variar ±40% respecto a esta cifra."*

Nunca presentar la cifra como **la** prima del coche, siempre como **una** prima para un perfil concreto.

## Revisión

Este perfil se revisa **una vez al año**. Si en la revisión se decide cambiarlo, se dispara una **recalibración completa** de todos los modelos con `fuente_tipo: "tres_cotizaciones_reales"`. Histórico de cambios al pie.

### Histórico

- **2026-04-15** — creación del documento, v1.
