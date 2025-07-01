const bgDiv = document.getElementById('bg3d');
Object.assign(bgDiv.style, {
  position: 'fixed',
  zIndex: '-1',
  top: 0, left: 0, width: '100vw', height: '100vh',
  overflow: 'hidden'
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
bgDiv.appendChild(renderer.domElement);

const geometry = new THREE.IcosahedronGeometry(8, 6);
const material = new THREE.MeshStandardMaterial({
  color: 0x6a7bbf, // leggermente più scuro di 0x8faaff
  roughness: 0.2,
  flatShading: true
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const light = new THREE.PointLight(0xffffff, 2.2, 200); 
light.position.set(18, 18, 40); 
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);

camera.position.z = 20;

// Dopo camera.position.z = 20;
if (window.innerWidth < 700) {
  mesh.scale.set(0.5, 0.5, 0.5);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (window.innerWidth < 700) {
    mesh.scale.set(0.5, 0.5, 0.5);
  } else {
    mesh.scale.set(1, 1, 1);
  }
  setTimeout(() => {
    window.dispatchEvent(new Event('scroll'));
  }, 100);
});

let mouseX = 0, mouseY = 0;
let dragging = false;
let lastX = 0, lastY = 0;
let rotationX = 0, rotationY = 0;

// Mouse move (hover)
document.addEventListener('mousemove', e => {
  if (!dragging) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }
});

// Mouse drag
renderer.domElement.addEventListener('mousedown', e => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
document.addEventListener('mouseup', () => dragging = false);
document.addEventListener('mouseleave', () => dragging = false);
renderer.domElement.addEventListener('mousemove', e => {
  if (dragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    rotationY += dx * 0.01;
    rotationX += dy * 0.01;
    lastX = e.clientX;
    lastY = e.clientY;
  }
});

// Touch events per mobile
renderer.domElement.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    dragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
});
renderer.domElement.addEventListener('touchend', () => dragging = false);
renderer.domElement.addEventListener('touchcancel', () => dragging = false);
renderer.domElement.addEventListener('touchmove', e => {
  if (dragging && e.touches.length === 1) {
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    rotationY += dx * 0.01;
    rotationX += dy * 0.01;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
});

// Accelerometro su mobile per ruotare l'icosaedro
if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', function(event) {
    // gamma: left-right [-90,90], beta: front-back [-180,180]
    // Normalizza su [-1,1]
    if (window.innerWidth < 700) {
      mouseX = (event.gamma || 0) / 45; // gamma va da -90 a 90
      mouseY = (event.beta || 0) / 90;  // beta va da -180 a 180, ma usiamo solo [-90,90]
      // Clamp per sicurezza
      mouseX = Math.max(-1, Math.min(1, mouseX));
      mouseY = Math.max(-1, Math.min(1, mouseY));
    }
  }, true);
}

let animateSpecial = false;
let specialStart = 0;
let specialDuration = 3000; // ms
let specialScale = 1;

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

  // Effetto speciale se attivo
  if (animateSpecial) {
    const elapsed = performance.now() - specialStart;
    // Oscilla la scala tra 1 e 1.7
    specialScale = 1 + 0.7 * Math.abs(Math.sin(elapsed * 0.004));
    // Ruota più velocemente
    mesh.rotation.x += 0.04 + mouseY * 0.05;
    mesh.rotation.y += 0.05 + mouseX * 0.05;
    mesh.scale.set(specialScale, specialScale, specialScale);
    if (elapsed > specialDuration) {
      animateSpecial = false;
      mesh.scale.set(1, 1, 1);
    }
  } else {
    // Rotazione automatica + interazione normale
    mesh.rotation.x = 0.5 * Math.sin(performance.now() * 0.0002) + rotationX + mouseY * 0.5;
    mesh.rotation.y = 0.5 * Math.cos(performance.now() * 0.0002) + rotationY + mouseX * 0.5;
    mesh.scale.set(1, 1, 1);
  }

  // Riduci la scala su mobile quando si scrolla verso il fondo
  if (window.innerWidth < 700 && !animateSpecial) {
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
  } else {
    // Reset posizione se non mobile o durante animazione speciale
    mesh.position.y = 0;
  }

  renderer.render(scene, camera);
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

document.getElementById('bottom-bar-btn').addEventListener('click', () => {
  animateSpecial = true;
  specialStart = performance.now();
});