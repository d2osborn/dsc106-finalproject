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
const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

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
    bat.position.set(0.70, 0.70, 0.00);
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
    ball.position.set(0.90, 0.70, 1.60);
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
    console.log('updateDirectionAngleVisualization called.');
    console.log('Received direction angle data in updateDirectionAngleVisualization:', directionAngleDegrees);
    currentDirectionAngle = directionAngleDegrees;
    // If models are already loaded, update the visualization immediately
    if (batMeshObject && ballMeshObject) {
        console.log('Models already loaded, attempting to update direction angle visualization with angle:', currentDirectionAngle);
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
    const origin = new THREE.Vector3(
        ballMeshObject.position.x,
        ballMeshObject.position.y + 0.1,
        ballMeshObject.position.z
    );

    // Convert degrees to radians
    const theta = THREE.MathUtils.degToRad(attackAngleDegrees);

    // Define a horizontal baseline extending outwards from the origin
    const visualizationSize = 0.5;
    const baselineDir = new THREE.Vector3(1, 0, 0);
    const baselineEnd = origin.clone().add(baselineDir.clone().multiplyScalar(visualizationSize));

    // Define the attack-angle endpoint
    const attackDir = new THREE.Vector3(
        Math.cos(theta) * visualizationSize,
        Math.sin(theta) * visualizationSize,
        0
    );
    const attackEnd = origin.clone().add(attackDir);

    // Line geometry for baseline (white, thin)
    const baselineGeometry = new THREE.BufferGeometry().setFromPoints([origin, baselineEnd]);
    const baselineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    baselineLine = new THREE.Line(baselineGeometry, baselineMaterial);
    attackAngleGroup.add(baselineLine);

    // Create arrow for attack angle
    const arrowLength = visualizationSize;
    const arrowHeadLength = 0.08;
    const arrowHeadWidth = 0.03;
    const shaftRadius = 0.005;  // Reduced from 0.02 to make it much skinnier

    // Create arrow shaft as a cylinder
    const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, arrowLength, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    
    // Position and rotate the shaft
    shaft.position.copy(origin.clone().add(attackDir.clone().multiplyScalar(0.5)));
    const shaftDirection = attackDir.clone().normalize();
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shaftDirection);
    attackAngleGroup.add(shaft);

    // Create arrow head
    const arrowHeadGeometry = new THREE.ConeGeometry(arrowHeadWidth, arrowHeadLength, 8);
    const arrowHeadMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowHeadMaterial);
    
    // Position and rotate arrow head
    arrowHead.position.copy(attackEnd);
    const arrowDirection = attackDir.clone().normalize();
    arrowHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDirection);
    attackAngleGroup.add(arrowHead);

    // Label: at the end of the attack angle arrow, with offset
    const labelPositionAttack = attackEnd.clone().add(attackDir.clone().normalize().multiplyScalar(0.05)); // Offset outwards

    // Create a new label sprite with red text
    labelSprite = createTextLabel(`${attackAngleDegrees.toFixed(1)}°`, labelPositionAttack.x, labelPositionAttack.y, labelPositionAttack.z, 0xff0000);
    attackAngleGroup.add(labelSprite);
}

// ─────────────── CREATE 3D DIRECTION ANGLE ───────────────
function createDirectionAngle3D(directionAngleDegrees) {
    console.log('createDirectionAngle3D called with angle:', directionAngleDegrees);
    // Remove previous visualization elements if they exist
    if (directionAngleGroup) {
        scene.remove(directionAngleGroup);
    }

    // Create a new group for direction angle visualization
    directionAngleGroup = new THREE.Group();
    scene.add(directionAngleGroup);

    // Define the origin point for the visualization (same as ball position)
    const origin = new THREE.Vector3(
        ballMeshObject.position.x,
        ballMeshObject.position.y + 0.1,
        ballMeshObject.position.z
    );

    // Convert degrees to radians
    const theta = THREE.MathUtils.degToRad(directionAngleDegrees);

    // Define the direction angle line (horizontal rotation from X-axis)
    const visualizationSize = 0.5;
    const directionDir = new THREE.Vector3(
        Math.cos(theta) * visualizationSize,
        0, // Direction angle rotates in the XZ plane (horizontal)
        Math.sin(theta) * visualizationSize
    );
    const directionEnd = origin.clone().add(directionDir);

    // Create arrow for direction angle
    const arrowLength = visualizationSize;
    const arrowHeadLength = 0.08;
    const arrowHeadWidth = 0.03;
    const shaftRadius = 0.005;  // Skinny shaft like attack angle

    // Create arrow shaft as a cylinder
    const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, arrowLength, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    
    // Position and rotate the shaft
    shaft.position.copy(origin.clone().add(directionDir.clone().multiplyScalar(0.5)));
    const shaftDirection = directionDir.clone().normalize();
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shaftDirection);
    directionAngleGroup.add(shaft);

    // Create arrow head
    const arrowHeadGeometry = new THREE.ConeGeometry(arrowHeadWidth, arrowHeadLength, 8);
    const arrowHeadMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowHeadMaterial);
    
    // Position and rotate arrow head
    arrowHead.position.copy(directionEnd);
    const arrowDirection = directionDir.clone().normalize();
    arrowHead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrowDirection);
    directionAngleGroup.add(arrowHead);

    // Label: at the end of the direction angle arrow, with offset
    const labelPositionDirection = directionEnd.clone().add(directionDir.clone().normalize().multiplyScalar(0.05)); // Offset outwards

    // Create a new label sprite with green text showing just the angle
    const labelText = `${directionAngleDegrees.toFixed(1)}°`;
    labelSprite = createTextLabel(labelText, labelPositionDirection.x, labelPositionDirection.y, labelPositionDirection.z, 0x00ff00);
    directionAngleGroup.add(labelSprite);
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

    // Restore bat rotation
    batMeshObject.rotation.set(0, 0, 0);
    batMeshObject.rotation.x = finalBatRotation;

    // Keep ball orientation fixed
    ballMeshObject.rotation.set(0, 0, 0);

    // Update direction angle visibility based on camera angle
    if (directionAngleGroup) {
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
function createTextLabel(text, x, y, z, color = 0xffd700) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.font = 'Bold 40px Arial';
    context.fillStyle = '#' + color.toString(16).padStart(6, '0');
    context.fillText(text, 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.5, 0.125, 1);
    return sprite;
}

