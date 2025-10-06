class EnhancedArtGallery {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.canvasFrames = [];
        this.particles = null;
        this.particleSystem = null;
        this.autoRotate = false;
        this.lightingMode = 0;
        this.particlesEnabled = true;
        this.fogEnabled = true;
        this.clock = new THREE.Clock();
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = 0;

        // Artwork selection
        this.currentArtworkIndex = 0;
        this.artworkPositions = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isZoomedToArtwork = false;

        // Image URLs provided by user
        this.imageUrls = [
            "https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1450&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1504333638930-c8787321eee0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1511&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1513&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            "https://images.unsplash.com/photo-1569177055508-b05cb535be71?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        ];

        // Camera presets
        this.cameraPresets = {
            overview: { position: new THREE.Vector3(0, 8, 12), target: new THREE.Vector3(0, 0, 0) },
            close: { position: new THREE.Vector3(0, 2, 3), target: new THREE.Vector3(0, 2, 0) },
            side: { position: new THREE.Vector3(8, 3, 0), target: new THREE.Vector3(0, 2, 0) }
        };

        // Artwork zoom positions
        this.artworkZoomPositions = [
            { position: new THREE.Vector3(-6, 3, -7), target: new THREE.Vector3(-6, 3, -9.9) }, // Left back
            { position: new THREE.Vector3(0, 3, -7), target: new THREE.Vector3(0, 3, -9.9) },   // Center back
            { position: new THREE.Vector3(6, 3, -7), target: new THREE.Vector3(6, 3, -9.9) },  // Right back
            { position: new THREE.Vector3(-7, 3, -3), target: new THREE.Vector3(-9.9, 3, -3) }, // Left wall top
            { position: new THREE.Vector3(-7, 3, 3), target: new THREE.Vector3(-9.9, 3, 3) }    // Left wall bottom
        ];

        this.lights = {
            ambient: null,
            directional: null,
            spotlights: [],
            rim: null
        };

        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createParticleSystem();
        this.createGallery();
        this.setupControls();
        this.setupEventListeners();
        this.animate();
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Add atmospheric fog
        this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 8);
    }

    createRenderer() {
        const canvas = document.getElementById('gallery-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    createLights() {
        // Ambient light
        this.lights.ambient = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(this.lights.ambient);

        // Directional light (main gallery lighting)
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.directional.position.set(5, 10, 5);
        this.lights.directional.castShadow = true;
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 50;
        this.lights.directional.shadow.camera.left = -10;
        this.lights.directional.shadow.camera.right = 10;
        this.lights.directional.shadow.camera.top = 10;
        this.lights.directional.shadow.camera.bottom = -10;
        this.scene.add(this.lights.directional);

        // Rim lighting for dramatic effect
        this.lights.rim = new THREE.DirectionalLight(0x667eea, 0.3);
        this.lights.rim.position.set(-5, 5, -5);
        this.scene.add(this.lights.rim);

        // Spotlights for each painting
        for (let i = 0; i < 5; i++) {
            const spotlight = new THREE.SpotLight(0xffffff, 0.6, 20, Math.PI / 6, 0.3, 1);
            spotlight.castShadow = true;
            this.lights.spotlights.push(spotlight);
            this.scene.add(spotlight);
        }
    }

    createParticleSystem() {
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            // Random positions in a large sphere around the gallery
            const radius = 15 + Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.cos(phi);
            positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // Random colors (blue/purple theme)
            const color = new THREE.Color();
            color.setHSL(0.6 + Math.random() * 0.2, 0.7, 0.5 + Math.random() * 0.3);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Random sizes
            sizes[i] = Math.random() * 2 + 0.5;

            // Random velocities
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particleSystem);
    }

    async createGallery() {
        // Create gallery floor with enhanced materials
        this.createFloor();

        // Create walls with better materials
        this.createWalls();

        // Create canvas frames and load images
        await this.createCanvasFrames();

        // Position spotlights
        this.positionSpotlights();

        // Add decorative elements
        this.addDecorativeElements();
    }

    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Add subtle pattern to floor
        const patternGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
        const patternMaterial = new THREE.LineBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.1
        });
        const pattern = new THREE.LineSegments(
            new THREE.EdgesGeometry(patternGeometry),
            patternMaterial
        );
        pattern.rotation.x = -Math.PI / 2;
        this.scene.add(pattern);
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.05
        });

        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(20, 8);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, 4, -10);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Side walls
        const sideWallGeometry = new THREE.PlaneGeometry(20, 8);

        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.set(-10, 4, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.set(10, 4, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    addDecorativeElements() {
        // Add floating orbs for atmosphere
        for (let i = 0; i < 3; i++) {
            const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const orbMaterial = new THREE.MeshBasicMaterial({
                color: 0x667eea,
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });
            const orb = new THREE.Mesh(orbGeometry, orbMaterial);
            orb.position.set(
                (Math.random() - 0.5) * 15,
                2 + Math.random() * 3,
                (Math.random() - 0.5) * 15
            );
            this.scene.add(orb);
        }
    }

    async createCanvasFrames() {
        const framePositions = [
            { x: -6, y: 3, z: -9.9, rotation: 0 },
            { x: 0, y: 3, z: -9.9, rotation: 0 },
            { x: 6, y: 3, z: -9.9, rotation: 0 },
            { x: -9.9, y: 3, z: -3, rotation: Math.PI / 2 },
            { x: -9.9, y: 3, z: 3, rotation: Math.PI / 2 }
        ];

        for (let i = 0; i < 5; i++) {
            const frame = await this.createFrame(framePositions[i], i);
            this.canvasFrames.push(frame);
        }
    }

    async createFrame(position, imageIndex) {
        const frameGroup = new THREE.Group();

        // Enhanced frame with multiple materials
        const frameGeometry = new THREE.BoxGeometry(3.2, 2.2, 0.1);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.3,
            metalness: 0.2
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.castShadow = true;
        frameGroup.add(frame);

        // Canvas area with enhanced material
        const canvasGeometry = new THREE.PlaneGeometry(3, 2);
        const canvasMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            roughness: 0.1,
            metalness: 0.0
        });
        const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
        canvas.position.z = 0.06;
        canvas.castShadow = true;
        frameGroup.add(canvas);

        // Add subtle glow effect
        const glowGeometry = new THREE.PlaneGeometry(3.1, 2.1);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x667eea,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = 0.05;
        frameGroup.add(glow);

        // Load and apply texture
        try {
            const texture = await this.loadTexture(this.imageUrls[imageIndex]);
            canvasMaterial.map = texture;
            canvasMaterial.needsUpdate = true;
        } catch (error) {
            console.error(`Failed to load image ${imageIndex + 1}:`, error);
        }

        // Position the frame
        frameGroup.position.set(position.x, position.y, position.z);
        frameGroup.rotation.y = position.rotation;

        // Store artwork position for navigation
        this.artworkPositions.push({
            position: new THREE.Vector3(position.x, position.y, position.z),
            group: frameGroup
        });

        // Add click event listener to the canvas
        canvas.userData = { artworkIndex: imageIndex, isArtwork: true };

        this.scene.add(frameGroup);
        return frameGroup;
    }

    loadTexture(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (texture) => {
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    resolve(texture);
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }

    positionSpotlights() {
        const spotlightPositions = [
            { x: -6, y: 6, z: -7 },
            { x: 0, y: 6, z: -7 },
            { x: 6, y: 6, z: -7 },
            { x: -7, y: 6, z: -3 },
            { x: -7, y: 6, z: 3 }
        ];

        this.lights.spotlights.forEach((spotlight, index) => {
            if (spotlightPositions[index]) {
                spotlight.position.set(
                    spotlightPositions[index].x,
                    spotlightPositions[index].y,
                    spotlightPositions[index].z
                );
                spotlight.target.position.set(
                    spotlightPositions[index].x,
                    3,
                    spotlightPositions[index].z === -7 ? -9.9 : spotlightPositions[index].z
                );
            }
        });
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 25;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Camera presets
        document.getElementById('preset-overview').addEventListener('click', () => {
            this.setCameraPreset('overview');
        });

        document.getElementById('preset-close').addEventListener('click', () => {
            this.setCameraPreset('close');
        });

        document.getElementById('preset-side').addEventListener('click', () => {
            this.setCameraPreset('side');
        });

        // Lighting controls
        document.getElementById('toggle-lights').addEventListener('click', () => {
            this.toggleLights();
        });

        document.getElementById('cycle-lighting').addEventListener('click', () => {
            this.cycleLighting();
        });

        // Effect controls
        document.getElementById('auto-rotate').addEventListener('click', () => {
            this.toggleAutoRotate();
        });

        document.getElementById('toggle-fog').addEventListener('click', () => {
            this.toggleFog();
        });

        document.getElementById('toggle-particles').addEventListener('click', () => {
            this.toggleParticles();
        });

        // Settings
        document.getElementById('reset-camera').addEventListener('click', () => {
            this.resetCamera();
        });

        document.getElementById('fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Particle controls
        this.setupParticleControls();

        // Artwork interaction
        this.setupArtworkInteraction();

        // Keyboard navigation
        this.setupKeyboardNavigation();

        // Update artwork counter
        this.updateArtworkCounter();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 2000);
    }

    setupParticleControls() {
        const particlePanel = document.getElementById('particle-controls');
        const countSlider = document.getElementById('particle-count-slider');
        const speedSlider = document.getElementById('particle-speed-slider');
        const sizeSlider = document.getElementById('particle-size-slider');

        // Toggle particle panel
        document.getElementById('toggle-particles').addEventListener('click', () => {
            particlePanel.classList.toggle('visible');
        });

        // Particle count control
        countSlider.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            document.getElementById('particle-count-display').textContent = count;
            this.updateParticleCount(count);
        });

        // Particle speed control
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            document.getElementById('particle-speed-display').textContent = speed.toFixed(1);
            this.particleSpeed = speed;
        });

        // Particle size control
        sizeSlider.addEventListener('input', (e) => {
            const size = parseFloat(e.target.value);
            document.getElementById('particle-size-display').textContent = size.toFixed(1);
            this.particleSize = size;
        });

        // Initialize values
        this.particleSpeed = 1.0;
        this.particleSize = 1.0;
    }

    setupArtworkInteraction() {
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onCanvasClick(event);
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                this.previousArtwork();
            } else if (event.key === 'ArrowRight') {
                this.nextArtwork();
            } else if (event.key === 'Escape') {
                this.exitArtworkView();
            }
        });
    }

    onCanvasClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all objects that intersect with the ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // Check if we clicked on an artwork
        for (let intersect of intersects) {
            if (intersect.object.userData && intersect.object.userData.isArtwork) {
                this.zoomToArtwork(intersect.object.userData.artworkIndex);
                break;
            }
        }
    }

    zoomToArtwork(artworkIndex) {
        this.currentArtworkIndex = artworkIndex;
        this.isZoomedToArtwork = true;

        const zoomPosition = this.artworkZoomPositions[artworkIndex];
        if (zoomPosition) {
            this.smoothCameraTransition(zoomPosition.position, zoomPosition.target);
            this.updateArtworkCounter();
        }
    }

    nextArtwork() {
        if (this.isZoomedToArtwork) {
            this.currentArtworkIndex = (this.currentArtworkIndex + 1) % this.artworkPositions.length;
            this.zoomToArtwork(this.currentArtworkIndex);
        }
    }

    previousArtwork() {
        if (this.isZoomedToArtwork) {
            this.currentArtworkIndex = (this.currentArtworkIndex - 1 + this.artworkPositions.length) % this.artworkPositions.length;
            this.zoomToArtwork(this.currentArtworkIndex);
        }
    }

    exitArtworkView() {
        this.isZoomedToArtwork = false;
        this.resetCamera();
    }

    updateArtworkCounter() {
        document.getElementById('current-artwork').textContent = this.currentArtworkIndex + 1;
        document.getElementById('total-artworks').textContent = this.artworkPositions.length;
    }

    setCameraPreset(presetName) {
        const preset = this.cameraPresets[presetName];
        if (preset) {
            this.smoothCameraTransition(preset.position, preset.target);
        }
    }

    smoothCameraTransition(targetPosition, targetLookAt) {
        const startPosition = this.camera.position.clone();
        const startTarget = this.controls.target.clone();

        const duration = 2000; // 2 seconds
        const startTime = Date.now();

        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeInOutCubic(progress);

            this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
            this.controls.target.lerpVectors(startTarget, targetLookAt, easeProgress);
            this.controls.update();

            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        };

        animateCamera();
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    toggleLights() {
        const isVisible = this.lights.ambient.visible;
        this.lights.ambient.visible = !isVisible;
        this.lights.directional.visible = !isVisible;
        this.lights.rim.visible = !isVisible;
        this.lights.spotlights.forEach(light => {
            light.visible = !isVisible;
        });
    }

    cycleLighting() {
        this.lightingMode = (this.lightingMode + 1) % 3;

        switch (this.lightingMode) {
            case 0: // Normal
                this.lights.ambient.intensity = 0.2;
                this.lights.directional.intensity = 0.8;
                this.lights.rim.intensity = 0.3;
                this.scene.background = new THREE.Color(0x0a0a0a);
                break;
            case 1: // Warm
                this.lights.ambient.color.setHex(0xffaa44);
                this.lights.directional.color.setHex(0xffdd88);
                this.lights.rim.color.setHex(0xff6677);
                this.scene.background = new THREE.Color(0x2a1a0a);
                break;
            case 2: // Cool
                this.lights.ambient.color.setHex(0x4488ff);
                this.lights.directional.color.setHex(0x88aaff);
                this.lights.rim.color.setHex(0x6677ff);
                this.scene.background = new THREE.Color(0x0a0a2a);
                break;
        }
    }

    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        this.controls.autoRotate = this.autoRotate;
    }

    toggleFog() {
        this.fogEnabled = !this.fogEnabled;
        if (this.fogEnabled) {
            this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
        } else {
            this.scene.fog = null;
        }
    }

    toggleParticles() {
        this.particlesEnabled = !this.particlesEnabled;
        this.particleSystem.visible = this.particlesEnabled;
    }

    resetCamera() {
        this.isZoomedToArtwork = false;
        this.camera.position.set(0, 2, 8);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.updateArtworkCounter();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    updateParticleCount(count) {
        // This would require recreating the particle system
        // For now, just update the display
        document.getElementById('particle-count').textContent = count;
    }

    updateFPS() {
        this.frameCount++;
        const currentTime = Date.now();

        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            document.getElementById('fps-counter').textContent = this.fps;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update controls
        this.controls.update();

        // Animate particles
        if (this.particlesEnabled && this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const velocities = this.particleSystem.geometry.attributes.velocity.array;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * this.particleSpeed;
                positions[i + 1] += velocities[i + 1] * this.particleSpeed;
                positions[i + 2] += velocities[i + 2] * this.particleSpeed;

                // Reset particles that are too far away
                const distance = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
                if (distance > 30) {
                    positions[i] = (Math.random() - 0.5) * 2;
                    positions[i + 1] = (Math.random() - 0.5) * 2;
                    positions[i + 2] = (Math.random() - 0.5) * 2;
                }
            }

            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Animate spotlights
        this.lights.spotlights.forEach((light, index) => {
            light.intensity = 0.6 + Math.sin(Date.now() * 0.001 + index) * 0.2;
        });

        // Update FPS counter
        this.updateFPS();

        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the enhanced gallery when the page loads
window.addEventListener('load', () => {
    new EnhancedArtGallery();
});