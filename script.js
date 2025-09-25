// Configuración del mapa de distribución de fauna de Chile
document.addEventListener('DOMContentLoaded', async function() {
    // Coordenadas centrales de Chile
    const PREFIX = ""
    const CHILE_CENTER = [-71.2, -39.5];
    const CHILE_ZOOM = 2.8;
    
    // Límites geográficos de Chile continental (sin Isla de Pascua)
    const CHILE_BOUNDS = [
        [-76.0, -56.0], // Suroeste (costa continental)
        [-66.5, -17.5]   // Noreste
    ];

    // Importar datos de fauna desde el JSON
    let FAUNA_DATA;
    try {
        const response = await fetch(PREFIX + '/data/especies_xd.json');
        FAUNA_DATA = await response.json();
        console.log('Datos de fauna cargados:', FAUNA_DATA);
    } catch (error) {
        console.error('Error al cargar datos de fauna:', error);
        return;
    }

    // Función para calcular color basado en porcentaje
    function getColorByPercentage(percentage) {
        // Normalizar porcentaje con mejor distribución (max es ~12.3%)
        const normalized = Math.min(percentage / 12.5, 1);
        
        // Gradiente verde mejorado con más contraste entre tonos
        const colors = [
            '#f0fdf4', // Verde muy muy claro (0-1%)
            '#dcfce7', // Verde muy claro (1-3%)
            '#bbf7d0', // Verde claro (3-5%)
            '#86efac', // Verde medio claro (5-7%)
            '#4ade80', // Verde medio (7-9%)
            '#22c55e', // Verde (9-11%)
            '#16a34a', // Verde oscuro (11-13%)
            '#15803d'  // Verde muy oscuro (13%+)
        ];
        
        // Seleccionar color con mejor distribución
        const colorIndex = Math.floor(normalized * (colors.length - 1));
        return colors[Math.min(colorIndex, colors.length - 1)];
    }

    // Inicializar el mapa
    const map = new maplibregl.Map({
        container: 'map',
        style: PREFIX +'/mapas/style.json',
        center: CHILE_CENTER,
        zoom: CHILE_ZOOM,
        minZoom: 1.5,
        maxZoom: 12,
        attributionControl: false,
        interactive: true,
        pitch: 0,
        bearing: 0,
        antialias: true
    });

    // Ajustar inmediatamente para mostrar todo Chile
    map.fitBounds(CHILE_BOUNDS, {
        padding: { top: 30, bottom: 30, left: 30, right: 30 },
        maxZoom: 3.5
    });

    // Agregar controles de navegación
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Función para cargar cuando el mapa esté listo
    map.on('load', function() {
        console.log('Mapa base cargado');
        cargarVisualizacion();
    });

    // Función para cargar las regiones con visualización de datos
    async function cargarVisualizacion() {
        try {
            // Cargar el archivo combinado de todas las regiones
            const response = await fetch(PREFIX+'/mapas/regiones_combinadas.geojson');
            if (!response.ok) {
                throw new Error('Error al cargar regiones_combinadas.geojson');
            }
            
            const regionesData = await response.json();
            
            // Procesar cada feature (región) del GeoJSON
            regionesData.features.forEach((feature, index) => {
                // Obtener el nombre de la región desde las propiedades del feature
                const regionName = feature.properties.name || feature.properties.NAME || feature.properties.Region;
                
                // Buscar la región en nuestros datos
                let regionIndex = null;
                for (const [dataIndex, dataRegion] of Object.entries(FAUNA_DATA.Region)) {
                    if (dataRegion === regionName || dataRegion.includes(regionName) || regionName.includes(dataRegion)) {
                        regionIndex = dataIndex;
                        break;
                    }
                }
                
                if (!regionIndex || FAUNA_DATA.Region[regionIndex] === "Zona sin demarcar") {
                    return; // Skip si no encontramos la región o es zona sin demarcar
                }
                
                const percentage = FAUNA_DATA.porcentaje_especies[regionIndex];
                const color = getColorByPercentage(percentage);

                // Crear un GeoJSON individual para cada región
                const singleRegionGeoJSON = {
                    type: "FeatureCollection",
                    features: [feature]
                };

                // Agregar fuente de datos para esta región
                map.addSource(`fauna-${index}`, {
                    type: 'geojson',
                    data: singleRegionGeoJSON
                });

                // Agregar capa de relleno con color basado en porcentaje
                map.addLayer({
                    id: `fauna-fill-${index}`,
                    type: 'fill',
                    source: `fauna-${index}`,
                    paint: {
                        'fill-color': color,
                        'fill-opacity': 0.8
                    }
                });

                // Agregar capa de borde
                map.addLayer({
                    id: `fauna-line-${index}`,
                    type: 'line',
                    source: `fauna-${index}`,
                    paint: {
                        'line-color': '#16a34a',
                        'line-width': 1.5,
                        'line-opacity': 0.9
                    }
                });
            });

            console.log('Visualización de fauna cargada correctamente desde regiones_combinadas.geojson');
        } catch (error) {
            console.error('Error al cargar la visualización:', error);
        }
    }

    map.on('error', function(e) {
        console.error('Error en el mapa:', e);
    });

    // Hacer el mapa disponible globalmente
    window.chileMap = map;

    // Función para aplicar colores a las cards basado en porcentaje
    function styleRegionCards() {
        const cards = document.querySelectorAll('.region-stat[data-percentage]');
        cards.forEach(card => {
            const percentage = parseFloat(card.getAttribute('data-percentage'));
            const color = getColorByPercentage(percentage);
            
            // Convertir hex a RGB para poder usar transparencia
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            // Aplicar gradiente más sólido para mejor contraste
            card.style.setProperty('background', `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.4), rgba(${r}, ${g}, ${b}, 0.8))`, 'important');
            card.style.setProperty('border-color', color, 'important');
            
            // Color de texto más oscuro para mejor contraste
            const percentageElement = card.querySelector('.region-percentage');
            if (percentageElement) {
                percentageElement.style.color = '#065f46'; // Verde muy oscuro
            }
        });
    }

    // Aplicar estilos a las cards
    styleRegionCards();
});