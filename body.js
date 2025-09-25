const bgDiv = document.getElementById('bg3d');
Object.assign(bgDiv.style, {
  position: 'fixed',
  zIndex: '-1',
  top: 0, left: 0, width: '100vw', height: '100vh',
  overflow: 'hidden'
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.pointerEvents = 'auto';
bgDiv.appendChild(renderer.domElement);

const particleCount = 200;
const particlesGeometry = new THREE.BufferGeometry();
const particlesPositions = new Float32Array(particleCount * 3);
const particlesColors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  particlesPositions[i] = (Math.random() - 0.5) * 200;
  particlesPositions[i + 1] = (Math.random() - 0.5) * 200;
  particlesPositions[i + 2] = (Math.random() - 0.5) * 200;

  const colors = [
    [0.55, 0.91, 0.99],
    [0.31, 0.98, 0.48],
    [1.0, 0.72, 0.42]
  ];
  const colorSet = colors[Math.floor(Math.random() * colors.length)];
  particlesColors[i] = colorSet[0];
  particlesColors[i + 1] = colorSet[1];
  particlesColors[i + 2] = colorSet[2];
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 2,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const geometry = new THREE.IcosahedronGeometry(6, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x6a7bbf,
  metalness: 0.25,
  roughness: 0.55,
  emissive: 0x000000
});
const mesh = new THREE.Mesh(geometry, material);
const edges = new THREE.EdgesGeometry(geometry);
const wireMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
const wireframe = new THREE.LineSegments(edges, wireMaterial);
mesh.add(wireframe);
scene.add(mesh);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85);
directionalLight.position.set(5, 6, 10);
scene.add(directionalLight);

let mouseX = 0, mouseY = 0;

let interactionEnabled = false;
let dragging = false;
let lastMouseX = 0, lastMouseY = 0;
let theta = 0.8;
let phi = 1.1;
let radius = 30;
let targetY = 0;

function updateCameraFromSpherical() {
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  camera.position.set(
    radius * sinPhi * sinTheta,
    radius * cosPhi,
    radius * sinPhi * cosTheta
  );
  camera.lookAt(0, targetY, 0);
}

function getBottomOverlayHeight() {
  let maxH = 0;
  const els = Array.from(document.querySelectorAll('body *'));
  for (const el of els) {
    const cs = window.getComputedStyle(el);
    if (cs.position === 'fixed' && parseFloat(cs.bottom || '0') <= 1 && cs.display !== 'none' && cs.visibility !== 'hidden') {
      const r = el.getBoundingClientRect();
      if (r.bottom >= window.innerHeight - 1 && r.top < window.innerHeight) {
        maxH = Math.max(maxH, r.height);
      }
    }
  }
  return maxH;
}

function updateMobileOffset(atBottom) {
  if (window.innerWidth < 700 && atBottom) {
    const overlayPx = getBottomOverlayHeight();
    const fovRad = camera.fov * Math.PI / 180;
    const worldPerPx = (2 * radius * Math.tan(fovRad / 2)) / window.innerHeight;
    targetY = overlayPx ? (overlayPx / 2) * worldPerPx : 0;
  } else {
    targetY = 0;
  }
  updateCameraFromSpherical();
}

document.addEventListener('click', (e) => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  if (scrollY + windowH >= docH - 400) {
    mesh.material.color.setHex(0x50fa7b);
    if (mesh.material.emissive) mesh.material.emissive.setHex(0x001a00);
    setTimeout(() => {
      mesh.material.color.setHex(0x6a7bbf);
      if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000);
    }, 250);
  }
  createClickEffect(e.clientX, e.clientY);
});

document.addEventListener('mousedown', (e) => {
  if (window.innerWidth > 700 && interactionEnabled) {
    dragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    document.body.style.cursor = 'grabbing';
  }
});

document.addEventListener('mousemove', (e) => {
  if (window.innerWidth > 700 && dragging && interactionEnabled) {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    theta -= deltaX * 0.005;
    phi   -= deltaY * 0.005;
    const EPS = 0.15;
    phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
    updateCameraFromSpherical();
  } else if (!interactionEnabled) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }
});

document.addEventListener('mouseup', () => {
  if (dragging) {
    dragging = false;
    document.body.style.cursor = '';
  }
});

document.addEventListener('wheel', (e) => {
  if (window.innerWidth > 700 && interactionEnabled) {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    radius *= (1 + dir * 0.08);
    radius = Math.max(12, Math.min(60, radius));
    updateCameraFromSpherical();
  }
}, { passive: false });

document.addEventListener('dblclick', () => {
  if (window.innerWidth > 700 && interactionEnabled) {
    theta = 0.8; phi = 1.1; radius = 30;
    updateCameraFromSpherical();
  }
});

if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', (event) => {
    if (window.innerWidth < 700) {
      const scrollY = window.scrollY || window.pageYOffset;
      const windowH = window.innerHeight;
      const docH = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
      );
      
      if (scrollY + windowH < docH - 400) {
        mouseX = (event.gamma || 0) / 45;
        mouseY = (event.beta || 0) / 90;
        mouseX = Math.max(-1, Math.min(1, mouseX));
        mouseY = Math.max(-1, Math.min(1, mouseY));
      }
    }
  }, true);
}

let touchDragging = false;
let lastTouchX = 0, lastTouchY = 0;
document.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  if (window.innerWidth < 700 && scrollY + windowH >= docH - 400) {
    touchDragging = true;
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  }
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (!touchDragging) return;
  const touch = e.touches[0];
  const deltaX = touch.clientX - lastTouchX;
  const deltaY = touch.clientY - lastTouchY;
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
  theta -= deltaX * 0.006;
  phi   -= deltaY * 0.006;
  const EPS = 0.15;
  phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
  updateCameraFromSpherical();
}, { passive: true });
document.addEventListener('touchend', () => { touchDragging = false; }, { passive: true });

function createClickEffect(x, y) {
  const effect = document.createElement('div');
  effect.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: 30px;
    height: 30px;
    background: radial-gradient(circle, #50fa7b 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 10000;
    animation: clickRipple 0.6s ease-out forwards;
    transform: translate(-50%, -50%);
  `;
  
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 600);
}

updateCameraFromSpherical();

function animate() {
  requestAnimationFrame(animate);
  
  particles.rotation.x += 0.001;
  particles.rotation.y += 0.002;
  
  if (interactionEnabled) {
    mesh.rotation.x += 0.0025;
    mesh.rotation.y += 0.0035;
  } else {
    const targetRotationX = mouseY * 0.5;
    const targetRotationY = mouseX * 0.5;
    mesh.rotation.x += (targetRotationX - mesh.rotation.x) * 0.05;
    mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.05;
    mesh.rotation.z += 0.0045;
    if (window.innerWidth < 700) {
      mesh.position.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
    }
  }
  
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCameraFromSpherical();
  updateMobileOffset(interactionEnabled);
});

function showControlsMessage() {
  if (document.getElementById('controls-msg')) return;
  
  const controlsDiv = document.createElement('div');
  controlsDiv.id = 'controls-msg';
    controlsDiv.innerHTML = window.innerWidth > 700 ? 
      `🎮 <strong>CONTROLLI DESKTOP:</strong><br>
       • <strong>Drag</strong> = Orbit (pan/rotate)<br>
       • <strong>Rotellina</strong> = Zoom<br>
       • <strong>Doppio click</strong> = Reset vista` :
      `\ud83d\udc49 <strong>CONTROLLI MOBILE:</strong><br>
       \u2022 <strong>Inclina</strong> = Hover/tilt sopra l'icosaedro<br>
       \u2022 <strong>Trascina</strong> = Orbit solo a fondo pagina<br>
       \u2022 <strong>Doppio tap</strong> = Reset vista`;
  controlsDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: #50fa7b;
    padding: 1rem;
    border-radius: 10px;
    font-size: 0.9rem;
    z-index: 9999;
    max-width: 250px;
    border: 1px solid #50fa7b;
    backdrop-filter: blur(5px);
  `;
  
  document.body.appendChild(controlsDiv);
  
  setTimeout(() => {
    controlsDiv.style.opacity = '0';
    controlsDiv.style.transition = 'opacity 0.5s';
    setTimeout(() => controlsDiv.remove(), 500);
  }, 5000);
}

let controlsShown = false;
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  const atBottom = scrollY + windowH >= docH - 400;
  interactionEnabled = atBottom;
  if (!controlsShown && atBottom) {
    controlsShown = true;
    showControlsMessage();
  }
  updateMobileOffset(atBottom);
});

const style = document.createElement('style');
style.textContent = `
@keyframes clickRipple {
  from {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}
`;
document.head.appendChild(style);

animate();

updateMobileOffset(false);