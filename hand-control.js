// Control por Manos - Aves de Chile por Zonas (Norte, Centro, Sur)
// Sin mapa, solo cámara y galería de aves

document.addEventListener('DOMContentLoaded', async function() {
    // === AVES POR ZONA GEOGRÁFICA ===
    const AVES_POR_ZONA = {
        norte: {
            nombre: 'Zona Norte',
            emoji: '🏜️',
            descripcion: 'Desierto y Altiplano',
            aves: [
                { nombre: 'Flamenco Chileno', archivo: 'flamenco_chileno', imagen: 'flamenco_chileno.jpg' },
                { nombre: 'Parina Grande', archivo: 'parina_grande', imagen: 'parina_grande.jpg' },
                { nombre: 'Pilpilén', archivo: 'pilpilen', imagen: 'pilpilen.jpg' },
                { nombre: 'Cóndor Andino', archivo: 'condor_andino', imagen: 'condor_andino.jpg' }
            ]
        },
        centro: {
            nombre: 'Zona Centro',
            emoji: '🌾',
            descripcion: 'Valle Central',
            aves: [
                { nombre: 'Loica', archivo: 'loica', imagen: 'loica.jpg' },
                { nombre: 'Diuca', archivo: 'diuca', imagen: 'diuca.jpg' },
                { nombre: 'Chincol', archivo: 'chincol', imagen: 'chincol.webp' },
                { nombre: 'Queltehue', archivo: 'queltehue', imagen: 'queltehue.jpg' },
                { nombre: 'Bandurria', archivo: 'bandurria', imagen: 'bandurria.jpg' },
                { nombre: 'Traro', archivo: 'traro', imagen: 'traro.jpg' }
            ]
        },
        sur: {
            nombre: 'Zona Sur',
            emoji: '🧊',
            descripcion: 'Bosques y Patagonia',
            aves: [
                { nombre: 'Chucao', archivo: 'chucao', imagen: 'chucao.jpg' },
                { nombre: 'Rayadito', archivo: 'rayadito', imagen: 'rayadito.jpg' },
                { nombre: 'Huet-huet', archivo: 'huet_huet', imagen: 'huet_huet.jpg' },
                { nombre: 'Martín Pescador', archivo: 'martin_pescador', imagen: 'martin_pescador.jpg' },
                { nombre: 'Carpintero Negro', archivo: 'carpintero_negro', imagen: 'carpintero_negro.jpg' },
                { nombre: 'Pingüino de Magallanes', archivo: 'pinguino_magallanes', imagen: 'pinguino_magallanes.jpg' }
            ]
        }
    };

    // Estado
    let currentZone = null;
    let audioPlayers = {};
    let activePlayers = [];
    let audioReady = false;

    // Estado de cámara y detección
    let hands, camera;
    let isProcessing = false;
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const videoContainer = document.getElementById('video-container');
    const handStatus = document.getElementById('hand-status');
    const statusText = document.getElementById('status-text');
    const instructions = document.getElementById('instructions');
    
    // Elementos de galería
    const birdGallery = document.getElementById('bird-gallery');
    const zoneTitle = document.getElementById('zone-title');
    const birdsContainer = document.getElementById('birds-container');
    
    // Labels de zonas
    const labelNorte = document.getElementById('label-norte');
    const labelCentro = document.getElementById('label-centro');
    const labelSur = document.getElementById('label-sur');

    // Inicializar Tone.js
    async function initAudio() {
        if (!audioReady) {
            await Tone.start();
            audioReady = true;
            console.log('🔊 Audio activado');
        }
    }
    
    // Manejar popups
    const loadingPopup = document.getElementById('loading-popup');
    const audioPopup = document.getElementById('audio-popup');
    const activateButton = document.getElementById('activate-audio');

    // Precargar TODOS los audios
    async function preloadAudio() {
        console.log('🎵 Cargando audios de todas las zonas...');
        const loadPromises = [];
        
        for (const [zona, datos] of Object.entries(AVES_POR_ZONA)) {
            for (const ave of datos.aves) {
                const loadPromise = new Promise((resolve, reject) => {
                    const player = new Tone.Player({
                        url: `sounds/${ave.archivo}.mp3`,
                        onload: () => {
                            console.log(`  ✓ ${ave.nombre} (${zona})`);
                            resolve();
                        },
                        onerror: (error) => {
                            console.warn(`  ❌ ${ave.nombre}: ${error}`);
                            reject(error);
                        }
                    }).toDestination();
                    audioPlayers[ave.archivo] = player;
                });
                loadPromises.push(loadPromise.catch(err => console.warn('Error cargando:', err)));
            }
        }
        await Promise.all(loadPromises);
        console.log('✓ Audios precargados y listos');
    }

    // Reproducir sonidos de aves de una zona
    function playZoneBirds(zona) {
        if (!audioReady) return;
        
        const zonaDatos = AVES_POR_ZONA[zona];
        if (!zonaDatos) return;

        console.log(`🐦 Reproduciendo aves de ${zonaDatos.nombre}`);
        stopAllBirds();

        // Seleccionar 2-3 aves aleatorias
        const avesSeleccionadas = shuffleArray([...zonaDatos.aves]).slice(0, 3);
        
        avesSeleccionadas.forEach((ave, index) => {
            const player = audioPlayers[ave.archivo];
            if (!player || !player.loaded) return;

            const count = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const bird = new Tone.Player(player.buffer);
                const panner = new Tone.Panner((Math.random() * 2) - 1);
                const volume = new Tone.Volume(-6 + Math.random() * -10);
                bird.chain(panner, volume, Tone.Destination);
                bird.loop = true;
                bird.playbackRate = 0.85 + Math.random() * 0.3;
                
                const delay = index * 400 + Math.random() * 800;
                setTimeout(() => {
                    if (currentZone === zona) {
                        bird.start();
                        activePlayers.push({ player: bird, archivo: ave.archivo });
                        highlightPlayingBird(ave.archivo);
                    }
                }, delay);
            }
        });
    }

    function highlightPlayingBird(archivo) {
        const card = document.querySelector(`.bird-card[data-archivo="${archivo}"]`);
        if (card) {
            card.classList.add('playing');
            setTimeout(() => card.classList.remove('playing'), 2000);
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function stopAllBirds() {
        activePlayers.forEach(p => {
            if (p.player.state === 'started') p.player.stop();
            p.player.dispose();
        });
        activePlayers = [];
        document.querySelectorAll('.bird-card.playing').forEach(card => card.classList.remove('playing'));
    }

    // Mostrar galería de aves
    function showBirdGallery(zona) {
        const zonaDatos = AVES_POR_ZONA[zona];
        if (!zonaDatos) return;

        zoneTitle.textContent = `${zonaDatos.emoji} ${zonaDatos.nombre} - ${zonaDatos.descripcion}`;
        zoneTitle.className = zona;

        birdsContainer.innerHTML = '';
        zonaDatos.aves.forEach(ave => {
            const card = document.createElement('div');
            card.className = `bird-card ${zona}`;
            card.dataset.archivo = ave.archivo;
            card.innerHTML = `
                <img class="bird-image" src="img/${ave.imagen}" alt="${ave.nombre}" loading="lazy">
                <div class="bird-card-name">${ave.nombre}</div>
            `;
            card.addEventListener('click', () => playSingleBird(ave.archivo, zona));
            birdsContainer.appendChild(card);
        });

        birdGallery.style.display = 'block';
    }

    function hideBirdGallery() {
        birdGallery.style.display = 'none';
    }

    function playSingleBird(archivo, zona) {
        if (!audioReady) return;
        const player = audioPlayers[archivo];
        if (!player || !player.loaded) return;

        stopAllBirds();

        const bird = new Tone.Player(player.buffer);
        const volume = new Tone.Volume(-5);
        bird.chain(volume, Tone.Destination);
        bird.loop = true;
        bird.start();
        activePlayers.push({ player: bird, archivo });
        highlightPlayingBird(archivo);
    }

    // Actualizar labels de zona activa
    function updateZoneLabels(zona) {
        labelNorte.classList.toggle('active', zona === 'norte');
        labelCentro.classList.toggle('active', zona === 'centro');
        labelSur.classList.toggle('active', zona === 'sur');
    }

    // === ACTIVAR ZONA POR MANO ===
    function activateZoneByHand(zona) {
        if (currentZone === zona) return;
        
        currentZone = zona;
        updateZoneLabels(zona);
        showBirdGallery(zona);
        playZoneBirds(zona);
    }

    function deactivateAllZones() {
        currentZone = null;
        updateZoneLabels(null);
        hideBirdGallery();
        stopAllBirds();
    }

    // === DETECCIÓN DE MANOS ===
    function onResults(results) {
        if (!canvas || !ctx) return;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Limpiar y dibujar video
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        // Dibujar líneas divisoras
        const zoneWidth = canvas.width / 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        
        ctx.beginPath();
        ctx.moveTo(zoneWidth, 0);
        ctx.lineTo(zoneWidth, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(zoneWidth * 2, 0);
        ctx.lineTo(zoneWidth * 2, canvas.height);
        ctx.stroke();
        
        ctx.setLineDash([]);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const indexTip = landmarks[8];
            
            const fingerX = indexTip.x * canvas.width;
            
            // Determinar zona
            let zonaActual = null;
            if (fingerX < zoneWidth) {
                zonaActual = 'norte';
            } else if (fingerX < zoneWidth * 2) {
                zonaActual = 'centro';
            } else {
                zonaActual = 'sur';
            }
            
            // Dibujar mano
            drawHand(landmarks, zonaActual);
            
            // Activar zona
            if (zonaActual) {
                activateZoneByHand(zonaActual);
                if (statusText) {
                    const zonaDatos = AVES_POR_ZONA[zonaActual];
                    statusText.innerHTML = `<strong style="color: ${getZoneColor(zonaActual)}">${zonaDatos.emoji} ${zonaDatos.nombre}</strong>`;
                }
            }
            
        } else {
            deactivateAllZones();
            if (statusText) statusText.textContent = 'Muestra tu mano';
        }
    }

    function getZoneColor(zona) {
        const colors = { norte: '#ff8a65', centro: '#81c784', sur: '#64b5f6' };
        return colors[zona] || '#fff';
    }

    function drawHand(landmarks, zona) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];
        
        const color = getZoneColor(zona);
        
        // Líneas de la mano
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        connections.forEach(([start, end]) => {
            ctx.moveTo(landmarks[start].x * canvas.width, landmarks[start].y * canvas.height);
            ctx.lineTo(landmarks[end].x * canvas.width, landmarks[end].y * canvas.height);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Puntos
        ctx.fillStyle = color;
        landmarks.forEach((lm, idx) => {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, idx === 8 ? 12 : 6, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Círculo indicador en el dedo índice
        const indexTip = landmarks[8];
        ctx.beginPath();
        ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 25, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    async function initHands() {
        hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        hands.onResults(onResults);
    }

    async function initCamera() {
        camera = new Camera(video, {
            onFrame: async () => {
                if (!isProcessing) {
                    isProcessing = true;
                    try {
                        await hands.send({ image: video });
                    } catch (error) {
                        console.warn('Error:', error);
                    } finally {
                        isProcessing = false;
                    }
                }
            },
            width: 640,
            height: 480
        });
        
        await camera.start();
        console.log('📷 Cámara iniciada');
    }

    // Mostrar popup de audio después de cargar
    loadingPopup.classList.remove('hidden');
    await preloadAudio();
    loadingPopup.classList.add('hidden');
    audioPopup.classList.remove('hidden');

    // Botón de activación
    activateButton.addEventListener('click', async () => {
        audioPopup.classList.add('hidden');
        loadingPopup.classList.remove('hidden');
        
        try {
            await initAudio();
            await initHands();
            await initCamera();
            
            if (videoContainer) videoContainer.style.display = 'block';
            if (handStatus) handStatus.style.display = 'block';
            if (instructions) instructions.style.display = 'block';
            loadingPopup.classList.add('hidden');
            
            console.log('✅ Control por zonas activado');
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Error al iniciar cámara: ' + error.message);
            loadingPopup.classList.add('hidden');
        }
    });

    window.addEventListener('beforeunload', () => {
        stopAllBirds();
        if (camera) camera.stop();
    });
});
