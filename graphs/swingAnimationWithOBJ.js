import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.156.0/examples/jsm/loaders/GLTFLoader.js';

// Get the animation container
const container = document.querySelector('#animation-swing');
const width = container.clientWidth;
const height = container.clientHeight;

// Create renderer, scene, and camera
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Set white background
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0, 0);

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

// Helper to process bat.glb so that its handle end becomes the pivot at (0,0,0)
function processBatObject(obj) {
  const bbox = new THREE.Box3().setFromObject(obj);
  const minX = bbox.min.x;
  obj.traverse(child => { 
    if (child.isMesh) { 
      child.geometry.translate(-minX, 0, 0);
      // Ensure materials are properly set
      if (child.material) {
        child.material.needsUpdate = true;
      }
    } 
  });
  const newLength = 3;
  const width = bbox.max.x - minX;
  const scaleVal = newLength / width;
  obj.scale.set(scaleVal, scaleVal, scaleVal);
  return obj;
}

// Helper to process ball.glb so its center is moved to (0,0,0) then positioned at x = -3.
function processBallObject(obj) {
  const bbox = new THREE.Box3().setFromObject(obj);
  const diameter = bbox.max.x - bbox.min.x;
  const desiredDiam = 0.4;
  const scaleVal = desiredDiam / diameter;
  obj.scale.setScalar(scaleVal);
  const newBbox = new THREE.Box3().setFromObject(obj);
  const center = new THREE.Vector3();
  newBbox.getCenter(center);
  obj.traverse(child => { 
    if (child.isMesh) { 
      child.geometry.translate(-center.x, -center.y, -center.z);
      // Ensure materials are properly set
      if (child.material) {
        child.material.needsUpdate = true;
      }
    } 
  });
  const radius = (newBbox.max.x - newBbox.min.x) / 2;
  obj.position.set(-3, radius, 0);
  return obj;
}

// Use GLTFLoader for loading models
const gltfLoader = new GLTFLoader();
let batMeshObject = null;
let ballMeshObject = null;

// Load the bat model
gltfLoader.load('models/bat.glb', (gltf) => {
  console.log('Bat model loaded successfully');
  batMeshObject = processBatObject(gltf.scene);
  batMeshObject.position.set(0, 0.5, 0);
  scene.add(batMeshObject);
  checkIfReady();
}, 
(progress) => {
  console.log('Loading bat model:', (progress.loaded / progress.total * 100) + '%');
},
(err) => {
  console.error("Error loading bat.glb:", err);
});

// Load the ball model
gltfLoader.load('models/baseball.glb', (gltf) => {
  console.log('Ball model loaded successfully');
  ballMeshObject = processBallObject(gltf.scene);
  scene.add(ballMeshObject);
  checkIfReady();
},
(progress) => {
  console.log('Loading ball model:', (progress.loaded / progress.total * 100) + '%');
},
(err) => {
  console.error("Error loading baseball.glb:", err);
});

function checkIfReady() {
  if (batMeshObject && ballMeshObject) {
    console.log('Both models loaded, starting animation');
    startAnimationLoop();
  }
}

function startAnimationLoop() {
  const swingTime = 2000;   // 2 seconds per swing cycle
  const hitMoment = 0.6;    // Contact occurs at 60% of the swing cycle
  const maxGhosts = 30;
  const ghostBats = [];
  let leagueAvgAngle = 5;
  
  function animate(time) {
    requestAnimationFrame(animate);
    const tCycle = (time % swingTime) / swingTime;
    const eased = 0.5 - Math.cos(tCycle * Math.PI) / 2;
    const startRad = THREE.MathUtils.degToRad(-45);
    const endRad = THREE.MathUtils.degToRad(leagueAvgAngle);
    const currentRad = THREE.MathUtils.lerp(startRad, endRad, eased);
    
    // Reset bat position and apply rotation
    batMeshObject.rotation.set(0, 0, 0);
    batMeshObject.position.set(0, 0.5, 0);
    batMeshObject.rotation.z = currentRad;
    
    // Handle ghost bats
    if (ghostBats.length < maxGhosts) {
      const ghost = batMeshObject.clone();
      ghost.traverse(child => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.3;
        }
      });
      ghostBats.push(ghost);
      scene.add(ghost);
    }
    
    // Update ghost bats
    for (let i = ghostBats.length - 1; i >= 0; i--) {
      ghostBats[i].traverse(child => {
        if (child.isMesh) {
          child.material.opacity *= 0.95;
        }
      });
      const mesh = ghostBats[i].getObjectByProperty('isMesh', true);
      if (mesh && mesh.material.opacity < 0.02) {
        scene.remove(ghostBats[i]);
        ghostBats.splice(i, 1);
      }
    }
    
    // Animate ball
    if (tCycle < hitMoment) {
      const tApproach = tCycle / hitMoment;
      ballMeshObject.position.set(-3 + 3 * tApproach, 0.2, 0);
      ballMeshObject.rotation.set(0, 0, 0);
    } else {
      const tLaunch = (tCycle - hitMoment) / (1 - hitMoment);
      ballMeshObject.position.set(
        0,
        0.2 + 1.0 * tLaunch,
        -2 + 7 * tLaunch
      );
      ballMeshObject.rotation.x += 0.05;
    }
    
    // At the moment of contact, briefly show the 2D attack-angle overlay
    if (Math.abs(tCycle - hitMoment) < 0.005 && angleSvg.style.opacity === "0") {
      const angleDeg = THREE.MathUtils.radToDeg(-currentRad);
      showAttackAngle2D(angleDeg);
    }
    
    renderer.render(scene, camera);
  }
  
  requestAnimationFrame(animate);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
