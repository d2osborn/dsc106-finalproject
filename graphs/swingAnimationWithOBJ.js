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
camera.position.set(2.5, 0.5, 3.5);  // Closer and slightly lower to the right
camera.lookAt(new THREE.Vector3(0.8, 0.5, 0.8));  // Adjusted lookAt point

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping   = true;
controls.dampingFactor   = 0.05;
controls.minDistance     = 2;
controls.maxDistance     = 10;
controls.target.set(0.8, 0.5, 0.8);  // Lowered target point

// ─────────────── LIGHTING ───────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// ─────────────── GROUND ───────────────
const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
gridHelper.position.y = -1.0;  // Lowered grid from -0.5 to -1.0
scene.add(gridHelper);

// ─────────────── GLOBALS FOR BAT AND ATTACK ANGLE ───────────────
let batMeshObject = null;

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
let directionBaselineLine = null;
let currentDirectionAngle = null;

// Add these variables at the top with other globals
let angleVisualizationOffset = {
    x: 0.2,
    y: 0,    // was 0.0, moved up by 0.5
    z: 1    // was 2.2, increased by 0.05
};

// ─────────────── LOAD 3D MODELS ───────────────
const gltfLoader = new GLTFLoader();

gltfLoader.load(
  'models/ballandbat.glb',
  (gltf) => {
    const bat = gltf.scene;
    bat.traverse((child) => {
      if (child.isMesh && child.material && typeof child.material.onBuild !== 'function') {
        child.material.onBuild = () => {};
      }
    });
    bat.scale.set(3.0, 3.0, 3.0);
    bat.position.set(0.7, 0.7, 0.0);  // Updated to match the provided position
    bat.rotation.x = THREE.MathUtils.degToRad(90);
    bat.rotation.y = THREE.MathUtils.degToRad(180);
    batMeshObject = bat;
    scene.add(batMeshObject);
    checkIfReady();
  },
  undefined,
  (err) => {
    console.error("Error loading ballandbat.glb:", err);
  }
);

function checkIfReady() {
  if (batMeshObject) {
    startAnimationLoop();
    console.log('3D model loaded. Ready for data updates.');
    
    // Create the tilt meter
    createTiltMeter();
    
    if (currentAttackAngle !== null) {
      console.log('Model loaded and attack angle received. Creating initial attack angle visualization.');
      createAttackAngle3D(currentAttackAngle);
    }
    
    if (currentDirectionAngle !== null) {
      console.log('Model loaded and direction angle received. Creating initial direction angle visualization.');
      createDirectionAngle3D(currentDirectionAngle);
    }
  }
}

// Function to be called from index.html with the calculated attack angle
function updateAttackAngleVisualization(attackAngleDegrees) {
    console.log('Received attack angle data:', attackAngleDegrees);
    currentAttackAngle = attackAngleDegrees;
    // If models are already loaded, update the visualization immediately
    if (batMeshObject) {
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
    if (batMeshObject) {
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
    if (attackAngleGroup) { scene.remove(attackAngleGroup); }
    attackAngleGroup = new THREE.Group();
    attackAngleGroup.position.set(0, 0.2, 0.1);  // Moved up from 0 to 0.5
    scene.add(attackAngleGroup);
  
    // Use bat's position as origin with offset
    const origin = new THREE.Vector3(
        batMeshObject.position.x + angleVisualizationOffset.x,
        batMeshObject.position.y + angleVisualizationOffset.y,
        batMeshObject.position.z + angleVisualizationOffset.z
    );
    // Use this origin directly for the baseline
    const baselineOrigin = origin.clone();
    const visualizationSize = 0.5;
    const baselineDir = new THREE.Vector3(1, 0, 0);
    const baselineEnd = baselineOrigin.clone().add(baselineDir.clone().multiplyScalar(visualizationSize));
    // Create a thicker yellow baseline line
    const baselineGeometry = new THREE.BufferGeometry().setFromPoints([baselineOrigin, baselineEnd]);
    const baselineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    baselineLine = new THREE.Line(baselineGeometry, baselineMaterial);
    attackAngleGroup.add(baselineLine);
  
    // Define the attack-angle endpoint
    const theta = THREE.MathUtils.degToRad(attackAngleDegrees);
    const attackDir = new THREE.Vector3(
        Math.cos(theta) * visualizationSize,
        Math.sin(theta) * visualizationSize,
        0
    );
    const attackEnd = origin.clone().add(attackDir);
  
    // Line geometry for baseline (white, thin)
    const shaftRadius = 0.005;  // Reduced from 0.02 to make it much skinnier
  
    // Create arrow shaft as a cylinder
    const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, visualizationSize, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    
    // Position and rotate the shaft
    shaft.position.copy(origin.clone().add(attackDir.clone().multiplyScalar(0.5)));
    const shaftDirection = attackDir.clone().normalize();
    shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shaftDirection);
    attackAngleGroup.add(shaft);
  
    // Create arrow head
    const arrowHeadLength = 0.08;
    const arrowHeadWidth = 0.03;
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
    if (directionAngleGroup) { scene.remove(directionAngleGroup); }
    directionAngleGroup = new THREE.Group();
    directionAngleGroup.position.set(0, 0.2, 0.1);  // Moved up from 0 to 0.5
    scene.add(directionAngleGroup);
  
    // Use bat's position as origin with offset
    const origin = new THREE.Vector3(
        batMeshObject.position.x + angleVisualizationOffset.x,
        batMeshObject.position.y + angleVisualizationOffset.y,
        batMeshObject.position.z + angleVisualizationOffset.z
    );
    const baselineOrigin = origin.clone();
    const visualizationSize = 0.5;
    const baselineDir = new THREE.Vector3(1, 0, 0);
    const baselineEnd = baselineOrigin.clone().add(baselineDir.clone().multiplyScalar(visualizationSize));
    // Create a thicker yellow baseline line
    const baselineGeometry = new THREE.BufferGeometry().setFromPoints([baselineOrigin, baselineEnd]);
    const baselineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    directionBaselineLine = new THREE.Line(baselineGeometry, baselineMaterial);
    directionAngleGroup.add(directionBaselineLine);
  
    // Convert degrees to radians
    const theta = THREE.MathUtils.degToRad(directionAngleDegrees);
  
    // Define the direction angle line (horizontal rotation from X-axis)
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
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyPress);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

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

function updateSwingPathTiltVisual(swingTiltDegrees) {
    // Store base rotation for bat if not already stored
    if (batMeshObject && batMeshObject.userData.baseRotationX === undefined) {
        batMeshObject.userData.baseRotationX = batMeshObject.rotation.x;
    }

    // Compute extra rotation (in radians) for the bat - subtract half the tilt from normal tilt
    const extraRotation = THREE.MathUtils.degToRad(swingTiltDegrees - (swingTiltDegrees / 2));
    if (batMeshObject) {
        batMeshObject.rotation.x = THREE.MathUtils.degToRad(90) + extraRotation;
        
        // Update tilt meter if it exists
        if (batMeshObject.userData.tiltMeter) {
            batMeshObject.userData.tiltMeter.rotation.z = Math.PI / 2 + extraRotation;
            
            // Update the text label with yellow color
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            context.font = 'Bold 40px Arial';
            context.fillStyle = '#ffff00'; // Changed to yellow
            context.fillText(`${swingTiltDegrees.toFixed(1)}°`, 10, 40);

            const texture = new THREE.CanvasTexture(canvas);
            batMeshObject.userData.tiltLabel.material.map = texture;
            batMeshObject.userData.tiltLabel.material.needsUpdate = true;
        }

        // Update the angle visualization position based on tilt
        if (currentAttackAngle !== null) {
            // Simple linear scaling for y-axis movement
            const yOffset = (swingTiltDegrees / 30); // Divide by 30 for more subtle movement
            angleVisualizationOffset.y = 0.0 - yOffset; // Changed from 0.45 to 0.0
            
            // Simple linear scaling for z-axis movement with smaller increment
            const zOffset = (swingTiltDegrees / 60); // Changed from 40 to 60 for smaller increment
            angleVisualizationOffset.z = 2.2 - zOffset; // Changed from 2.0 to 2.2
            
            // Update the visualizations
            createAttackAngle3D(currentAttackAngle);
            if (currentDirectionAngle !== null) {
                createDirectionAngle3D(currentDirectionAngle);
            }
        }
    }
    console.log(`Updated swing path tilt visualization: swingTiltDegrees=${swingTiltDegrees}`);
}

// Expose the function to be called from outside
window.updateSwingPathTilt = updateSwingPathTiltVisual;

function createTiltMeter() {
    if (!batMeshObject) return;
    
    // Remove old meter if it exists
    if (batMeshObject.userData.tiltMeter) {
        batMeshObject.remove(batMeshObject.userData.tiltMeter);
    }

    // Create a group for the meter
    const meterGroup = new THREE.Group();
    
    // Create the meter line (red line)
    const lineLength = 0.3;
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(lineLength, 0, 0)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    const meterLine = new THREE.Line(lineGeometry, lineMaterial);
    meterGroup.add(meterLine);

    // Create the text label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.font = 'Bold 40px Arial';
    context.fillStyle = '#ff0000';
    context.fillText('0°', 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const labelSprite = new THREE.Sprite(material);
    labelSprite.position.set(lineLength + 0.1, 0, 0);
    labelSprite.scale.set(0.5, 0.125, 1);
    meterGroup.add(labelSprite);

    // Position the meter at the bottom of the bat handle
    meterGroup.position.set(0, -0.8, 0);
    meterGroup.rotation.z = Math.PI / 2; // Rotate to be horizontal

    batMeshObject.add(meterGroup);
    batMeshObject.userData.tiltMeter = meterGroup;
    batMeshObject.userData.tiltLabel = labelSprite;
}

// Add this function after the other helper functions
function handleKeyPress(event) {
    const moveAmount = 0.1; // Amount to move per keypress
    
    switch(event.key.toLowerCase()) {
        case 'arrowright':
            angleVisualizationOffset.x += moveAmount;
            break;
        case 'arrowleft':
            angleVisualizationOffset.x -= moveAmount;
            break;
        case 'arrowup':
            angleVisualizationOffset.y += moveAmount;
            break;
        case 'arrowdown':
            angleVisualizationOffset.y -= moveAmount;
            break;
        case 'a': // Move forward
            angleVisualizationOffset.z += moveAmount;
            break;
        case 'd': // Move backward
            angleVisualizationOffset.z -= moveAmount;
            break;
        case 'p':
            // Copy parameters to clipboard
            const params = {
                offset: angleVisualizationOffset,
                batPosition: batMeshObject.position,
                attackAngle: currentAttackAngle,
                directionAngle: currentDirectionAngle
            };
            navigator.clipboard.writeText(JSON.stringify(params, null, 2))
                .then(() => console.log('Parameters copied to clipboard'))
                .catch(err => console.error('Failed to copy parameters:', err));
            break;
    }
    
    // Update visualizations if they exist
    if (currentAttackAngle !== null) {
        createAttackAngle3D(currentAttackAngle);
    }
    if (currentDirectionAngle !== null) {
        createDirectionAngle3D(currentDirectionAngle);
    }
}

// Initialize the scene
init();

// Set default values for initial load
const defaultValues = {
    attack_angle: 10,  // Default attack angle
    attack_direction: 5,  // Default direction angle
    swing_path_tilt: 8  // Default swing path tilt
};

// Apply default values
updateAttackAngleVisualization(defaultValues.attack_angle);
updateDirectionAngleVisualization(defaultValues.attack_direction);
updateSwingPathTilt(defaultValues.swing_path_tilt);

// Start animation loop
animate();