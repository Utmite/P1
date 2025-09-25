// Configuración del mapa MapLibre para Chile
document.addEventListener('DOMContentLoaded', function() {
    // Coordenadas centrales de Chile - más al sur para incluir Patagonia
    const CHILE_CENTER = [-71.2, -39.5];
    const CHILE_ZOOM = 3.4; // Zoom fijo

    // Inicializar el mapa sin controles ni interacción
    const map = new maplibregl.Map({
        container: 'map',
        style: '/mapas/style.json',
        center: CHILE_CENTER,
        zoom: CHILE_ZOOM,
        attributionControl: false, // Sin atribución
        interactive: false, // Sin interacción (no zoom, no pan, no rotación)
        // Configuración optimizada para vista estática
        pitch: 0,
        bearing: 0,
        antialias: true
    });

    // Evento de carga del mapa
    map.on('load', function() {
        console.log('Mapa de Chile con regiones cargado desde OSM');
        
        // Verificar que las capas se cargaron correctamente
        const layers = map.getStyle().layers;
        console.log('Capas disponibles:', layers.map(l => l.id));
        
        // Verificar fuentes de datos
        const sources = map.getStyle().sources;
        console.log('Fuentes de datos:', Object.keys(sources));
    });

    // Manejo de errores
    map.on('error', function(e) {
        console.error('Error en el mapa:', e);
    });

    // Hacer el mapa disponible globalmente para debugging
    window.chileMap = map;
});