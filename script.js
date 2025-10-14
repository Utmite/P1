// Configuración del mapa de distribución de aves de Chile
document.addEventListener('DOMContentLoaded', async function () {
    const PREFIX = '/P1/';
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
        Norte: {
            name: 'Phoenicoparrus jamesi - Puna flamingo',
            audio: PREFIX + '/audio/flamingo.mp3'
        },
        Centro: {
            name: 'Himantopus mexicanus - White-backed stilt',
            audio: PREFIX + '/audio/perrito.mp3'
        },
        Sur: {
            name: 'Scelorchilus rubecula - Chucao tapaculo',
            audio: PREFIX + '/audio/chucao.mp3'
        }
    };

    let birdDataByRegion = new Map();
    let zoneTotals = [];
    let audioGain = null;
    let zonePlayers = new Map();
    let currentZonePlaying = null;
    let audioReady = false;
    let audioContextStarted = false;
    let audioStatusElement = null;

    const birdRaw = await loadBirdData();
    if (!birdRaw) {
        return;
    }

    birdDataByRegion = buildBirdRecords(birdRaw);
    zoneTotals = computeZoneTotals(birdDataByRegion);

    const map = createMap();

    renderZoneStats(zoneTotals);
    styleZoneCards();
    attachZoneCardInteractions();
    updateContextInfo(zoneTotals);

    map.on('load', async () => {
        await cargarVisualizacion(map, birdDataByRegion);
        attachZoneCardInteractions();
    });

    map.on('error', (event) => {
        console.error('Error en el mapa:', event);
    });

    window.chileMap = map;

    setupAudioControls();

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
            const typicalBird = ZONE_TYPICAL_BIRDS[zone]?.name || 'Ave representativa';

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
                typicalBird
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

    function renderZoneStats(data) {
        const grid = document.getElementById('zone-stats');
        if (!grid) {
            return;
        }

        grid.innerHTML = '';
        data.forEach((zoneData) => {
            const card = document.createElement('article');
            card.className = 'region-stat zone-card';
            card.dataset.zone = zoneData.zone;
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Zona ${zoneData.zone} con ${zoneData.totalPercentage.toFixed(1)} por ciento de las especies de aves; ave típica ${zoneData.typicalBird}`);

            const topBreakdown = zoneData.breakdown[0];
            const topDetail = topBreakdown
                ? `Mayor aporte: ${topBreakdown.name} (${topBreakdown.percentage.toFixed(1)}%)`
                : 'Sin datos detallados para esta zona';

            card.innerHTML = `
                <div class="region-name">Zona ${zoneData.zone}</div>
                <div class="region-percentage">${zoneData.totalPercentage.toFixed(1)}%</div>
                <div class="region-animals">${zoneData.totalSpecies.toLocaleString('es-CL')} especies de aves registradas</div>
                <div class="zone-bird">Ave típica: ${zoneData.typicalBird}</div>
                <div class="zone-detail">${topDetail}</div>
            `;

            grid.appendChild(card);
        });
    }

    function styleZoneCards() {
        const cards = document.querySelectorAll('.zone-card');
        cards.forEach((card) => {
            const zone = card.dataset.zone;
            const color = ZONE_COLORS[zone] || '#6b7280';
            const { r, g, b } = hexToRgb(color);
            card.style.background = `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.65))`;
            card.style.borderColor = color;
            const percentage = card.querySelector('.region-percentage');
            if (percentage) {
                percentage.style.color = '#0f172a';
            }
        });
    }

    function attachZoneCardInteractions() {
        const cards = document.querySelectorAll('.zone-card');
        cards.forEach((card) => {
            if (card.dataset.listenersAttached === 'true') {
                return;
            }
            card.dataset.listenersAttached = 'true';

            const zone = card.dataset.zone;

            card.addEventListener('pointerenter', () => {
                setZoneHighlight(zone);
                playZoneBird(zone).catch((error) => {
                    console.error('No se pudo reproducir el canto de la zona:', error);
                });
            });

            card.addEventListener('pointerleave', () => {
                clearZoneHighlight();
                stopCurrentBird();
            });

            card.addEventListener('focus', () => {
                setZoneHighlight(zone);
            });

            card.addEventListener('blur', () => {
                clearZoneHighlight();
                stopCurrentBird();
            });

            card.addEventListener('keyup', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    if (!audioReady) {
                        return;
                    }
                    if (currentZonePlaying === zone) {
                        stopCurrentBird();
                    } else {
                        playZoneBird(zone).catch((error) => {
                            console.error('No se pudo reproducir el canto de la zona mediante teclado:', error);
                        });
                    }
                }
            });
        });
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
            secondary.innerHTML = `📍 Mayor aporte regional: <strong>${topBreakdown.name}</strong> con el ${topBreakdown.percentage.toFixed(1)}% del total nacional de aves. Ave típica por zona: ${ZONE_ORDER.map((zone) => `${zone}: ${ZONE_TYPICAL_BIRDS[zone]?.name || 'sin definir'}`).join(' · ')}.${bottomText}`;
        } else {
            secondary.textContent = `📍 Sin desglose regional disponible. Ave típica por zona: ${ZONE_ORDER.map((zone) => `${zone}: ${ZONE_TYPICAL_BIRDS[zone]?.name || 'sin definir'}`).join(' · ')}.${bottomText}`;
        }
    }

    function setupAudioControls() {
        const volumeSlider = document.getElementById('mix-control');
        const volumeLabel = document.getElementById('mix-value');
        const audioStatus = document.getElementById('audio-status');
        audioStatusElement = audioStatus;

        if (!volumeSlider || !volumeLabel || !audioStatus) {
            console.warn('Controles de audio no encontrados en el DOM.');
            return;
        }

        const initialValue = parseFloat(volumeSlider.value) || 0;
        volumeLabel.textContent = `${Math.round(initialValue * 100)}%`;

        if (!window.Tone) {
            audioStatus.textContent = 'ToneJS no está disponible en esta página.';
            return;
        }

        audioGain = new Tone.Gain(initialValue).toDestination();

        let hasConfiguredAudio = false;
        const loadPromises = Object.entries(ZONE_TYPICAL_BIRDS).map(([zone, config]) => new Promise((resolve) => {
            if (!config.audio) {
                console.info(`Sin ruta de audio definida para la zona ${zone}.`);
                zonePlayers.set(zone, null);
                return resolve();
            }

            hasConfiguredAudio = true;
            const player = new Tone.Player({
                url: config.audio,
                autostart: false,
                onload: resolve,
                onerror: (error) => {
                    console.error(`No se pudo cargar el canto de ${config.name}`, error);
                    zonePlayers.set(zone, null);
                    resolve();
                }
            });
            player.loop = true; // Mantiene el canto en loop mientras el cursor permanece sobre la zona
            player.fadeIn = 0.3;
            player.fadeOut = 0.3;
            player.connect(audioGain);
            zonePlayers.set(zone, player);
        }));

        Promise.all(loadPromises).then(() => {
            if (!hasConfiguredAudio) {
                audioStatus.textContent = 'Define las rutas de audio en ZONE_TYPICAL_BIRDS para habilitar la reproducción por zona.';
                return;
            }

            audioReady = true;
            audioStatus.textContent = 'Cantos listos. Ajusta el volumen y pasa el cursor por una zona para escuchar su ave característica.';
        });

        volumeSlider.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value) || 0;
            volumeLabel.textContent = `${Math.round(value * 100)}%`;
            if (audioGain) {
                audioGain.gain.rampTo(value, 0.1);
            }
        });
    }

    async function playZoneBird(zone) {
        if (!audioReady) {
            if (audioStatusElement) {
                audioStatusElement.textContent = 'Aún se están cargando los cantos...';
            }
            return;
        }
        if (currentZonePlaying === zone) {
            const currentPlayer = zonePlayers.get(zone);
            if (currentPlayer && currentPlayer.state !== 'started') {
                currentPlayer.start();
            }
            return;
        }

        stopCurrentBird();

        const player = zonePlayers.get(zone);
        if (!player) {
            if (audioStatusElement) {
                audioStatusElement.textContent = `La zona ${zone} no tiene audio configurado. Define la ruta en ZONE_TYPICAL_BIRDS.`;
            }
            return;
        }

        if (!audioContextStarted) {
            try {
                await Tone.start();
                audioContextStarted = true;
            } catch (error) {
                console.error('No se pudo iniciar el contexto de audio:', error);
                if (audioStatusElement) {
                    audioStatusElement.textContent = 'No fue posible iniciar el audio en el navegador.';
                }
                return;
            }
        }

        player.start();
        currentZonePlaying = zone;
        if (audioStatusElement) {
            const birdName = ZONE_TYPICAL_BIRDS[zone]?.name || 'ave típica';
            audioStatusElement.textContent = `Reproduciendo el canto del ${birdName} (zona ${zone}).`;
        }
    }

    function stopCurrentBird() {
        if (!currentZonePlaying) {
            return;
        }

        const player = zonePlayers.get(currentZonePlaying);
        if (player && player.state === 'started') {
            player.stop();
        }
        currentZonePlaying = null;
        if (audioStatusElement && audioReady) {
            audioStatusElement.textContent = 'Pasa el cursor por una zona para escuchar el ave de referencia.';
        }
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
});