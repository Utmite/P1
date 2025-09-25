// Configuración del mapa MapLibre para Chile
document.addEventListener('DOMContentLoaded', function() {
    // Coordenadas centrales de Chile optimizadas para vista angosta
    const CHILE_CENTER = [-71.2, -35.0];
    
    // Función para calcular zoom basado en distancia en kilómetros
    function getZoomForDistance(distanceKm, latitude = -35.0) {
        // Fórmula para calcular zoom basado en distancia y latitud
        // Zoom = log2(156543.03392 * cos(lat) / (distanceKm * 1000 / mapWidthPixels))
        // Asumiendo ancho del mapa de aproximadamente 400px (25% de 1600px típico)
        const mapWidthPixels = 400;
        const metersPerPixel = (distanceKm * 1000) / mapWidthPixels;
        const latRad = latitude * Math.PI / 180;
        const zoom = Math.log2(156543.03392 * Math.cos(latRad) / metersPerPixel);
        return Math.max(1, Math.min(zoom, 18)); // Limitar entre zoom 1 y 18
    }
    
    // Calcular zoom para mostrar 500km
    const TARGET_DISTANCE_KM = 500;
    const CHILE_ZOOM = getZoomForDistance(TARGET_DISTANCE_KM, CHILE_CENTER[1]);
    
    console.log(`Zoom calculado para ${TARGET_DISTANCE_KM}km: ${CHILE_ZOOM.toFixed(2)}`);
    
    // Límites geográficos de Chile optimizados para vista vertical
    const CHILE_BOUNDS = [
        [-76.5, -56.5], // Suroeste más ajustado
        [-66.5, -17.5]  // Noreste más ajustado
    ];

    // Inicializar el mapa
    const map = new maplibregl.Map({
        container: 'map',
        style: '/mapas/style.json',
        center: CHILE_CENTER,
        zoom: CHILE_ZOOM, // Usar el zoom calculado para 500km
        maxBounds: CHILE_BOUNDS,
        attributionControl: true,
        // Configuración optimizada para vista vertical angosta de Chile
        pitch: 0, // Sin inclinación para mejor vista norte-sur
        bearing: 0, // Sin rotación
        antialias: true // Mejor calidad visual
    });

    // Agregar controles de navegación
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Agregar control de escala
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    // Agregar control de pantalla completa
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    // Evento cuando el mapa se carga completamente
    map.on('load', function() {
        console.log('Mapa de Chile cargado correctamente');
        console.log(`Vista inicial: ${TARGET_DISTANCE_KM}km de ancho aproximadamente`);
        
        // Función para ajustar zoom dinámicamente según el tamaño del contenedor
        function adjustZoomForDistance() {
            const mapContainer = document.getElementById('map');
            const mapWidth = mapContainer.offsetWidth;
            const latitude = map.getCenter().lat;
            
            // Recalcular zoom basado en el ancho actual del contenedor
            const metersPerPixel = (TARGET_DISTANCE_KM * 1000) / mapWidth;
            const latRad = latitude * Math.PI / 180;
            const optimalZoom = Math.log2(156543.03392 * Math.cos(latRad) / metersPerPixel);
            const clampedZoom = Math.max(1, Math.min(optimalZoom, 18));
            
            map.setZoom(clampedZoom);
            console.log(`Zoom ajustado para ${TARGET_DISTANCE_KM}km en ${mapWidth}px: ${clampedZoom.toFixed(2)}`);
        }
        
        // Ajustar zoom inicial
        adjustZoomForDistance();
        
        // Función para actualizar la información del zoom en el overlay
        function updateZoomInfo() {
            const currentZoom = map.getZoom();
            const zoomElement = document.getElementById('zoom-level');
            if (zoomElement) {
                zoomElement.textContent = currentZoom.toFixed(2);
            }
        }
        
        // Actualizar info inicial
        updateZoomInfo();
        
        // Escuchar cambios de zoom para actualizar la información
        map.on('zoom', updateZoomInfo);
        
        // Escuchar cambios de tamaño de ventana para mantener los 500km
        window.addEventListener('resize', () => {
            setTimeout(() => {
                adjustZoomForDistance();
                updateZoomInfo();
            }, 100); // Delay para esperar que termine el resize
        });
    });

    // Evento de error
    map.on('error', function(e) {
        console.error('Error en el mapa:', e);
    });

    // Hacer el mapa disponible globalmente para debugging
    window.chileMap = map;
});