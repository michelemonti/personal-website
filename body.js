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
const material = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.4, metalness: 0.7, flatShading: true });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const light = new THREE.PointLight(0xffffff, 1.2, 100);
light.position.set(10, 10, 20);
scene.add(light);

camera.position.z = 20;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.003 + mouseY * 0.01;
  mesh.rotation.y += 0.004 + mouseX * 0.01;
  renderer.render(scene, camera);
}
animate();