// Configuración del mapa de distribución de fauna de Chile
document.addEventListener('DOMContentLoaded', async function() {
    // Coordenadas centrales de Chile
    const CHILE_CENTER = [-71.2, -39.5];
    const CHILE_ZOOM = 3.4;

    // Importar datos de fauna desde el JSON
    let FAUNA_DATA;
    try {
        const response = await fetch('/data/especies_xd.json');
        FAUNA_DATA = await response.json();
        console.log('Datos de fauna cargados:', FAUNA_DATA);
    } catch (error) {
        console.error('Error al cargar datos de fauna:', error);
        return;
    }

    // Lista de archivos GeoJSON por región (basada en nombres estándar)
    const REGION_FILES = {
        "Región Metropolitana de Santiago": "Región_Metropolitana_de_Santiago",
        "Región de Antofagasta": "Región_de_Antofagasta",
        "Región de Arica y Parinacota": "Región_de_Arica_y_Parinacota",
        "Región de Atacama": "Región_de_Atacama",
        "Región de Aysén del Gral.Ibañez del Campo": "Región_de_Aysén_del_GralIbañez_del_Campo",
        "Región de Coquimbo": "Región_de_Coquimbo",
        "Región de La Araucanía": "Región_de_La_Araucanía",
        "Región de Los Lagos": "Región_de_Los_Lagos",
        "Región de Los Ríos": "Región_de_Los_Ríos",
        "Región de Magallanes y Antártica Chilena": "Región_de_Magallanes_y_Antártica_Chilena",
        "Región de Tarapacá": "Región_de_Tarapacá",
        "Región de Valparaíso": "Región_de_Valparaíso",
        "Región de Ñuble": "Región_de_Ñuble",
        "Región del Bío-Bío": "Región_del_Bío-Bío",
        "Región del Libertador Bernardo O'Higgins": "Región_del_Libertador_Bernardo_O'Higgins",
        "Región del Maule": "Región_del_Maule"
    };

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
        style: '/mapas/style.json',
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
            for (const [index, regionName] of Object.entries(FAUNA_DATA.Region)) {
                if (regionName === "Zona sin demarcar") continue; // Skip zona sin demarcar
                
                const fileName = REGION_FILES[regionName];
                if (!fileName) continue;

                const response = await fetch(`/mapas/${fileName}.geojson`);
                if (!response.ok) continue;
                
                const data = await response.json();
                const percentage = FAUNA_DATA.porcentaje_especies[index];
                const color = getColorByPercentage(percentage);

                // Agregar fuente de datos
                map.addSource(`fauna-${index}`, {
                    type: 'geojson',
                    data: data
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
            }

            // Generar estadísticas en la interfaz (las cards ya están en el HTML)
            console.log('Visualización de fauna cargada correctamente');
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