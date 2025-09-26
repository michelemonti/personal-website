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
let targetRotationY = 0;

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

function updateMobileOffset(atBottom) {
  targetY = 0;
  updateCameraFromSpherical();
}

document.addEventListener('click', (e) => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
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
      const docH = document.documentElement.scrollHeight;
      
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
let pinchZooming = false;
let lastPinchDist = 0;
document.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  if (window.innerWidth < 700 && scrollY + windowH >= docH - 400) {
    touchDragging = true;
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
  }
  if (e.touches.length === 2) {
    pinchZooming = true;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    lastPinchDist = Math.hypot(dx, dy);
  }
}, { passive: true });
document.addEventListener('touchmove', (e) => {
  if (pinchZooming && e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    const delta = dist - lastPinchDist;
    lastPinchDist = dist;
    radius *= (1 - delta * 0.002);
    radius = Math.max(12, Math.min(60, radius));
    updateCameraFromSpherical();
    return;
  }
  if (!touchDragging) return;
  const touch = e.touches[0];
  const deltaX = touch.clientX - lastTouchX;
  const deltaY = touch.clientY - lastTouchY;
  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
  theta -= deltaX * 0.0045;
  phi   -= deltaY * 0.0045;
  const EPS = 0.15;
  phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
  updateCameraFromSpherical();
}, { passive: false });
document.addEventListener('touchend', () => { touchDragging = false; pinchZooming = false; }, { passive: true });

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
    targetRotationY = 0;
  } else {
    targetRotationY = mouseX * 0.5;
  }
  mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.05;
  mesh.rotation.x += (mouseY * 0.5 - mesh.rotation.x) * 0.05;
  mesh.rotation.z += 0.0045;
  if (window.innerWidth < 700) {
    mesh.position.set(0, 0, 0);
    mesh.scale.set(0.8, 0.8, 0.8); // Scala ridotta ma visibile su mobile
  } else {
    mesh.scale.set(1, 1, 1);
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

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  const atBottom = scrollY + windowH >= docH - 400;
  interactionEnabled = atBottom;
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

// ---- Lightweight i18n ----
const i18n = {
  it: {
    intro: "Imprenditore multidisciplinare con 15 anni di esperienza nei settori della manifattura digitale, design industriale e tecnologie emergenti. CEO / Creative Director di <strong class=\"highlight-text\">JUNO.AM</strong>, e Head of Products per <strong class=\"highlight-text\">ANY3DP.APP</strong>.",
    skills_h2: "COMPETENZE",
    business_h2: "BUSINESS",
    business_p: "JUNO.AM (fondata nel 2012) e 3FESTO/ANY3DP: ecosistema integrato tra stampa 3D professionale e software MES modulare per l’additive. Guido strategia, prodotto e operatività end‑to‑end.",
    vision_h2: "Visione",
    logos_title: "LE MIE IMPRESE E LA MIA ATTIVITA PERSONALE:",
  
    // Skills
  skills_cad: "<strong><em>CAD:</em></strong> CAD parametrico e di superfici per prodotto/meccanica; modellazione solida/NURBS e messa in tavola",
  skills_amtools: "<strong><em>AM Tools:</em></strong> toolchain per additive: slicing, riparazione mesh, analisi e preparazione di stampa",
    skills_dev: "<strong><em>Dev:</em></strong> Web full‑stack (TypeScript/JavaScript/PHP), architetture moderne (SPA/SSR/SSG), API REST, WebGL/3D, CI/CD, container e Git",
    skills_ai: "<strong><em>AI:</em></strong> GPT APIs, Hugging Face, image vision, prototipi hard-coded",
    skills_admin: "<strong><em>Business Admin:</em></strong> gestione a 360° di PMI, fiscalità e finanza italiana, budgeting, operations, strategia",
    skills_exp: "<strong><em>Esperienza diretta:</em></strong> scale-up aziendali, fondazione e direzione, sviluppo di brand indipendenti",
    skills_mindset: "<strong><em>Mindset:</em></strong> visione, motivazione, pragmaticità, equilibrio tra visione e execution",
    // Business
    business_roles: "<strong><em>Ruoli:</em></strong> Co‑founder/CEO & Creative Director (JUNO.AM); Head of Products (3FESTO/ANY3DP).",
    business_core: "<strong><em>Core:</em></strong> Stampa 3D professionale + piattaforma MES modulare a supporto dell’intero ciclo AM.",
    business_tech: "<strong><em>Tecnologie 3DP:</em></strong> HP MJF, Carbon DLS, LPBF, FDM, PolyJet (prototipazione, serie, parti funzionali).",
    business_services: "<strong><em>Servizi CAD:</em></strong> DfAM e ottimizzazione topologica, prototipazione/produzione, reverse engineering (scanner fino a 0,05 mm).",
    business_software: "<strong><em>Software:</em></strong> Frontend moderni; Backend REST/event‑driven con queue/worker e observability; dati relazionali + cache + object storage.",
    business_microservices: "<strong><em>Microservizi:</em></strong> AI predictions, algoritmic quoting, 3D parsing, job tracking; engine mesh C++, Three.js experience; API documentate per integrazioni.",
    business_ops: "<strong><em>Operatività:</em></strong> Automazione software/hardware per gestione distribuita della stampa 3D e KPI.",
  business_teamco: "<strong><em>Team & Società:</em></strong> Designer, ingegneri e tecnici specializzati; JUNO DESIGN SRL controllata da STUDIO PEDRINI SRL; 3FESTO SRL; brand: JUNO.AM e ANY3DP.",
    
    // Vision
    vision_quote: "La manifattura digitale è cultura: un ponte tra intuizione umana, automazione e software. La stampa 3D non è solo tecnologia, ma linguaggio che trasforma idee in oggetti e processi. Ogni pezzo stampato racconta visione e innovazione, grazie a strumenti digitali e software che abilitano nuove forme di creazione. Fabbricare oggi significa progettare il futuro, integrando pensiero, codice e materia.",
    // Misc
    vat_label: "P.IVA (IT)03456789012"
  },
  en: {
    intro: "Multidisciplinary entrepreneur with 15 years across digital manufacturing, industrial design and emerging tech. CEO / Creative Director at <strong class=\"highlight-text\">JUNO.AM</strong>, and Head of Products for <strong class=\"highlight-text\">ANY3DP.APP</strong>.",
    skills_h2: "SKILLS",
    business_h2: "BUSINESS",
    business_p: "JUNO.AM (founded in 2012) and 3FESTO/ANY3DP form an integrated ecosystem: professional 3D printing plus a modular MES for additive. I lead strategy, product, and end‑to‑end operations.",
    vision_h2: "Vision",
    logos_title: "MY COMPANIES AND PERSONAL ACTIVITY:",
  
    // Skills
  skills_cad: "<strong><em>CAD:</em></strong> Parametric and surface CAD for product/mechanical design; solid/NURBS modeling and drafting",
  skills_amtools: "<strong><em>AM Tools:</em></strong> Additive manufacturing toolchain: slicing, mesh repair, analysis and print preparation",
    skills_dev: "<strong><em>Dev:</em></strong> Full‑stack web (TypeScript/JavaScript/PHP), modern architectures (SPA/SSR/SSG), REST APIs, WebGL/3D, CI/CD, containers and Git",
    skills_ai: "<strong><em>AI:</em></strong> GPT APIs, Hugging Face, computer vision, hard‑coded prototypes",
    skills_admin: "<strong><em>Business Admin:</em></strong> 360° SME management, Italian tax and finance, budgeting, operations, strategy",
    skills_exp: "<strong><em>Hands‑on:</em></strong> company scale‑ups, founding and leadership, building independent brands",
    skills_mindset: "<strong><em>Mindset:</em></strong> vision, drive, pragmatism, balance between vision and execution",
    // Business
    business_roles: "<strong><em>Roles:</em></strong> Co‑founder/CEO & Creative Director (JUNO.AM); Head of Products (3FESTO/ANY3DP).",
    business_core: "<strong><em>Core:</em></strong> Professional 3D printing + modular MES platform supporting the full AM lifecycle.",
    business_tech: "<strong><em>3DP Technologies:</em></strong> HP MJF, Carbon DLS, LPBF, FDM, PolyJet (prototyping, series, functional parts).",
    business_services: "<strong><em>CAD Services:</em></strong> DfAM and topology optimization, prototyping/production, reverse engineering (scanning up to 0.05 mm).",
    business_software: "<strong><em>Software:</em></strong> Component‑based frontend (SSR/SSG, WebGL/3D); REST/event‑driven backend with queues/workers and observability; relational data + cache + object storage.",
    business_microservices: "<strong><em>Microservices:</em></strong> AI predictions, algorithmic quoting, 3D parsing, job tracking; mesh engine in C++, Three.js experiences; documented APIs for integrations.",
    business_ops: "<strong><em>Operations:</em></strong> Software/hardware automation for distributed 3D printing management and KPIs.",
  business_teamco: "<strong><em>Team & Company:</em></strong> Designers, engineers and specialized technicians; JUNO DESIGN SRL controlled by STUDIO PEDRINI SRL; 3FESTO SRL; brands: JUNO.AM and ANY3DP.",
    
    // Vision
    vision_quote: "Digital manufacturing is culture: a bridge between human intuition, automation, and software. 3D printing is not just technology, but a language that transforms ideas into objects and processes. Every printed piece tells a story of vision and innovation, thanks to digital tools and software that enable new forms of creation. Manufacturing today means designing the future, integrating thought, code, and matter.",
    // Misc
    vat_label: "VAT (IT)03456789012"
  },
  es: {
    intro: "Emprendedor multidisciplinario con 15 años de experiencia en fabricación digital, diseño industrial y tecnologías emergentes. CEO / Director Creativo en <strong class=\"highlight-text\">JUNO.AM</strong> y Head of Products en <strong class=\"highlight-text\">ANY3DP.APP</strong>.",
    skills_h2: "COMPETENCIAS",
    business_h2: "NEGOCIO",
    business_p: "JUNO.AM (fundada en 2012) y 3FESTO/ANY3DP: ecosistema integrado entre impresión 3D profesional y un MES modular para aditiva. Lidero estrategia, producto y operaciones end‑to‑end.",
    vision_h2: "Visión",
    logos_title: "MIS EMPRESAS Y ACTIVIDAD PERSONAL:",
  
    // Skills
  skills_cad: "<strong><em>CAD:</em></strong> CAD paramétrico y de superficies para diseño de producto/mecánico; modelado sólido/NURBS y planos",
  skills_amtools: "<strong><em>AM Tools:</em></strong> Herramientas para fabricación aditiva: slicing, reparación de mallas, análisis y preparación de impresión",
    skills_dev: "<strong><em>Dev:</em></strong> Web full‑stack (TypeScript/JavaScript/PHP), arquitecturas modernas (SPA/SSR/SSG), APIs REST, WebGL/3D, CI/CD, contenedores y Git",
    skills_ai: "<strong><em>AI:</em></strong> APIs de GPT, Hugging Face, visión por computadora, prototipos hard‑coded",
    skills_admin: "<strong><em>Administración:</em></strong> gestión 360° de PyMEs, fiscalidad y finanzas italianas, presupuestos, operaciones, estrategia",
    skills_exp: "<strong><em>Experiencia directa:</em></strong> scale‑ups de empresas, fundación y dirección, desarrollo de marcas independientes",
    skills_mindset: "<strong><em>Mindset:</em></strong> visión, motivación, pragmatismo, equilibrio entre visión y ejecución",
    // Business
    business_roles: "<strong><em>Roles:</em></strong> Co‑founder/CEO & Director Creativo (JUNO.AM); Head of Products (3FESTO/ANY3DP).",
    business_core: "<strong><em>Núcleo:</em></strong> Impresión 3D profesional + plataforma MES modular que soporta todo el ciclo AM.",
    business_tech: "<strong><em>Tecnologías 3DP:</em></strong> HP MJF, Carbon DLS, LPBF, FDM, PolyJet (prototipado, series, piezas funcionales).",
    business_services: "<strong><em>Servicios:</em></strong> DfAM y optimización topológica, prototipado/producción, ingeniería inversa (escaneo hasta 0,05 mm).",
    business_software: "<strong><em>Software:</em></strong> Frontend basado en componentes (SSR/SSG, WebGL/3D); Backend REST/event‑driven con colas/workers y observabilidad; datos relacionales + caché + object storage.",
    business_microservices: "<strong><em>Microservicios:</em></strong> predicciones de IA, cotización algorítmica, parsing 3D, seguimiento de trabajos; motor de malla en C++, experiencias con Three.js; APIs documentadas para integraciones.",
    business_ops: "<strong><em>Operación:</em></strong> Automatización de software/hardware para gestión distribuida de impresión 3D y KPIs.",
  business_teamco: "<strong><em>Equipo y Sociedad:</em></strong> Diseñadores, ingenieros y técnicos especializados; JUNO DESIGN SRL controlada por STUDIO PEDRINI SRL; 3FESTO SRL; marcas: JUNO.AM y ANY3DP.",
    
    // Vision
    vision_quote: "La manufactura digital es cultura: un puente entre la intuición humana, la automatización y el software. La impresión 3D no es solo tecnología, sino un lenguaje que transforma ideas en objetos y procesos. Cada pieza impresa cuenta una historia de visión e innovación, gracias a herramientas digitales y software que habilitan nuevas formas de creación. Fabricar hoy significa diseñar el futuro, integrando pensamiento, código y materia.",
    // Misc
    vat_label: "IVA (IT)03456789012"
  },
  ca: {
    intro: "Emprenedor multidisciplinari amb 15 anys d’experiència en fabricació digital, disseny industrial i tecnologies emergents. CEO / Director Creatiu a <strong class=\"highlight-text\">JUNO.AM</strong>, i Head of Products a <strong class=\"highlight-text\">ANY3DP.APP</strong>.",
    skills_h2: "COMPETÈNCIES",
    business_h2: "NEGOCI",
    business_p: "JUNO.AM (fundada el 2012) i 3FESTO/ANY3DP: ecosistema integrat entre impressió 3D professional i MES modular per a l’additiva. Lidero estratègia, producte i operacions end‑to‑end.",
    vision_h2: "Visió",
    logos_title: "LES MEVES EMPRESES I ACTIVITAT PERSONAL:",
  
    // Skills
  skills_cad: "<strong><em>CAD:</em></strong> CAD paramètric i de superfícies per a disseny de producte/mecànic; modelatge sòlid/NURBS i plànols",
  skills_amtools: "<strong><em>AM Tools:</em></strong> Eines per a manufactura additiva: slicing, reparació de malles, anàlisi i preparació d’impressió",
    skills_dev: "<strong><em>Dev:</em></strong> Web full‑stack (TypeScript/JavaScript/PHP), arquitectures modernes (SPA/SSR/SSG), APIs REST, WebGL/3D, CI/CD, contenidors i Git",
    skills_ai: "<strong><em>AI:</em></strong> APIs de GPT, Hugging Face, visió per computador, prototips hard‑coded",
    skills_admin: "<strong><em>Administració:</em></strong> gestió 360° de pimes, fiscalitat i finances italianes, pressupostos, operacions, estratègia",
    skills_exp: "<strong><em>Experiència directa:</em></strong> scale‑ups d’empresa, fundació i direcció, desenvolupament de marques independents",
    skills_mindset: "<strong><em>Mindset:</em></strong> visió, motivació, pragmatisme, equilibri entre visió i execució",
    // Business
    business_roles: "<strong><em>Rols:</em></strong> Co‑founder/CEO i Director Creatiu (JUNO.AM); Head of Products (3FESTO/ANY3DP).",
    business_core: "<strong><em>Nucli:</em></strong> Impressió 3D professional + plataforma MES modular que dona suport a tot el cicle AM.",
    business_tech: "<strong><em>Tecnologies 3DP:</em></strong> HP MJF, Carbon DLS, LPBF, FDM, PolyJet (prototipat, sèries, peces funcionals).",
    business_services: "<strong><em>Serveis:</em></strong> DfAM i optimització topològica, prototipat/producció, enginyeria inversa (escaneig fins a 0,05 mm).",
    business_software: "<strong><em>Software:</em></strong> Frontend basat en components (SSR/SSG, WebGL/3D); Backend REST/event‑driven amb cues/workers i observabilitat; dades relacionals + memòria cau + object storage.",
    business_microservices: "<strong><em>Microserveis:</em></strong> prediccions amb IA, pressupost algorítmic, parsing 3D, seguiment de treballs; motor de malla en C++, experiències Three.js; APIs documentades per a integracions.",
    business_ops: "<strong><em>Operacions:</em></strong> Automatització de software/hardware per a la gestió distribuïda de la impressió 3D i KPIs.",
  business_teamco: "<strong><em>Equip i Societat:</em></strong> Dissenyadors, enginyers i tècnics especialitzats; JUNO DESIGN SRL controlada per STUDIO PEDRINI SRL; 3FESTO SRL; marques: JUNO.AM i ANY3DP.",
    
    // Vision
    vision_quote: "La manufactura digital és cultura: un pont entre la intuïció humana, l'automatització i el programari. La impressió 3D no és només tecnologia, sinó un llenguatge que transforma idees en objectes i processos. Cada peça impresa explica una història de visió i innovació, gràcies a eines digitals i programari que habiliten noves formes de creació. Fabricar avui significa dissenyar el futur, integrant pensament, codi i matèria.",
    // Misc
    vat_label: "IVA (IT)03456789012"
  },
  fr: {
    intro: "Entrepreneur pluridisciplinaire avec 15 ans d’expérience en fabrication numérique, design industriel et technologies émergentes. CEO / Directeur Créatif chez <strong class=\"highlight-text\">JUNO.AM</strong> et Head of Products pour <strong class=\"highlight-text\">ANY3DP.APP</strong>.",
    skills_h2: "COMPÉTENCES",
    business_h2: "BUSINESS",
    business_p: "JUNO.AM (fondée en 2012) et 3FESTO/ANY3DP : un écosystème intégré entre impression 3D professionnelle et MES modulaire pour l’additif. Je dirige la stratégie, le produit et les opérations de bout en bout.",
    vision_h2: "Vision",
    logos_title: "MES ENTREPRISES ET MON ACTIVITÉ PERSONNELLE :",
  
    // Skills
  skills_cad: "<strong><em>CAD :</em></strong> CAO paramétrique et surfacique pour conception produit/mécanique ; modélisation solide/NURBS et mise en plan",
  skills_amtools: "<strong><em>Outils AM :</em></strong> Chaîne FA : slicing, réparation de maillages, analyse et préparation d’impression",
    skills_dev: "<strong><em>Dev :</em></strong> Web full‑stack (TypeScript/JavaScript/PHP), architectures modernes (SPA/SSR/SSG), APIs REST, WebGL/3D, CI/CD, conteneurs et Git",
    skills_ai: "<strong><em>IA :</em></strong> APIs GPT, Hugging Face, vision par ordinateur, prototypes hard‑coded",
    skills_admin: "<strong><em>Administration :</em></strong> gestion 360° de PME, fiscalité et finance italiennes, budgétisation, opérations, stratégie",
    skills_exp: "<strong><em>Expérience terrain :</em></strong> scale‑ups d’entreprises, création et direction, développement de marques indépendantes",
    skills_mindset: "<strong><em>Mindset :</em></strong> vision, motivation, pragmatisme, équilibre entre vision et exécution",
    // Business
    business_roles: "<strong><em>Rôles :</em></strong> Co‑founder/CEO & Directeur Créatif (JUNO.AM) ; Head of Products (3FESTO/ANY3DP).",
    business_core: "<strong><em>Cœur :</em></strong> Impression 3D professionnelle + plateforme MES modulaire couvrant tout le cycle AM.",
    business_tech: "<strong><em>Technologies 3DP :</em></strong> HP MJF, Carbon DLS, LPBF, FDM, PolyJet (prototypage, séries, pièces fonctionnelles).",
    business_services: "<strong><em>Services :</em></strong> DfAM et optimisation topologique, prototypage/production, rétro‑ingénierie (scan jusqu’à 0,05 mm).",
    business_software: "<strong><em>Logiciel :</em></strong> Frontend à base de composants (SSR/SSG, WebGL/3D) ; Backend REST/event‑driven avec files/workers et observabilité ; données relationnelles + cache + object storage.",
    business_microservices: "<strong><em>Microservices :</em></strong> prédictions IA, devis algorithmique, parsing 3D, suivi des jobs ; moteur de maillage en C++, expériences Three.js ; APIs documentées pour intégrations.",
    business_ops: "<strong><em>Opérations :</em></strong> Automatisation logiciel/matériel pour la gestion distribuée de l’impression 3D et des KPI.",
  business_teamco: "<strong><em>Équipe & Société :</em></strong> Designers, ingénieurs et techniciens spécialisés ; JUNO DESIGN SRL contrôlée par STUDIO PEDRINI SRL ; 3FESTO SRL ; marques : JUNO.AM et ANY3DP.",
    
    // Vision
    vision_quote: "La fabrication numérique est culture : un pont entre l'intuition humaine, l'automatisation et le logiciel. L'impression 3D n'est pas seulement une technologie, mais un langage qui transforme les idées en objets et processus. Chaque pièce imprimée raconte une histoire de vision et d'innovation, grâce à des outils numériques et des logiciels qui permettent de nouvelles formes de création. Fabriquer aujourd'hui signifie concevoir l'avenir, en intégrant pensée, code et matière.",
    // Misc
    vat_label: "TVA (IT)03456789012"
  },
  sr: {
    intro: "Multidisciplinarni preduzetnik sa 15 godina iskustva u digitalnoj proizvodnji, industrijskom dizajnu i novim tehnologijama. CEO / Kreativni direktor u <strong class=\"highlight-text\">JUNO.AM</strong> i Head of Products za <strong class=\"highlight-text\">ANY3DP.APP</strong>.",
    skills_h2: "VEŠTINE",
    business_h2: "BIZNIS",
    business_p: "JUNO.AM (osnovana 2012) i 3FESTO/ANY3DP: integrisani ekosistem profesionalne 3D štampe i modularnog MES softvera za aditivnu proizvodnju. Vodim strategiju, proizvod i end‑to‑end operacije.",
    vision_h2: "Vizija",
    logos_title: "MOJE KOMPANIJE I LIČNA AKTIVNOST:",
  
    // Skills
  skills_cad: "<strong><em>CAD:</em></strong> Parametarski i površinski CAD za produkt/mehanički dizajn; čvrsto/NURBS modelovanje i tehnički crteži",
  skills_amtools: "<strong><em>AM alati:</em></strong> Alatni lanac za aditivnu proizvodnju: slicing, popravka mreža, analiza i priprema štampe",
    skills_dev: "<strong><em>Dev:</em></strong> Full‑stack web (TypeScript/JavaScript/PHP), moderne arhitekture (SPA/SSR/SSG), REST API, WebGL/3D, CI/CD, kontejneri i Git",
    skills_ai: "<strong><em>AI:</em></strong> GPT API‑ji, Hugging Face, računarski vid, hard‑coded prototipovi",
    skills_admin: "<strong><em>Administracija:</em></strong> 360° upravljanje MSP, italijanski porezi i finansije, budžetiranje, operacije, strategija",
    skills_exp: "<strong><em>Praktično iskustvo:</em></strong> skaliranje kompanija, osnivanje i vođenje, razvoj nezavisnih brendova",
    skills_mindset: "<strong><em>Mindset:</em></strong> vizija, motivacija, pragmatizam, balans između vizije i egzekucije",
    // Business
    business_roles: "<strong><em>Uloge:</em></strong> Su‑osnivač/CEO i Kreativni direktor (JUNO.AM); Head of Products (3FESTO/ANY3DP).",
    business_core: "<strong><em>Jezgro:</em></strong> Profesionalna 3D štampa + modularna MES platforma koja podržava ceo AM ciklus.",
    business_tech: "<strong><em>3DP tehnologije:</em></strong> HP MJF, Carbon DLS, LPBF, FDM, PolyJet (prototipovi, serije, funkcionalni delovi).",
    business_services: "<strong><em>Usluge:</em></strong> DfAM i topološka optimizacija, prototipovanje/proizvodnja, reverzibilni inženjering (skener do 0,05 mm).",
    business_software: "<strong><em>Softver:</em></strong> Frontend zasnovan na komponentama (SSR/SSG, WebGL/3D); REST/event‑driven backend sa redovima/worker‑ima i observability; relacioni podaci + keš + object storage.",
    business_microservices: "<strong><em>Mikroservisi:</em></strong> AI predikcije, algoritamsko ponudjivanje cena, 3D parsing, praćenje poslova; mesh engine u C++, Three.js iskustva; dokumentovani API‑ji za integracije.",
    business_ops: "<strong><em>Operacije:</em></strong> Automatizacija softver/hardver za distribuirano upravljanje 3D štampom i KPI.",
  business_teamco: "<strong><em>Tim i Društvo:</em></strong> Dizajneri, inženjeri i specijalizovani tehničari; JUNO DESIGN SRL pod kontrolom STUDIO PEDRINI SRL; 3FESTO SRL; brendovi: JUNO.AM i ANY3DP.",
    
    // Vision
    vision_quote: "Digitalna proizvodnja je kultura: most između ljudske intuicije, automatizacije i softvera. 3D štampa nije samo tehnologija, već jezik koji pretvara ideje u objekte i procese. Svaki odštampani deo priča priču o viziji i inovaciji, zahvaljujući digitalnim alatima i softverima koji omogućavaju nove forme stvaranja. Proizvoditi danas znači dizajnirati budućnost, integrirajući misao, kod i materiju.",
    // Misc
    vat_label: "PDV (IT)03456789012"
  },
  ru: {
    intro: "Мультидисциплинарный предприниматель с 15‑летним опытом в цифровом производстве, промышленном дизайне и новых технологиях. CEO / Creative Director в <strong class=\"highlight-text\">JUNO.AM</strong> и Head of Products в <strong class=\"highlight-text\">ANY3DP.APP</strong>.",
    skills_h2: "НАВЫКИ",
    business_h2: "БИЗНЕС",
    business_p: "JUNO.AM (основана в 2012) и 3FESTO/ANY3DP — интегрированная экосистема: профессиональная 3D‑печать плюс модульная MES‑платформа для аддитивного производства. Руководю стратегией, продуктом и операциями end‑to‑end.",
    vision_h2: "Видение",
    logos_title: "МОИ КОМПАНИИ И ЛИЧНАЯ ДЕЯТЕЛЬНОСТЬ:",
  
    // Skills
  skills_cad: "<strong><em>CAD:</em></strong> Параметрическое и поверхностное CAD для продуктового/механического дизайна; твердотельное/NURBS‑моделирование и чертежи",
  skills_amtools: "<strong><em>Инструменты AM:</em></strong> Цепочка инструментов для АМ: слайсинг, починка сеток, анализ и подготовка к печати",
    skills_dev: "<strong><em>Разработка:</em></strong> Full‑stack веб (TypeScript/JavaScript/PHP), современные архитектуры (SPA/SSR/SSG), REST API, WebGL/3D, CI/CD, контейнеры и Git",
    skills_ai: "<strong><em>ИИ:</em></strong> GPT API, Hugging Face, компьютерное зрение, hard‑coded прототипы",
    skills_admin: "<strong><em>Администрирование бизнеса:</em></strong> 360° управление МСП, итальянские налоги и финансы, бюджетирование, операции, стратегия",
    skills_exp: "<strong><em>Практика:</em></strong> масштабирование компаний, основание и руководство, развитие независимых брендов",
    skills_mindset: "<strong><em>Подход:</em></strong> видение, мотивация, прагматизм, баланс между видением и исполнением",
    // Business
    business_roles: "<strong><em>Роли:</em></strong> Со‑основатель/CEO и креативный директор (JUNO.AM); Head of Products (3FESTO/ANY3DP).",
    business_core: "<strong><em>Ядро:</em></strong> Профессиональная 3D‑печать + модульная MES‑платформа, охватывающая весь жизненный цикл AM.",
    business_tech: "<strong><em>3DP‑технологии:</em></strong> HP MJF, Carbon DLS, LPBF, FDM, PolyJet (прототипирование, серии, функциональные детали).",
    business_services: "<strong><em>Услуги:</em></strong> DfAM и топологическая оптимизация, прототипирование/производство, реверс‑инжиниринг (сканирование до 0,05 мм).",
    business_software: "<strong><em>Софт:</em></strong> Frontend на компонентах (SSR/SSG, WebGL/3D); REST/event‑driven backend с очередями/воркерами и наблюдаемостью; реляционные данные + кэш + object storage.",
    business_microservices: "<strong><em>Микросервисы:</em></strong> AI‑предсказания, алгоритмические расчёты стоимости, 3D‑парсинг, трекинг задач; mesh‑движок на C++, проекты на Three.js; документированные API для интеграций.",
    business_ops: "<strong><em>Операции:</em></strong> Автоматизация ПО/ЖО для распределённого управления 3D‑печатью и KPI.",
  business_teamco: "<strong><em>Команда и компания:</em></strong> Дизайнеры, инженеры и профильные техники; JUNO DESIGN SRL под управлением STUDIO PEDRINI SRL; 3FESTO SRL; бренды: JUNO.AM и ANY3DP.",
    
    // Vision
    vision_quote: "Цифровое производство — культура: мост между человеческой интуицией, автоматизацией и программным обеспечением. 3D-печать — это не просто технология, а язык, преобразующий идеи в объекты и процессы. Каждая напечатанная деталь рассказывает историю видения и инноваций, благодаря цифровым инструментам и программному обеспечению, которые позволяют новые формы творчества. Производить сегодня значит проектировать будущее, интегрируя мысль, код и материю.",
    // Misc
    vat_label: "НДС (IT)03456789012"
  }
};

function applyLanguage(lang) {
  const dict = i18n[lang] || i18n.it;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });
  const buttons = document.querySelectorAll('#lang-toggle button');
  buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  try { localStorage.setItem('lang', lang); } catch {}
}

function setupLanguageToggle() {
  const container = document.getElementById('lang-toggle');
  if (!container) return;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lang]');
    if (!btn) return;
    const lang = btn.dataset.lang;
    applyLanguage(lang);
  });
  const saved = (() => { try { return localStorage.getItem('lang'); } catch { return null; }})();
  const supported = ['it','en','es','ca','fr','sr','ru'];
  const initial = supported.includes(saved) ? saved : 'it';
  applyLanguage(initial);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { 
    setupLanguageToggle();
  });
} else {
  setupLanguageToggle();
}

animate();

updateMobileOffset(false);