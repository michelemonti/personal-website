 

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
bgDiv.appendChild(renderer.domElement);

// ✨ PARTICELLE STELLARI ✨
const particleCount = 200;
const particlesGeometry = new THREE.BufferGeometry();
const particlesPositions = new Float32Array(particleCount * 3);
const particlesColors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  particlesPositions[i] = (Math.random() - 0.5) * 200;
  particlesPositions[i + 1] = (Math.random() - 0.5) * 200;
  particlesPositions[i + 2] = (Math.random() - 0.5) * 200;
  
  // Colori delle particelle: blu, verde, arancione
  const colors = [
    [0.55, 0.91, 0.99], // #8be9fd blu
    [0.31, 0.98, 0.48], // #50fa7b verde
    [1.0, 0.72, 0.42]   // #ffb86c arancione
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

// Icosaedro principale con materiale migliorato
const geometry = new THREE.IcosahedronGeometry(8, 6);
const material = new THREE.MeshStandardMaterial({
  color: 0x6a7bbf,
  roughness: 0.1,
  metalness: 0.3,
  flatShading: true,
  transparent: true,
  opacity: 0.9
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Luci migliorate
const light = new THREE.PointLight(0x8be9fd, 2.5, 200); 
light.position.set(18, 18, 40); 
scene.add(light);

const light2 = new THREE.PointLight(0x50fa7b, 2.0, 150);
light2.position.set(-18, -18, -40);
scene.add(light2);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

camera.position.z = 20;

// Dopo camera.position.z = 20;
// Fix per assicurare visibilità su mobile
if (window.innerWidth < 700) {
  mesh.scale.set(0.6, 0.6, 0.6); // Scala più appropriata per mobile
  camera.position.z = 25; // Un po' più lontano per vedere meglio
}

// Assicuriamoci che la top bar sia sempre full width
window.addEventListener('resize', () => {
  const topBar = document.querySelector('.top-bar');
  if (topBar) {
    topBar.style.width = '100vw';
    topBar.style.left = '0';
  }
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (window.innerWidth < 700) {
    mesh.scale.set(0.6, 0.6, 0.6); // Assicura visibilità mobile
    camera.position.z = 25;
  } else {
    mesh.scale.set(1, 1, 1);
    camera.position.z = 20;
  }
  setTimeout(() => {
    window.dispatchEvent(new Event('scroll'));
  }, 100);
});

let mouseX = 0, mouseY = 0;
let dragging = false;
let lastX = 0, lastY = 0;
let rotationX = 0, rotationY = 0;

// ⚡ FISICA AVANZATA PER L'ICOSAEDRO ⚡
let velocity = { x: 0, y: 0, z: 0 };
let angularVelocity = { x: 0, y: 0, z: 0 };
let gravity = -0.003;
let friction = 0.97;
let bounceStrength = 0.85;
let boundaries = {
  left: -20, right: 20,
  top: 20, bottom: -20,
  front: 20, back: -20
};

// Stato della fisica semplificato
let physicsEnabled = false;
let lastClickTime = 0;
let trailParticles = [];
let shakeIntensity = 0;

let animateSpecial = false;
let specialStart = 0;
let specialDuration = 3000; // ms
let specialScale = 1;

// 🎯 CLICK DETECTION MIGLIORATO - FISICA REALE
renderer.domElement.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Controlla se siamo vicini al fondo della pagina per attivare l'interazione
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  
  // Attiva l'interazione solo se siamo negli ultimi 400px della pagina
  if (scrollY + windowH < docH - 400) {
    return; // Non fare nulla se non siamo in fondo
  }
  
  const currentTime = performance.now();
  
  // Evita doppi click troppo ravvicinati
  if (currentTime - lastClickTime < 50) return;
  lastClickTime = currentTime;
  
  // Converti coordinate schermo in coordinate 3D world space
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Crea un raycaster per l'interazione precisa 3D
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  // Calcola la direzione del click rispetto alla posizione dell'icosaedro
  const icosahedronScreenPos = new THREE.Vector3();
  icosahedronScreenPos.copy(mesh.position);
  icosahedronScreenPos.project(camera);
  
  // Converte in coordinate schermo
  const screenX = (icosahedronScreenPos.x * 0.5 + 0.5) * rect.width + rect.left;
  const screenY = (-icosahedronScreenPos.y * 0.5 + 0.5) * rect.height + rect.top;
  
  // Calcola vettore di forza dal click verso la palla
  const deltaX = e.clientX - screenX;
  const deltaY = e.clientY - screenY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Normalizza la direzione
  const forceDirection = {
    x: distance > 0 ? deltaX / distance : 0,
    y: distance > 0 ? -deltaY / distance : 0, // Inverted Y for screen coords
    z: (Math.random() - 0.5) * 0.5 // Aggiunge variazione Z
  };
  
  // Forza semplice e funzionante
  const baseForce = 0.6;
  
  // Applica impulso nella direzione del click (fisica reale)
  velocity.x += forceDirection.x * baseForce * 0.5;
  velocity.y += forceDirection.y * baseForce * 0.5;
  velocity.z += forceDirection.z * baseForce;
  
  // Aggiungi spin rotazionale realistica
  const spinForce = baseForce * 2;
  angularVelocity.x += forceDirection.y * spinForce * (Math.random() * 0.5 + 0.5);
  angularVelocity.y += forceDirection.x * spinForce * (Math.random() * 0.5 + 0.5);
  angularVelocity.z += (Math.random() - 0.5) * spinForce * 0.8;
  
  // Attiva la fisica
  physicsEnabled = true;
  
  // Effetti visivi del click potenziati
  createSuperClickEffect(e.clientX, e.clientY);
  
  // Screenshake semplice
  shakeIntensity = 4;
  
  // Colore fisso
  mesh.material.color.setHex(0x50fa7b); // Verde  
  
  // Feedback aptico su desktop (vibrazione cursor)
  document.body.style.cursor = 'grabbing';
  setTimeout(() => {
    document.body.style.cursor = '';
  }, 100);
});

// � POWER MODE ACTIVATION
function activatePowerMode() {
  powerMode = true;
  
  // Effetti visivi estremi
  mesh.material.emissive.setHex(0x444444);
  boundaries.left = -25; boundaries.right = 25;
  boundaries.top = 25; boundaries.bottom = -25;
  
  // Messaggio power mode
  const powerMsg = document.createElement('div');
  powerMsg.innerHTML = '⚡ POWER MODE ACTIVATED! ⚡<br><span style="font-size:0.8em;">ULTIMATE PHYSICS!</span>';
  powerMsg.style.cssText = `
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(45deg, #ff79c6, #bd93f9, #8be9fd, #50fa7b);
    background-size: 300% 300%;
    animation: rainbowPulse 0.5s ease infinite, powerShake 0.1s ease infinite;
    color: #fff;
    padding: 1.5rem 2rem;
    border-radius: 15px;
    font-weight: 900;
    z-index: 10000;
    text-align: center;
    font-size: 1.3rem;
    box-shadow: 0 0 30px rgba(255, 121, 198, 0.8);
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  `;
  document.body.appendChild(powerMsg);
  
  setTimeout(() => powerMsg.remove(), 3000);
  
  // Disattiva dopo 10 secondi
  setTimeout(() => {
    powerMode = false;
    mesh.material.emissive.setHex(0x000000);
    boundaries.left = -20; boundaries.right = 20;
    boundaries.top = 20; boundaries.bottom = -20;
  }, 10000);
}

// 💥 SUPER CLICK EFFECTS
function createSuperClickEffect(x, y) {
  // Effetto principale
  const effect = document.createElement('div');
  const size = 30;
  const color = '#50fa7b';
  
  effect.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: radial-gradient(circle, ${color} 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 10000;
    animation: superClickRipple 0.8s ease-out forwards;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 20px ${color};
  `;
  
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 800);
  
  // Particelle esplosive
  for (let i = 0; i < 6; i++) {
    createExplosionParticle(x, y, color);
  }
}

// 🎆 EXPLOSION PARTICLES
function createExplosionParticle(x, y, color) {
  const particle = document.createElement('div');
  const angle = Math.random() * Math.PI * 2;
  const velocity = 100 + Math.random() * 150;
  const size = 3 + Math.random() * 6;
  
  particle.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: ${color};
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    animation: explodeParticle 1s ease-out forwards;
    transform: translate(-50%, -50%);
    --dx: ${Math.cos(angle) * velocity}px;
    --dy: ${Math.sin(angle) * velocity}px;
  `;
  
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 1000);
}

// 🔢 COMBO COUNTER
function showComboCounter(combo) {
  const counter = document.createElement('div');
  counter.textContent = `${combo}x COMBO!`;
  counter.style.cssText = `
    position: fixed;
    top: 15%;
    right: 20px;
    background: linear-gradient(135deg, #ff79c6, #bd93f9);
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-weight: 800;
    z-index: 10000;
    font-size: ${0.9 + combo * 0.1}rem;
    animation: comboFloat 0.5s ease;
    box-shadow: 0 5px 15px rgba(255, 121, 198, 0.4);
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  `;
  
  document.body.appendChild(counter);
  setTimeout(() => counter.remove(), 1500);
}

// CSS per le animazioni potenziate (aggiunto dinamicamente)
if (!document.querySelector('#super-animations')) {
  const style = document.createElement('style');
  style.id = 'super-animations';
  style.textContent = `
    @keyframes clickRipple {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(3);
        opacity: 0;
      }
    }
    
    @keyframes superClickRipple {
      0% {
        transform: translate(-50%, -50%) scale(0) rotate(0deg);
        opacity: 1;
      }
      50% {
        transform: translate(-50%, -50%) scale(2) rotate(180deg);
        opacity: 0.8;
      }
      100% {
        transform: translate(-50%, -50%) scale(4) rotate(360deg);
        opacity: 0;
      }
    }
    
    @keyframes explodeParticle {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0);
        opacity: 0;
      }
    }
    
    @keyframes comboFloat {
      0% {
        transform: translateY(20px) scale(0.8);
        opacity: 0;
      }
      50% {
        transform: translateY(-5px) scale(1.1);
        opacity: 1;
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    
    @keyframes rainbowPulse {
      0% { background-position: 0% 50%; filter: brightness(1); }
      50% { background-position: 100% 50%; filter: brightness(1.3); }
      100% { background-position: 0% 50%; filter: brightness(1); }
    }
    
    @keyframes powerShake {
      0%, 100% { transform: translateX(-50%) translateY(0px); }
      25% { transform: translateX(-50%) translateY(-2px); }
      75% { transform: translateX(-50%) translateY(2px); }
    }
  `;
  document.head.appendChild(style);
}

// 🖱️ CONTROLLI DESKTOP AVANZATI - PAN, ZOOM, ATTRAZIONE MAGNETICA
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let lastMouseX = 0, lastMouseY = 0;

document.addEventListener('mousemove', e => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  
  // Attrazione magnetica SOLO quando la fisica è attiva e siamo in fondo
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  
  if (physicsEnabled && window.innerWidth >= 700 && scrollY + windowH >= docH - 400) {
    const mouseForce = 0.015;
    const rect = renderer.domElement.getBoundingClientRect();
    
    // Converti mouse in world coordinates
    const targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
    const targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 30;
    
    // Attrazione magnetica sottile verso il cursore
    const distanceX = targetX - mesh.position.x;
    const distanceY = targetY - mesh.position.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (distance > 2) { // Solo se non troppo vicino
      velocity.x += distanceX * mouseForce;
      velocity.y += distanceY * mouseForce;
    }
  }
  
  // Interazione hover normale quando fisica non attiva
  if (!physicsEnabled && !isDragging) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }
});

// 🎮 DRAG CONTROLS per spostare l'icosaedro quando la fisica è attiva
renderer.domElement.addEventListener('mousedown', e => {
  // Solo se siamo in fondo alla pagina
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  
  if (scrollY + windowH >= docH - 400 && physicsEnabled) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    renderer.domElement.style.cursor = 'grabbing';
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    renderer.domElement.style.cursor = '';
    
    // Applica velocità finale dal drag
    const dragForce = 0.02;
    velocity.x += (lastMouseX - dragStartX) * dragForce;
    velocity.y -= (lastMouseY - dragStartY) * dragForce;
  }
});

renderer.domElement.addEventListener('mousemove', e => {
  if (isDragging) {
    const rect = renderer.domElement.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    // Sposta direttamente l'icosaedro durante il drag
    const moveForce = 0.05;
    mesh.position.x += deltaX * moveForce;
    mesh.position.y -= deltaY * moveForce;
    
    // Mantieni nei limiti
    mesh.position.x = Math.max(boundaries.left, Math.min(boundaries.right, mesh.position.x));
    mesh.position.y = Math.max(boundaries.bottom, Math.min(boundaries.top, mesh.position.y));
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }
});

// 🔍 ZOOM CONTROLS con rotella del mouse
renderer.domElement.addEventListener('wheel', e => {
  // Solo se siamo in fondo alla pagina
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  
  if (scrollY + windowH >= docH - 400) {
    e.preventDefault();
    
    const zoomSpeed = 0.1;
    const zoomDelta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    
    // Zoom della camera
    camera.position.z = Math.max(10, Math.min(50, camera.position.z * zoomDelta));
    
    // Effetto visivo durante zoom
    if (physicsEnabled) {
      const zoomForce = (e.deltaY > 0 ? -0.1 : 0.1);
      velocity.z += zoomForce;
    }
  }
});

// ⌨️ KEYBOARD CONTROLS per impulsi direzionali
document.addEventListener('keydown', e => {
  // Solo se siamo in fondo alla pagina e la fisica è attiva
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  
  if (scrollY + windowH >= docH - 400 && physicsEnabled) {
    const keyForce = 0.3;
    
    switch(e.code) {
      case 'ArrowUp':
      case 'KeyW':
        velocity.y += keyForce;
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        velocity.y -= keyForce;
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'KeyA':
        velocity.x -= keyForce;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        velocity.x += keyForce;
        e.preventDefault();
        break;
      case 'Space':
        // Super jump!
        velocity.y += keyForce * 2;
        velocity.x += (Math.random() - 0.5) * keyForce;
        velocity.z += (Math.random() - 0.5) * keyForce;
        e.preventDefault();
        break;
    }
  }
});

// 📱 ACCELEROMETRO MOBILE POTENZIATO
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', function(event) {
    if (window.innerWidth < 700) {
      // Controlla se siamo in fondo alla pagina per attivare controlli
      const scrollY = window.scrollY || window.pageYOffset;
      const windowH = window.innerHeight;
      const docH = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
      );
      
      if (scrollY + windowH >= docH - 400) {
        if (!physicsEnabled) {
          // Comportamento normale quando la fisica è disattivata
          mouseX = (event.gamma || 0) / 45;
          mouseY = (event.beta || 0) / 90;
          mouseX = Math.max(-1, Math.min(1, mouseX));
          mouseY = Math.max(-1, Math.min(1, mouseY));
        } else {
          // Usa l'accelerometro per la fisica su mobile - POTENZIATO
          const tiltForce = 0.008; // Aumentato per più reattività
          const gamma = (event.gamma || 0) / 90; // -1 a 1
          const beta = (event.beta || 0) / 90;   // -1 a 1
          
          // Applica forza gravitazionale basata sull'inclinazione
          velocity.x += gamma * tiltForce;
          velocity.y -= beta * tiltForce;
          
          // Aggiungi rotazione basata sull'inclinazione
          angularVelocity.z += gamma * 0.02;
          angularVelocity.x += beta * 0.02;
          
          // Attrito leggermente ridotto per più fluidità su mobile
          velocity.x *= 0.992;
          velocity.y *= 0.992;
          velocity.z *= 0.995;
        }
      }
    }
  }, true);
}

// 🎮 CONTROLLI TOUCH PER MOBILE - SOLO IN FONDO PAGINA
renderer.domElement.addEventListener('touchstart', e => {
  e.preventDefault();
  
  // Controlla se siamo in fondo alla pagina
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  
  // Attiva l'interazione solo se siamo negli ultimi 400px della pagina
  if (scrollY + windowH < docH - 400) {
    return; // Non fare nulla se non siamo in fondo
  }
  
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    
    // Simula un click per attivare la fisica
    const rect = renderer.domElement.getBoundingClientRect();
    const clickEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      stopPropagation: () => {}
    };
    
    // Trigger manuale della logica di click
    renderer.domElement.dispatchEvent(new MouseEvent('click', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: false
    }));
  }
});

// 🔄 RESET PHYSICS (doppio tap/click)
let tapCount = 0;
let tapTimer = null;

renderer.domElement.addEventListener('dblclick', () => {
  // Reset della fisica
  velocity = { x: 0, y: 0, z: 0 };
  angularVelocity = { x: 0, y: 0, z: 0 };
  physicsEnabled = false;
  
  // Reset posizione
  mesh.position.set(0, 0, 0);
  
  // Effetto visivo di reset
  mesh.material.color.setHex(0xff79c6);
  setTimeout(() => {
    mesh.material.color.setHex(0x6a7bbf);
  }, 300);
  
  // Messaggio di feedback
  const resetMsg = document.createElement('div');
  resetMsg.textContent = '🔄 ICOSAEDRO RESET!';
  resetMsg.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ff79c6, #bd93f9);
    color: #fff;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: bold;
    z-index: 10000;
    animation: popup-fadein 0.5s ease;
    box-shadow: 0 10px 30px rgba(255, 121, 198, 0.5);
  `;
  document.body.appendChild(resetMsg);
  
  setTimeout(() => resetMsg.remove(), 1500);
});

// Rileva click solo vicino al fondo della pagina
document.addEventListener('click', e => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = document.body.scrollHeight;
  // Se siamo negli ultimi 200px della pagina
  if (scrollY + windowH > docH - 200) {
    animateSpecial = true;
    specialStart = performance.now();
  }
});

function animate() {
  requestAnimationFrame(animate);

  // Animazione particelle stellari
  const positions = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] += Math.sin(performance.now() * 0.001 + i) * 0.05;
    positions[i + 1] += Math.cos(performance.now() * 0.001 + i) * 0.03;
    positions[i + 2] += Math.sin(performance.now() * 0.0008 + i) * 0.02;
    
    // Reset particelle che escono dal campo visivo
    if (positions[i] > 100) positions[i] = -100;
    if (positions[i] < -100) positions[i] = 100;
    if (positions[i + 1] > 100) positions[i + 1] = -100;
    if (positions[i + 1] < -100) positions[i + 1] = 100;
  }
  particles.geometry.attributes.position.needsUpdate = true;
  
  // Rotazione lenta delle particelle
  particles.rotation.y += 0.001;

  // 🏀 FISICA DELL'ICOSAEDRO SUPER AVANZATA
  if (physicsEnabled) {
    // Applica gravità
    velocity.y += gravity;
    
    // Applica velocità alla posizione
    mesh.position.x += velocity.x;
    mesh.position.y += velocity.y;
    mesh.position.z += velocity.z;
    
    // Crea trail particles durante il movimento veloce
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
    if (speed > 0.05 && trailParticles.length < 10) {
      createTrailParticle();
    }
    
    // Applica velocità angolare alla rotazione
    mesh.rotation.x += angularVelocity.x;
    mesh.rotation.y += angularVelocity.y;
    mesh.rotation.z += angularVelocity.z;
    
    // Gestione rimbalzi sui bordi (potenziata)
    let bounced = false;
    
    if (mesh.position.x > boundaries.right || mesh.position.x < boundaries.left) {
      velocity.x *= -bounceStrength;
      mesh.position.x = Math.max(boundaries.left, Math.min(boundaries.right, mesh.position.x));
      angularVelocity.y += velocity.x * 0.8;
      bounced = true;
    }
    
    if (mesh.position.y > boundaries.top || mesh.position.y < boundaries.bottom) {
      velocity.y *= -bounceStrength;
      mesh.position.y = Math.max(boundaries.bottom, Math.min(boundaries.top, mesh.position.y));
      angularVelocity.x += velocity.y * 0.8;
      bounced = true;
    }
    
    if (mesh.position.z > boundaries.front || mesh.position.z < boundaries.back) {
      velocity.z *= -bounceStrength;
      mesh.position.z = Math.max(boundaries.back, Math.min(boundaries.front, mesh.position.z));
      angularVelocity.z += velocity.z * 0.8;
      bounced = true;
    }
    
    // Effetti speciali al rimbalzo
    if (bounced) {
      shakeIntensity = Math.min(3, speed * 10);
      
      // Cambia colore al rimbalzo in power mode
      if (powerMode) {
        const bounceColors = [0xff79c6, 0xbd93f9, 0x8be9fd, 0x50fa7b, 0xffb86c];
        mesh.material.color.setHex(bounceColors[Math.floor(Math.random() * bounceColors.length)]);
      }
    }
    
    // Applica attrito
    velocity.x *= friction;
    velocity.y *= friction;
    velocity.z *= friction;
    angularVelocity.x *= friction;
    angularVelocity.y *= friction;
    angularVelocity.z *= friction;
    
    // Disattiva la fisica se la velocità è troppo bassa
    const totalVelocity = Math.abs(velocity.x) + Math.abs(velocity.y) + Math.abs(velocity.z);
    if (totalVelocity < 0.005) {
      physicsEnabled = false;
      // Reset combo quando si ferma
      comboCount = 0;
      // Ritorna gradualmente alla posizione centrata
      mesh.position.x *= 0.92;
      mesh.position.y *= 0.92;
      mesh.position.z *= 0.92;
    }
    
    // Effetto visivo: colore dinamico basato su velocità e modalità
    if (!powerMode && !bounced) {
      const speedNorm = Math.min(1, totalVelocity * 50);
      const hue = 0.6 - speedNorm * 0.4; // Da blu a rosso
      mesh.material.color.setHSL(Math.max(0, hue), 0.8, 0.6);
    }
    
  } else {
    // Comportamento normale quando la fisica è disattivata
    if (animateSpecial) {
      const elapsed = performance.now() - specialStart;
      // Oscilla la scala tra 1 e 1.7
      specialScale = 1 + 0.7 * Math.abs(Math.sin(elapsed * 0.004));
      // Ruota più velocemente
      mesh.rotation.x += 0.04 + mouseY * 0.05;
      mesh.rotation.y += 0.05 + mouseX * 0.05;
      mesh.scale.set(specialScale, specialScale, specialScale);
      
      // Effetto particelle durante animazione speciale
      particlesMaterial.size = 3 + Math.sin(elapsed * 0.01) * 2;
      particlesMaterial.opacity = 0.8 + Math.sin(elapsed * 0.008) * 0.3;
      
      if (elapsed > specialDuration) {
        animateSpecial = false;
        mesh.scale.set(1, 1, 1);
        particlesMaterial.size = 2;
        particlesMaterial.opacity = 0.8;
      }
    } else {
      // Rotazione automatica + interazione normale
      mesh.rotation.x = 0.5 * Math.sin(performance.now() * 0.0002) + rotationX + mouseY * 0.5;
      mesh.rotation.y = 0.5 * Math.cos(performance.now() * 0.0002) + rotationY + mouseX * 0.5;
      mesh.scale.set(1, 1, 1);
      
      // Pulsazione sottile delle particelle
      particlesMaterial.opacity = 0.6 + 0.2 * Math.sin(performance.now() * 0.002);
      
      // Ritorna il colore normale
      if (!powerMode) mesh.material.color.setHex(0x6a7bbf);
    }
  }

  // 📳 SCREENSHAKE EFFECT
  if (shakeIntensity > 0) {
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;
    renderer.domElement.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
    shakeIntensity *= 0.9; // Diminuisce gradualmente
    
    if (shakeIntensity < 0.1) {
      shakeIntensity = 0;
      renderer.domElement.style.transform = '';
    }
  }

  // Update trail particles
  updateTrailParticles();

  // Cambia colore delle luci nel tempo (solo se non in modalità fisica)
  if (!physicsEnabled) {
    light.color.setHSL(0.5 + 0.1 * Math.sin(performance.now() * 0.001), 0.8, 0.6);
    light2.color.setHSL(0.3 + 0.1 * Math.cos(performance.now() * 0.0012), 0.9, 0.5);
  }

  // Gestione mobile scroll (solo se non in modalità fisica)
  if (window.innerWidth < 700 && !animateSpecial && !physicsEnabled) {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const windowH = window.innerHeight;
    const docH = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    // Calcola quanto sei vicino al fondo (0 = top, 1 = fondo)
    const progress = Math.min(1, Math.max(0, (scrollY + windowH - (docH - 400)) / 400));
    // Scala da 0.7 (normale) a 0.3 (più piccolo) verso il fondo
    const scale = 0.7 - 0.4 * progress;
    mesh.scale.set(scale, scale, scale);

    // Sposta verso il basso fino a 300px 
    mesh.position.y = -300 * progress;
  } else if (!animateSpecial && !physicsEnabled) {
    // Reset posizione se non mobile o durante animazione speciale
    mesh.position.y = 0;
  }

  renderer.render(scene, camera);
}

// 🌟 TRAIL PARTICLES SYSTEM
function createTrailParticle() {
  const trail = {
    position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
    life: 1.0,
    maxLife: 1.0,
    size: 0.5 + Math.random() * 0.5
  };
  trailParticles.push(trail);
}

function updateTrailParticles() {
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const particle = trailParticles[i];
    particle.life -= 0.02;
    
    if (particle.life <= 0) {
      trailParticles.splice(i, 1);
    }
  }
  
  // Renderizza trail particles (semplificato con sfere colorate)
  trailParticles.forEach(particle => {
    if (!particle.sphere) {
      const geometry = new THREE.SphereGeometry(particle.size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: powerMode ? 0xff79c6 : 0x8be9fd,
        transparent: true,
        opacity: particle.life
      });
      particle.sphere = new THREE.Mesh(geometry, material);
      scene.add(particle.sphere);
    }
    
    particle.sphere.position.copy(particle.position);
    particle.sphere.material.opacity = particle.life * 0.6;
    
    if (particle.life <= 0 && particle.sphere) {
      scene.remove(particle.sphere);
    }
  });
}
animate();

window.addEventListener('scroll', () => {
  const bar = document.getElementById('bottom-bar-animation');
  // Nascondi sempre la barra su mobile
  if (window.innerWidth < 700) {
    if (bar) bar.style.display = 'none';
    return;
  }
  const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  const windowH = window.innerHeight;
  const docH = Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight,
    document.body.offsetHeight, document.documentElement.offsetHeight,
    document.body.clientHeight, document.documentElement.clientHeight
  );
  if (bar) {
    if (scrollY + windowH >= docH - 400) {
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }
});

window.addEventListener('resize', () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('scroll'));
  }, 100);
});

// ✨ SCROLL REVEAL EFFECT ✨
function revealSections() {
  const sections = document.querySelectorAll('.section');
  const windowHeight = window.innerHeight;
  
  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    const revealPoint = windowHeight * 0.8;
    
    if (sectionTop < revealPoint) {
      section.classList.add('reveal');
    }
  });
}

// Inizializza le sezioni come nascoste
document.addEventListener('DOMContentLoaded', () => {
  revealSections(); // Controlla subito
  
  // Aggiungi listener per lo scroll
  window.addEventListener('scroll', revealSections);
  
  // Effetto typewriter per il testo introduttivo (opzionale)
  const introText = document.querySelector('.intro-text');
  if (introText) {
    const text = introText.textContent;
    introText.textContent = '';
    introText.style.opacity = '1';
    
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        introText.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 30);
      }
    };
    
    setTimeout(typeWriter, 500); // Inizia dopo 500ms
  }
  
  // Easter egg: click sul footer per attivare l'animazione speciale
  const footer = document.querySelector('footer');
  if (footer) {
    footer.addEventListener('click', () => {
      animateSpecial = true;
      specialStart = performance.now();
      
      // Mostra un messaggio divertente
      const message = document.createElement('div');
      message.textContent = '🚀 MODALITÀ IPERSPAZIO ATTIVATA! 🚀';
      message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #8be9fd, #50fa7b);
        color: #111;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: bold;
        z-index: 10000;
        animation: popup-fadein 0.5s ease;
        box-shadow: 0 10px 30px rgba(139, 233, 253, 0.5);
      `;
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.remove();
      }, 2000);
    });
  }
  
  // 🎮 MESSAGGIO DI BENVENUTO INTERATTIVO - SOLO IN FONDO PAGINA
  let welcomeMessageShown = false;
  
  function checkShowWelcomeMessage() {
    if (welcomeMessageShown) return;
    
    // Controlla se siamo vicini al fondo della pagina
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const windowH = window.innerHeight;
    const docH = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    
    // Mostra solo quando siamo negli ultimi 500px della pagina
    if (scrollY + windowH >= docH - 500) {
      showWelcomeMessage();
      welcomeMessageShown = true;
    }
  }
  
  function showWelcomeMessage() {
    const welcomeMsg = document.createElement('div');
    
    // Messaggio diverso per mobile e desktop
    const isMobile = window.innerWidth < 700;
    welcomeMsg.innerHTML = isMobile ? `
      <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">📱 CONTROLLI ICOSAEDRO</div>
      <div style="font-size: 0.85rem; opacity: 0.9;">
        • <strong>Tocca</strong> per farlo rimbalzare<br>
        • <strong>Inclina</strong> device per controllarlo<br>
        • <strong>Tocca veloce</strong> per combo!<br>
        • <strong>5x Combo</strong> = POWER MODE! ⚡
      </div>
    ` : `
      <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">🎮 CONTROLLI ICOSAEDRO</div>
      <div style="font-size: 0.9rem; opacity: 0.9;">
        • <strong>Click</strong> per farlo rimbalzare<br>
        • <strong>Click rapidi</strong> per combo<br>
        • <strong>5x Combo</strong> = POWER MODE! ⚡<br>
        • <strong>Double-click</strong> per reset
      </div>
    `;
    
    welcomeMsg.style.cssText = `
      position: fixed;
      ${isMobile ? 'bottom: 20px; left: 20px; right: 20px;' : 'bottom: 20px; right: 20px; max-width: 300px;'}
      background: linear-gradient(135deg, rgba(139, 233, 253, 0.95), rgba(80, 250, 123, 0.95));
      color: #111;
      padding: 1rem 1.2rem;
      border-radius: 12px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 10px 30px rgba(139, 233, 253, 0.4);
      animation: slideInUp 0.6s ease-out;
      cursor: pointer;
      font-family: 'Exo', sans-serif;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
    `;
    
    // Aggiungi animazione slideInUp
    if (!document.querySelector('#welcome-slide-animation')) {
      const style = document.createElement('style');
      style.id = 'welcome-slide-animation';
      style.textContent = `
        @keyframes slideInUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(welcomeMsg);
    
    // Rimuovi il messaggio dopo un click o dopo 12 secondi
    const removeMsg = () => {
      welcomeMsg.style.animation = 'slideInUp 0.5s ease-in reverse';
      setTimeout(() => welcomeMsg.remove(), 500);
    };
    
    welcomeMsg.addEventListener('click', removeMsg);
    setTimeout(removeMsg, 12000);
  }
  
  // Ascolta lo scroll per mostrare il messaggio
  window.addEventListener('scroll', checkShowWelcomeMessage);
  
  // Controlla subito all'inizio (nel caso si sia già in fondo)
  checkShowWelcomeMessage();
});