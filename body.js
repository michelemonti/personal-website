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
    controls_bar: "Trascina: orbit • Inclina: hover • Doppio tap: reset",
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
    business_services: "<strong><em>Servizi:</em></strong> DfAM e ottimizzazione topologica, prototipazione/produzione, reverse engineering (scanner fino a 0,05 mm).",
    business_software: "<strong><em>Software:</em></strong> Frontend component‑based (SSR/SSG, WebGL/3D); Backend REST/event‑driven con queue/worker e observability; dati relazionali + cache + object storage.",
    business_microservices: "<strong><em>Microservizi:</em></strong> AI predictions, algoritmic quoting, 3D parsing, job tracking; engine mesh C++, Three.js experience; API documentate per integrazioni.",
    business_ops: "<strong><em>Operatività:</em></strong> Automazione software/hardware per gestione distribuita della stampa 3D e KPI.",
  business_teamco: "<strong><em>Team & Società:</em></strong> Designer, ingegneri e tecnici specializzati; JUNO DESIGN SRL controllata da STUDIO PEDRINI SRL; 3FESTO SRL; brand: JUNO.AM e ANY3DP.",
    
    // Vision
    vision_quote: "La manifattura non è solo produzione, è una forma di cultura: un gesto progettuale che connette umanità e automazione.<br>È l'incontro tra la sensibilità umana e la precisione digitale, tra l’intuizione di chi progetta e la logica di chi automatizza.<br>Nella stampa 3D, ho trovato molto più di una tecnologia: un linguaggio espressivo capace di trasformare sogni in oggetti, idee in impatti reali, layer dopo layer.<br>Ogni pezzo stampato è una testimonianza di visione, resilienza e innovazione.<br>Fabbricare oggi significa ridisegnare la supply chain, democratizzare l’accesso alla creazione e restituire centralità al pensiero progettuale.<br>La manifattura digitale è cultura tangibile: è un atto umano che guarda al futuro, senza dimenticare le radici di chi ha imparato costruendo.",
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
    controls_bar: "Drag: orbit • Tilt: hover • Double tap: reset",
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
    business_services: "<strong><em>Services:</em></strong> DfAM and topology optimization, prototyping/production, reverse engineering (scanning up to 0.05 mm).",
    business_software: "<strong><em>Software:</em></strong> Component‑based frontend (SSR/SSG, WebGL/3D); REST/event‑driven backend with queues/workers and observability; relational data + cache + object storage.",
    business_microservices: "<strong><em>Microservices:</em></strong> AI predictions, algorithmic quoting, 3D parsing, job tracking; mesh engine in C++, Three.js experiences; documented APIs for integrations.",
    business_ops: "<strong><em>Operations:</em></strong> Software/hardware automation for distributed 3D printing management and KPIs.",
  business_teamco: "<strong><em>Team & Company:</em></strong> Designers, engineers and specialized technicians; JUNO DESIGN SRL controlled by STUDIO PEDRINI SRL; 3FESTO SRL; brands: JUNO.AM and ANY3DP.",
    
    // Vision
    vision_quote: "Manufacturing is not just production; it's a form of culture: a design act that connects humanity and automation.<br>It’s the encounter between human sensitivity and digital precision, between the intuition of the designer and the logic of the automator.<br>In 3D printing I found much more than a technology: an expressive language capable of turning dreams into objects, ideas into real impact, layer after layer.<br>Every printed piece is a testament to vision, resilience, and innovation.<br>To manufacture today means redesigning the supply chain, democratizing access to creation, and bringing design thinking back to the center.<br>Digital manufacturing is tangible culture: a human act that looks to the future without forgetting the roots of those who learned by building.",
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
    controls_bar: "Arrastrar: órbita • Inclinar: hover • Doble toque: reset",
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
    vision_quote: "La manufactura no es solo producción; es una forma de cultura: un gesto de diseño que conecta humanidad y automatización.<br>Es el encuentro entre la sensibilidad humana y la precisión digital, entre la intuición de quien diseña y la lógica de quien automatiza.<br>En la impresión 3D encontré mucho más que una tecnología: un lenguaje expresivo capaz de transformar sueños en objetos, ideas en impacto real, capa tras capa.<br>Cada pieza impresa es testimonio de visión, resiliencia e innovación.<br>Fabricar hoy significa rediseñar la cadena de suministro, democratizar el acceso a la creación y devolver centralidad al pensamiento de diseño.<br>La manufactura digital es cultura tangible: un acto humano que mira al futuro sin olvidar las raíces de quienes aprendieron construyendo.",
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
    controls_bar: "Arrossega: òrbita • Inclina: hover • Doble toc: reset",
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
    vision_quote: "La manufactura no és només producció; és una forma de cultura: un gest de disseny que connecta humanitat i automatització.<br>És la trobada entre la sensibilitat humana i la precisió digital, entre la intuïció de qui dissenya i la lògica de qui automatitza.<br>En la impressió 3D he trobat molt més que una tecnologia: un llenguatge expressiu capaç de convertir somnis en objectes, idees en impacte real, capa rere capa.<br>Cada peça impresa és un testimoni de visió, resiliència i innovació.<br>Fabricar avui significa redissenyar la cadena de subministrament, democratitzar l’accés a la creació i retornar centralitat al pensament de disseny.<br>La manufactura digital és cultura tangible: un acte humà que mira cap al futur sense oblidar les arrels de qui ha après construint.",
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
    controls_bar: "Faites glisser : orbite • Inclinez : survol • Double tap : réinitialiser",
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
    vision_quote: "La fabrication n’est pas seulement de la production ; c’est une forme de culture : un geste de conception qui relie l’humanité et l’automatisation.<br>C’est la rencontre entre la sensibilité humaine et la précision numérique, entre l’intuition de celui qui conçoit et la logique de celui qui automatise.<br>Dans l’impression 3D, j’ai trouvé bien plus qu’une technologie : un langage expressif capable de transformer des rêves en objets, des idées en impacts réels, couche après couche.<br>Chaque pièce imprimée témoigne de vision, de résilience et d’innovation.<br>Fabriquer aujourd’hui, c’est redessiner la chaîne d’approvisionnement, démocratiser l’accès à la création et redonner au design sa centralité.<br>La fabrication numérique est une culture tangible : un acte humain tourné vers l’avenir, sans oublier les racines de ceux qui ont appris en construisant.",
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
    controls_bar: "Prevuci: orbita • Nagnite: hover • Dvostruki dodir: reset",
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
    vision_quote: "Proizvodnja nije samo proizvod; to je oblik kulture: dizajnerski gest koji povezuje humanost i automatizaciju.<br>To je susret ljudske osetljivosti i digitalne preciznosti, između intuicije onoga ko projektuje i logike onoga ko automatizuje.<br>U 3D štampi pronašao sam mnogo više od tehnologije: izražajni jezik koji pretvara snove u objekte, ideje u stvarni uticaj, sloj po sloj.<br>Svaki odštampani deo je svedočanstvo vizije, otpornosti i inovacije.<br>Proizvoditi danas znači redizajnirati lanac snabdevanja, demokratizovati pristup kreaciji i vratiti centralnost dizajnerskom razmišljanju.<br>Digitalna proizvodnja je opipljiva kultura: ljudski čin okrenut budućnosti, ne zaboravljajući korene onih koji su učili gradeći.",
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
    controls_bar: "Перетаскивание: орбита • Наклон: hover • Двойной тап: сброс",
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
    vision_quote: "Производство — это не просто выпуск продукции; это форма культуры: проектный жест, соединяющий человечность и автоматизацию.<br>Это встреча человеческой чувствительности и цифровой точности, интуиции проектировщика и логики автоматизатора.<br>В 3D‑печати я нашёл гораздо больше, чем технологию: выразительный язык, способный превращать мечты в объекты, идеи — в реальный эффект, слой за слоем.<br>Каждая напечатанная деталь — свидетельство видения, устойчивости и инноваций.<br>Производить сегодня — значит переосмысливать цепочку поставок, демократизировать доступ к созданию и возвращать центральность проектному мышлению.<br>Цифровое производство — осязаемая культура: человеческий акт, устремлённый в будущее, не забывающий корни тех, кто учился, создавая.",
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
  document.addEventListener('DOMContentLoaded', setupLanguageToggle);
} else {
  setupLanguageToggle();
}

animate();

updateMobileOffset(false);