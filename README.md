# 🐦 Aves de Chile - Mapa Interactivo

Visualización interactiva minimalista de las aves representativas de cada región de Chile. Al pasar el cursor sobre una región, se reproduce el canto de su ave característica con un efecto de "bandada" usando múltiples instancias de audio simultáneas.

![Aves de Chile](preview.png)

## ✨ Características

- **Diseño minimalista horizontal** con mapa en escala de grises
- **Audio interactivo** al pasar el cursor sobre cada región
- **Porcentajes de biodiversidad** - Muestra % de especies de Chile por región
- **Efecto de bandada** con 3-5 instancias de cada sonido
- **Variaciones espaciales** usando Tone.js:
  - Variación de tono (pitch): 0.85x - 1.15x
  - Paneo estéreo (espacialización): -1 a 1
  - Volumen aleatorio: -16dB a -8dB
  - Delays de inicio: 0-1 segundo
- **16 regiones de Chile** con sus aves representativas
- **Código simplificado y optimizado** (~200 líneas)

## 🗺️ Regiones y Aves

| Región             | Ave Representativa     |
| ------------------ | ---------------------- |
| Arica y Parinacota | Flamenco Chileno       |
| Tarapacá           | Parina Grande          |
| Antofagasta        | Pilpilén               |
| Atacama            | Cóndor Andino          |
| Coquimbo           | Loica                  |
| Valparaíso         | Diuca                  |
| Metropolitana      | Chincol                |
| O'Higgins          | Queltehue              |
| Maule              | Bandurria              |
| Ñuble              | Traro                  |
| Biobío             | Chucao                 |
| Araucanía          | Rayadito               |
| Los Ríos           | Huet-huet              |
| Los Lagos          | Martín Pescador        |
| Aysén              | Carpintero Negro       |
| Magallanes         | Pingüino de Magallanes |

## 🚀 Instalación y Uso

### 1. Clonar o descargar el proyecto

```bash
cd infoviz
```

### 2. Descargar los archivos de audio

#### Opción A: Script automático (recomendado)

```bash
# Instalar dependencias de Python
pip install requests beautifulsoup4

# Ejecutar el script de descarga
python3 download_sounds.py
```

#### Opción B: Descarga manual

1. Ve a la carpeta `sounds/`
2. Lee el archivo `sounds/README.md`
3. Descarga cada audio desde [Xeno-canto](https://www.xeno-canto.org/)
4. Guarda los archivos con los nombres especificados

### 3. Abrir la visualización

Inicia un servidor local:

```bash
# Con Python
python3 -m http.server 8000

# O con Node.js
npx serve
```

Luego visita: `http://localhost:8000`

**⚠️ IMPORTANTE:** Haz clic en la página primero para activar el audio (requerimiento del navegador), luego pasa el cursor sobre las regiones.

## 🛠️ Tecnologías Utilizadas

- **MapLibre GL JS** - Renderizado del mapa
- **Tone.js** - Procesamiento y síntesis de audio
- **GeoJSON** - Datos geográficos de las regiones
- **Xeno-canto** - Base de datos de cantos de aves

## 📁 Estructura del Proyecto

```
infoviz/
├── index.html              # Página principal
├── script.js               # Lógica de interacción y audio
├── styles.css              # Estilos minimalistas
├── download_sounds.py      # Script para descargar audios
├── sounds/                 # Archivos de audio (MP3)
│   ├── README.md          # Documentación de archivos de audio
│   ├── flamenco_chileno.mp3
│   ├── parina_grande.mp3
│   └── ...                # (16 archivos en total)
├── mapas/
│   ├── style.json         # Estilo del mapa
│   └── regiones_combinadas.geojson  # Geometrías de regiones
├── data/
│   └── especies_xd.json   # Datos de especies (si se necesita)
└── AVES_MP3s.md           # Documentación de aves y fuentes

```

## 🎨 Personalización

### Cambiar colores del mapa

Edita `styles.css`:

```css
#map {
  filter: grayscale(100%) brightness(1.1);
}
```

### Ajustar efecto de bandada

Edita `script.js`:

```javascript
// Cambiar número de aves en la bandada
const flockSize = 3 + Math.floor(Math.random() * 3); // Actualmente 3-5

// Ajustar variación de pitch
bird.playbackRate = 0.85 + Math.random() * 0.3; // 0.85 a 1.15

// Ajustar volumen
const volume = new Tone.Volume(-8 + Math.random() * -8); // -16dB a -8dB
```

## 🔧 Troubleshooting

### No se escucha audio

1. **HAZ CLIC en la página primero** (requerimiento del navegador para Tone.js)
2. Verifica que los archivos MP3 estén en la carpeta `sounds/`
3. Asegúrate de que los nombres de archivo coincidan exactamente
4. Revisa la consola del navegador (F12) - debe aparecer "🔊 Audio listo"
5. Busca el mensaje "💡 Haz clic en la página para activar el audio"

### El mapa no se carga

1. Verifica que `mapas/regiones_combinadas.geojson` exista
2. Si usas `file://`, considera usar un servidor local
3. Revisa la consola para errores de CORS

### Audio se corta o suena mal

1. Descarga archivos de mejor calidad (≥192 kbps)
2. Evita archivos con mucho ruido de fondo
3. Ajusta el volumen en `script.js`

## 📚 Recursos

- **Xeno-canto**: https://www.xeno-canto.org/ - Base de datos de cantos de aves
- **AvesChile**: https://avesdechile.cl/ - Información sobre aves de Chile
- **Tone.js Docs**: https://tonejs.github.io/ - Documentación de Tone.js
- **MapLibre**: https://maplibre.org/ - Biblioteca de mapas open source

## 📄 Licencia

Este proyecto es de código abierto. Los archivos de audio tienen sus propias licencias según Xeno-canto (generalmente Creative Commons).

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Algunas ideas:

- Agregar más información de cada ave
- Mejorar los efectos de audio
- Añadir animaciones visuales
- Versión móvil optimizada
- Más especies por región

## 👤 Autor

Proyecto creado para visualizar la riqueza ornitológica de Chile de manera interactiva y accesible.

---

**¡Disfruta explorando las aves de Chile! 🇨🇱🐦**
