let scene, camera, renderer, tower, controls;
let numLevels = 10;
let heightSeries = 1;
let floorArea = 5000;
let isAutoRotating = true;

// Enhanced color palette with transparency
const colorPalette = [
    '#ff69b488', '#ff69b488', '#ff99cc88', '#ff99cc88', '#ff33cc88',
    '#ff66cc88', '#ff66cc88', '#ff99ff88', '#ff99ff88', '#ffccff88',
    '#ffccff88', '#ffb6c188', '#ffb6c188', '#ff99ff88', '#ff99ff88',
    '#ff66ff88', '#ff66ff88', '#ff33ff88', '#ff33ff88', '#ff00ff88',
    '#ff00ff88', '#cc00ff88', '#cc00ff88', '#9900ff88', '#9900ff88',
    '#6600ff88', '#6600ff88', '#3300ff88', '#3300ff88', '#0000ff88',
    '#0000ff88', '#0033ff88', '#0033ff88', '#0066ff88', '#0066ff88',
    '#0099ff88', '#0099ff88', '#00ccff88', '#00ccff88', '#00ffff88'
].map(color => {
    const c = new THREE.Color();
    c.setStyle(color);
    return c;
});

// Height series algorithms (20 different patterns)
const heightSeriesNames = [
    "Standard 10ft",
    "Linear Increase",
    "Linear Decrease",
    "Binary (8ft/12ft)",
    "Tri-Level (8ft/10ft/12ft)",
    "Penta-Level",
    "Golden Ratio",
    "Executive Top",
    "Grand Lobby",
    "Pyramid Up",
    "Pyramid Down",
    "Hour Glass",
    "Reverse Hour Glass",
    "Penthouse Suite",
    "Mezzanine Special",
    "Fibonacci Sequence",
    "Wave Pattern",
    "Mountain Range",
    "Urban Step-back",
    "Extreme Contrast"
];

const heightPatternNames = [
    'Standard 10ft',
    'Retail Ground 15ft',
    'Mixed-Use Pattern',
    'Hotel Layout',
    'Office Premium',
    'Residential Luxury',
    'Penthouse Suite',
    'Commercial Base',
    'Podium Design',
    'Sky Garden',
    'Mechanical Floor',
    'Transfer Level',
    'Amenity Floor',
    'Executive Level',
    'Double Height',
    'Mezzanine Style',
    'Atrium Space',
    'Observatory Deck',
    'Crown Level',
    'Spire Integration'
];

const heightSeriesPatterns = [
    // 1. Standard 10ft - All floors same height
    n => Array(n).fill(10),
    
    // 2. Linear Increase - Gradually increases from 8ft to 14ft
    n => Array(n).fill(0).map((_, i) => 8 + (6 * i / (n - 1 || 1))),
    
    // 3. Linear Decrease - Gradually decreases from 14ft to 8ft
    n => Array(n).fill(0).map((_, i) => 14 - (6 * i / (n - 1 || 1))),
    
    // 4. Binary - Alternates between 8ft and 12ft
    n => Array(n).fill(0).map((_, i) => i % 2 ? 12 : 8),
    
    // 5. Tri-Level - Cycles through 8ft, 10ft, and 12ft
    n => Array(n).fill(0).map((_, i) => [8, 10, 12][i % 3]),
    
    // 6. Penta-Level - Five different heights
    n => Array(n).fill(0).map((_, i) => [8, 9, 10, 11, 12][i % 5]),
    
    // 7. Golden Ratio - Each floor height is golden ratio of previous
    n => {
        let heights = [8];
        for(let i = 1; i < n; i++) {
            heights.push(Math.min(14, heights[i-1] * 1.618 % 6 + 8));
        }
        return heights;
    },
    
    // 8. Executive Top - Regular floors with taller top floors
    n => Array(n).fill(0).map((_, i) => i >= n-3 ? 14 : 10),
    
    // 9. Grand Lobby - Taller ground floor with regular upper floors
    n => Array(n).fill(0).map((_, i) => i === 0 ? 16 : 10),
    
    // 10. Pyramid Up - Heights increase towards middle then decrease
    n => Array(n).fill(0).map((_, i) => 8 + 6 * (1 - Math.abs(i - n/2)/(n/2))),
    
    // 11. Pyramid Down - Heights decrease towards middle then increase
    n => Array(n).fill(0).map((_, i) => 14 - 6 * (1 - Math.abs(i - n/2)/(n/2))),
    
    // 12. Hour Glass - Smaller in middle, larger at ends
    n => Array(n).fill(0).map((_, i) => 14 - 6 * Math.sin(Math.PI * i / (n-1))),
    
    // 13. Reverse Hour Glass - Larger in middle, smaller at ends
    n => Array(n).fill(0).map((_, i) => 8 + 6 * Math.sin(Math.PI * i / (n-1))),
    
    // 14. Penthouse Suite - Regular floors with extra tall top floor
    n => Array(n).fill(0).map((_, i) => i === n-1 ? 16 : 10),
    
    // 15. Mezzanine Special - Taller second floor
    n => Array(n).fill(0).map((_, i) => i === 1 ? 14 : 10),
    
    // 16. Fibonacci Sequence - Based on Fibonacci numbers
    n => {
        const fib = [8, 9, 10, 11, 12, 13, 14];
        return Array(n).fill(0).map((_, i) => fib[i % fib.length]);
    },
    
    // 17. Wave Pattern - Sinusoidal variation
    n => Array(n).fill(0).map((_, i) => 11 + 3 * Math.sin(2 * Math.PI * i / 8)),
    
    // 18. Mountain Range - Random peaks and valleys
    n => Array(n).fill(0).map((_, i) => {
        const phase = i / (n-1);
        return 11 + 3 * Math.sin(phase * 5) * Math.cos(phase * 3);
    }),
    
    // 19. Urban Step-back - Groups of 4 floors, each group slightly shorter
    n => Array(n).fill(0).map((_, i) => 14 - Math.floor(i/4) * 1.5),
    
    // 20. Extreme Contrast - Alternates between very low and very high
    n => Array(n).fill(0).map((_, i) => i % 3 === 0 ? 16 : (i % 3 === 1 ? 8 : 12))
];

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);
    scene.fog = new THREE.Fog(0xf8f9fa, 100, 200);
    
    const container = document.querySelector('.visualization-container');
    const aspect = container.clientWidth / container.clientHeight;
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('parametricCanvas'),
        antialias: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Controls setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Add hemisphere light for better ambient lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemiLight);

    // Ground plane with grid
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Create tower group
    tower = new THREE.Group();
    scene.add(tower);

    // Position camera
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Event listeners
    document.getElementById('numLevels').addEventListener('input', (e) => {
        numLevels = parseInt(e.target.value);
        e.target.nextElementSibling.textContent = numLevels;
        regenerateTower();
    });

    document.getElementById('heightSeries').addEventListener('input', (e) => {
        heightSeries = parseInt(e.target.value);
        const patternName = heightPatternNames[heightSeries - 1] || 'Custom Pattern';
        e.target.nextElementSibling.textContent = patternName;
        regenerateTower();
    });

    document.getElementById('floorArea').addEventListener('input', (e) => {
        floorArea = parseInt(e.target.value);
        const value = parseInt(e.target.value).toLocaleString();
        e.target.nextElementSibling.textContent = `${value} sf`;
        regenerateTower();
    });

    document.getElementById('resetCamera').addEventListener('click', () => {
        camera.position.set(20, 20, 20);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
    });

    document.getElementById('toggleAutoRotate').addEventListener('click', (e) => {
        isAutoRotating = !isAutoRotating;
        controls.autoRotate = isAutoRotating;
        e.currentTarget.classList.toggle('active');
    });

    document.getElementById('exportData').addEventListener('click', exportToCSV);

    regenerateTower();
    window.addEventListener('resize', onWindowResize, false);

    // Add consultation button functionality
    function initConsultationButtons() {
        const consultationButtons = document.querySelectorAll('.cta-button');
        const emailSubject = encodeURIComponent('Consultation Request for Automation Solutions');
        const emailBody = encodeURIComponent(
            'Hello,\n\n' +
            'I am interested in learning more about your automation solutions for architectural design. ' +
            'I would like to schedule a consultation to discuss how your services can benefit our projects.\n\n' +
            'Best regards'
        );
        const mailtoLink = `mailto:alireza.memaryan@gmail.com?subject=${emailSubject}&body=${emailBody}`;

        consultationButtons.forEach(button => {
            button.addEventListener('click', () => {
                window.location.href = mailtoLink;
            });
        });
    }

    initConsultationButtons();
}

function createFloor(width, depth, height, color, yPosition) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const floorMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff69b4,  // Hot pink
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
    });
    
    const floor = new THREE.Mesh(geometry, floorMaterial);
    
    // Add edges with emissive material
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xffb6c1,  // Light pink
        linewidth: 1
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    floor.add(edgeLines);
    
    floor.position.y = yPosition;
    floor.castShadow = true;
    floor.receiveShadow = true;
    
    return floor;
}

function updateHeightsList(heights) {
    const heightsList = document.getElementById('heightsList');
    heightsList.innerHTML = '';
    
    heights.forEach((height, index) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <span>Level ${index + 1}</span>
            <span>${height.toFixed(2)} ft</span>
        `;
        heightsList.appendChild(div);
    });
}

function regenerateTower() {
    while(tower.children.length > 0) {
        tower.remove(tower.children[0]);
    }
    
    // Get floor heights from selected pattern
    const floorHeights = heightSeriesPatterns[heightSeries - 1](numLevels);
    
    // Update heights list display
    updateHeightsList(floorHeights);
    
    // Calculate floor dimensions using golden ratio (1.618)
    const totalArea = floorArea;
    const width = Math.sqrt(totalArea / 1.618) / 30; // Scaled down
    const depth = width * 1.618;
    
    let currentHeight = 0;
    
    // Create floors
    for(let i = 0; i < numLevels; i++) {
        const height = floorHeights[i] / 10; // Scaled down
        const floor = createFloor(
            width,
            depth,
            height,
            colorPalette[i],
            currentHeight + (height / 2)
        );
        tower.add(floor);
        currentHeight += height;
    }
    
    // Center the tower
    tower.position.set(0, 0, 0);
}

function exportToCSV() {
    const floorHeights = heightSeriesPatterns[heightSeries - 1](numLevels);
    const csv = ['Level,Height (ft)'];
    floorHeights.forEach((height, index) => {
        csv.push(`${index + 1},${height.toFixed(2)}`);
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'floor_heights.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.querySelector('.visualization-container');
    const aspect = container.clientWidth / container.clientHeight;
    
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

init();
animate();
