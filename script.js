// Configuración del mapa de distribución de aves de Chile
document.addEventListener('DOMContentLoaded', async function () {
    const PREFIX = '/P1';
    // Modal para activar audio
    function createAudioModal() {
        if (document.getElementById('audio-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'audio-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.45)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <div style="background: #fff; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.18); padding: 2.2rem 2.5rem; max-width: 350px; text-align: center;">
                <h2 style="font-size: 1.3rem; margin-bottom: 1rem; color: #10b981;">🔊 Activar audio</h2>
                <p style="font-size: 1rem; color: #222; margin-bottom: 1.2rem;">Para escuchar los cantos de aves, es necesario habilitar el audio.<br><br><strong>Haz clic en el botón para activar el audio.</strong></p>
                <button id="audio-modal-btn" style="background: #10b981; color: #fff; border: none; border-radius: 6px; padding: 0.7rem 1.5rem; font-size: 1.1rem; cursor: pointer; font-weight: 600;">Activar audio</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('audio-modal-btn').onclick = async function() {
            if (window.Tone) {
                try {
                    await Tone.start();
                    audioContextStarted = true;
                    if (audioStatusElement) {
                        updateAudioStatusText();
                    }
                } catch (e) {
                    if (audioStatusElement) {
                        audioStatusElement.textContent = 'No fue posible habilitar el audio en el navegador.';
                    }
                }
            }
            modal.remove();
            // refrescar estado
            updateAudioStatusText();
        };
    }
    const CHILE_CENTER = [-71.2, -39.5];
    const CHILE_ZOOM = 2.8;
    const CHILE_BOUNDS = [
        [-76.0, -56.0],
        [-66.5, -17.5]
    ];
    const ZONE_GROUPS = {
        Norte: [
            'Región de Arica y Parinacota',
            'Región de Tarapacá',
            'Región de Antofagasta',
            'Región de Atacama',
            'Región de Coquimbo'
        ],
        Centro: [
            'Región de Valparaíso',
            'Región Metropolitana de Santiago',
            "Región del Libertador Bernardo O'Higgins",
            'Región del Maule',
            'Región de Ñuble',
            'Región del Bío-Bío'
        ],
        Sur: [
            'Región de La Araucanía',
            'Región de Los Ríos',
            'Región de Los Lagos',
            'Región de Aysén del Gral.Ibañez del Campo',
            'Región de Magallanes y Antártica Chilena'
        ]
    };
    const ZONE_ORDER = ['Norte', 'Centro', 'Sur'];
    const ZONE_COLORS = {
        Norte: '#f97316',
        Centro: '#3b82f6',
        Sur: '#10b981'
    };
    const EMPTY_FILTER_VALUE = '__none__';
    const ZONE_TYPICAL_BIRDS = {
        Norte: [
            {
                name: 'Phoenicoparrus jamesi - Puna flamingo',
                audio: PREFIX + '/audio/flamingo.mp3'
            }
        ],
        Centro: [
            {
                name: 'Himantopus mexicanus - White-backed stilt',
                audio: PREFIX + '/audio/perrito.mp3'
            },
        ],
        Sur: [
            {
                name: 'Scelorchilus rubecula - Chucao tapaculo',
                audio: PREFIX + '/audio/chucao.mp3'
            },
        ]
    };

    let birdDataByRegion = new Map();
    let zoneTotals = [];
    let zonePlayers = new Map();
    let currentZonePlaying = null;
    let audioReady = false;
    let audioContextStarted = false;
    let audioUnlockRegistered = false;
    let audioStatusElement = null;
    let pendingZoneToPlay = null;
    let currentZoneInfo = null;
    let currentTimeouts = [];
    let lastHoveredZone = null;

    // Mantener referencia actualizada al elemento de estado de audio
    function refreshAudioStatusElement() {
        audioStatusElement = document.getElementById('audio-status');
    }

    function updateAudioStatusText() {
        refreshAudioStatusElement();
        if (!audioStatusElement) return;
        if (!window.Tone) {
            audioStatusElement.textContent = 'ToneJS no está disponible en esta página.';
            return;
        }
        if (audioContextStarted && audioReady) {
            audioStatusElement.textContent = 'Audio habilitado. Pasa el cursor por una zona para escuchar sus aves características.';
            return;
        }
        if (audioContextStarted && !audioReady) {
            audioStatusElement.textContent = 'Audio habilitado. Cargando cantos...';
            return;
        }
        if (!audioContextStarted && audioReady) {
            audioStatusElement.textContent = 'Cantos cargados. Usa "Activar audio" si no se inicia automáticamente al pasar el cursor.';
            return;
        }
        audioStatusElement.textContent = 'Cargando cantos...';
    }

    const birdRaw = await loadBirdData();
    if (!birdRaw) {
        return;
    }

    birdDataByRegion = buildBirdRecords(birdRaw);
    zoneTotals = computeZoneTotals(birdDataByRegion);

    const map = createMap();

    updateContextInfo(zoneTotals);

    map.on('load', async () => {
        await cargarVisualizacion(map, birdDataByRegion);
        attachMapInteractions(map);
    });

    map.on('error', (event) => {
        console.error('Error en el mapa:', event);
    });

    window.chileMap = map;

    setupAudioControls();
    
    // Mostrar modal de audio al inicio siempre
    createAudioModal();

    async function loadBirdData() {
        try {
            const response = await fetch(PREFIX + '/data/especies_xd.json');
            if (!response.ok) {
                throw new Error('No se pudo cargar especies_xd.json');
            }
            return await response.json();
        } catch (error) {
            console.error('Error al cargar datos de aves:', error);
            const status = document.getElementById('context-primary');
            if (status) {
                status.textContent = 'No fue posible cargar los datos de aves. Intenta nuevamente más tarde.';
            }
            return null;
        }
    }

    function buildBirdRecords(rawData) {
        const records = new Map();
        Object.keys(rawData.Region).forEach((key) => {
            const name = rawData.Region[key];
            if (!name || name === 'Zona sin demarcar') {
                return;
            }
            records.set(name.trim(), {
                name: name.trim(),
                species: Number(rawData.cantidad_especies_unicas[key]) || 0,
                percentage: Number(rawData.porcentaje_especies[key]) || 0
            });
        });
        return records;
    }

    function computeZoneTotals(birdMap) {
        return ZONE_ORDER.map((zone) => {
            const regionNames = ZONE_GROUPS[zone];
            let totalSpecies = 0;
            let totalPercentage = 0;
            const breakdown = [];
            const typicalBirds = ZONE_TYPICAL_BIRDS[zone] || [];

            regionNames.forEach((regionName) => {
                const record = birdMap.get(regionName);
                if (record) {
                    totalSpecies += record.species;
                    totalPercentage += record.percentage;
                    breakdown.push({ ...record });
                } else {
                    console.warn(`No se encontraron datos de aves para ${regionName}`);
                }
            });

            breakdown.sort((a, b) => b.percentage - a.percentage);

            return {
                zone,
                totalSpecies,
                totalPercentage,
                breakdown,
                topRegion: breakdown[0]?.name || null,
                regionCount: breakdown.length,
                typicalBirds
            };
        });
    }

    function createMap() {
        const mapInstance = new maplibregl.Map({
            container: 'map',
            style: PREFIX + '/mapas/style.json',
            center: CHILE_CENTER,
            zoom: CHILE_ZOOM,
            minZoom: 1.5,
            maxZoom: 12,
            attributionControl: false,
            interactive: false,
            pitch: 0,
            bearing: 0,
            antialias: true
        });

        mapInstance.boxZoom.disable();
        mapInstance.scrollZoom.disable();
        mapInstance.dragPan.disable();
        mapInstance.dragRotate.disable();
        mapInstance.keyboard.disable();
        mapInstance.doubleClickZoom.disable();
        mapInstance.touchZoomRotate.disable();

        mapInstance.fitBounds(CHILE_BOUNDS, {
            padding: { top: 30, bottom: 30, left: 30, right: 30 },
            maxZoom: 3.5
        });

        return mapInstance;
    }

    async function cargarVisualizacion(mapInstance, birdMap) {
        try {
            const response = await fetch(PREFIX + '/mapas/regiones_combinadas.geojson');
            if (!response.ok) {
                throw new Error('No se pudo cargar regiones_combinadas.geojson');
            }

            const geojson = await response.json();
            const enrichedFeatures = geojson.features
                .map((feature) => enriquecerRegion(feature, birdMap))
                .filter(Boolean);

            mapInstance.addSource('aves-zonas', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: enrichedFeatures
                }
            });

            const zoneColorExpression = [
                'match',
                ['get', 'zone'],
                'Norte', ZONE_COLORS.Norte,
                'Centro', ZONE_COLORS.Centro,
                'Sur', ZONE_COLORS.Sur,
                '#d1d5db'
            ];

            mapInstance.addLayer({
                id: 'aves-zonas-fill',
                type: 'fill',
                source: 'aves-zonas',
                paint: {
                    'fill-color': zoneColorExpression,
                    'fill-opacity': 0.35
                }
            });

            mapInstance.addLayer({
                id: 'aves-zonas-highlight-fill',
                type: 'fill',
                source: 'aves-zonas',
                paint: {
                    'fill-color': zoneColorExpression,
                    'fill-opacity': 0.7
                },
                filter: ['==', ['get', 'zone'], EMPTY_FILTER_VALUE]
            });

            mapInstance.addLayer({
                id: 'aves-zonas-outline',
                type: 'line',
                source: 'aves-zonas',
                paint: {
                    'line-color': '#0f172a',
                    'line-width': 0.6,
                    'line-opacity': 0.5
                }
            });

            mapInstance.addLayer({
                id: 'aves-zonas-highlight-line',
                type: 'line',
                source: 'aves-zonas',
                paint: {
                    'line-color': '#0f172a',
                    'line-width': 2.2
                },
                filter: ['==', ['get', 'zone'], EMPTY_FILTER_VALUE]
            });
        } catch (error) {
            console.error('Error al cargar la visualización:', error);
        }
    }

    function enriquecerRegion(feature, birdMap) {
        const properties = feature.properties || {};
        const regionName = (properties.Region || properties.name || properties.NAME || '').trim();
        if (!regionName) {
            return null;
        }

        const zone = findZoneForRegion(regionName);
        if (!zone) {
            console.warn(`La región ${regionName} no está asociada a una zona`);
            return null;
        }

        const record = birdMap.get(regionName);
        feature.properties = {
            ...properties,
            zone,
            regionName,
            species: record?.species ?? 0,
            percentage: record?.percentage ?? 0
        };

        return feature;
    }

    function findZoneForRegion(regionName) {
        return ZONE_ORDER.find((zone) => ZONE_GROUPS[zone].includes(regionName)) || null;
    }

    function attachMapInteractions(mapInstance) {
        // Hover para mostrar información de la zona (seguimiento continuo)
        mapInstance.on('mousemove', 'aves-zonas-fill', (e) => {
            const zone = e.features?.[0]?.properties?.zone;
            if (!zone) {
                return;
            }
            if (zone !== lastHoveredZone) {
                lastHoveredZone = zone;
                showZoneInfo(zone);
                setZoneHighlight(zone);
                playZoneBird(zone).catch((error) => {
                    console.error('No se pudo reproducir el canto de la zona:', error);
                });
            }
        });

        mapInstance.on('mouseleave', 'aves-zonas-fill', () => {
            hideZoneInfo();
            clearZoneHighlight();
            stopCurrentBird();
            lastHoveredZone = null;
        });

        // Cambiar cursor al pasar sobre las zonas
        mapInstance.on('mouseenter', 'aves-zonas-fill', () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', 'aves-zonas-fill', () => {
            mapInstance.getCanvas().style.cursor = '';
        });
    }

    function showZoneInfo(zoneName) {
        const zoneData = zoneTotals.find(z => z.zone === zoneName);
        if (!zoneData) return;

        const zoneInfoContent = document.getElementById('zone-info-content');
        if (!zoneInfoContent) return;

        // Ocultar el context-info cuando se hace hover
        const contextInfo = document.querySelector('.context-info');
        if (contextInfo) {
            contextInfo.style.display = 'none';
        }

        const topBreakdown = zoneData.breakdown[0];
        const topDetail = topBreakdown
            ? `Mayor aporte: ${topBreakdown.name} (${topBreakdown.percentage.toFixed(1)}%)`
            : 'Sin datos detallados para esta zona';

        const birdsList = zoneData.typicalBirds.map(bird => 
            `<li class="zone-bird-item">${bird.name}</li>`
        ).join('');

        const zoneColor = ZONE_COLORS[zoneData.zone] || '#10b981';
        const zoneColorRgb = hexToRgb(zoneColor);
        
        zoneInfoContent.innerHTML = `
            <div class="zone-info-active">
                <div class="zone-name" style="color: ${zoneColor};">Zona ${zoneData.zone}</div>
                <div class="zone-percentage" style="color: ${zoneColor};">${zoneData.totalPercentage.toFixed(1)}%</div>
                <div class="zone-species" style="background: rgba(${zoneColorRgb.r}, ${zoneColorRgb.g}, ${zoneColorRgb.b}, 0.1); border-color: rgba(${zoneColorRgb.r}, ${zoneColorRgb.g}, ${zoneColorRgb.b}, 0.2);">${zoneData.totalSpecies.toLocaleString('es-CL')} especies de aves registradas</div>
                <div class="zone-detail">${topDetail}</div>
                <div class="zone-birds">
                    <div class="zone-birds-title">Aves características:</div>
                    <ul class="zone-bird-list">${birdsList}</ul>
                </div>
                <div class="audio-info" style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(${zoneColorRgb.r}, ${zoneColorRgb.g}, ${zoneColorRgb.b}, 0.1); border-radius: 8px; border: 1px solid rgba(${zoneColorRgb.r}, ${zoneColorRgb.g}, ${zoneColorRgb.b}, 0.2);">
                    <p style="font-size: 0.8rem; color: rgba(26, 26, 26, 0.8); margin: 0; text-align: center; font-weight: 500;">🎶 Escuchando cantos de aves características</p>
                    <p id="audio-status" style="font-size: 0.75rem; color: rgba(26, 26, 26, 0.6); margin: 0.5rem 0 0 0; text-align: center;">Cargando cantos...</p>
                </div>
            </div>
        `;

        currentZoneInfo = zoneName;
        // actualizar referencia y texto de estado de audio si existe
        updateAudioStatusText();
    }

    function hideZoneInfo() {
        const zoneInfoContent = document.getElementById('zone-info-content');
        if (!zoneInfoContent) return;

        // Mostrar el context-info cuando se quita el hover
        const contextInfo = document.querySelector('.context-info');
        if (contextInfo) {
            contextInfo.style.display = 'block';
        }

        zoneInfoContent.innerHTML = `
            <div class="zone-info-placeholder">
                <h3 style="font-size: 1.2rem; margin-bottom: 0.75rem; color: #1a1a1a;">🎯 Cómo usar esta infografía</h3>
                <p style="margin-bottom: 0.75rem; font-size: 0.9rem;">Pasa el cursor sobre las zonas del mapa para:</p>
                <ul style="text-align: left; max-width: 350px; margin: 0 auto;">
                    <li style="margin-bottom: 0.4rem; font-size: 0.85rem;">📊 Ver estadísticas de biodiversidad</li>
                    <li style="margin-bottom: 0.4rem; font-size: 0.85rem;">🎵 Escuchar cantos de aves características</li>
                    <li style="margin-bottom: 0.4rem; font-size: 0.85rem;">🔊 El volumen indica el ranking de especies</li>
                    <li style="margin-bottom: 0.4rem; font-size: 0.85rem;">🐦 Conocer las 3 aves típicas por zona</li>
                </ul>
                <div class="audio-info" style="margin-top: 1rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
                    <p style="font-size: 0.8rem; color: rgba(26, 26, 26, 0.8); margin: 0; text-align: center; font-weight: 500;">🎶 Pasa el cursor por una zona para escuchar las aves características</p>
                    <p id="audio-status" style="font-size: 0.75rem; color: rgba(26, 26, 26, 0.6); margin: 0.5rem 0 0 0; text-align: center;">Cargando cantos...</p>
                </div>
            </div>
        `;

        currentZoneInfo = null;
        // actualizar referencia y texto de estado de audio si existe
        updateAudioStatusText();
    }

    function setZoneHighlight(zoneName) {
        if (!map.getLayer('aves-zonas-highlight-fill') || !map.getLayer('aves-zonas-highlight-line')) {
            return;
        }
        const target = zoneName || EMPTY_FILTER_VALUE;
        map.setFilter('aves-zonas-highlight-fill', ['==', ['get', 'zone'], target]);
        map.setFilter('aves-zonas-highlight-line', ['==', ['get', 'zone'], target]);
    }

    function clearZoneHighlight() {
        setZoneHighlight(null);
    }

    function updateContextInfo(data) {
        const primary = document.getElementById('context-primary');
        const secondary = document.getElementById('context-secondary');
        if (!primary || !secondary || data.length === 0) {
            return;
        }

        const sorted = [...data].sort((a, b) => b.totalPercentage - a.totalPercentage);
        const topZone = sorted[0];
        const bottomZone = sorted[sorted.length - 1];
        const topBreakdown = topZone.breakdown[0];

        primary.innerHTML = `🏆 <strong>Zona ${topZone.zone}</strong> concentra el ${topZone.totalPercentage.toFixed(1)}% de las especies de aves (${topZone.totalSpecies.toLocaleString('es-CL')} especies registradas).`;

        const bottomText = bottomZone && bottomZone.zone !== topZone.zone
            ? ` La zona con menor proporción es ${bottomZone.zone} (${bottomZone.totalPercentage.toFixed(1)}%).`
            : '';

        if (topBreakdown) {
            const birdsInfo = ZONE_ORDER.map((zone) => {
                const birds = ZONE_TYPICAL_BIRDS[zone] || [];
                const firstBird = birds[0]?.name || 'sin definir';
                return `${zone}: ${firstBird}`;
            }).join(' · ');
            secondary.innerHTML = `📍 Mayor aporte regional: <strong>${topBreakdown.name}</strong> con el ${topBreakdown.percentage.toFixed(1)}% del total nacional de aves. Ave típica por zona: ${birdsInfo}.${bottomText}`;
        } else {
            const birdsInfo = ZONE_ORDER.map((zone) => {
                const birds = ZONE_TYPICAL_BIRDS[zone] || [];
                const firstBird = birds[0]?.name || 'sin definir';
                return `${zone}: ${firstBird}`;
            }).join(' · ');
            secondary.textContent = `📍 Sin desglose regional disponible. Ave típica por zona: ${birdsInfo}.${bottomText}`;
        }
    }

    function setupAudioControls() {
        const audioStatus = document.getElementById('audio-status');
        audioStatusElement = audioStatus;

        if (!audioStatus) {
            console.warn('Elemento de estado de audio no encontrado en el DOM.');
            return;
        }

        if (!window.Tone) {
            audioStatus.textContent = 'ToneJS no está disponible en esta página.';
            return;
        }

        let hasConfiguredAudio = false;
        const loadPromises = Object.entries(ZONE_TYPICAL_BIRDS).map(([zone, birds]) => new Promise((resolve) => {
            if (!birds || birds.length === 0) {
                console.info(`Sin aves definidas para la zona ${zone}.`);
                zonePlayers.set(zone, []);
                return resolve();
            }

            hasConfiguredAudio = true;
            const players = birds.map(bird => {
                if (!bird.audio) {
                    console.info(`Sin ruta de audio definida para ${bird.name}.`);
                    return null;
                }

                const player = new Tone.Player({
                    url: bird.audio,
                    autostart: false,
                    onload: () => {},
                    onerror: (error) => {
                        console.error(`No se pudo cargar el canto de ${bird.name}`, error);
                    }
                });
                player.loop = true;
                player.fadeIn = 0.3;
                player.fadeOut = 0.3;
                return player;
            }).filter(Boolean);

            zonePlayers.set(zone, players);
            resolve();
        }));

        Promise.all(loadPromises).then(() => {
            if (!hasConfiguredAudio) {
                audioStatus.textContent = 'Define las rutas de audio en ZONE_TYPICAL_BIRDS para habilitar la reproducción por zona.';
                return;
            }

            audioReady = true;
            
            // Intentar activar el audio automáticamente
            const tryAutoStart = async () => {
                try {
                    await Tone.start();
                    audioContextStarted = true;
                    audioStatus.textContent = 'Cantos listos. Pasa el cursor por una zona para escuchar sus aves características.';
                    if (pendingZoneToPlay) {
                        const zoneToResume = pendingZoneToPlay;
                        pendingZoneToPlay = null;
                        playZoneBird(zoneToResume).catch((error) => {
                            console.error('No se pudo iniciar el canto tras cargar los audios:', error);
                        });
                    }
                } catch (error) {
                    console.log('No se pudo activar el audio automáticamente, se requiere interacción del usuario');
                    audioStatus.textContent = 'Cantos listos. Realiza un clic, toque o presiona una tecla una vez para habilitar el audio y luego pasa el cursor por una zona.';
                    registerAudioContextUnlock();
                }
            };
            
            tryAutoStart();
            // actualizar estado visual del audio
            updateAudioStatusText();
        });
    }

    async function playZoneBird(zone) {
        if (!audioReady) {
            pendingZoneToPlay = zone;
            if (audioStatusElement) {
                audioStatusElement.textContent = 'Aún se están cargando los cantos...';
            }
            return;
        }
        if (!audioContextStarted) {
            // Intentar activar el audio automáticamente
            try {
                await Tone.start();
                audioContextStarted = true;
                if (audioStatusElement) {
                    updateAudioStatusText();
                }
            } catch (error) {
                console.log('No se pudo activar el audio automáticamente, se requiere interacción del usuario');
                pendingZoneToPlay = zone;
                if (audioStatusElement) {
                    updateAudioStatusText();
                }
                registerAudioContextUnlock();
                createAudioModal();
                return;
            }
        }
        // Si ya estamos reproduciendo la misma zona, no hacer nada
        if (currentZonePlaying === zone) {
            pendingZoneToPlay = null;
            return;
        }

        // Detener la zona actual si hay una reproduciéndose
        stopCurrentBird();

        const players = zonePlayers.get(zone);
        if (!players || players.length === 0) {
            if (audioStatusElement) {
                audioStatusElement.textContent = `La zona ${zone} no tiene audio configurado. Define la ruta en ZONE_TYPICAL_BIRDS.`;
            }
            return;
        }

        // Calcular el volumen basado en el ranking de especies (menor a mayor)
        const zoneData = zoneTotals.find(z => z.zone === zone);
        
        // Ordenar zonas por cantidad de especies para determinar ranking
        const sortedZones = [...zoneTotals].sort((a, b) => a.totalSpecies - b.totalSpecies);
        const zoneRank = sortedZones.findIndex(z => z.zone === zone);
        
        // Asignar volumen según posición: 1ra (menos especies) = 20%, 2da = 50%, 3ra (más especies) = 100%
        const volumeLevels = [0.1, 0.4, 1.0];
        const volumePercentage = volumeLevels[zoneRank] || 0.2;

        pendingZoneToPlay = null;
        
        // Limpiar timeouts anteriores
        currentTimeouts.forEach(timeout => clearTimeout(timeout));
        currentTimeouts = [];
        
        // Reproducir todos los sonidos de la zona con el volumen basado en el porcentaje
        players.forEach((player, index) => {
            if (player) {
                // Crear un gain individual para cada player
                const gainNode = new Tone.Gain(volumePercentage).toDestination();
                player.disconnect();
                player.connect(gainNode);
                
                // Agregar un pequeño delay entre los sonidos para crear un efecto de coro
                const delay = index * 0.5; // 0.5 segundos entre cada sonido
                const timeout = setTimeout(() => {
                    player.start();
                }, delay * 1000);
                currentTimeouts.push(timeout);
            }
        });

        currentZonePlaying = zone;
        if (audioStatusElement) {
            const birds = ZONE_TYPICAL_BIRDS[zone] || [];
            const birdNames = birds.map(b => b.name).join(', ');
            audioStatusElement.textContent = `Reproduciendo cantos de ${birdNames} (zona ${zone}) - Volumen: ${Math.round(volumePercentage * 100)}%`;
        }
    }

    function stopCurrentBird() {
        if (!currentZonePlaying) {
            return;
        }

        // Limpiar todos los timeouts pendientes
        currentTimeouts.forEach(timeout => clearTimeout(timeout));
        currentTimeouts = [];

        const players = zonePlayers.get(currentZonePlaying);
        if (players && players.length > 0) {
            players.forEach(player => {
                if (player && player.state === 'started') {
                    player.stop();
                }
            });
        }
        currentZonePlaying = null;
        pendingZoneToPlay = null;
        // actualizar estado visual
        updateAudioStatusText();
    }

    function hexToRgb(hex) {
        const sanitized = hex.replace('#', '');
        const bigint = parseInt(sanitized, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }


    function registerAudioContextUnlock() {
        if (audioUnlockRegistered || audioContextStarted || !window.Tone) {
            return;
        }
        audioUnlockRegistered = true;

        const attemptUnlock = async () => {
            if (audioContextStarted) {
                cleanup();
                return;
            }
            try {
                await Tone.start();
                audioContextStarted = true;
                if (audioStatusElement) {
                    audioStatusElement.textContent = 'Audio habilitado. Pasa el cursor por una zona para escuchar sus aves características.';
                }
                const zoneToResume = pendingZoneToPlay;
                if (zoneToResume) {
                    pendingZoneToPlay = null;
                    playZoneBird(zoneToResume).catch((error) => {
                        console.error('No se pudo reanudar el canto tras habilitar el audio:', error);
                    });
                }
                removeAudioModal();
            } catch (error) {
                console.error('No se pudo habilitar el audio tras la interacción del usuario:', error);
                if (audioStatusElement) {
                    audioStatusElement.textContent = 'No fue posible habilitar el audio en el navegador.';
                }
                audioUnlockRegistered = false;
                return;
            }
            cleanup();
        };

        const cleanup = () => {
            document.removeEventListener('pointerdown', attemptUnlock);
            document.removeEventListener('touchstart', attemptUnlock);
            document.removeEventListener('keydown', attemptUnlock);
            document.removeEventListener('pointermove', attemptUnlock);
            document.removeEventListener('mousemove', attemptUnlock);
        };

        document.addEventListener('pointerdown', attemptUnlock, { passive: true });
        document.addEventListener('touchstart', attemptUnlock, { passive: true });
        document.addEventListener('keydown', attemptUnlock);
        document.addEventListener('pointermove', attemptUnlock, { passive: true });
            document.addEventListener('mousemove', attemptUnlock, { passive: true });

            // Mostrar modal para guiar al usuario si aún no ha activado el audio
            createAudioModal();
    }

    function removeAudioModal() {
        const modal = document.getElementById('audio-modal');
        if (modal) modal.remove();
    }

});