// Aves de Chile - Mapa Interactivo Simplificado
document.addEventListener('DOMContentLoaded', async function() {
    // Mapeo de regiones a aves - con nombres exactos del GeoJSON
    const REGIONES_AVES = {
        'Región de Arica y Parinacota': 'Flamenco Chileno',
        'Región de Tarapacá': 'Parina Grande',
        'Región de Antofagasta': 'Pilpilén',
        'Región de Atacama': 'Cóndor Andino',
        'Región de Coquimbo': 'Loica',
        'Región de Valparaíso': 'Diuca',
        'Región Metropolitana de Santiago': 'Chincol',
        "Región del Libertador Bernardo O'Higgins": 'Queltehue',
        'Región del Maule': 'Bandurria',
        'Región de Ñuble': 'Traro',
        'Región del Bío-Bío': 'Chucao',
        'Región de La Araucanía': 'Rayadito',
        'Región de Los Ríos': 'Huet-huet',
        'Región de Los Lagos': 'Martín Pescador',
        'Región de Aysén del Gral.Ibañez del Campo': 'Carpintero Negro',
        'Región de Magallanes y Antártica Chilena': 'Pingüino de Magallanes'
    };

    // Mapeo de nombres de aves a nombres de archivo
    const AVE_TO_FILE = {
        'Flamenco Chileno': 'flamenco_chileno.mp3',
        'Parina Grande': 'parina_grande.mp3',
        'Pilpilén': 'pilpilen.mp3',
        'Cóndor Andino': 'condor_andino.mp3',
        'Loica': 'loica.mp3',
        'Diuca': 'diuca.mp3',
        'Chincol': 'chincol.mp3',
        'Queltehue': 'queltehue.mp3',
        'Bandurria': 'bandurria.mp3',
        'Traro': 'traro.mp3',
        'Chucao': 'chucao.mp3',
        'Rayadito': 'rayadito.mp3',
        'Huet-huet': 'huet_huet.mp3',
        'Martín Pescador': 'martin_pescador.mp3',
        'Carpintero Negro': 'carpintero_negro.mp3',
        'Pingüino de Magallanes': 'pinguino_magallanes.mp3'
    };

    // Datos de especies
    let ESPECIES_DATA = {};
    let TOTAL_NACIONAL = 0;
    
    // Estado
    let currentRegion = null;
    let audioPlayers = {};
    let activePlayers = [];
    let audioReady = false;

    // Cargar datos de especies
    try {
        const response = await fetch('data/especies_xd.json');
        const data = await response.json();
        
        // Calcular total nacional (máximo de especies entre todas las regiones)
        TOTAL_NACIONAL = 14506;
        
        // Crear mapa de región -> cantidad de especies
        Object.keys(data.Region).forEach(key => {
            const region = data.Region[key];
            const cantidad = data.cantidad_especies_unicas[key];
            ESPECIES_DATA[region] = cantidad;
        });
        console.log('✓ Datos de especies cargados - Total nacional:', TOTAL_NACIONAL);
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
    }

    // Inicializar Tone.js (requiere interacción del usuario)
    async function initAudio() {
        if (!audioReady) {
            await Tone.start();
            audioReady = true;
            console.log('🔊 Audio activado');
        }
    }
    
    // Manejar popup de activación de audio
    const audioPopup = document.getElementById('audio-popup');
    const activateButton = document.getElementById('activate-audio');
    
    activateButton.addEventListener('click', async () => {
        await initAudio();
        audioPopup.classList.add('hidden');
        console.log('✅ Audio activado por el usuario');
    });

    // Precargar audio
    async function preloadAudio() {
        console.log('🎵 Cargando audios...');
        const loadPromises = [];
        
        for (const [region, ave] of Object.entries(REGIONES_AVES)) {
            const filename = AVE_TO_FILE[ave];
            
            if (!filename) {
                console.warn(`  ⚠️  No hay mapeo de archivo para: ${ave}`);
                continue;
            }
            
            const loadPromise = new Promise((resolve, reject) => {
                const player = new Tone.Player({
                    url: `sounds/${filename}`,
                    onload: () => {
                        console.log(`  ✓ ${ave} → ${filename}`);
                        resolve();
                    },
                    onerror: (error) => {
                        console.warn(`  ❌ ${ave}: ${error}`);
                        reject(error);
                    }
                }).toDestination();
                
                audioPlayers[region] = player;
            });
            
            loadPromises.push(loadPromise.catch(err => console.warn('Error cargando:', err)));
        }
        
        // Esperar a que todos los audios se carguen
        await Promise.all(loadPromises);
        console.log('✓ Audios precargados y listos');
    }

    // Reproducir bandada
    function playBirdFlock(regionName) {
        // Verificar que el audio esté activado
        if (!audioReady) {
            return;
        }

        const player = audioPlayers[regionName];
        if (!player) {
            console.warn(`❌ No hay player para: ${regionName}`);
            return;
        }
        if (!player.loaded) {
            return; // Silenciosamente esperar a que cargue
        }

        console.log(`🐦 Reproduciendo bandada: ${REGIONES_AVES[regionName]}`);
        stopAllBirds();

        // Crear bandada (3-5 aves)
        const flockSize = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < flockSize; i++) {
            const bird = new Tone.Player(player.buffer);
            const panner = new Tone.Panner((Math.random() * 2) - 1);
            const volume = new Tone.Volume(-8 + Math.random() * -8);
            
            bird.chain(panner, volume, Tone.Destination);
            bird.loop = true;
            bird.playbackRate = 0.85 + Math.random() * 0.3;

            setTimeout(() => {
                if (currentRegion === regionName) {
                    bird.start();
                    activePlayers.push(bird);
                }
            }, Math.random() * 1000);
        }
    }

    // Detener sonidos
    function stopAllBirds() {
        activePlayers.forEach(p => {
            if (p.state === 'started') p.stop();
            p.dispose();
        });
        activePlayers = [];
    }

    // Actualizar info
    function updateInfo(regionName, show = true) {
        const infoBox = document.getElementById('region-info');
        const birdNameEl = infoBox.querySelector('.bird-name');
        const regionNameEl = infoBox.querySelector('.region-name');
        
        if (show && REGIONES_AVES[regionName]) {
            const ave = REGIONES_AVES[regionName];
            // El nombre de la región ya viene completo del GeoJSON
            const cantidad = ESPECIES_DATA[regionName] || '?';
            
            birdNameEl.textContent = `Ave Característica: ${ave}`;
            regionNameEl.textContent = `${regionName} • ${cantidad} de ${TOTAL_NACIONAL} especies nacionales`;
            infoBox.classList.remove('hidden');
        } else {
            infoBox.classList.add('hidden');
        }
    }

    // Inicializar mapa
    const map = new maplibregl.Map({
        container: 'map',
        style: 'mapas/style.json',
        center: [0, 0],  // Centro temporal, se ajustará con fitBounds
        zoom: 1,  // Zoom temporal, se ajustará con fitBounds
        bearing: 90,  // Rotar 90 grados para orientación horizontal
        interactive: true,  // ¡IMPORTANTE: true para hover!
        attributionControl: false,
        antialias: true
    });
    
    // Deshabilitar navegación pero mantener hover
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.dragPan.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();

    map.on('load', async () => {
        console.log('🗺️  Mapa cargado');
        await preloadAudio();
        
        const response = await fetch('mapas/regiones_combinadas.geojson');
        const regiones = await response.json();
        
        // Asignar IDs y cantidad de especies a las features
        regiones.features.forEach((feature, index) => {
            if (!feature.id) {
                feature.id = index;
            }
            // Agregar cantidad de especies como propiedad
            const regionName = feature.properties.name || feature.properties.NAME || feature.properties.Region;
            const cantidad = ESPECIES_DATA[regionName] || 0;
            feature.properties.cantidad = cantidad;
            // Calcular porcentaje para colorear
            feature.properties.porcentaje = (cantidad / TOTAL_NACIONAL) * 100;
        });
        
        console.log('✓ Regiones cargadas:', regiones.features.length);
        
        // Calcular los límites usando solo Arica y Magallanes para centrado óptimo
        const bounds = new maplibregl.LngLatBounds();
        const regionesParaBounds = ['Región de Arica y Parinacota', 'Región de Magallanes y Antártica Chilena'];
        
        regiones.features.forEach(feature => {
            const regionName = feature.properties.name || feature.properties.NAME || feature.properties.Region;
            
            // Solo usar Arica y Magallanes para calcular bounds
            if (!regionesParaBounds.includes(regionName)) {
                return;
            }
            
            if (feature.geometry.type === 'Polygon') {
                feature.geometry.coordinates[0].forEach(coord => {
                    bounds.extend(coord);
                });
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    polygon[0].forEach(coord => {
                        bounds.extend(coord);
                    });
                });
            }
        });
        
        // Ajustar el mapa a los límites centrado y a tamaño completo
        // Con bearing: 90 (mapa horizontal), los ejes se intercambian:
        // - top/bottom padding afecta centrado en X
        // - left/right padding afecta centrado en Y
        map.fitBounds(bounds, {
            padding: {
                top: 80,     // Espacio para título y subtítulo
                bottom: 80,  // Espacio para info box
                left: 100,   // Margen izquierdo
                right: 100   // Margen derecho
            },
            bearing: 90,  // Mantener la rotación horizontal
            duration: 0,  // Sin animación
        });

        map.addSource('regiones', {
            type: 'geojson',
            data: regiones,
            generateId: true  // Generar IDs automáticamente
        });

        // Colorear regiones según cantidad de especies
        // Solo la región con más especies (Valparaíso: 4473) es roja
        // Solo la región con menos especies (Tarapacá: 737) es azul
        // El resto permanece gris
        map.addLayer({
            id: 'regiones-fill',
            type: 'fill',
            source: 'regiones',
            paint: {
                'fill-color': [
                    'case',
                    ['>=', ['get', 'cantidad'], 4473],  // Valparaíso (máximo)
                    '#c75a5a',  // Rojo suave
                    ['<=', ['get', 'cantidad'], 737],  // Tarapacá (mínimo)
                    '#5a8db8',  // Azul suave
                    '#c0c0c0'   // Gris para todas las demás
                ],
                'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0.7]
            }
        });

        // Agregar líneas de frontera entre regiones (solo sutiles bordes internos)
        map.addLayer({
            id: 'regiones-line',
            type: 'line',
            source: 'regiones',
            paint: {
                'line-color': '#ffffff',
                'line-width': 1,
                'line-opacity': 0.3
            }
        });

        let hoveredId = null;

        map.on('mousemove', 'regiones-fill', (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0];
                
                if (hoveredId !== null) {
                    map.setFeatureState({ source: 'regiones', id: hoveredId }, { hover: false });
                }

                hoveredId = feature.id;
                const regionName = feature.properties.name || feature.properties.NAME || feature.properties.Region;

                if (hoveredId !== undefined && hoveredId !== null) {
                    map.setFeatureState({ source: 'regiones', id: hoveredId }, { hover: true });
                }

                if (currentRegion !== regionName) {
                    if (REGIONES_AVES[regionName]) {
                        currentRegion = regionName;
                        updateInfo(regionName, true);
                        playBirdFlock(regionName);
                    }
                }

                map.getCanvas().style.cursor = 'pointer';
            }
        });

        map.on('mouseleave', 'regiones-fill', () => {
            if (hoveredId !== null && hoveredId !== undefined) {
                map.setFeatureState({ source: 'regiones', id: hoveredId }, { hover: false });
            }
            hoveredId = null;
            currentRegion = null;
            updateInfo(null, false);
            stopAllBirds();
            map.getCanvas().style.cursor = '';
        });

        console.log('✅ TODO LISTO');
        console.log('💡 HAZ CLIC en la página para activar audio');
        console.log('🖱️  Luego pasa el cursor sobre las regiones');
    });

    window.chileMap = map;
});
