import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js?module';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js?module';

// Setup
const container = document.querySelector('#animation-swing');
const width = container.clientWidth;
const height = container.clientHeight;
const scaleFactor = 2;
const newWidth = width * scaleFactor;
const newHeight = height * scaleFactor;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(45, newWidth / newHeight, 0.1, 1000);
camera.position.set(2.5, 2, 3.5);
camera.lookAt(new THREE.Vector3(0.8, 1.05, 0.8));

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(newWidth, newHeight);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.target.set(0.8, 1.05, 0.8);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Grid
const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// Animation state
let bat = null;
let ball = null;
let attackAngleGroup = null;
let directionAngleGroup = null;
let currentTilt = 0;
let targetTilt = 0;
let isAnimating = false;
let animationStartTime = 0;

// Load models
const loader = new GLTFLoader();

// Load bat
loader.load('models/bat.glb', (gltf) => {
    bat = gltf.scene;
  bat.scale.set(3.0, 3.0, 3.0);
    bat.position.set(0.70, 0.70, 0.00);
    scene.add(bat);
    checkReady();
});

// Load ball
loader.load('models/baseball.glb', (gltf) => {
    ball = gltf.scene;
  ball.scale.set(0.5, 0.5, 0.5);
    ball.position.set(0.90, 0.70, 1.60);
    scene.add(ball);
    checkReady();
});

function checkReady() {
    if (bat && ball) {
        startAnimation();
    }
}

// Animation function
function startAnimation() {
  function animate() {
    requestAnimationFrame(animate);
    controls.update();

        if (isAnimating) {
            const now = performance.now();
            const elapsed = now - animationStartTime;
            const duration = 1000; // 1 second
            const progress = Math.min(elapsed / duration, 1);

            // Ease function
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // Update tilt
            currentTilt = currentTilt + (targetTilt - currentTilt) * easeProgress;

            // Update bat rotation
            if (bat) {
                bat.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(currentTilt);
            }

            // Update ball position
            if (ball) {
                const ballProgress = Math.min(progress * 2, 1); // Ball moves faster
                ball.position.x = 0.90 - (0.90 - 0.85) * ballProgress;
                ball.position.z = 1.60 - (1.60 - 0.80) * ballProgress;
            }

            // Show angles at contact
            if (progress >= 0.5 && progress <= 0.7) {
                if (attackAngleGroup) attackAngleGroup.visible = true;
                if (directionAngleGroup) directionAngleGroup.visible = true;
            } else {
                if (attackAngleGroup) attackAngleGroup.visible = false;
                if (directionAngleGroup) directionAngleGroup.visible = false;
            }

            if (progress >= 1) {
                isAnimating = false;
                // Reset positions
                if (bat) bat.rotation.x = Math.PI / 2;
                if (ball) {
                    ball.position.set(0.90, 0.70, 1.60);
                }
            }
    }

    renderer.render(scene, camera);
  }

  animate();
}

// Update functions
function updateSwingPathTilt(tiltDegrees) {
    console.log('Updating tilt to:', tiltDegrees);
    targetTilt = tiltDegrees;
    isAnimating = true;
    animationStartTime = performance.now();
}

function updateAttackAngleVisualization(angle) {
    if (!attackAngleGroup) {
        attackAngleGroup = new THREE.Group();
        scene.add(attackAngleGroup);
        // Add attack angle visualization elements here
    }
}

function updateDirectionAngleVisualization(angle) {
    if (!directionAngleGroup) {
        directionAngleGroup = new THREE.Group();
        scene.add(directionAngleGroup);
        // Add direction angle visualization elements here
    }
}

// Expose functions globally
window.updateSwingPathTilt = updateSwingPathTilt;
window.updateAttackAngleVisualization = updateAttackAngleVisualization;
window.updateDirectionAngleVisualization = updateDirectionAngleVisualization;

// Handle window resize
    window.addEventListener('resize', () => {
        const w = container.clientWidth * scaleFactor;
        const h = container.clientHeight * scaleFactor;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
