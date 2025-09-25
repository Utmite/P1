// Configuración del mapa de distribución de fauna de Chile
document.addEventListener('DOMContentLoaded', async function() {
    // Coordenadas centrales de Chile
    const PREFIX = "/P1"
    const CHILE_CENTER = [-71.2, -39.5];
    const CHILE_ZOOM = 3.0;

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
        // Normalizar porcentaje (max es ~12.3%)
        const normalized = Math.min(percentage / 15, 1);
        
        // Gradiente verde usando valores RGB estándar
        // Del verde más claro al más oscuro
        const colors = [
            '#dcfce7', // Verde muy claro
            '#bbf7d0', // Verde claro
            '#86efac', // Verde medio claro
            '#4ade80', // Verde medio
            '#22c55e', // Verde
            '#16a34a'  // Verde oscuro
        ];
        
        // Seleccionar color basado en el porcentaje normalizado
        const colorIndex = Math.floor(normalized * (colors.length - 1));
        return colors[Math.min(colorIndex, colors.length - 1)];
    }

    // Inicializar el mapa
    const map = new maplibregl.Map({
        container: 'map',
        style: PREFIX +'/mapas/style.json',
        center: CHILE_CENTER,
        zoom: CHILE_ZOOM,
        attributionControl: false,
        interactive: false,
        pitch: 0,
        bearing: 0,
        antialias: true
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

    // Eventos del mapa
    map.on('load', function() {
        console.log('Mapa base cargado');
        cargarVisualizacion();
    });

    map.on('error', function(e) {
        console.error('Error en el mapa:', e);
    });

    // Hacer el mapa disponible globalmente
    window.chileMap = map;
});