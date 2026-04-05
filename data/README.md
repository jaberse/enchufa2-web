# data/ — La biblia de datos de enchufa2

Este directorio es la **fuente de verdad** para todos los datos del comparador.
Cada archivo en `coches/` representa una variante concreta de un coche eléctrico,
con trazabilidad completa de fuentes por cada especificación.

El `src/data/comparador.json` que consume la web es un **derivado generado**
desde estos archivos. Nunca se edita a mano.

## Principios

1. **Cada dato tiene una fuente citable.** Si alguien cuestiona un valor,
   tenemos que poder apuntar a la página del fabricante, homologación oficial,
   o test independiente de donde salió.
2. **Git es el audit trail.** Toda modificación queda registrada con autor,
   fecha y motivo. No editamos fuera de git.
3. **Una variante = un archivo.** `tesla-model-3-performance-my2024.json`
   es distinto de `tesla-model-3-rwd-my2024.json`. Las variantes se separan
   cuando cambian configuración de motor, capacidad de batería, o carrocería.
4. **La web es un destilado.** Si la web muestra un dato, existe en la biblia
   con su fuente. Si no tiene fuente, aparece como `pendiente`.

## Estructura de un archivo

```json
{
  "id": "tesla-model-y-rwd-long-range",
  "slug": "tesla-model-y-rwd-long-range",
  "marca": "Tesla",
  "modelo": "Model Y",
  "variante": "RWD Long Range",
  "nombre_completo": "Tesla Model Y RWD Long Range",
  "segmento": "SUV",
  "imagen": "/comparador/tesla-model-y-rwd-long-range.webp",
  "specs": {
    "bateria_neta_kwh": {
      "valor": 79,
      "unidad": "kWh",
      "fuente_tipo": "fabricante",
      "fuente_nombre": "Tesla España",
      "fuente_url": "https://www.tesla.com/es_es/modely/specs",
      "fuente_fecha": "2026-03-15",
      "verificado": true
    },
    "…": "…"
  },
  "meta": {
    "fecha_actualizacion": "2026-03-15",
    "estado": "verificado",
    "notas_my": "Facelift Juniper MY2024. Bomba de calor de serie desde fábrica."
  }
}
```

## Tipos de fuente (`fuente_tipo`)

| Valor                | Qué significa                                          |
|----------------------|--------------------------------------------------------|
| `fabricante`         | Web oficial o ficha técnica del fabricante             |
| `homologacion`       | Documento oficial de homologación (WLTP, ITV)          |
| `test_independiente` | Test de P3, Bjørn Nyland, ADAC, Fastned, etc.          |
| `base_datos`         | EV-Database, Electrek, etc. (menos autoridad)          |
| `calculo_propio`     | Derivado por nosotros con fórmula documentada          |
| `pendiente`          | Aún no se ha citado (migración inicial)                |

## Workflow

### Añadir un coche nuevo

1. Crear archivo `data/coches/marca-modelo-variante.json` copiando la estructura de uno existente.
2. Rellenar todos los `specs` con valor + fuente.
3. Poner `meta.estado: "verificado"` cuando al menos el 80% de los campos tengan `fuente_tipo != "pendiente"`.
4. Ejecutar `npm run data:build` para regenerar el comparador.json.
5. Commit.

### Actualizar un coche

1. Editar el archivo correspondiente.
2. Actualizar `fuente_fecha` del campo modificado.
3. Actualizar `meta.fecha_actualizacion`.
4. `npm run data:build`.
5. Commit con mensaje tipo `data(tesla-model-3): actualiza PVP tras reducción marzo 2026`.

### Política de variantes

Una variante merece **archivo propio** si cambia **≥1** de estos ejes:

- Configuración de motor (RWD / AWD / Tri-motor)
- Capacidad de batería
- Longitud / carrocería / distancia entre ejes

Diferencias de llantas, packs de confort, o colores **no** justifican variante nueva.
En su lugar, anótalas en `meta.notas_my`.

### Política de Model Years

Cuando un MY introduce un cambio técnico relevante (nueva batería, bomba de calor,
motor distinto, facelift), se crea **archivo nuevo** con sufijo de MY:
`polestar-2-single-motor-pre2023.json` vs `polestar-2-single-motor-my2023.json`.

No se actualiza retroactivamente el archivo anterior. Queda como referencia histórica.

## Scripts

```bash
# Regenerar archivos individuales desde el comparador.json actual
# (solo uso inicial o para añadir coches masivamente. No sobrescribe existentes.)
npm run data:migrate

# Construir el comparador.json plano desde los archivos individuales
npm run data:build

# Build completo de la web (incluye data:build)
npm run build
```
