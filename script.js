// Configuración del mapa de distribución de fauna de Chile
document.addEventListener('DOMContentLoaded', function() {
    // Coordenadas centrales de Chile
    const CHILE_CENTER = [-71.2, -39.5];
    const CHILE_ZOOM = 3.4;

    // Datos de fauna por región
    const FAUNA_DATA = {
        "Region": {
            "0": "Región Metropolitana de Santiago",
            "1": "Región de Antofagasta",
            "2": "Región de Arica y Parinacota",
            "3": "Región de Atacama",
            "4": "Región de Aysén del Gral.Ibañez del Campo",
            "5": "Región de Coquimbo",
            "6": "Región de La Araucanía",
            "7": "Región de Los Lagos",
            "8": "Región de Los Ríos",
            "9": "Región de Magallanes y Antártica Chilena",
            "10": "Región de Tarapacá",
            "11": "Región de Valparaíso",
            "12": "Región de Ñuble",
            "13": "Región del Bío-Bío",
            "14": "Región del Libertador Bernardo O'Higgins",
            "15": "Región del Maule",
            "16": "Zona sin demarcar"
        },
        "porcentaje": {
            "0": 17.5591590274,
            "1": 1.7159984178,
            "2": 4.8000408345,
            "3": 1.9980274308,
            "4": 3.3944174544,
            "5": 6.3872535603,
            "6": 4.5312602316,
            "7": 12.8295146206,
            "8": 4.857543494,
            "9": 9.5129664064,
            "10": 0.7346408053,
            "11": 18.4249033632,
            "12": 0.8885554129,
            "13": 4.3799167782,
            "14": 3.6727607242,
            "15": 4.3129907754,
            "16": 0.0000506631
        },
        "cantidad_animales": {
            "0": 1386346,
            "1": 135483,
            "2": 378977,
            "3": 157750,
            "4": 267999,
            "5": 504292,
            "6": 357756,
            "7": 1012927,
            "8": 383517,
            "9": 751076,
            "10": 58002,
            "11": 1454699,
            "12": 70154,
            "13": 345807,
            "14": 289975,
            "15": 340523,
            "16": 4
        }
    };

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
        // Normalizar porcentaje (max es ~18.4%)
        const normalized = Math.min(percentage / 20, 1);
        
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
                const percentage = FAUNA_DATA.porcentaje[index];
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