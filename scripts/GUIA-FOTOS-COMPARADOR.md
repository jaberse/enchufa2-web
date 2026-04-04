# Guía de descarga de fotos — comparador enchufa2

## Criterios de selección
- **Ángulo**: 3/4 frontal (front three-quarter)
- **Orientación**: coche mirando hacia la DERECHA
- **Fondo**: preferiblemente neutro/estudio (se elimina con rembg)
- **Resolución**: mínimo 1200px de ancho
- **Formato**: JPG o PNG

## Cómo nombrar los archivos
Usa el slug del modelo como nombre del archivo.
Ejemplo: `volkswagen-id4-pro-performance.jpg`

## Portales de prensa por fabricante

### Tesla (4 modelos)
- **Portal**: https://www.tesla.com/tesla-gallery
- Modelos: Model Y, Model 3
- Archivos:
  - `tesla-model-y-rwd-long-range.jpg` (= mismo que AWD)
  - `tesla-model-y-awd-long-range.jpg`
  - `tesla-model-3-rwd-highland.jpg` (= mismo que AWD)
  - `tesla-model-3-long-range-awd-highland.jpg`
- Nota: Tesla Gallery a veces requiere registro. Alternativa: buscar "Tesla Model Y 2025 press photo" en Google Imágenes y filtrar por resolución alta.

### Volkswagen (4 modelos)
- **Portal**: https://www.volkswagen-newsroom.com/en/images
- Buscar: "ID.3", "ID.4", "ID.7", "ID.4 GTX"
- Archivos:
  - `volkswagen-id3-pro-s.jpg` ✅ DESCARGADA
  - `volkswagen-id4-pro-performance.jpg` ✅ DESCARGADA
  - `volkswagen-id4-gtx.jpg` ✅ DESCARGADA
  - `volkswagen-id7-pro-s.jpg`

### Hyundai (3 modelos)
- **Portal**: https://www.hyundai.news/eu/models/electrified/
- Archivos:
  - `hyundai-ioniq-5-long-range-rwd.jpg` (= mismo que AWD)
  - `hyundai-ioniq-5-long-range-awd.jpg`
  - `hyundai-kona-electric-65-kwh.jpg`

### Kia (3 modelos)
- **Portal**: https://press.kia.com/eu/en/models.html
- Archivos:
  - `kia-ev3-long-range.jpg`
  - `kia-ev6-long-range-rwd.jpg`
  - `kia-ev6-gt.jpg`

### Škoda (3 modelos)
- **Portal**: https://www.skoda-storyboard.com/en/press-releases/
- Archivos:
  - `skoda-elroq-60.jpg` (= mismo que 85)
  - `skoda-elroq-85.jpg`
  - `skoda-enyaq-85.jpg`

### BMW (2 modelos)
- **Portal**: https://www.press.bmwgroup.com/global
- Buscar: "iX1", "i4"
- Archivos:
  - `bmw-ix1-xdrive30.jpg`
  - `bmw-i4-edrive40.jpg`

### Volvo (3 modelos)
- **Portal**: https://www.media.volvocars.com/global/en-gb
- Archivos:
  - `volvo-ex30-single-motor.jpg` (= mismo que Extended Range)
  - `volvo-ex30-single-motor-extended-range.jpg`
  - `volvo-ex40-recharge-single-motor.jpg`

### Audi (2 modelos)
- **Portal**: https://www.audi-mediacenter.com/en
- Archivos:
  - `audi-q4-e-tron-45.jpg`
  - `audi-q6-e-tron-performance.jpg`

### Stellantis: Peugeot, Citroën, Fiat, Opel (5 modelos)
- **Portal**: https://www.media.stellantis.com/em-en
- Buscar cada marca por separado
- Archivos:
  - `peugeot-e-208-allure.jpg`
  - `peugeot-e-2008-allure.jpg`
  - `citroen-e-c3-you.jpg`
  - `fiat-500e-la-prima.jpg`
  - `opel-mokka-e-gs.jpg`

### Mercedes (1 modelo)
- **Portal**: https://media.mercedes-benz.com
- Archivo: `mercedes-eqa-250-plus.jpg`

### Renault (1 modelo)
- **Portal**: https://media.renaultgroup.com
- Archivo: `renault-5-e-tech-comfort-range.jpg`

### Cupra (1 modelo)
- **Portal**: https://www.cupraofficial.com/press.html
- Archivo: `cupra-born-58-kwh.jpg`

### Ford (1 modelo)
- **Portal**: https://media.ford.com
- Archivo: `ford-explorer-ev-standard-range-rwd.jpg`

### BYD (1 modelo)
- **Portal**: https://www.byd.com/eu/news
- Archivo: `byd-atto-3-comfort.jpg`

### Dacia (1 modelo)
- **Portal**: https://media.renaultgroup.com (buscar Dacia)
- Archivo: `dacia-spring-essential.jpg`

### Mini (1 modelo)
- **Portal**: https://www.press.bmwgroup.com/global (buscar Mini)
- Archivo: `mini-cooper-se-e.jpg`

### MG (1 modelo)
- **Portal**: buscar "MG4 Electric press photo" en Google
- Archivo: `mg-4-standard-range.jpg`

## Workflow
1. Descargar las fotos originales a `scripts/raw/`
2. Ejecutar `python3 procesar-fotos-comparador.py`
3. Copiar los `.webp` de `scripts/processed/` a `03_Web/enchufa2-web/public/comparador/`
4. Los modelos con foto se verán automáticamente en el comparador

## Nota sobre variantes
Cuando dos variantes del mismo coche comparten foto (ej. Model Y RWD y AWD), basta con descargar una foto y copiarla con los dos nombres de slug.
