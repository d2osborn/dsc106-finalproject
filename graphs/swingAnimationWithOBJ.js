import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js?module';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js?module';

// ─────────────── SETUP RENDERER, SCENE, CAMERA ───────────────
const container = document.querySelector('#animation-swing');
const width     = container.clientWidth;
const height    = container.clientHeight;
const scaleFactor = 2;
const newWidth  = width  * scaleFactor;
const newHeight = height * scaleFactor;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(newWidth, newHeight);
renderer.domElement.style.width  = '100%';
renderer.domElement.style.height = '100%';
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(45, newWidth / newHeight, 0.1, 1000);
camera.position.set(2.5, 2, 3.5);  // Adjusted position for better view
camera.lookAt(new THREE.Vector3(0.8, 1.05, 0.8));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping   = true;
controls.dampingFactor   = 0.05;
controls.minDistance     = 2;
controls.maxDistance     = 10;
controls.target.set(0.8, 1.05, 0.8);

// ─────────────── LIGHTING ───────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// ─────────────── GROUND ───────────────
const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x7CB342,
  roughness: 0.8,
  metalness: 0.2,
  side: THREE.DoubleSide
});

const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(4, 4);
groundMaterial.map = grassTexture;

const gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0xffffff);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

const aoMap = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big-nm.jpg');
groundMaterial.aoMap = aoMap;
groundMaterial.aoMapIntensity = 0.5;

const normalMap = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big-nm.jpg');
groundMaterial.normalMap = normalMap;
groundMaterial.normalScale.set(0.5, 0.5);

// ─────────────── GLOBALS FOR BAT, BALL, AND ATTACK ANGLE ───────────────
let batMeshObject = null;
let ballMeshObject = null;

// Keep track of the current attack angle visualization elements
let attackAngleGroup = null;
let attackAngleLine = null;
let baselineLine = null;
let triMesh = null;
let labelSprite = null;
let currentAttackAngle = null;

// Keep track of the current direction angle visualization elements
let directionAngleGroup = null;
let directionAngleLine = null;
let directionArc = null;
let directionBaselineLine = null; // Also need a baseline for direction
let currentDirectionAngle = null;

// ─────────────── LOAD 3D MODELS ───────────────
const gltfLoader = new GLTFLoader();

gltfLoader.load(
  'models/bat.glb',
  (gltf) => {
  const bat = gltf.scene;
    bat.traverse((child) => {
    if (child.isMesh && child.material && typeof child.material.onBuild !== 'function') {
      child.material.onBuild = () => {};
    }
  });
  bat.scale.set(3.0, 3.0, 3.0);
    bat.position.set(0.70, 1.10, 0.00);
  batMeshObject = bat;
  scene.add(batMeshObject);
  checkIfReady();
  },
  undefined,
  (err) => {
    console.error("Error loading bat.glb:", err);
  }
);

gltfLoader.load(
  'models/baseball.glb',
  (gltf) => {
  const ball = gltf.scene;
    ball.traverse((child) => {
    if (child.isMesh && child.material && typeof child.material.onBuild !== 'function') {
      child.material.onBuild = () => {};
    }
  });
  ball.scale.set(0.5, 0.5, 0.5);
    ball.position.set(0.90, 1.00, 1.60);
  ballMeshObject = ball;
  scene.add(ballMeshObject);
  checkIfReady();
  },
  undefined,
  (err) => {
    console.error("Error loading baseball.glb:", err);
  }
);

function checkIfReady() {
  if (batMeshObject && ballMeshObject) {
    // Once both models are loaded, start the animation loop.
    startAnimationLoop();
    // After models are loaded, signal that the 3D scene is ready to receive updates
    // The index.html script will call createAttackAngle3D once data is loaded and filtered
    console.log('3D models loaded. Ready for data updates.');
    
    // If we have already received the attack angle data from index.html,
    // create the 3D visualization now that models are ready.
    if (currentAttackAngle !== null) {
        console.log('Models loaded and attack angle received. Creating initial attack angle visualization.');
        createAttackAngle3D(currentAttackAngle);
    }
    
    // If we have already received the direction angle data from index.html,
    // create the 3D visualization now that models are ready.
    if (currentDirectionAngle !== null) {
        console.log('Models loaded and direction angle received. Creating initial direction angle visualization.');
        createDirectionAngle3D(currentDirectionAngle);
    }
  }
}

// Function to be called from index.html with the calculated attack angle
function updateAttackAngleVisualization(attackAngleDegrees) {
    console.log('Received attack angle data:', attackAngleDegrees);
    currentAttackAngle = attackAngleDegrees;
    // If models are already loaded, update the visualization immediately
    if (batMeshObject && ballMeshObject) {
        console.log('Models already loaded, updating attack angle visualization...');
        createAttackAngle3D(currentAttackAngle);
    } else {
        console.log('Models not yet loaded, will create attack angle visualization when ready.');
    }
}

// Expose this function globally so index.html can send data
window.updateAttackAngleVisualization = updateAttackAngleVisualization;

// Function to be called from index.html with the calculated direction angle
function updateDirectionAngleVisualization(directionAngleDegrees) {
    console.log('Received direction angle data in updateDirectionAngleVisualization:', directionAngleDegrees);
    currentDirectionAngle = directionAngleDegrees;
    // If models are already loaded, update the visualization immediately
    if (batMeshObject && ballMeshObject) {
        console.log('Models already loaded, attempting to update direction angle visualization...');
        createDirectionAngle3D(currentDirectionAngle);
    } else {
        console.log('Models not yet loaded, will create direction angle visualization when ready (from update).');
    }
}

// Expose this function globally so index.html can send data
window.updateDirectionAngleVisualization = updateDirectionAngleVisualization;

// ─────────────── CREATE 3D ATTACK ANGLE ───────────────
function createAttackAngle3D(attackAngleDegrees) {
    // Remove previous visualization elements if they exist
    if (attackAngleGroup) {
        scene.remove(attackAngleGroup);
    }

    // Create a new group for attack angle visualization
    attackAngleGroup = new THREE.Group();
    scene.add(attackAngleGroup);

    // Define the origin point for the visualization.
    // Keep it at the exact position of the ball model.
    const ballRadius = 0.1; // Radius of the ball
    const origin = new THREE.Vector3(
        ballMeshObject.position.x,
        ballMeshObject.position.y + 0.1, // Move up along Y axis (reduced by half)
        ballMeshObject.position.z
    );

    // Convert degrees to radians
    const theta = THREE.MathUtils.degToRad(attackAngleDegrees);

    // Define a horizontal baseline extending outwards from the origin (e.g., along +X).
    const visualizationSize = 0.5; // Consistent size
    const baselineDir = new THREE.Vector3(1, 0, 0); // Horizontal direction in the XZ plane (along +X)
    const baselineEnd = origin.clone().add(baselineDir.clone().multiplyScalar(visualizationSize));

    // Define the attack-angle endpoint by rotating upwards/downwards from the horizontal baseline in the XY plane.
    // The attackDir vector represents the direction and magnitude of the attack angle line.
    const attackDir = new THREE.Vector3(
        Math.cos(theta) * visualizationSize, // X component based on angle and size
        Math.sin(theta) * visualizationSize, // Y component based on angle and size
        0 // Z component is zero for rotation in XY plane
    );
    const attackEnd = origin.clone().add(attackDir);

    // Line geometry for baseline (white, thin)
    const baselineGeometry = new THREE.BufferGeometry().setFromPoints([origin, baselineEnd]);
    const baselineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    baselineLine = new THREE.Line(baselineGeometry, baselineMaterial);
    attackAngleGroup.add(baselineLine);

    // Attack line: bright red
    const attackGeometry = new THREE.BufferGeometry().setFromPoints([origin, attackEnd]);
    const attackMaterial = new THREE.LineBasicMaterial({ color: 0xEE3311, linewidth: 3 });
    attackAngleLine = new THREE.Line(attackGeometry, attackMaterial);
    attackAngleGroup.add(attackAngleLine);

    // Triangle fill between origin, baselineEnd, and attackEnd (golden-brown, transparent)
    const triVertices = new Float32Array([
        origin.x, origin.y, origin.z,
        baselineEnd.x, baselineEnd.y, baselineEnd.z,
        attackEnd.x, attackEnd.y, attackEnd.z,
    ]);
    const triGeometry = new THREE.BufferGeometry();
    triGeometry.setAttribute('position', new THREE.BufferAttribute(triVertices, 3));
    triGeometry.setIndex([0, 1, 2]); // Explicit indices for clarity

    const triMaterial = new THREE.MeshBasicMaterial({
        color: 0xb8860b,        // golden‐brown
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    triMesh = new THREE.Mesh(triGeometry, triMaterial);
    attackAngleGroup.add(triMesh);

    // Label: slightly above midpoint of attack line
    // Calculate midpoint along the angled line from the fixed origin
    const midAttackLine = origin.clone().add(attackDir.clone().multiplyScalar(0.5));
    // Position the label slightly above this midpoint
    const labelPosition = midAttackLine.clone();
    labelPosition.y += 0.1; // Adjust label height above the line

    // Create a new label sprite with the current angle value
    labelSprite = createTextLabel(`${attackAngleDegrees.toFixed(1)}°`, labelPosition.x, labelPosition.y, labelPosition.z);
    attackAngleGroup.add(labelSprite);
}

// ─────────────── CREATE 3D DIRECTION ANGLE ───────────────
// EXACT COPY of createAttackAngle3D, modified for direction angle
function createDirectionAngle3D(directionAngleDegrees) {
    console.log('createDirectionAngle3D called with angle:', directionAngleDegrees);
    // Remove previous visualization elements if they exist
    if (directionAngleGroup) {
        scene.remove(directionAngleGroup);
        console.log('Removed existing directionAngleGroup.');
    }

    // Create a new group for direction angle visualization
    directionAngleGroup = new THREE.Group();
    scene.add(directionAngleGroup);
    console.log('Created and added new directionAngleGroup to scene.', directionAngleGroup);

    // Define the origin point for the visualization.
    // Keep it at the exact position of the ball model.
    const ballRadius = 0.1; // Radius of the ball
    const origin = new THREE.Vector3(
        ballMeshObject.position.x,
        ballMeshObject.position.y + 0.1, // Move up along Y axis (reduced by half)
        ballMeshObject.position.z
    );

    // Convert degrees to radians (using direction angle)
    const theta = THREE.MathUtils.degToRad(directionAngleDegrees);

    // Define a horizontal baseline extending outwards from the origin (e.g., along +X).
    const visualizationSize = 0.5; // Consistent size (same as attack angle)
    const baselineDir = new THREE.Vector3(1, 0, 0); // Horizontal direction in the XZ plane (along +X)
    const baselineEnd = origin.clone().add(baselineDir.clone().multiplyScalar(visualizationSize));

    // Define the direction-angle endpoint by rotating upwards/downwards from the horizontal baseline in the XY plane.
    // The directionDir vector represents the direction and magnitude of the direction angle line.
    // This geometry will be horizontal, matching the attack angle code exactly.
    const directionDir = new THREE.Vector3(
        Math.cos(theta) * visualizationSize, // X component based on angle and size
        Math.sin(theta) * visualizationSize, // Y component based on angle and size
        0 // Z component is zero for rotation in XY plane
    );
    const directionEnd = origin.clone().add(directionDir);

    // Line geometry for baseline (white, thin) - Using a separate baseline for the direction group
    const directionBaselineGeometry = new THREE.BufferGeometry().setFromPoints([origin, baselineEnd]);
    const directionBaselineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    directionBaselineLine = new THREE.Line(directionBaselineGeometry, directionBaselineMaterial);
    directionAngleGroup.add(directionBaselineLine);
    console.log('Added direction baseline line to group.');

    // Direction line: bright green
    const directionGeometry = new THREE.BufferGeometry().setFromPoints([origin, directionEnd]);
    const directionMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }); // Green line
    directionAngleLine = new THREE.Line(directionGeometry, directionMaterial);
    directionAngleGroup.add(directionAngleLine);
    console.log('Added direction angle line to group.');

    // Direction angle arc: bright green
    const directionArcGeometry = new THREE.BufferGeometry();
    const directionArcPoints = [];
    const directionArcRadius = 0.3; // Same radius as attack angle arc
    const directionArcSegments = 32;
    for (let i = 0; i <= directionArcSegments; i++) {
        const angle = (i / directionArcSegments) * theta; // Use theta calculated from directionAngleDegrees
        directionArcPoints.push(
            new THREE.Vector3(
                origin.x + directionArcRadius * Math.cos(angle),
                origin.y,
                origin.z + directionArcRadius * Math.sin(angle)
            )
        );
    }
    directionArcGeometry.setFromPoints(directionArcPoints);
    directionArc = new THREE.Line(
        directionArcGeometry,
        new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }) // Green arc
    );
    directionAngleGroup.add(directionArc);
    console.log('Added direction angle arc to group.');

    // Visibility controlled by animate loop (currently always visible for debugging)
    directionAngleGroup.visible = true; // Currently always visible for debugging
    console.log('Direction angle group visibility set to true.');
}

// ─────────────── ANIMATION LOOP ───────────────
function startAnimationLoop() {
  // Compute bat rotation (keeping original orientation)
  const avgSwingTilt = 5; // static tilt—or compute dynamically if desired
  const baseRotation  = Math.PI / 2;                      // horizontal orientation
  const extraRotation = -THREE.MathUtils.degToRad(avgSwingTilt);
    const finalBatRotation = baseRotation + extraRotation;
    
  function animate() {
        requestAnimationFrame(animate);
    controls.update();

    // Apply bat rotation each frame
            batMeshObject.rotation.set(0, 0, 0);
            batMeshObject.rotation.x = finalBatRotation;

    // Keep ball orientation fixed
            ballMeshObject.rotation.set(0, 0, 0);

    // Update direction angle visibility based on camera angle
    if (directionAngleGroup) {
        // Temporarily make direction angle always visible for debugging
        directionAngleGroup.visible = true;
        }

        renderer.render(scene, camera);
    }

  animate();

    window.addEventListener('resize', () => {
        const w = container.clientWidth * scaleFactor;
        const h = container.clientHeight * scaleFactor;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

// ─────────────── HELPER FUNCTIONS ───────────────
function createTextLabel(text, x, y, z) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width  = 256;
    canvas.height = 64;
    // Yellow‐gold text
    context.font = 'Bold 40px Arial';
    context.fillStyle = '#ffd700'; // gold
    context.fillText(text, 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.5, 0.125, 1);
    return sprite;
}

