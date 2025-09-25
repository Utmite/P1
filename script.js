// Configuración del mapa MapLibre para Chile
document.addEventListener('DOMContentLoaded', function() {
    // Coordenadas centrales de Chile (centro geográfico real)
    const CHILE_CENTER = [-71.5, -35.5];
    const CHILE_ZOOM = 4.3; // Zoom más bajo para mostrar todo Chile
    
    // Límites geográficos de Chile (completo incluyendo territorio insular)
    const CHILE_BOUNDS = [
        [-110.0, -57.0], // Suroeste (incluye Isla de Pascua)
        [-66.0, -17.0]   // Noreste 
    ];

    // Inicializar el mapa
    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json', // Estilo gratuito corregido
        center: CHILE_CENTER,
        zoom: CHILE_ZOOM,
        maxBounds: CHILE_BOUNDS, // Limita la navegación solo a Chile
        attributionControl: true,
        // Configuración optimizada para vista vertical de Chile
        pitch: 0, // Sin inclinación para mejor vista norte-sur
        bearing: 0 // Sin rotación
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
        
        // Ajustar la vista para mostrar todo Chile
        const chileBounds = [
            [-76.0, -56.0], // Suroeste
            [-66.5, -17.5]  // Noreste (sin Isla de Pascua para mejor ajuste)
        ];
        
        // Ajustar la vista con padding apropiado
        map.fitBounds(chileBounds, {
            padding: 20,
            maxZoom: 6
        });
        
        // Opcional: Agregar marcador en Santiago
        new maplibregl.Marker({
            color: '#e74c3c'
        })
        .setLngLat([-70.6693, -33.4489])
        .setPopup(new maplibregl.Popup().setHTML('<h3>Santiago de Chile</h3><p>Capital de Chile</p>'))
        .addTo(map);

        // Opcional: Agregar algunos marcadores de ciudades importantes
        const ciudades = [
            { nombre: 'Valparaíso', coords: [-71.6275, -33.0458] },
            { nombre: 'Concepción', coords: [-73.0444, -36.8270] },
            { nombre: 'La Serena', coords: [-71.2500, -29.9027] },
            { nombre: 'Temuco', coords: [-72.6003, -38.7359] },
            { nombre: 'Puerto Montt', coords: [-72.9444, -41.4693] },
            { nombre: 'Antofagasta', coords: [-70.4000, -23.6500] },
            { nombre: 'Iquique', coords: [-70.1500, -20.2208] },
            { nombre: 'Punta Arenas', coords: [-70.9171, -53.1638] }
        ];

        ciudades.forEach(ciudad => {
            new maplibregl.Marker({
                color: '#3498db',
                scale: 0.8
            })
            .setLngLat(ciudad.coords)
            .setPopup(new maplibregl.Popup().setHTML(`<h3>${ciudad.nombre}</h3>`))
            .addTo(map);
        });
    });

    // Evento de error
    map.on('error', function(e) {
        console.error('Error en el mapa:', e);
    });

    // Hacer el mapa disponible globalmente para debugging
    window.chileMap = map;
});