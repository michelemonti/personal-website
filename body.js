const bgDiv = document.getElementById('bg3d');
Object.assign(bgDiv.style, {
  position: 'fixed',
  zIndex: '0',
  top: 0, left: 0, width: '100vw', height: '100vh',
  overflow: 'hidden'
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  alpha: true, 
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
if (renderer.outputColorSpace !== undefined) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} else if (renderer.outputEncoding !== undefined) {
  renderer.outputEncoding = THREE.sRGBEncoding;
}
renderer.domElement.style.pointerEvents = 'auto';
renderer.domElement.style.display = 'block';
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
bgDiv.appendChild(renderer.domElement);
renderer.domElement.style.opacity = '0';
renderer.domElement.style.transition = 'opacity 2s ease';
renderer.domElement.style.willChange = 'opacity';
let __fadedIn = false;

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
  if (window.innerWidth < 700 && atBottom) {
    const windowH = window.innerHeight;
    targetY = windowH * 0.15;
    camera.lookAt(0, targetY, 0);
  } else {
    targetY = 0;
    updateCameraFromSpherical();
  }
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
  theta -= deltaX * 0.008;
  phi   -= deltaY * 0.008;
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
  const scrollY = window.scrollY || window.pageYOffset;
  const docH = document.documentElement.scrollHeight;
  const windowH = window.innerHeight;
  const maxScroll = Math.max(docH - windowH, 1);
  const scrollProgress = Math.min(scrollY / maxScroll, 1);
  let baseScale;
  if (window.innerWidth < 700) {
    baseScale = 2.5 - (scrollProgress * 1.9);
  } else {
    baseScale = 3.5 - (scrollProgress * 2.5);
  }
  baseScale = Math.max(baseScale, window.innerWidth < 700 ? 0.6 : 1.0);
  particles.rotation.x += 0.001;
  particles.rotation.y += 0.002;
  targetRotationY = interactionEnabled ? 0 : mouseX * 0.5;
  mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.05;
  mesh.rotation.x += (mouseY * 0.5 - mesh.rotation.x) * 0.05;
  mesh.rotation.z += 0.0045;
  mesh.scale.set(baseScale, baseScale, baseScale);
  let yOffset = 0;
  if (window.innerWidth < 700) {
    const distFromBottom = Math.max(docH - (scrollY + windowH), 0);
    const bottomZone = 400;
    
    if (distFromBottom <= bottomZone) {
      const progress = 1 - (distFromBottom / bottomZone);
      yOffset = progress * windowH * 0.3;
    }
  }
  mesh.position.set(0, yOffset, 0);
  renderer.render(scene, camera);
  if (!__fadedIn) { renderer.domElement.style.opacity = '1'; __fadedIn = true; }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.width = window.innerWidth + 'px';
  renderer.domElement.style.height = window.innerHeight + 'px';
  updateCameraFromSpherical();
  updateMobileOffset(interactionEnabled);
});

let hintShownOnce = false;
let hintTimeout = null;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  const atBottom = scrollY + windowH >= docH - 400;
  interactionEnabled = atBottom;
  updateMobileOffset(atBottom);
  
  // Show/hide interaction hint
  const hint = document.getElementById('interaction-hint');
  if (hint) {
    if (atBottom && !hintShownOnce) {
      hint.classList.add('visible');
      hintShownOnce = true;
      // Auto-hide after 4 seconds
      if (hintTimeout) clearTimeout(hintTimeout);
      hintTimeout = setTimeout(() => {
        hint.classList.remove('visible');
      }, 4000);
    } else if (!atBottom) {
      hint.classList.remove('visible');
      hintShownOnce = false;
    }
  }
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

const i18n = {
  it: {
    intro: "Imprenditore con 15 anni nella manifattura digitale e stampa 3D. CEO di <strong class=\"highlight-text\">JUNO.AM</strong>, Head of Products per <strong class=\"highlight-text\">3FESTO</strong>. Costruisco aziende, prodotti e team.",
    skills_h2: "COMPETENZE",
    business_h2: "BUSINESS",
    vision_h2: "VISIONE",
    logos_title: "LE MIE IMPRESE E LA MIA ATTIVITÀ PERSONALE:",
    
    skills_design: "<strong><em>Design & CAD:</em></strong> Modellazione parametrica e organica, DfAM, reverse engineering",
    skills_3dp: "<strong><em>Stampa 3D:</em></strong> HP MJF, Carbon DLS, DMLS, FDM, PolyJet — dalla prototipazione alla produzione",
    skills_tech: "<strong><em>Coding:</em></strong> Full-stack dev, architetture cloud, AI/ML applicata dal manufacturing al day-to-day",
    skills_business: "<strong><em>Business:</em></strong> Strategia, operations, fundraising, gestione PMI",

    business_juno: "<strong><em>JUNO.AM</em></strong> (2012) — Service bureau 3D printing professionale. Prototipazione rapida, produzione in serie, design industriale.",
    business_3festo: "<strong><em>3FESTO</em></strong> (2020) — 4 linee di prodotto: MES software per AM, hardware custom, operations utilities, servizi IT avanzati.",
    business_freelance: "<strong><em>FREELANCE</em></strong> — Everywhere.",

    vision_quote: "Credo che la manifattura digitale sia il ponte tra idee e oggetti. Il mio lavoro è costruire gli strumenti che rendono questo possibile.",

    vat_label: "P.IVA (IT)03456789012",
    hint_interact: "Interagisci con il solido 3D!"
  },
  en: {
    intro: "Entrepreneur with 15 years in digital manufacturing and 3D printing. CEO at <strong class=\"highlight-text\">JUNO.AM</strong>, Head of Products at <strong class=\"highlight-text\">3FESTO</strong>. I build companies, products and teams.",
    skills_h2: "SKILLS",
    business_h2: "BUSINESS",
    vision_h2: "VISION",
    logos_title: "MY COMPANIES AND PERSONAL ACTIVITY:",
    
    skills_design: "<strong><em>Design & CAD:</em></strong> Parametric and organic modeling, DfAM, reverse engineering",
    skills_3dp: "<strong><em>3D Printing:</em></strong> HP MJF, Carbon DLS, DMLS, FDM, PolyJet — from prototyping to production",
    skills_tech: "<strong><em>Coding:</em></strong> Full-stack dev, cloud architectures, AI/ML applied from manufacturing to day-to-day",
    skills_business: "<strong><em>Business:</em></strong> Strategy, operations, fundraising, SME management",

    business_juno: "<strong><em>JUNO.AM</em></strong> (2012) — Professional 3D printing service bureau. Rapid prototyping, series production, industrial design.",
    business_3festo: "<strong><em>3FESTO</em></strong> (2020) — 4 product lines: MES software for AM, custom hardware, operations utilities, advanced IT services.",
    business_freelance: "<strong><em>FREELANCE</em></strong> — Everywhere.",

    vision_quote: "I believe digital manufacturing is the bridge between ideas and objects. My job is to build the tools that make this possible.",

    vat_label: "VAT (IT)03456789012",
    hint_interact: "Interact with the 3D shape!"
  },
  es: {
    intro: "Emprendedor con 15 años en fabricación digital e impresión 3D. CEO de <strong class=\"highlight-text\">JUNO.AM</strong>, Head of Products en <strong class=\"highlight-text\">3FESTO</strong>. Construyo empresas, productos y equipos.",
    skills_h2: "COMPETENCIAS",
    business_h2: "NEGOCIO",
    vision_h2: "VISIÓN",
    logos_title: "MIS EMPRESAS Y ACTIVIDAD PERSONAL:",
    
    skills_design: "<strong><em>Diseño & CAD:</em></strong> Modelado paramétrico y orgánico, DfAM, ingeniería inversa",
    skills_3dp: "<strong><em>Impresión 3D:</em></strong> HP MJF, Carbon DLS, DMLS, FDM, PolyJet — del prototipado a la producción",
    skills_tech: "<strong><em>Coding:</em></strong> Full-stack dev, arquitecturas cloud, AI/ML aplicada del manufacturing al día a día",
    skills_business: "<strong><em>Negocio:</em></strong> Estrategia, operaciones, fundraising, gestión de PyMEs",

    business_juno: "<strong><em>JUNO.AM</em></strong> (2012) — Service bureau de impresión 3D profesional. Prototipado rápido, producción en serie, diseño industrial.",
    business_3festo: "<strong><em>3FESTO</em></strong> (2020) — 4 líneas de producto: software MES para AM, hardware custom, utilidades operativas, servicios IT avanzados.",
    business_freelance: "<strong><em>FREELANCE</em></strong> — En todas partes.",

    vision_quote: "Creo que la manufactura digital es el puente entre ideas y objetos. Mi trabajo es construir las herramientas que lo hacen posible.",

    vat_label: "IVA (IT)03456789012",
    hint_interact: "¡Interactúa con el sólido 3D!"
  },
  ca: {
    intro: "Emprenedor amb 15 anys en fabricació digital i impressió 3D. CEO de <strong class=\"highlight-text\">JUNO.AM</strong>, Head of Products a <strong class=\"highlight-text\">3FESTO</strong>. Construeixo empreses, productes i equips.",
    skills_h2: "COMPETÈNCIES",
    business_h2: "NEGOCI",
    vision_h2: "VISIÓ",
    logos_title: "LES MEVES EMPRESES I ACTIVITAT PERSONAL:",
    
    skills_design: "<strong><em>Disseny & CAD:</em></strong> Modelatge paramètric i orgànic, DfAM, enginyeria inversa",
    skills_3dp: "<strong><em>Impressió 3D:</em></strong> HP MJF, Carbon DLS, DMLS, FDM, PolyJet — del prototipat a la producció",
    skills_tech: "<strong><em>Coding:</em></strong> Full-stack dev, arquitectures cloud, AI/ML aplicada del manufacturing al dia a dia",
    skills_business: "<strong><em>Negoci:</em></strong> Estratègia, operacions, fundraising, gestió de pimes",

    business_juno: "<strong><em>JUNO.AM</em></strong> (2012) — Service bureau d'impressió 3D professional. Prototipat ràpid, producció en sèrie, disseny industrial.",
    business_3festo: "<strong><em>3FESTO</em></strong> (2020) — 4 línies de producte: software MES per AM, hardware custom, utilitats operatives, serveis IT avançats.",
    business_freelance: "<strong><em>FREELANCE</em></strong> — Arreu.",

    vision_quote: "Crec que la manufactura digital és el pont entre idees i objectes. La meva feina és construir les eines que ho fan possible.",

    vat_label: "IVA (IT)03456789012",
    hint_interact: "Interactua amb el sòlid 3D!"
  },
  fr: {
    intro: "Entrepreneur avec 15 ans dans la fabrication numérique et l'impression 3D. CEO de <strong class=\"highlight-text\">JUNO.AM</strong>, Head of Products chez <strong class=\"highlight-text\">3FESTO</strong>. Je construis des entreprises, des produits et des équipes.",
    skills_h2: "COMPÉTENCES",
    business_h2: "BUSINESS",
    vision_h2: "VISION",
    logos_title: "MES ENTREPRISES ET ACTIVITÉ PERSONNELLE :",
    
    skills_design: "<strong><em>Design & CAD :</em></strong> Modélisation paramétrique et organique, DfAM, rétro-ingénierie",
    skills_3dp: "<strong><em>Impression 3D :</em></strong> HP MJF, Carbon DLS, DMLS, FDM, PolyJet — du prototypage à la production",
    skills_tech: "<strong><em>Coding :</em></strong> Full-stack dev, architectures cloud, AI/ML appliquée du manufacturing au quotidien",
    skills_business: "<strong><em>Business :</em></strong> Stratégie, opérations, fundraising, gestion de PME",

    business_juno: "<strong><em>JUNO.AM</em></strong> (2012) — Service bureau d'impression 3D professionnelle. Prototypage rapide, production en série, design industriel.",
    business_3festo: "<strong><em>3FESTO</em></strong> (2020) — 4 lignes de produits : logiciel MES pour AM, hardware custom, utilitaires opérationnels, services IT avancés.",
    business_freelance: "<strong><em>FREELANCE</em></strong> — Partout.",

    vision_quote: "Je crois que la fabrication numérique est le pont entre les idées et les objets. Mon travail est de construire les outils qui rendent cela possible.",

    vat_label: "TVA (IT)03456789012",
    hint_interact: "Interagissez avec le solide 3D !"
  },
  sr: {
    intro: "Preduzetnik sa 15 godina u digitalnoj proizvodnji i 3D štampi. CEO u <strong class=\"highlight-text\">JUNO.AM</strong>, Head of Products u <strong class=\"highlight-text\">3FESTO</strong>. Gradim kompanije, proizvode i timove.",
    skills_h2: "VEŠTINE",
    business_h2: "BIZNIS",
    vision_h2: "VIZIJA",
    logos_title: "MOJE KOMPANIJE I LIČNA AKTIVNOST:",
    
    skills_design: "<strong><em>Dizajn & CAD:</em></strong> Parametarsko i organsko modelovanje, DfAM, reverzni inženjering",
    skills_3dp: "<strong><em>3D štampa:</em></strong> HP MJF, Carbon DLS, DMLS, FDM, PolyJet — od prototipa do proizvodnje",
    skills_tech: "<strong><em>Coding:</em></strong> Full-stack dev, cloud arhitekture, AI/ML primenjena od proizvodnje do svakodnevnice",
    skills_business: "<strong><em>Biznis:</em></strong> Strategija, operacije, fundraising, upravljanje MSP",

    business_juno: "<strong><em>JUNO.AM</em></strong> (2012) — Profesionalni 3D printing servis. Brzo prototipovanje, serijska proizvodnja, industrijski dizajn.",
    business_3festo: "<strong><em>3FESTO</em></strong> (2020) — 4 linije proizvoda: MES softver za AM, custom hardver, operativni alati, napredne IT usluge.",
    business_freelance: "<strong><em>FREELANCE</em></strong> — Svuda.",

    vision_quote: "Verujem da je digitalna proizvodnja most između ideja i objekata. Moj posao je da gradim alate koji to omogućavaju.",

    vat_label: "PDV (IT)03456789012",
    hint_interact: "Interagujte sa 3D telom!"
  },
  ru: {
    intro: "Предприниматель с 15-летним опытом в цифровом производстве и 3D-печати. CEO <strong class=\"highlight-text\">JUNO.AM</strong>, Head of Products в <strong class=\"highlight-text\">3FESTO</strong>. Строю компании, продукты и команды.",
    skills_h2: "НАВЫКИ",
    business_h2: "БИЗНЕС",
    vision_h2: "ВИДЕНИЕ",
    logos_title: "МОИ КОМПАНИИ И ЛИЧНАЯ ДЕЯТЕЛЬНОСТЬ:",
    
    skills_design: "<strong><em>Дизайн & CAD:</em></strong> Параметрическое и органическое моделирование, DfAM, реверс-инжиниринг",
    skills_3dp: "<strong><em>3D-печать:</em></strong> HP MJF, Carbon DLS, DMLS, FDM, PolyJet — от прототипа до производства",
    skills_tech: "<strong><em>Coding:</em></strong> Full-stack dev, облачные архитектуры, AI/ML от производства до повседневной работы",
    skills_business: "<strong><em>Бизнес:</em></strong> Стратегия, операции, fundraising, управление МСП",

    business_juno: "<strong><em>JUNO.AM</em></strong> (2012) — Профессиональный сервис 3D-печати. Быстрое прототипирование, серийное производство, промышленный дизайн.",
    business_3festo: "<strong><em>3FESTO</em></strong> (2020) — 4 линейки продуктов: MES-софт для AM, кастомное оборудование, операционные утилиты, продвинутые IT-услуги.",
    business_freelance: "<strong><em>FREELANCE</em></strong> — Везде.",

    vision_quote: "Я верю, что цифровое производство — это мост между идеями и объектами. Моя работа — создавать инструменты, которые делают это возможным.",

    vat_label: "НДС (IT)03456789012",
    hint_interact: "Взаимодействуйте с 3D-фигурой!"
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
  

  container.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.activeElement?.blur?.();
    }
  });
  
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
    animate();
  });
} else {
  setupLanguageToggle();
  animate();
}

updateMobileOffset(false);