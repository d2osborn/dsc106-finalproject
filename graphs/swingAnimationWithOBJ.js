import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js?module';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js?module';

// Get the animation container
const container = document.querySelector('#animation-swing');
const width = container.clientWidth;
const height = container.clientHeight;
const scaleFactor = 2; // enlarge the rendering area
const newWidth = width * scaleFactor;
const newHeight = height * scaleFactor;

// Create renderer, scene, and camera
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(newWidth, newHeight);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
// Zoom out a bit more: reposition camera farther away from bat’s area
const camera = new THREE.PerspectiveCamera(45, newWidth / newHeight, 0.1, 1000);
camera.position.set(0, 1, 5);
camera.lookAt(new THREE.Vector3(-0.35, 0.2, 0));  // Focus near bat’s meeting zone

// Add lights
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 0.8);
directional.position.set(5, 10, 7);
scene.add(directional);

// Optional grid helper as ground reference
const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
grid.position.y = -1.5;
scene.add(grid);

// Create an overlay for the 2D attack-angle SVG effect
const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.pointerEvents = 'none';
container.appendChild(overlay);

const svgNS = "http://www.w3.org/2000/svg";
const angleSvg = document.createElementNS(svgNS, "svg");
angleSvg.setAttribute("viewBox", "0 0 200 200");
angleSvg.style.position = 'absolute';
angleSvg.style.bottom = '10px';
angleSvg.style.left = '10px';
angleSvg.style.width = '200px';
angleSvg.style.height = '200px';
angleSvg.style.opacity = '0';
overlay.appendChild(angleSvg);

function showAttackAngle2D(angleDegrees) {
  // Clear previous SVG content
  while (angleSvg.firstChild) angleSvg.removeChild(angleSvg.firstChild);
  const centerX = 100, centerY = 100, r = 80;
  const zeroAngle = Math.PI;
  const blackX = centerX + r * Math.cos(zeroAngle);
  const blackY = centerY - r * Math.sin(zeroAngle);
  const baseline = document.createElementNS(svgNS, "line");
  baseline.setAttribute("x1", centerX);
  baseline.setAttribute("y1", centerY);
  baseline.setAttribute("x2", blackX);
  baseline.setAttribute("y2", blackY);
  baseline.setAttribute("stroke", "#111");
  baseline.setAttribute("stroke-width", "2");
  baseline.setAttribute("stroke-dasharray", "4,4");
  angleSvg.appendChild(baseline);
  const theta = angleDegrees * Math.PI / 180;
  const redX = centerX + r * Math.cos(zeroAngle - theta);
  const redY = centerY - r * Math.sin(zeroAngle - theta);
  const redLine = document.createElementNS(svgNS, "line");
  redLine.setAttribute("x1", centerX);
  redLine.setAttribute("y1", centerY);
  redLine.setAttribute("x2", redX);
  redLine.setAttribute("y2", redY);
  redLine.setAttribute("stroke", "#EE3311");
  redLine.setAttribute("stroke-width", "3");
  angleSvg.appendChild(redLine);
  const poly = document.createElementNS(svgNS, "polygon");
  poly.setAttribute("points", `${centerX},${centerY} ${blackX},${blackY} ${redX},${redY}`);
  poly.setAttribute("fill", "#b8860b");
  poly.setAttribute("opacity", "0.5");
  angleSvg.appendChild(poly);
  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", (centerX + blackX + redX)/3);
  text.setAttribute("y", (centerY + blackY + redY)/3);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", "#000");
  text.setAttribute("font-size", "16px");
  text.textContent = angleDegrees.toFixed(1) + "°";
  angleSvg.appendChild(text);
  angleSvg.style.transition = "none";
  angleSvg.style.opacity = "1";
  setTimeout(() => {
    angleSvg.style.transition = "opacity 0.5s";
    angleSvg.style.opacity = "0";
  }, 1000);
}

// Use GLTFLoader for loading models
const gltfLoader = new GLTFLoader();
let batMeshObject = null;
let ballMeshObject = null;

gltfLoader.load('models/bat.glb', (gltf) => {
  console.log('Bat model loaded successfully');
  const bat = gltf.scene;
  bat.traverse(child => {
    if (child.isMesh && child.material && typeof child.material.onBuild !== 'function') {
      child.material.onBuild = () => {};
    }
  });
  // Increase bat size significantly and reposition it on the RIGHT side
  bat.scale.set(3.0, 3.0, 3.0);
  // Initial bat position on right
  bat.position.set(2, 0.2, 0);
  batMeshObject = bat;
  scene.add(batMeshObject);
  checkIfReady();
}, undefined, err => { console.error("Error loading bat.glb:", err); });

gltfLoader.load('models/baseball.glb', (gltf) => {
  console.log('Baseball model loaded successfully');
  const ball = gltf.scene;
  ball.traverse(child => {
    if (child.isMesh && child.material && typeof child.material.onBuild !== 'function') {
      child.material.onBuild = () => {};
    }
  });
  // Reduce ball size and reposition it on the LEFT side
  ball.scale.set(0.5, 0.5, 0.5);
  ball.position.set(-2, 0.2, 0);
  ballMeshObject = ball;
  scene.add(ballMeshObject);
  checkIfReady();
}, undefined, err => { console.error("Error loading baseball.glb:", err); });

function checkIfReady() {
  if (batMeshObject && ballMeshObject) {
    console.log('Both models loaded, starting animation');
    startAnimationLoop();
  }
}

function startAnimationLoop() {
    let avgBatSpeed = (window.__statcast_full_data__ && d3.mean(window.__statcast_full_data__, d => +d.bat_speed)) || 90;
    let avgSwingTilt = (window.__statcast_full_data__ && d3.mean(window.__statcast_full_data__, d => +d.swing_path_tilt)) || 5;
    let swingTime = 4000 - avgBatSpeed * 10;
    swingTime = Math.max(1000, Math.min(swingTime, 3000));

    // Changed base rotation on the X axis to +90° (Math.PI/2) so the bat rotates the other way
    const baseRotation = Math.PI/2; // +90° on x-axis
    const extraRotation = -THREE.MathUtils.degToRad(avgSwingTilt); // additional tilt from swing data
    const finalBatRotation = baseRotation + extraRotation;
    
    // Final and initial positions (unchanged)
    const finalBatPosition = new THREE.Vector3(0, 0.2, 0);
    const finalBallPosition = new THREE.Vector3(-0.7, 0.2, 0);
    const initBatPosition = new THREE.Vector3(2, 0.2, 0);
    const initBallPosition = new THREE.Vector3(-2, 0.2, 0);
    
    function animate(time) {
        requestAnimationFrame(animate);
        const tCycle = (time % swingTime) / swingTime;
        const contactThreshold = 0.6;
        if (tCycle < contactThreshold) {
            const tApproach = tCycle / contactThreshold;
            const currentBatRotation = THREE.MathUtils.lerp(baseRotation, finalBatRotation, tApproach);
            batMeshObject.rotation.set(0, 0, 0);
            batMeshObject.position.copy(initBatPosition.clone().lerp(finalBatPosition, tApproach));
            batMeshObject.rotation.x = currentBatRotation;
            
            const tApproachBall = (tCycle / contactThreshold) * 0.8;
            ballMeshObject.position.copy(initBallPosition.clone().lerp(finalBallPosition, tApproachBall));
            ballMeshObject.rotation.set(0, 0, 0);
            // ...existing ghost clones code...
        } else {
            // Freeze positions once edges contact
            batMeshObject.position.copy(finalBatPosition);
            batMeshObject.rotation.set(0, 0, 0);
            batMeshObject.rotation.x = finalBatRotation;
            ballMeshObject.position.copy(finalBallPosition);
            ballMeshObject.rotation.set(0, 0, 0);
        }
        renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
    window.addEventListener('resize', () => {
        const w = container.clientWidth * scaleFactor;
        const h = container.clientHeight * scaleFactor;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}
