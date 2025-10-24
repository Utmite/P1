# 🎵 Archivos de Audio de Aves de Chile

Esta carpeta debe contener los archivos MP3 de los cantos de aves para cada región de Chile.

## 📋 Archivos Necesarios

Coloca los siguientes archivos MP3 en esta carpeta:

| Región               | Ave                    | Nombre de Archivo         | Fuente                                                                   |
| -------------------- | ---------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Arica y Parinacota   | Flamenco Chileno       | `flamenco_chileno.mp3`    | [Descargar](https://www.xeno-canto.org/species/Phoenicopterus-chilensis) |
| Tarapacá             | Parina Grande          | `parina_grande.mp3`       | [Descargar](https://www.xeno-canto.org/species/Phoenicoparrus-andinus)   |
| Antofagasta          | Pilpilén               | `pilpilen.mp3`            | [Descargar](https://www.xeno-canto.org/species/Haematopus-palliatus)     |
| Atacama              | Cóndor Andino          | `condor_andino.mp3`       | [Descargar](https://www.xeno-canto.org/species/Vultur-gryphus)           |
| Coquimbo             | Loica                  | `loica.mp3`               | [Descargar](https://www.xeno-canto.org/species/Leistes-loyca)            |
| Valparaíso           | Diuca                  | `diuca.mp3`               | [Descargar](https://www.xeno-canto.org/species/Diuca-diuca)              |
| Región Metropolitana | Chincol                | `chincol.mp3`             | [Descargar](https://www.xeno-canto.org/species/Zonotrichia-capensis)     |
| O'Higgins            | Queltehue              | `queltehue.mp3`           | [Descargar](https://www.xeno-canto.org/species/Vanellus-chilensis)       |
| Maule                | Bandurria              | `bandurria.mp3`           | [Descargar](https://www.xeno-canto.org/species/Theristicus-melanopis)    |
| Ñuble                | Traro                  | `traro.mp3`               | [Descargar](https://www.xeno-canto.org/species/Caracara-plancus)         |
| Biobío               | Chucao                 | `chucao.mp3`              | [Descargar](https://www.xeno-canto.org/species/Scelorchilus-rubecula)    |
| Araucanía            | Rayadito               | `rayadito.mp3`            | [Descargar](https://www.xeno-canto.org/species/Aphrastura-spinicauda)    |
| Los Ríos             | Huet-huet              | `huet_huet.mp3`           | [Descargar](https://www.xeno-canto.org/species/Pteroptochos-tarnii)      |
| Los Lagos            | Martín Pescador        | `martin_pescador.mp3`     | [Descargar](https://www.xeno-canto.org/species/Megaceryle-torquata)      |
| Aysén                | Carpintero Negro       | `carpintero_negro.mp3`    | [Descargar](https://www.xeno-canto.org/species/Campephilus-magellanicus) |
| Magallanes           | Pingüino de Magallanes | `pinguino_magallanes.mp3` | [Descargar](https://www.xeno-canto.org/species/Spheniscus-magellanicus)  |

## 🔍 Cómo Descargar

### Opción 1: Xeno-canto (Recomendado)

1. Haz clic en el enlace de "Descargar" de cada ave
2. Elige una grabación de buena calidad (Calidad A o B)
3. Filtra por país "Chile" para grabaciones locales
4. Haz clic en el botón de descarga ⬇️
5. Renombra el archivo según la tabla de arriba
6. Coloca el archivo en esta carpeta

### Opción 2: Script de Descarga Automática (Próximamente)

```bash
# Ejecutar desde la raíz del proyecto
python download_sounds.py
```

## ⚙️ Especificaciones Técnicas

- **Formato:** MP3
- **Calidad recomendada:** 128-320 kbps
- **Duración:** 5-30 segundos (lo suficiente para loop)
- **Limpieza:** Preferible sin ruido de fondo excesivo

## 🎨 Características del Sistema de Audio

El sistema usa **Tone.js** para crear un efecto de "bandada":

- **3-6 instancias** del mismo sonido se reproducen simultáneamente
- Cada instancia tiene:
  - **Variación de tono** (pitch): 0.9x a 1.2x
  - **Panning espacial**: distribuido entre izquierda y derecha
  - **Volumen variable**: -15dB a -5dB
  - **Delay de inicio**: 0-1.5 segundos
  - **Loop continuo** mientras el cursor está sobre la región

## 📱 Testing

Para verificar que los archivos funcionan:

1. Coloca al menos un archivo de prueba
2. Abre `index.html` en el navegador
3. Pasa el cursor sobre la región correspondiente
4. Deberías escuchar el sonido con efecto de bandada

## 🐛 Troubleshooting

**No se escucha audio:**

- Verifica que los archivos estén en formato MP3
- Asegúrate de que los nombres coincidan exactamente con la tabla
- Revisa la consola del navegador (F12) para errores
- Algunos navegadores requieren interacción del usuario antes de reproducir audio

**Audio se corta o suena mal:**

- Usa archivos de mejor calidad (≥192 kbps)
- Evita archivos con ruido de fondo excesivo
- La duración ideal es 5-15 segundos

## 📚 Recursos Adicionales

- **Xeno-canto:** https://www.xeno-canto.org/
- **AvesChile:** https://avesdechile.cl/
- **Merlin Bird ID:** App móvil para identificación de aves
- **BirdNET:** App móvil para identificar cantos en tiempo real

---

**Nota:** Los archivos de audio NO están incluidos en el repositorio por derechos de autor. Debes descargarlos individualmente desde las fuentes indicadas.
