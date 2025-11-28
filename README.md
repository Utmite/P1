# 🐦 Aves de Chile - Mapa Interactivo

## 👥 Nombres

1. Vicente Muñoz
2. Cristobal Soto
3. Pilar Valloton

Visualización interactiva minimalista de las aves representativas de cada región de Chile. Al pasar el cursor sobre una región, se reproduce el canto de su ave característica con un efecto de "bandada" usando múltiples instancias de audio simultáneas.

## 🎮 Modos de Interacción

### 1. **Mapa Interactivo** (`index.html`)

Pasa el cursor sobre las regiones del mapa para escuchar los cantos de las aves.

### 2. **Control por Manos** (`hand-control.html`) 🆕

¡Nueva funcionalidad! Usa tu cámara web y gestos con las manos para recorrer Chile:

- **Acerca tu mano** a la cámara → Escucha las aves del **norte** (Arica y Parinacota)
- **Aleja tu mano** de la cámara → Escucha las aves del **sur** (Magallanes)
- El sistema detecta automáticamente la distancia de tu mano y reproduce el sonido de la región correspondiente

**Tecnologías usadas:** MediaPipe Hands + Tone.js

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

## 🌐 Página

[🔗 Ver sitio publicado en GitHub Pages](https://utmite.github.io/P1/)

## 🚀 Cómo Usar

### Mapa Interactivo

1. Abre `index.html` en tu navegador
2. Haz clic en "Activar Audio"
3. Pasa el cursor sobre las regiones del mapa

### Control por Manos

1. Abre `hand-control.html` en tu navegador
2. Haz clic en "Iniciar Cámara y Audio"
3. Permite el acceso a tu cámara web
4. Muestra tu mano a la cámara:
   - **Mano cerca** (mano grande en la pantalla) = **Arica** (norte)
   - **Mano lejos** (mano pequeña en la pantalla) = **Magallanes** (sur)
5. El sistema detecta automáticamente la posición y reproduce el sonido

**Nota:** Necesitas tener los archivos MP3 de los sonidos en la carpeta `sounds/` (ver `sounds/README.md`)

## 📚 Documentación

- 📖 **[QUICKSTART.md](QUICKSTART.md)** - Inicio rápido en 3 pasos
- 📖 **[HAND_CONTROL.md](HAND_CONTROL.md)** - Guía completa del control por manos
- 📖 **[sounds/README.md](sounds/README.md)** - Información sobre archivos de audio

## 🛠️ Servidor de Prueba

Para probar localmente con un servidor HTTP:

```bash
python test-server.py
```

Luego abre:

- Mapa: http://localhost:8000/index.html
- Control por manos: http://localhost:8000/hand-control.html

## Citas

El código fue desarrollado con la asistencia de Microsoft Copilot (GPT-5 mini; Microsoft, 2025).

Microsoft. (2025). Copilot (GPT-5 mini) [Large language model]. https://copilot.microsoft.com/
