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
    [0.44, 0.78, 0.86],
    [0.55, 0.63, 0.72],
    [0.72, 0.79, 0.84]
  ];
  const colorSet = colors[Math.floor(Math.random() * colors.length)];
  particlesColors[i] = colorSet[0];
  particlesColors[i + 1] = colorSet[1];
  particlesColors[i + 2] = colorSet[2];
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 1.6,
  vertexColors: true,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const geometry = new THREE.IcosahedronGeometry(6, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x2b3d48,
  metalness: 0.5,
  roughness: 0.5,
  emissive: 0x000000,
  side: THREE.DoubleSide
});
const mesh = new THREE.Mesh(geometry, material);
const edges = new THREE.EdgesGeometry(geometry);
const wireMaterial = new THREE.LineBasicMaterial({ color: 0x9fd8e5, transparent: true, opacity: 0.14 });
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
  camera.lookAt(0, 0, 0);
}

document.addEventListener('click', (e) => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  if (scrollY + windowH >= docH - 400) {
    mesh.material.color.setHex(0x6fc7db);
    if (mesh.material.emissive) mesh.material.emissive.setHex(0x06222b);
    setTimeout(() => {
      mesh.material.color.setHex(0x2b3d48);
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





function createClickEffect(x, y) {
  const effect = document.createElement('div');
  effect.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: 30px;
    height: 30px;
    background: radial-gradient(circle, rgba(111, 199, 219, 0.75) 0%, transparent 70%);
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
  // Inverted zoom: page opens *inside* the solid (dark inner faces),
  // scrolling pulls the camera out and reveals it.
  let baseScale;
  if (window.innerWidth < 700) {
    baseScale = 6.4 - (scrollProgress * 4.8);
  } else {
    baseScale = 6.4 - (scrollProgress * 4.4);
  }
  baseScale = Math.max(baseScale, window.innerWidth < 700 ? 1.6 : 2.0);
  particles.rotation.x += 0.001;
  particles.rotation.y += 0.002;
  targetRotationY = interactionEnabled ? 0 : mouseX * 0.5;
  mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.05;
  mesh.rotation.x += (mouseY * 0.5 - mesh.rotation.x) * 0.05;
  mesh.rotation.z += 0.0045;
  mesh.scale.set(baseScale, baseScale, baseScale);
  mesh.position.set(0, 0, 0);
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
});

let hintShownOnce = false;
let hintTimeout = null;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  const atBottom = scrollY + windowH >= docH - 400;
  interactionEnabled = atBottom && window.innerWidth >= 700;
  
  const hint = document.getElementById('interaction-hint');
  if (hint) {
    if (interactionEnabled && !hintShownOnce) {
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
    nav_home: "Home",
    nav_story: "La storia",
    nav_work: "Lavora con me",

    hero_kicker: "Additive Manufacturing · Software · Team tecnici",
    hero_role: "Digital Manufacturing Entrepreneur — CEO @ JUNO.AM · Head of Products @ 3FESTO / ANY3DP",
    hero_lede: "Da 15 anni dentro la stampa 3D industriale: macchine, materiali, software, business e persone.",
    hero_sub: "Costruisco prodotti, sistemi e team nella manifattura digitale, per PMI e grandi gruppi industriali. Da Bologna, nel cuore dell'Emilia-Romagna tra Motor Valley e Packaging Valley, porto l'additive manufacturing dalla prototipazione alla produzione reale — con il software come leva.",
    hero_cta_work: "Lavora con me",

    cred_1: "15+ anni di stampa 3D",
    cred_4: "AM + Software + Human Team",
    cred_5: "Bologna · Emilia-Romagna",
    cred_6: "Motor Valley · Packaging Valley",

    do_kicker: "Cosa faccio",
    do_h2: "Dove porto valore",
    do_1_t: "Additive Manufacturing & DfAM",
    do_1_d: "HP MJF, Carbon DLS, DMLS, FDM, PolyJet. Design for AM, reverse engineering, scelta di tecnologie e materiali per applicazioni reali.",
    do_2_t: "Industrializzazione & produzione",
    do_2_d: "Dal prototipo alla serie: workflow produttivi, post-processing, qualità, costi. La parte dell'AM che si vede solo dentro un'officina.",
    do_3_t: "Software, AI & automazione",
    do_3_d: "Sviluppo full-stack, architetture cloud, MES per AM, AI applicata a preventivazione, produzione e operations manifatturiere.",
    do_4_t: "Prodotto & strategia",
    do_4_d: "Product thinking applicato al manufacturing: cosa costruire, per chi, con quale modello di business. Esperienza diretta da founder, con PMI e realtà corporate.",
    do_5_t: "Team tecnici & operations",
    do_5_d: "Costruzione e gestione di team che mescolano officina e codice: cultura tecnica, processi, autonomia, responsabilità.",

    biz_kicker: "Imprese",
    biz_h2: "Dove lavoro ogni giorno",
    biz_juno_meta: "CEO · dal 2012",
    biz_juno_d: "Service bureau di stampa 3D professionale: prototipazione rapida, produzione in serie, design industriale per aziende e studi tecnici.",
    biz_3festo_meta: "Head of Products · dal 2020",
    biz_3festo_d: "MES software per additive manufacturing, hardware custom, utilities operative e servizi IT avanzati per chi produce davvero.",
    biz_piva_meta: "Attività indipendente · P.IVA",
    biz_piva_t: "Advisory & progetti selezionati",
    biz_piva_d: "Collaborazioni dirette con aziende e founder su AM, software per manufacturing e team tecnici. Poche cose, fatte bene.",
    biz_piva_cta: "come lavoro →",

    tl_kicker: "Percorso",
    tl_h2: "15 anni in sette righe",
    tl_2009: "<strong>Primo contatto con la stampa 3D industriale.</strong> PolyJet, Objet EDEN500V: da lì non sono più uscito.",
    tl_2012: "<strong>Nasce il percorso JUNO.AM.</strong> Dalla prototipazione al service bureau professionale.",
    tl_2014: "<strong>FabLab Valsamoggia e cultura maker.</strong> Divulgazione, comunità, accesso alla fabbricazione digitale.",
    tl_2017: "<strong>HP Multi Jet Fusion.</strong> Il salto dalla prototipazione alla produzione in serie.",
    tl_2020a: "<strong>Partnership Carbon DLS.</strong> Tecnologia dalla Silicon Valley, portata in produzione e seguita in prima persona.",
    tl_2020b: "<strong>Nasce 3FESTO / ANY3DP.</strong> MES e software per far scalare la produzione additiva.",
    tl_now_y: "Oggi",
    tl_now: "<strong>AI e software per sistemi manifatturieri.</strong> Automazione, dati e strumenti per chi produce.",
    tl_more: "Leggi la storia completa →",

    phil_kicker: "Visione",
    phil_quote: "La manifattura digitale è il ponte tra le idee e gli oggetti. Il software è il sistema nervoso che lo rende scalabile.",
    phil_note: "Il mio lavoro è costruire entrambi — e i team che li fanno funzionare.",

    contact_kicker: "Contatti",
    contact_h2: "Parliamone",
    contact_intro: "Se lavori su additive manufacturing, sviluppo prodotto, software per il manufacturing o team tecnici, il modo più semplice è scrivermi.",

    wm_kicker: "Advisory · Progetti · P.IVA",
    wm_title: "Collaboro in modo selezionato con chi produce, progetta o costruisce software per il manufacturing.",
    wm_intro: "Gruppi industriali, PMI, founder e reparti tecnici che lavorano su additive manufacturing, sviluppo prodotto, software per il manufacturing, automazione e team tecnici. Non faccio consulenza a volume: prendo pochi incarichi, dove la mia esperienza diretta fa la differenza.",
    wm_how_kicker: "Come posso aiutare",
    wm_how_h2: "Ambiti di intervento",
    wm_svc1_t: "AM production readiness review",
    wm_svc1_d: "Valutazione onesta di quanto un'applicazione, un reparto o un prodotto è pronto per la produzione additiva: tecnologie, costi, colli di bottiglia, rischi.",
    wm_svc2_t: "DfAM & design review",
    wm_svc2_d: "Revisione di parti e assiemi per la produzione additiva: geometrie, materiali, tolleranze, post-processing. Riprogettare per l'AM, non adattare.",
    wm_svc3_t: "Audit di workflow e operations",
    wm_svc3_d: "Analisi di come ordini, file, macchine e persone si muovono in produzione. Dove si perde tempo, dove si perde margine, cosa automatizzare.",
    wm_svc4_t: "Scelte tecnologiche AM",
    wm_svc4_d: "Supporto in decisioni di investimento: MJF, DLS, DMLS, FDM, PolyJet o nessuna di queste. Ho lavorato con tutte, so cosa promettono e cosa mantengono.",
    wm_svc5_t: "Roadmap software & AI per il manufacturing",
    wm_svc5_d: "Cosa ha senso costruire, comprare o integrare: MES, preventivazione, automazione, AI applicata. Da chi il software per l'AM lo ha costruito davvero.",
    wm_svc6_t: "Temporary / fractional leadership",
    wm_svc6_d: "Guida temporanea di prodotto, AM o area tecnica: per colmare un vuoto, avviare una funzione o accompagnare una transizione.",
    wm_svc7_t: "Workshop per team tecnici e management",
    wm_svc7_d: "Sessioni pratiche su AM, DfAM, automazione e AI nel manufacturing. Concrete, sul vostro contesto, senza slide motivazionali.",
    wm_svc8_t: "Orientamento su AM & AI",
    wm_svc8_d: "Per PMI e gruppi industriali che vogliono capire cosa ha senso fare davvero — e cosa no — con stampa 3D e intelligenza artificiale nella propria azienda.",
    wm_m_kicker: "Metodo",
    wm_m_h2: "Come lavoro",
    wm_m1_t: "Contesto",
    wm_m1_d: "Una prima call per capire problema, vincoli e obiettivi. Senza impegno, senza slide, senza vendita.",
    wm_m2_t: "Assessment",
    wm_m2_d: "Analisi sul campo: dati, macchine, flussi, persone. Ne esce una fotografia onesta e le priorità vere — anche quando la risposta è “non serve l'AM”.",
    wm_m3_t: "Intervento",
    wm_m3_d: "Esecuzione con deliverable chiari: report, roadmap, prototipi, affiancamento del team. Con un inizio, una fine e risultati misurabili.",
    wm_fit_kicker: "Trasparenza",
    wm_fit_h2: "Quando funziona, quando no",
    wm_fit_yes_h3: "Ha senso lavorare insieme se",
    wm_fit_yes_1: "Avete un problema concreto di produzione, prodotto o processo — non un problema di marketing.",
    wm_fit_yes_2: "Cercate qualcuno che abbia visto macchine, materiali e codice, non solo slide.",
    wm_fit_yes_3: "Volete decisioni argomentate, anche quando la risposta è \"non fatelo\".",
    wm_fit_yes_4: "Siete disposti a coinvolgere le persone che fanno il lavoro, non solo chi lo racconta.",
    wm_fit_no_h3: "Probabilmente no se",
    wm_fit_no_1: "Cercate un corpo in affitto full-time a tempo indeterminato.",
    wm_fit_no_3: "L'obiettivo è \"fare qualcosa con l'AI\" senza un problema da risolvere.",
    wm_cta_kicker: "Primo passo",
    wm_cta_h2: "Raccontami il problema",
    wm_cta_intro: "Una mail con due righe di contesto basta. Se posso essere utile, lo capiamo in una prima call. Se non posso, te lo dico subito.",
    wm_cta_btn: "Scrivimi",
    wm_vat_note: "Attività svolta con P.IVA (IT) 03577361201 — fatturazione regolare, NDA quando serve.",

    st_kicker: "Biografia tecnica · 2009 → oggi",
    st_title: "15 anni dentro la stampa 3D",
    st_intro: "Non è un blog e non è un curriculum. È il percorso, in sette capitoli, di come la stampa 3D è passata da curiosità di laboratorio a sistema produttivo — visto da dentro, macchina per macchina.",
    st_ch1_h2: "La prima macchina",
    st_ch1_p1: "Il primo incontro con la stampa 3D industriale è una <strong>PolyJet, una Objet EDEN500V</strong>: resina fotopolimerica, strati da 16 micron, un livello di dettaglio che all'epoca sembrava fantascienza. Non era un hobby: era prototipazione vera, per prodotti veri.",
    st_ch1_p2: "Quella macchina ha definito il metodo che uso ancora oggi: capire il processo fino in fondo — materiali, limiti, manutenzione, costi — prima di prometterne i risultati.",
    st_ch2_h2: "Da prototipi a impresa: JUNO.AM",
    st_ch2_p1: "Nel 2012 inizia il percorso che diventerà <strong>JUNO.AM</strong>: un service bureau di stampa 3D professionale costruito da zero, in Emilia, tra Motor Valley e Packaging Valley — dove le aziende non comprano promesse, comprano pezzi che funzionano.",
    st_ch2_p2: "Fare impresa nell'AM in Italia significa imparare tutto insieme: tecnologia, commerciale, operations, persone, cassa. È la palestra che ha trasformato un tecnico in un imprenditore.",
    st_ch3_h2: "FabLab e cultura maker",
    st_ch3_p1: "Negli anni del movimento maker contribuisco a portare la fabbricazione digitale fuori dalle aziende, con il <strong>FabLab Valsamoggia</strong> e la comunità locale: corsi, macchine aperte, ragazzi e artigiani che scoprono cosa si può fare con un file e una stampante.",
    st_ch3_p2: "Da lì viene una convinzione che non ho più abbandonato: la tecnologia conta quanto le persone che la sanno usare. È il motivo per cui oggi lavoro tanto sui team quanto sulle macchine.",
    st_ch4_h2: "Il salto alla produzione: HP Multi Jet Fusion",
    st_ch4_p1: "Con <strong>HP Multi Jet Fusion</strong> la stampa 3D smette di essere solo prototipazione: diventa produzione in serie. Nylon, ripetibilità, costi per pezzo che iniziano a competere con lo stampaggio per lotti piccoli e medi.",
    st_ch4_p2: "Cambia tutto: non più \"quanto è bello il prototipo\", ma qualità costante, post-processing, logistica, flussi. L'AM diventa una questione di sistema, non di macchina.",
    st_ch5_h2: "Carbon DLS: la partnership dalla Silicon Valley",
    st_ch5_p1: "Nel 2020 seguo in prima persona la partnership con <strong>Carbon</strong>, azienda della Silicon Valley, per portare la tecnologia <strong>DLS</strong> in produzione: materiali ingegneristici, elastomeri, geometrie impossibili con altri processi.",
    st_ch5_p2: "Una partnership internazionale non è solo tecnologia: è due culture industriali che devono capirsi. Farla funzionare tra California ed Emilia è stata una lezione di business, prima ancora che di stampa 3D.",
    st_ch6_h2: "Il software per scalare: 3FESTO",
    st_ch6_p1: "Nello stesso anno, su un binario parallelo, nasce il lavoro su <strong>3FESTO / ANY3DP</strong>: più cresce la produzione, più il vero collo di bottiglia si sposta dalle macchine al software che le governa.",
    st_ch6_p2: "MES per additive manufacturing, preventivazione, automazione dei flussi, hardware custom. Software scritto da chi in produzione ci sta davvero, non immaginato in una sala riunioni.",
    st_ch7_y: "Oggi",
    st_ch7_h2: "AI, sistemi e persone",
    st_ch7_p1: "Oggi il lavoro è far convergere tutto questo: <strong>AI applicata al manufacturing</strong>, automazione dei processi, dati di produzione che diventano decisioni. E team capaci di muoversi tra officina e codice senza perdersi.",
    st_ch7_p2: "Quindici anni dopo quella prima PolyJet, la domanda è sempre la stessa: come si trasforma un'idea in un oggetto, in modo ripetibile e sostenibile? È cambiata solo la scala della risposta.",
    st_cta_h2: "Questa esperienza può servirti?",
    st_cta_btn: "Scopri come lavoro",
    st_cta_mail: "Scrivimi",
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

    vat_label: "P.IVA (IT) 03577361201",
    hint_interact: "Trascina per ruotare il solido 3D"
  },
  en: {
    nav_home: "Home",
    nav_story: "The story",
    nav_work: "Work with me",

    hero_kicker: "Additive Manufacturing · Software · Technical Teams",
    hero_role: "Digital Manufacturing Entrepreneur — CEO @ JUNO.AM · Head of Products @ 3FESTO / ANY3DP",
    hero_lede: "15 years inside industrial 3D printing: machines, materials, software, business and people.",
    hero_sub: "I build products, systems and teams in digital manufacturing, for SMEs and large industrial groups. From Bologna — in the heart of Emilia-Romagna, between Motor Valley and Packaging Valley — I take additive manufacturing from prototyping to real production, with software as the lever.",
    hero_cta_work: "Work with me",

    cred_1: "15+ years in 3D printing",
    cred_4: "AM + Software + Human Teams",
    cred_5: "Bologna · Emilia-Romagna",
    cred_6: "Motor Valley · Packaging Valley",

    do_kicker: "What I do",
    do_h2: "Where I add value",
    do_1_t: "Additive Manufacturing & DfAM",
    do_1_d: "HP MJF, Carbon DLS, DMLS, FDM, PolyJet. Design for AM, reverse engineering, technology and material selection for real applications.",
    do_2_t: "Industrialization & production",
    do_2_d: "From prototype to series: production workflows, post-processing, quality, costs. The side of AM you only see inside a workshop.",
    do_3_t: "Software, AI & automation",
    do_3_d: "Full-stack development, cloud architectures, MES for AM, AI applied to quoting, production and manufacturing operations.",
    do_4_t: "Product & strategy",
    do_4_d: "Product thinking applied to manufacturing: what to build, for whom, with which business model. First-hand experience as a founder, with SMEs and corporate environments.",
    do_5_t: "Technical teams & operations",
    do_5_d: "Building and running teams that mix workshop and code: technical culture, processes, autonomy, ownership.",

    biz_kicker: "Ventures",
    biz_h2: "Where I work every day",
    biz_juno_meta: "CEO · since 2012",
    biz_juno_d: "Professional 3D printing service bureau: rapid prototyping, series production, industrial design for companies and engineering firms.",
    biz_3festo_meta: "Head of Products · since 2020",
    biz_3festo_d: "MES software for additive manufacturing, custom hardware, operations utilities and advanced IT services for people who actually produce.",
    biz_piva_meta: "Independent practice · VAT",
    biz_piva_t: "Advisory & selected projects",
    biz_piva_d: "Direct collaborations with companies and founders on AM, manufacturing software and technical teams. Few things, done well.",
    biz_piva_cta: "how I work →",

    tl_kicker: "Path",
    tl_h2: "15 years in seven lines",
    tl_2009: "<strong>First contact with industrial 3D printing.</strong> PolyJet, Objet EDEN500V: I never left.",
    tl_2012: "<strong>The JUNO.AM journey begins.</strong> From prototyping to a professional service bureau.",
    tl_2014: "<strong>FabLab Valsamoggia and maker culture.</strong> Outreach, community, access to digital fabrication.",
    tl_2017: "<strong>HP Multi Jet Fusion.</strong> The leap from prototyping to series production.",
    tl_2020a: "<strong>Carbon DLS partnership.</strong> Silicon Valley technology, brought into production and managed first-hand.",
    tl_2020b: "<strong>3FESTO / ANY3DP is born.</strong> MES and software to scale additive production.",
    tl_now_y: "Today",
    tl_now: "<strong>AI and software for manufacturing systems.</strong> Automation, data and tools for people who make things.",
    tl_more: "Read the full story →",

    phil_kicker: "Vision",
    phil_quote: "Digital manufacturing is the bridge between ideas and objects. Software is the nervous system that makes it scale.",
    phil_note: "My job is to build both — and the teams that make them work.",

    contact_kicker: "Contact",
    contact_h2: "Let's talk",
    contact_intro: "If you work on additive manufacturing, product development, manufacturing software or technical teams, the simplest way is to write me.",

    wm_kicker: "Advisory · Projects · VAT",
    wm_title: "I work selectively with people who manufacture, design or build software for manufacturing.",
    wm_intro: "Industrial groups, SMEs, founders and technical departments working on additive manufacturing, product development, manufacturing software, automation and technical teams. I don't do volume consulting: I take on few engagements, where my first-hand experience makes the difference.",
    wm_how_kicker: "How I can help",
    wm_how_h2: "Areas of work",
    wm_svc1_t: "AM production readiness review",
    wm_svc1_d: "An honest assessment of how ready an application, department or product is for additive production: technologies, costs, bottlenecks, risks.",
    wm_svc2_t: "DfAM & design review",
    wm_svc2_d: "Review of parts and assemblies for additive production: geometries, materials, tolerances, post-processing. Redesign for AM, don't just adapt.",
    wm_svc3_t: "Workflow & operations audit",
    wm_svc3_d: "Analysis of how orders, files, machines and people move through production. Where time is lost, where margin is lost, what to automate.",
    wm_svc4_t: "AM technology decisions",
    wm_svc4_d: "Support on investment decisions: MJF, DLS, DMLS, FDM, PolyJet — or none of them. I've worked with all of them; I know what they promise and what they deliver.",
    wm_svc5_t: "Software & AI roadmap for manufacturing",
    wm_svc5_d: "What makes sense to build, buy or integrate: MES, quoting, automation, applied AI. From someone who actually built software for AM.",
    wm_svc6_t: "Temporary / fractional leadership",
    wm_svc6_d: "Temporary leadership of product, AM or a technical area: to fill a gap, start a function or steer a transition.",
    wm_svc7_t: "Workshops for technical teams and management",
    wm_svc7_d: "Hands-on sessions on AM, DfAM, automation and AI in manufacturing. Concrete, on your context, no motivational slides.",
    wm_svc8_t: "Guidance on AM & AI",
    wm_svc8_d: "For SMEs and industrial groups that want to understand what actually makes sense to do — and what doesn't — with 3D printing and AI in their company.",
    wm_m_kicker: "Method",
    wm_m_h2: "How I work",
    wm_m1_t: "Context",
    wm_m1_d: "A first call to understand the problem, constraints and goals. No commitment, no slides, no selling.",
    wm_m2_t: "Assessment",
    wm_m2_d: "Analysis in the field: data, machines, flows, people. The result is an honest picture and the real priorities — even when the answer is “you don't need AM”.",
    wm_m3_t: "Execution",
    wm_m3_d: "Delivery with clear deliverables: reports, roadmaps, prototypes, team coaching. With a beginning, an end and measurable results.",
    wm_fit_kicker: "Transparency",
    wm_fit_h2: "When it works, when it doesn't",
    wm_fit_yes_h3: "It makes sense to work together if",
    wm_fit_yes_1: "You have a concrete production, product or process problem — not a marketing problem.",
    wm_fit_yes_2: "You want someone who has seen machines, materials and code, not just slides.",
    wm_fit_yes_3: "You want reasoned decisions, even when the answer is \"don't do it\".",
    wm_fit_yes_4: "You're willing to involve the people who do the work, not just those who talk about it.",
    wm_fit_no_h3: "Probably not if",
    wm_fit_no_1: "You're looking for a full-time body for hire, indefinitely.",
    wm_fit_no_3: "The goal is \"doing something with AI\" without a problem to solve.",
    wm_cta_kicker: "First step",
    wm_cta_h2: "Tell me about the problem",
    wm_cta_intro: "An email with two lines of context is enough. If I can help, we'll figure it out in a first call. If I can't, I'll tell you right away.",
    wm_cta_btn: "Write me",
    wm_vat_note: "Work carried out under VAT (IT) 03577361201 — regular invoicing, NDA when needed.",

    st_kicker: "Technical biography · 2009 → today",
    st_title: "15 years inside 3D printing",
    st_intro: "This is not a blog and not a résumé. It's the journey, in seven chapters, of how 3D printing went from lab curiosity to production system — seen from the inside, machine by machine.",
    st_ch1_h2: "The first machine",
    st_ch1_p1: "My first encounter with industrial 3D printing was a <strong>PolyJet, an Objet EDEN500V</strong>: photopolymer resin, 16-micron layers, a level of detail that felt like science fiction at the time. It wasn't a hobby: it was real prototyping, for real products.",
    st_ch1_p2: "That machine defined the method I still use today: understand the process inside out — materials, limits, maintenance, costs — before promising its results.",
    st_ch2_h2: "From prototypes to a company: JUNO.AM",
    st_ch2_p1: "In 2012 the journey that would become <strong>JUNO.AM</strong> began: a professional 3D printing service bureau built from scratch, in Emilia, between Motor Valley and Packaging Valley — where companies don't buy promises, they buy parts that work.",
    st_ch2_p2: "Building an AM business in Italy means learning everything at once: technology, sales, operations, people, cash flow. It's the training ground that turned a technician into an entrepreneur.",
    st_ch3_h2: "FabLab and maker culture",
    st_ch3_p1: "During the maker movement years I helped bring digital fabrication outside companies, with <strong>FabLab Valsamoggia</strong> and the local community: courses, open machines, kids and artisans discovering what you can do with a file and a printer.",
    st_ch3_p2: "From there comes a conviction I never abandoned: technology matters as much as the people who know how to use it. It's why today I work on teams as much as on machines.",
    st_ch4_h2: "The leap to production: HP Multi Jet Fusion",
    st_ch4_p1: "With <strong>HP Multi Jet Fusion</strong>, 3D printing stopped being just prototyping: it became series production. Nylon, repeatability, per-part costs starting to compete with molding for small and medium batches.",
    st_ch4_p2: "Everything changes: no longer \"how nice is the prototype\", but consistent quality, post-processing, logistics, flows. AM becomes a matter of systems, not machines.",
    st_ch5_h2: "Carbon DLS: the Silicon Valley partnership",
    st_ch5_p1: "In 2020 I personally managed the partnership with <strong>Carbon</strong>, a Silicon Valley company, to bring <strong>DLS</strong> technology into production: engineering materials, elastomers, geometries impossible with other processes.",
    st_ch5_p2: "An international partnership is not just technology: it's two industrial cultures that need to understand each other. Making it work between California and Emilia was a lesson in business before it was one in 3D printing.",
    st_ch6_h2: "The software to scale: 3FESTO",
    st_ch6_p1: "That same year, on a parallel track, the work on <strong>3FESTO / ANY3DP</strong> began: the more production grows, the more the real bottleneck shifts from the machines to the software that runs them.",
    st_ch6_p2: "MES for additive manufacturing, quoting, workflow automation, custom hardware. Software written by people who actually live in production, not imagined in a meeting room.",
    st_ch7_y: "Today",
    st_ch7_h2: "AI, systems and people",
    st_ch7_p1: "Today the work is making all of this converge: <strong>AI applied to manufacturing</strong>, process automation, production data turned into decisions. And teams able to move between workshop and code without getting lost.",
    st_ch7_p2: "Fifteen years after that first PolyJet, the question is still the same: how do you turn an idea into an object, repeatably and sustainably? Only the scale of the answer has changed.",
    st_cta_h2: "Could this experience be useful to you?",
    st_cta_btn: "See how I work",
    st_cta_mail: "Write me",

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

    vat_label: "VAT (IT) 03577361201",
    hint_interact: "Drag to rotate the 3D solid"
  },
  es: {
    nav_home: "Inicio",
    nav_story: "La historia",
    nav_work: "Trabaja conmigo",
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

    vat_label: "IVA (IT)03577361201",
    hint_interact: "¡Interactúa con el sólido 3D!"
  },
  ca: {
    nav_home: "Inici",
    nav_story: "La història",
    nav_work: "Treballa amb mi",
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

    vat_label: "IVA (IT)03577361201",
    hint_interact: "Interactua amb el sòlid 3D!"
  },
  fr: {
    nav_home: "Accueil",
    nav_story: "L'histoire",
    nav_work: "Travaillez avec moi",
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

    vat_label: "TVA (IT)03577361201",
    hint_interact: "Interagissez avec le solide 3D !"
  },
  sr: {
    nav_home: "Početna",
    nav_story: "Priča",
    nav_work: "Radi sa mnom",
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

    vat_label: "PDV (IT)03577361201",
    hint_interact: "Interagujte sa 3D telom!"
  },
  ru: {
    nav_home: "Главная",
    nav_story: "История",
    nav_work: "Работа со мной",
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

    vat_label: "НДС (IT)03577361201",
    hint_interact: "Взаимодействуйте с 3D-фигурой!"
  }
};

// Fully activate non-IT/EN flags with complete content (EN base + localized labels).
const extraLanguageOverrides = {
  "es": {
    "biz_3festo_d": "MES software para fabricación aditiva, hardware personalizado, utilidades de operaciones y servicios de TI avanzados para personas que realmente producen.",
    "biz_3festo_meta": "Head of Products · desde 2020",
    "biz_h2": "donde trabajo todos los días",
    "biz_juno_d": "Oficina de servicios profesionales de impresión 3D: prototipado rápido, producción en serie, diseño industrial para empresas y ingenierías.",
    "biz_juno_meta": "CEO · desde 2012",
    "biz_kicker": "Empresas",
    "biz_piva_cta": "como trabajo →",
    "biz_piva_d": "Colaboraciones directas con empresas y fundadores de AM, software de fabricación y equipos técnicos. Pocas cosas, bien hechas.",
    "biz_piva_meta": "Práctica independiente · IVA",
    "biz_piva_t": "Asesoramiento y proyectos seleccionados",
    "contact_h2": "hablemos",
    "contact_intro": "Si trabajas en fabricación aditiva, desarrollo de productos, fabricación de software o equipos técnicos, la forma más sencilla es escribirme.",
    "contact_kicker": "Contacto",
    "cred_1": "Más de 15 años en impresión 3D",
    "cred_4": "AM + Software + Equipos Humanos",
    "cred_5": "Bolonia · Emilia-Romaña",
    "cred_6": "Motor Valley · Packaging Valley",
    "do_1_d": "HP MJF, Carbon DLS, DMLS, FDM, PolyJet. Diseño para AM, ingeniería inversa, tecnología y selección de materiales para aplicaciones reales.",
    "do_1_t": "Fabricación aditiva y DfAM",
    "do_2_d": "Del prototipo a la serie: flujos de trabajo de producción, posprocesamiento, calidad, costes. El lado de AM solo se ve dentro de un taller.",
    "do_2_t": "Industrialización y producción",
    "do_3_d": "Desarrollo full-stack, arquitecturas en la nube, MES para AM, AI aplicadas a operaciones de cotización, producción y manufactura.",
    "do_3_t": "Software, AI y automatización",
    "do_4_d": "Pensamiento de producto aplicado a la fabricación: qué construir, para quién, con qué modelo de negocio. Experiencia de primera mano como fundador, con pymes y entornos corporativos.",
    "do_4_t": "Producto y estrategia",
    "do_5_d": "Construir y ejecutar equipos que combinen taller y código: cultura técnica, procesos, autonomía, propiedad.",
    "do_5_t": "Equipos técnicos y operaciones.",
    "do_h2": "Donde agrego valor",
    "do_kicker": "lo que hago",
    "hero_cta_work": "Trabaja conmigo",
    "hero_kicker": "Fabricación Aditiva · Software · Equipos Técnicos",
    "hero_lede": "15 años dentro de la impresión 3D industrial: máquinas, materiales, software, negocios y personas.",
    "hero_role": "Digital Manufacturing Entrepreneur — CEO @ JUNO.AM · Head of Products @ 3FESTO / ANY3DP",
    "hero_sub": "Construyo productos, sistemas y equipos en fabricación digital, para pymes y grandes grupos industriales. Desde Bolonia (en el corazón de Emilia-Romaña, entre Motor Valley y Packaging Valley), llevo la fabricación aditiva desde la creación de prototipos hasta la producción real, con el software como palanca.",
    "hint_interact": "Arrastre para rotar el sólido 3D",
    "nav_home": "Inicio",
    "nav_story": "La historia",
    "nav_work": "Trabaja conmigo",
    "phil_kicker": "Visión",
    "phil_note": "Mi trabajo es construir ambos y los equipos que los hacen funcionar.",
    "phil_quote": "La fabricación digital es el puente entre ideas y objetos. El software es el sistema nervioso que lo hace escalar.",
    "st_ch1_h2": "la primera maquina",
    "st_ch1_p1": "Mi primer encuentro con la impresión 3D industrial fue un <strong>PolyJet, un Objet EDEN500V</strong>: resina de fotopolímero, capas de 16 micrones, un nivel de detalle que en ese momento parecía ciencia ficción. No era un hobby: era creación de prototipos reales, para productos reales.",
    "st_ch1_p2": "Esa máquina definió el método que todavía uso hoy: comprender el proceso de adentro hacia afuera (materiales, límites, mantenimiento, costos) antes de prometer sus resultados.",
    "st_ch2_h2": "De prototipos a empresa: JUNO.AM",
    "st_ch2_p1": "En 2012 comenzó el viaje que se convertiría en <strong>JUNO.AM</strong>: una oficina de servicios de impresión 3D profesional construida desde cero, en Emilia, entre Motor Valley y Packaging Valley, donde las empresas no compran promesas, compran piezas que funcionan.",
    "st_ch2_p2": "Construir un negocio AM en Italia significa aprender todo a la vez: tecnología, ventas, operaciones, personas, flujo de caja. Es el campo de formación que convirtió a un técnico en emprendedor.",
    "st_ch3_h2": "FabLab y la cultura maker",
    "st_ch3_p1": "Durante los años del movimiento maker, ayudé a llevar la fabricación digital fuera de las empresas, con <strong>FabLab Valsamoggia</strong> y la comunidad local: cursos, máquinas abiertas, niños y artesanos que descubren lo que se puede hacer con un archivo y una impresora.",
    "st_ch3_p2": "De ahí surge una convicción que nunca abandoné: la tecnología importa tanto como las personas que saben utilizarla. Por eso hoy trabajo tanto en equipos como en máquinas.",
    "st_ch4_h2": "El salto a la producción: HP Multi Jet Fusion",
    "st_ch4_p1": "Con <strong>HP Multi Jet Fusion</strong>, la impresión 3D dejó de ser solo prototipos: pasó a ser producción en serie. El nailon, la repetibilidad y los costos por pieza comienzan a competir con el moldeado para lotes pequeños y medianos.",
    "st_ch4_p2": "Todo cambia: ya no \"qué bonito es el prototipo\", sino calidad constante, posprocesamiento, logística, flujos. AM se convierte en una cuestión de sistemas, no de máquinas.",
    "st_ch5_h2": "Carbon DLS: la asociación Silicon Valley",
    "st_ch5_p1": "En 2020 gestioné personalmente la asociación con <strong>Carbon</strong>, una empresa de Silicon Valley, para llevar a producción tecnología de <strong>DLS</strong>: materiales de ingeniería, elastómeros, geometrías imposibles con otros procesos.",
    "st_ch5_p2": "Una asociación internacional no es sólo tecnología: son dos culturas industriales que necesitan entenderse. Hacer que funcionara entre California y Emilia fue una lección de negocios antes que de impresión 3D.",
    "st_ch6_h2": "El software a escala: 3FESTO",
    "st_ch6_p1": "Ese mismo año, de forma paralela, comenzó el trabajo en <strong>3FESTO / ANY3DP</strong>: cuanto más crece la producción, más se desplaza el verdadero cuello de botella de las máquinas al software que las ejecuta.",
    "st_ch6_p2": "MES para fabricación aditiva, cotizaciones, automatización del flujo de trabajo y hardware personalizado. Software escrito por personas que realmente viven en producción, no imaginadas en una sala de reuniones.",
    "st_ch7_h2": "AI, sistemas y personas",
    "st_ch7_p1": "Hoy el trabajo está haciendo que todo esto converja: <strong>AI aplicado a la fabricación</strong>, automatización de procesos, datos de producción convertidos en decisiones. Y equipos capaces de moverse entre el taller y el código sin perderse.",
    "st_ch7_p2": "Quince años después de ese primer PolyJet, la pregunta sigue siendo la misma: ¿cómo se convierte una idea en un objeto, de manera repetible y sostenible? Sólo ha cambiado la escala de la respuesta.",
    "st_ch7_y": "Hoy",
    "st_cta_btn": "Descubre cómo trabajo",
    "st_cta_h2": "¿Te podría ser útil esta experiencia?",
    "st_cta_mail": "Escríbeme",
    "st_intro": "Esto no es un blog ni un currículum. Es el viaje, en siete capítulos, de cómo la impresión 3D pasó de ser una curiosidad de laboratorio a un sistema de producción, vista desde adentro, máquina por máquina.",
    "st_kicker": "Biografía técnica · 2009 → hoy",
    "st_title": "15 años dentro de la impresión 3D",
    "tl_2009": "<strong>Primer contacto con la impresión 3D industrial.</strong> PolyJet, Objet EDEN500V: Nunca lo dejé.",
    "tl_2012": "<strong>El viaje JUNO.AM comienza.</strong> De la creación de prototipos a una oficina de servicios profesionales.",
    "tl_2014": "<strong>FabLab Valsamoggia y la cultura maker.</strong> Divulgación, comunidad, acceso a la fabricación digital.",
    "tl_2017": "<strong>HP Multi Jet Fusion.</strong> El salto del prototipo a la producción en serie.",
    "tl_2020a": "<strong>Alianza con Carbon DLS.</strong> Tecnología de Silicon Valley, puesta en producción y gestionada de primera mano.",
    "tl_2020b": "Nace <strong>3FESTO / ANY3DP.</strong> MES y software para escalar la producción aditiva.",
    "tl_h2": "15 años en siete líneas",
    "tl_kicker": "Camino",
    "tl_more": "Leer la historia completa →",
    "tl_now": "<strong>AI y software para sistemas de fabricación.</strong> Automatización, datos y herramientas para las personas que fabrican cosas.",
    "tl_now_y": "Hoy",
    "vat_label": "IVA (IT) 03577361201",
    "wm_cta_btn": "Escríbeme",
    "wm_cta_h2": "Cuéntame sobre el problema",
    "wm_cta_intro": "Un correo electrónico con dos líneas de contexto es suficiente. Si puedo ayudar, lo resolveremos en una primera llamada. Si no puedo, te lo diré enseguida.",
    "wm_cta_kicker": "primer paso",
    "wm_fit_h2": "Cuando funciona, cuando no",
    "wm_fit_kicker": "Transparencia",
    "wm_fit_no_1": "Estás buscando un cuerpo para contratar a tiempo completo, por tiempo indefinido.",
    "wm_fit_no_3": "El objetivo es \"hacer algo con AI\" sin ningún problema que resolver.",
    "wm_fit_no_h3": "Probablemente no si",
    "wm_fit_yes_1": "Tiene un problema concreto de producción, producto o proceso, no un problema de marketing.",
    "wm_fit_yes_2": "Quiere a alguien que haya visto máquinas, materiales y códigos, no sólo diapositivas.",
    "wm_fit_yes_3": "Quiere decisiones razonadas, incluso cuando la respuesta es \"no lo hagas\".",
    "wm_fit_yes_4": "Está dispuesto a involucrar a las personas que hacen el trabajo, no sólo a quienes hablan de ello.",
    "wm_fit_yes_h3": "Tiene sentido trabajar juntos si",
    "wm_how_h2": "Áreas de trabajo",
    "wm_how_kicker": "como puedo ayudar",
    "wm_intro": "Grupos industriales, pymes, fundadores y departamentos técnicos que trabajan en fabricación aditiva, desarrollo de producto, software de fabricación, automatización y equipos técnicos. No hago consultoría en volumen: asumo pocos compromisos, donde mi experiencia de primera mano marca la diferencia.",
    "wm_kicker": "Asesoría · Proyectos · IVA",
    "wm_m1_d": "Una primera llamada para comprender el problema, las limitaciones y los objetivos. Sin compromiso, sin diapositivas, sin ventas.",
    "wm_m1_t": "Contexto",
    "wm_m2_d": "Análisis en campo: datos, máquinas, flujos, personas. El resultado es una imagen honesta y las prioridades reales, incluso cuando la respuesta es \"no necesitas AM\".",
    "wm_m2_t": "Evaluación",
    "wm_m3_d": "Entrega con entregables claros: informes, hojas de ruta, prototipos, coaching de equipos. Con un comienzo, un final y resultados medibles.",
    "wm_m3_t": "Ejecución",
    "wm_m_h2": "como trabajo",
    "wm_m_kicker": "Método",
    "wm_svc1_d": "Una evaluación honesta de qué tan preparada está una aplicación, departamento o producto para la producción aditiva: tecnologías, costos, cuellos de botella, riesgos.",
    "wm_svc1_t": "AM revisión de preparación para la producción",
    "wm_svc2_d": "Revisión de piezas y conjuntos para producción aditiva: geometrías, materiales, tolerancias, postprocesamiento. Rediseñe para AM, no se limite a adaptarse.",
    "wm_svc2_t": "DfAM y revisión de diseño",
    "wm_svc3_d": "Análisis de cómo se mueven los pedidos, archivos, máquinas y personas a lo largo de la producción. Dónde se pierde tiempo, dónde se pierde margen, qué automatizar.",
    "wm_svc3_t": "Auditoría de flujo de trabajo y operaciones",
    "wm_svc4_d": "Soporte en decisiones de inversión: MJF, DLS, DMLS, FDM, PolyJet — o ninguna de ellas. He trabajado con todos ellos; Sé lo que prometen y lo que cumplen.",
    "wm_svc4_t": "AM decisiones tecnológicas",
    "wm_svc5_d": "Qué tiene sentido construir, comprar o integrar: MES, cotización, automatización, AI aplicado. De alguien que realmente creó software para AM.",
    "wm_svc5_t": "Software y hoja de ruta de AI para la fabricación",
    "wm_svc6_d": "Liderazgo temporal de producto, AM o de un área técnica: para llenar un vacío, iniciar una función o liderar una transición.",
    "wm_svc6_t": "Liderazgo temporal/fraccional",
    "wm_svc7_d": "Sesiones prácticas sobre AM, DfAM, automatización y AI en fabricación. Concreto, en su contexto, sin diapositivas motivacionales.",
    "wm_svc7_t": "Talleres para equipos técnicos y directivos.",
    "wm_svc8_d": "Para pymes y grupos industriales que quieran entender qué tiene realmente sentido hacer (y qué no) con la impresión 3D y AI en su empresa.",
    "wm_svc8_t": "Orientación sobre AM y AI",
    "wm_title": "Trabajo selectivamente con personas que fabrican, diseñan o construyen software para manufactura.",
    "wm_vat_note": "Trabajo realizado bajo IVA (IT) 03577361201 — facturación periódica, NDA cuando sea necesario."
  },
  "ca": {
    "biz_3festo_d": "MES programari per a la fabricació additiva, maquinari personalitzat, utilitats d'operacions i serveis informàtics avançats per a persones que realment produeixen.",
    "biz_3festo_meta": "Head of Products · des del 2020",
    "biz_h2": "On treballo cada dia",
    "biz_juno_d": "Oficina professional de serveis d'impressió 3D: prototipat ràpid, producció en sèrie, disseny industrial per a empreses i empreses d'enginyeria.",
    "biz_juno_meta": "CEO · des del 2012",
    "biz_kicker": "Ventures",
    "biz_piva_cta": "com treballo →",
    "biz_piva_d": "Col·laboracions directes amb empreses i fundadors de AM, programari de fabricació i equips tècnics. Poques coses, ben fetes.",
    "biz_piva_meta": "Pràctica independent · IVA",
    "biz_piva_t": "Assessorament i projectes seleccionats",
    "contact_h2": "Parlem",
    "contact_intro": "Si treballes en fabricació additiva, desenvolupament de productes, programari de fabricació o equips tècnics, la manera més senzilla és escriure'm.",
    "contact_kicker": "Contacte",
    "cred_1": "Més de 15 anys en impressió 3D",
    "cred_4": "AM + Programari + Equips humans",
    "cred_5": "Bolonya · Emília-Romanya",
    "cred_6": "Motor Valley · Packaging Valley",
    "do_1_d": "HP MJF, Carbon DLS, DMLS, FDM, PolyJet. Disseny per a AM, enginyeria inversa, tecnologia i selecció de materials per a aplicacions reals.",
    "do_1_t": "Fabricació additiva i DfAM",
    "do_2_d": "Del prototip a la sèrie: fluxos de treball de producció, postprocessament, qualitat, costos. El costat de AM només es veu dins d'un taller.",
    "do_2_t": "Industrialització i producció",
    "do_3_d": "Desenvolupament de pila completa, arquitectures al núvol, MES per a AM, AI aplicat a les operacions de cotització, producció i fabricació.",
    "do_3_t": "Programari, AI i automatització",
    "do_4_d": "Pensament de producte aplicat a la fabricació: què construir, per a qui, amb quin model de negoci. Experiència de primera mà com a fundador, amb pimes i entorns corporatius.",
    "do_4_t": "Producte i estratègia",
    "do_5_d": "Construir i dirigir equips que barregin taller i codi: cultura tècnica, processos, autonomia, propietat.",
    "do_5_t": "Equips tècnics i operacions",
    "do_h2": "On afegeixo valor",
    "do_kicker": "El que faig",
    "hero_cta_work": "Treballa amb mi",
    "hero_kicker": "Fabricació additiva · Programari · Equips tècnics",
    "hero_lede": "15 anys dins de la impressió 3D industrial: màquines, materials, programari, negocis i persones.",
    "hero_role": "Digital Manufacturing Entrepreneur — CEO @ JUNO.AM · Head of Products @ 3FESTO / ANY3DP",
    "hero_sub": "Construeixo productes, sistemes i equips en fabricació digital, per a pimes i grans grups industrials. Des de Bolonya, al cor de l'Emília-Romanya, entre Motor Valley i Packaging Valley, porto la fabricació additiva des de la creació de prototips fins a la producció real, amb el programari com a palanca.",
    "hint_interact": "Arrossegueu per girar el sòlid 3D",
    "nav_home": "Inici",
    "nav_story": "La història",
    "nav_work": "Treballa amb mi",
    "phil_kicker": "Visió",
    "phil_note": "La meva feina és construir tots dos, i els equips que els fan funcionar.",
    "phil_quote": "La fabricació digital és el pont entre les idees i els objectes. El programari és el sistema nerviós que el fa escalar.",
    "st_ch1_h2": "La primera màquina",
    "st_ch1_p1": "La meva primera trobada amb la impressió 3D industrial va ser un <strong>PolyJet, un Objet EDEN500V</strong>: resina de fotopolímer, capes de 16 micres, un nivell de detall que semblava ciència ficció en aquell moment. No era una afició: era crear prototips reals, per a productes reals.",
    "st_ch1_p2": "Aquella màquina va definir el mètode que encara faig servir avui: entendre el procés al revés —materials, límits, manteniment, costos— abans de prometre els seus resultats.",
    "st_ch2_h2": "Dels prototips a una empresa: JUNO.AM",
    "st_ch2_p1": "El 2012 va començar el viatge que es convertiria en <strong>JUNO.AM</strong>: una oficina professional de serveis d'impressió 3D construïda des de zero, a Emília, entre Motor Valley i Packaging Valley: on les empreses no compren promeses, compren peces que funcionen.",
    "st_ch2_p2": "Crear un negoci AM a Itàlia significa aprendre-ho tot alhora: tecnologia, vendes, operacions, persones, flux de caixa. És el camp de formació que va convertir un tècnic en un emprenedor.",
    "st_ch3_h2": "FabLab i cultura maker",
    "st_ch3_p1": "Durant els anys del moviment maker vaig ajudar a portar la fabricació digital fora d'empreses, amb <strong>FabLab Valsamoggia</strong> i la comunitat local: cursos, màquines obertes, nens i artesans descobrint què es pot fer amb un fitxer i una impressora.",
    "st_ch3_p2": "D'aquí ve una convicció que mai vaig abandonar: la tecnologia importa tant com les persones que la saben utilitzar. Per això avui treballo tant en equip com en màquines.",
    "st_ch4_h2": "El salt a la producció: HP Multi Jet Fusion",
    "st_ch4_p1": "Amb <strong>HP Multi Jet Fusion</strong>, la impressió 3D va deixar de ser només prototipatge: es va convertir en producció en sèrie. Niló, repetibilitat, costos per peça que comencen a competir amb l'emmotllament per a lots petits i mitjans.",
    "st_ch4_p2": "Tot canvia: ja no “que bonic és el prototip”, sinó qualitat constant, postprocessament, logística, fluxos. AM esdevé una qüestió de sistemes, no de màquines.",
    "st_ch5_h2": "Carbon DLS: l'associació Silicon Valley",
    "st_ch5_p1": "El 2020 vaig gestionar personalment l'associació amb <strong>Carbon</strong>, una empresa de Silicon Valley, per introduir la tecnologia <strong>DLS</strong> en producció: materials d'enginyeria, elastòmers, geometries impossibles amb altres processos.",
    "st_ch5_p2": "Una associació internacional no és només tecnologia: són dues cultures industrials que s'han d'entendre. Fer que funcionés entre Califòrnia i Emília va ser una lliçó de negocis abans que fos una d'impressió 3D.",
    "st_ch6_h2": "El programari per escalar: 3FESTO",
    "st_ch6_p1": "Aquell mateix any, en una pista paral·lela, va començar el treball a <strong>3FESTO / ANY3DP</strong>: com més creix la producció, més canvia el coll d'ampolla real de les màquines al programari que les executa.",
    "st_ch6_p2": "MES per a la fabricació additiva, cotització, automatització del flux de treball, maquinari personalitzat. Programari escrit per persones que viuen realment en producció, no imaginat en una sala de reunions.",
    "st_ch7_h2": "AI, sistemes i persones",
    "st_ch7_p1": "Avui el treball fa convergir tot això: <strong>AI aplicat a la fabricació</strong>, automatització de processos, dades de producció convertides en decisions. I equips capaços de moure's entre taller i codi sense perdre's.",
    "st_ch7_p2": "Quinze anys després del primer PolyJet, la pregunta segueix sent la mateixa: com es converteix una idea en un objecte, de manera repetida i sostenible? Només ha canviat l'escala de la resposta.",
    "st_ch7_y": "Avui",
    "st_cta_btn": "Mira com treballo",
    "st_cta_h2": "Aquesta experiència et pot ser útil?",
    "st_cta_mail": "Escriu-me",
    "st_intro": "Això no és un bloc ni un currículum. És el viatge, en set capítols, de com la impressió 3D va passar de la curiositat del laboratori al sistema de producció, vista des de dins, màquina per màquina.",
    "st_kicker": "Biografia tècnica · 2009 → avui",
    "st_title": "15 anys dins de la impressió 3D",
    "tl_2009": "<strong>Primer contacte amb la impressió 3D industrial.</strong> PolyJet, Objet EDEN500V: no vaig marxar mai.",
    "tl_2012": "<strong>Comença el viatge JUNO.AM.</strong> Des de la creació de prototips fins a una oficina de serveis professional.",
    "tl_2014": "<strong>FabLab Valsamoggia i cultura maker.</strong> Difusió, comunitat, accés a la fabricació digital.",
    "tl_2017": "<strong>HP Multi Jet Fusion.</strong> El salt de la creació de prototips a la producció en sèrie.",
    "tl_2020a": "<strong>Aliança amb Carbon DLS.</strong> Tecnologia de Silicon Valley, posada en producció i gestionada de primera mà.",
    "tl_2020b": "Neix <strong>3FESTO / ANY3DP.</strong> MES i programari per escalar la producció additiva.",
    "tl_h2": "15 anys en set línies",
    "tl_kicker": "Camí",
    "tl_more": "Llegeix la història sencera →",
    "tl_now": "<strong>AI i programari per a sistemes de fabricació.</strong> Automatització, dades i eines per a la gent que fa coses.",
    "tl_now_y": "Avui",
    "vat_label": "IVA (IT) 03577361201",
    "wm_cta_btn": "Escriu-me",
    "wm_cta_h2": "Explica'm el problema",
    "wm_cta_intro": "Un correu electrònic amb dues línies de context és suficient. Si puc ajudar, ho solucionarem en una primera trucada. Si no puc, t'ho diré de seguida.",
    "wm_cta_kicker": "Primer pas",
    "wm_fit_h2": "Quan funciona, quan no",
    "wm_fit_kicker": "Transparència",
    "wm_fit_no_1": "Busques un cos de lloguer a temps complet, indefinidament.",
    "wm_fit_no_3": "L'objectiu és \"fer alguna cosa amb AI\" sense cap problema per resoldre.",
    "wm_fit_no_h3": "Probablement no si",
    "wm_fit_yes_1": "Teniu un problema concret de producció, producte o procés, no un problema de màrqueting.",
    "wm_fit_yes_2": "Voleu algú que hagi vist màquines, materials i codi, no només diapositives.",
    "wm_fit_yes_3": "Voleu prendre decisions raonades, fins i tot quan la resposta sigui \"no ho feu\".",
    "wm_fit_yes_4": "Estàs disposat a implicar les persones que fan la feina, no només les que en parlen.",
    "wm_fit_yes_h3": "Té sentit treballar junts si",
    "wm_how_h2": "Àrees de treball",
    "wm_how_kicker": "Com puc ajudar",
    "wm_intro": "Grups industrials, pimes, fundadors i departaments tècnics que treballen en fabricació additiva, desenvolupament de productes, programari de fabricació, automatització i equips tècnics. No faig consultoria de volum: assumeixo pocs compromisos, on la meva experiència de primera mà marca la diferència.",
    "wm_kicker": "Assessorament · Projectes · IVA",
    "wm_m1_d": "Una primera crida per entendre el problema, les limitacions i els objectius. Sense compromís, sense diapositives, sense venda.",
    "wm_m1_t": "Context",
    "wm_m2_d": "Anàlisi de camp: dades, màquines, fluxos, persones. El resultat és una imatge honesta i les prioritats reals, fins i tot quan la resposta és \"no necessites AM\".",
    "wm_m2_t": "Avaluació",
    "wm_m3_d": "Lliurament amb lliuraments clars: informes, fulls de ruta, prototips, coaching d'equips. Amb un principi, un final i resultats mesurables.",
    "wm_m3_t": "Execució",
    "wm_m_h2": "Com treballo",
    "wm_m_kicker": "Mètode",
    "wm_svc1_d": "Una avaluació honesta de la preparació d'una aplicació, departament o producte per a la producció additiva: tecnologies, costos, colls d'ampolla, riscos.",
    "wm_svc1_t": "AM revisió de la preparació per a la producció",
    "wm_svc2_d": "Revisió de peces i conjunts per a la producció additiva: geometries, materials, toleràncies, postprocessament. Redissenyeu per a AM, no només us adapteu.",
    "wm_svc2_t": "DfAM i revisió del disseny",
    "wm_svc3_d": "Anàlisi de com es mouen comandes, fitxers, màquines i persones per la producció. On es perd temps, on es perd marge, què automatitzar.",
    "wm_svc3_t": "Auditoria de flux de treball i operacions",
    "wm_svc4_d": "Suport en decisions d'inversió: MJF, DLS, DMLS, FDM, PolyJet, o cap d'ells. He treballat amb tots; Sé el que prometen i el que compleixen.",
    "wm_svc4_t": "AM decisions tecnològiques",
    "wm_svc5_d": "Què té sentit construir, comprar o integrar: MES, cotització, automatització, aplicat AI. D'algú que realment va crear programari per a AM.",
    "wm_svc5_t": "Programari i AI full de ruta per a la fabricació",
    "wm_svc6_d": "Lideratge temporal de producte, AM o àrea tècnica: per omplir un buit, iniciar una funció o dirigir una transició.",
    "wm_svc6_t": "Lideratge temporal / fraccionat",
    "wm_svc7_d": "Sessions pràctiques sobre AM, DfAM, automatització i AI a la fabricació. Concreta, al teu context, sense diapositives motivacionals.",
    "wm_svc7_t": "Tallers per a equips tècnics i directius",
    "wm_svc8_d": "Per a pimes i grups industrials que volen entendre què té sentit fer (i què no) amb la impressió 3D i AI a la seva empresa.",
    "wm_svc8_t": "Orientació sobre AM i AI",
    "wm_title": "Treballo selectivament amb persones que fabriquen, dissenyen o construeixen programari per a la fabricació.",
    "wm_vat_note": "Treball realitzat amb IVA (IT) 03577361201 — facturació habitual, NDA quan sigui necessari."
  },
  "fr": {
    "biz_3festo_d": "MES logiciels pour la fabrication additive, matériel personnalisé, utilitaires d'exploitation et services informatiques avancés pour les personnes qui produisent réellement.",
    "biz_3festo_meta": "Head of Products · depuis 2020",
    "biz_h2": "Où je travaille tous les jours",
    "biz_juno_d": "Bureau de services professionnels d'impression 3D: prototypage rapide, production en série, design industriel pour entreprises et bureaux d'ingénierie.",
    "biz_juno_meta": "CEO · depuis 2012",
    "biz_kicker": "Entreprises",
    "biz_piva_cta": "comment je travaille →",
    "biz_piva_d": "Collaborations directes avec des entreprises et des fondateurs sur AM, des logiciels de fabrication et des équipes techniques. Peu de choses, bien faites.",
    "biz_piva_meta": "Cabinet indépendant · TVA",
    "biz_piva_t": "Conseil & projets sélectionnés",
    "contact_h2": "Parlons",
    "contact_intro": "Si vous travaillez sur la fabrication additive, le développement de produits, la fabrication de logiciels ou les équipes techniques, le plus simple est de m'écrire.",
    "contact_kicker": "Contact",
    "cred_1": "15+ ans d'expérience dans l'impression 3D",
    "cred_4": "AM + Logiciel + Équipes humaines",
    "cred_5": "Bologne · Émilie-Romagne",
    "cred_6": "Motor Valley · Packaging Valley",
    "do_1_d": "HP MJF, Carbon DLS, DMLS, FDM, PolyJet. Conception pour AM, rétro-ingénierie, sélection de technologies et de matériaux pour des applications réelles.",
    "do_1_t": "Fabrication additive et DfAM",
    "do_2_d": "Du prototype à la série: workflows de production, post-traitement, qualité, coûts. Le côté de AM que vous voyez uniquement à l'intérieur d'un atelier.",
    "do_2_t": "Industrialisation & production",
    "do_3_d": "Développement full-stack, architectures cloud, MES pour AM, AI appliqués aux opérations de devis, de production et de fabrication.",
    "do_3_t": "Logiciels, AI et automatisation",
    "do_4_d": "La pensée produit appliquée à l’industrie manufacturière: quoi construire, pour qui, avec quel business model. Expérience directe en tant que fondateur, auprès de PME et d'entreprises.",
    "do_4_t": "Produit & stratégie",
    "do_5_d": "Construire et animer des équipes mêlant atelier et code: culture technique, processus, autonomie, appropriation.",
    "do_5_t": "Equipes techniques & opérations",
    "do_h2": "Où j'ajoute de la valeur",
    "do_kicker": "Ce que je fais",
    "hero_cta_work": "Travaillez avec moi",
    "hero_kicker": "Fabrication additive · Logiciels · Équipes techniques",
    "hero_lede": "15 ans d'expérience dans l'impression 3D industrielle: machines, matériaux, logiciels, entreprises et hommes.",
    "hero_role": "Digital Manufacturing Entrepreneur — CEO @ JUNO.AM · Head of Products @ 3FESTO / ANY3DP",
    "hero_sub": "Je construis des produits, des systèmes et des équipes en fabrication numérique, pour des PME et des grands groupes industriels. Depuis Bologne, au cœur de l'Émilie-Romagne, entre Motor Valley et Packaging Valley, je fais passer la fabrication additive du prototypage à la production réelle, avec le logiciel comme levier.",
    "hint_interact": "Faites glisser pour faire pivoter le solide 3D",
    "nav_home": "Accueil",
    "nav_story": "L'histoire",
    "nav_work": "Travaillez avec moi",
    "phil_kicker": "Vision",
    "phil_note": "Mon travail consiste à construire les deux – ainsi que les équipes qui les font fonctionner.",
    "phil_quote": "La fabrication numérique est le pont entre les idées et les objets. Le logiciel est le système nerveux qui le rend évolutif.",
    "st_ch1_h2": "La première machine",
    "st_ch1_p1": "Ma première rencontre avec l'impression 3D industrielle a été un <strong>PolyJet, un Objet EDEN500V</strong>: résine photopolymère, couches de 16 microns, un niveau de détail qui ressemblait à de la science-fiction à l'époque. Ce n'était pas un passe-temps: c'était du vrai prototypage, pour de vrais produits.",
    "st_ch1_p2": "Cette machine a défini la méthode que j’utilise encore aujourd’hui: comprendre le processus de fond en comble – matériaux, limites, maintenance, coûts – avant de promettre ses résultats.",
    "st_ch2_h2": "Des prototypes à une entreprise: JUNO.AM",
    "st_ch2_p1": "En 2012, l'aventure qui allait devenir <strong>JUNO.AM</strong> a commencé: un bureau de services d'impression 3D professionnel construit de toutes pièces, en Émilie, entre Motor Valley et Packaging Valley – où les entreprises n'achètent pas de promesses, elles achètent des pièces qui fonctionnent.",
    "st_ch2_p2": "Créer une entreprise AM en Italie signifie tout apprendre en même temps: la technologie, les ventes, les opérations, les ressources humaines, les flux de trésorerie. C'est le terrain de formation qui a transformé un technicien en entrepreneur.",
    "st_ch3_h2": "FabLab et culture maker",
    "st_ch3_p1": "Au cours des années du mouvement des créateurs, j'ai contribué à introduire la fabrication numérique en dehors des entreprises, avec le <strong>FabLab Valsamoggia</strong> et la communauté locale: des cours, des machines ouvertes, des enfants et des artisans découvrant ce que l'on peut faire avec un fichier et une imprimante.",
    "st_ch3_p2": "De là vient une conviction que je n’ai jamais abandonnée: la technologie compte autant que les personnes qui savent l’utiliser. C'est pourquoi aujourd'hui je travaille autant en équipe que sur machines.",
    "st_ch4_h2": "Le passage à la production: HP Multi Jet Fusion",
    "st_ch4_p1": "Avec <strong>HP Multi Jet Fusion</strong>, l'impression 3D a cessé d'être du simple prototypage: elle est devenue une production en série. Le nylon, la répétabilité et les coûts par pièce commencent à rivaliser avec le moulage de petites et moyennes séries.",
    "st_ch4_p2": "Tout change: non plus « comme le prototype est beau », mais une qualité constante, le post-traitement, la logistique, les flux. AM devient une question de systèmes, pas de machines.",
    "st_ch5_h2": "Carbon DLS: le partenariat Silicon Valley",
    "st_ch5_p1": "En 2020, j'ai personnellement géré le partenariat avec <strong>Carbon</strong>, une entreprise Silicon Valley, pour mettre en production la technologie <strong>DLS</strong>: matériaux d'ingénierie, élastomères, géométries impossibles avec d'autres procédés.",
    "st_ch5_p2": "Un partenariat international n'est pas seulement une question de technologie: ce sont deux cultures industrielles qui doivent se comprendre. Faire en sorte que cela fonctionne entre la Californie et l’Émilie a été une leçon en affaires avant de devenir une leçon en impression 3D.",
    "st_ch6_h2": "Le logiciel à mettre à l'échelle: 3FESTO",
    "st_ch6_p1": "La même année, en parallèle, les travaux sur <strong>3FESTO / ANY3DP</strong> ont commencé: plus la production augmente, plus le véritable goulot d'étranglement se déplace des machines vers les logiciels qui les font fonctionner.",
    "st_ch6_p2": "MES pour la fabrication additive, les devis, l'automatisation des flux de travail et le matériel personnalisé. Des logiciels écrits par des personnes qui vivent réellement en production, et non imaginés dans une salle de réunion.",
    "st_ch7_h2": "AI, systèmes et personnes",
    "st_ch7_p1": "Aujourd'hui, le travail fait converger tout cela: <strong>AI appliqué à la fabrication</strong>, à l'automatisation des processus, aux données de production transformées en décisions. Et des équipes capables de passer de l'atelier au code sans se perdre.",
    "st_ch7_p2": "Quinze ans après ce premier PolyJet, la question est toujours la même: comment transformer une idée en un objet, de manière reproductible et durable? Seule l’ampleur de la réponse a changé.",
    "st_ch7_y": "Aujourd'hui",
    "st_cta_btn": "Voyez comment je travaille",
    "st_cta_h2": "Cette expérience pourrait-elle vous être utile?",
    "st_cta_mail": "Écrivez-moi",
    "st_intro": "Ceci n'est ni un blog ni un CV. C'est le voyage, en sept chapitres, de la façon dont l'impression 3D est passée de la curiosité du laboratoire au système de production – vue de l'intérieur, machine par machine.",
    "st_kicker": "Biographie technique · 2009 → aujourd'hui",
    "st_title": "15 ans dans l'impression 3D",
    "tl_2009": "<strong>Premier contact avec l'impression 3D industrielle.</strong> PolyJet, Objet EDEN500V: Je n'ai jamais quitté.",
    "tl_2012": "<strong>Le voyage JUNO.AM commence.</strong> Du prototypage à un bureau de services professionnel.",
    "tl_2014": "<strong>FabLab Valsamoggia et culture maker.</strong> Sensibilisation, communauté, accès à la fabrication numérique.",
    "tl_2017": "<strong>HP Multi Jet Fusion.</strong> Le passage du prototypage à la production en série.",
    "tl_2020a": "<strong>Partenariat Carbon DLS.</strong> Technologie de la Silicon Valley, mise en production et gérée en direct.",
    "tl_2020b": "<strong>3FESTO / ANY3DP est né.</strong> MES et un logiciel pour faire évoluer la production additive.",
    "tl_h2": "15 ans en sept lignes",
    "tl_kicker": "Chemin",
    "tl_more": "Lire l'histoire complète →",
    "tl_now": "<strong>AI et logiciels pour les systèmes de fabrication.</strong> Automatisation, données et outils pour les personnes qui fabriquent des objets.",
    "tl_now_y": "Aujourd'hui",
    "vat_label": "TVA (IT) 03577361201",
    "wm_cta_btn": "Écrivez-moi",
    "wm_cta_h2": "Parlez-moi du problème",
    "wm_cta_intro": "Un email avec deux lignes de contexte suffit. Si je peux vous aider, nous le découvrirons lors d'un premier appel. Si je ne peux pas, je vous le dirai tout de suite.",
    "wm_cta_kicker": "Premier pas",
    "wm_fit_h2": "Quand ça marche, quand ça ne marche pas",
    "wm_fit_kicker": "Transparence",
    "wm_fit_no_1": "Vous recherchez un corps à temps plein à embaucher, pour une durée indéterminée.",
    "wm_fit_no_3": "Le but est de \"faire quelque chose avec AI\" sans problème à résoudre.",
    "wm_fit_no_h3": "Probablement pas si",
    "wm_fit_yes_1": "Vous avez un problème concret de production, de produit ou de processus – pas un problème de marketing.",
    "wm_fit_yes_2": "Vous voulez quelqu'un qui a vu des machines, des matériaux et du code, pas seulement des diapositives.",
    "wm_fit_yes_3": "Vous voulez des décisions raisonnées, même si la réponse est « ne le faites pas ».",
    "wm_fit_yes_4": "Vous êtes prêt à impliquer les personnes qui font le travail, pas seulement celles qui en parlent.",
    "wm_fit_yes_h3": "Il est logique de travailler ensemble si",
    "wm_how_h2": "Domaines de travail",
    "wm_how_kicker": "Comment puis-je aider",
    "wm_intro": "Groupes industriels, PME, fondateurs et services techniques travaillant sur la fabrication additive, le développement de produits, les logiciels de fabrication, l'automatisation et les équipes techniques. Je ne fais pas de conseil en volume: je prends peu de missions, où mon expérience directe fait la différence.",
    "wm_kicker": "Conseil · Projets · TVA",
    "wm_m1_d": "Un premier appel pour comprendre la problématique, les contraintes et les objectifs. Aucun engagement, aucune diapositive, aucune vente.",
    "wm_m1_t": "Contexte",
    "wm_m2_d": "Analyse sur le terrain: données, machines, flux, personnes. Le résultat est une image honnête et les véritables priorités, même lorsque la réponse est « vous n'avez pas besoin de AM ».",
    "wm_m2_t": "Évaluation",
    "wm_m3_d": "Livraison avec des livrables clairs: rapports, feuilles de route, prototypes, coaching d'équipe. Avec un début, une fin et des résultats mesurables.",
    "wm_m3_t": "Exécution",
    "wm_m_h2": "Comment je travaille",
    "wm_m_kicker": "Méthode",
    "wm_svc1_d": "Une évaluation honnête du degré de préparation d'une application, d'un département ou d'un produit pour la production additive: technologies, coûts, goulots d'étranglement, risques.",
    "wm_svc1_t": "AM examen de préparation à la production",
    "wm_svc2_d": "Revue de pièces et assemblages pour la production additive: géométries, matériaux, tolérances, post-traitement. Refonte pour AM, ne vous contentez pas de vous adapter.",
    "wm_svc2_t": "DfAM et révision de la conception",
    "wm_svc3_d": "Analyse de la façon dont les commandes, les fichiers, les machines et les personnes évoluent dans la production. Où le temps est perdu, où la marge est perdue, quoi automatiser.",
    "wm_svc3_t": "Audit des flux de travail et des opérations",
    "wm_svc4_d": "Aide aux décisions d'investissement: MJF, DLS, DMLS, FDM, PolyJet – ou aucune d'entre elles. J'ai travaillé avec chacun d'eux; Je sais ce qu’ils promettent et ce qu’ils livrent.",
    "wm_svc4_t": "AM décisions technologiques",
    "wm_svc5_d": "Ce qui est logique de créer, d'acheter ou d'intégrer: MES, devis, automatisation, appliqué AI. De quelqu'un qui a réellement créé un logiciel pour AM.",
    "wm_svc5_t": "Logiciels et AI feuille de route pour la fabrication",
    "wm_svc6_d": "Leadership temporaire d'un produit, AM ou d'un domaine technique: pour combler une lacune, démarrer une fonction ou piloter une transition.",
    "wm_svc6_t": "Leadership temporaire/fractionné",
    "wm_svc7_d": "Séances pratiques sur AM, DfAM, l'automatisation et AI dans la fabrication. Du concret, sur votre contexte, pas de slides motivationnels.",
    "wm_svc7_t": "Ateliers pour les équipes techniques et le management",
    "wm_svc8_d": "Pour les PME et les groupes industriels qui souhaitent comprendre ce qui a du sens – et ce qui ne l'est pas – avec l'impression 3D et AI dans leur entreprise.",
    "wm_svc8_t": "Conseils sur AM et AI",
    "wm_title": "Je travaille de manière sélective avec des personnes qui fabriquent, conçoivent ou créent des logiciels pour la fabrication.",
    "wm_vat_note": "Travaux réalisés sous TVA (IT) 03577361201 — facturation régulière, NDA en cas de besoin."
  },
  "sr": {
    "biz_3festo_d": "MES софтвер за адитивну производњу, прилагођени хардвер, оперативне услужне програме и напредне ИТ услуге за људе који стварно производе.",
    "biz_3festo_meta": "Head of Products · од 2020",
    "biz_h2": "Где радим сваки дан",
    "biz_juno_d": "Професионални биро за 3Д штампање: брза израда прототипа, серијска производња, индустријски дизајн за компаније и инжењерске фирме.",
    "biz_juno_meta": "CEO · од 2012",
    "biz_kicker": "Вентурес",
    "biz_piva_cta": "како радим →",
    "biz_piva_d": "Директна сарадња са компанијама и оснивачима на AM, производном софтверу и техничким тимовима. Мало ствари, добро урађено.",
    "biz_piva_meta": "Самостална пракса · ПДВ",
    "biz_piva_t": "Саветодавни и одабрани пројекти",
    "contact_h2": "хајде да разговарамо",
    "contact_intro": "Ако радите на адитивној производњи, развоју производа, производном софтверу или техничким тимовима, најједноставнији начин је да ми пишете.",
    "contact_kicker": "Контакт",
    "cred_1": "15+ година у 3Д штампању",
    "cred_4": "AM + софтвер + људски тимови",
    "cred_5": "Болоња · Емилија-Ромања",
    "cred_6": "Motor Valley · Packaging Valley",
    "do_1_d": "HP MJF, Carbon DLS, DMLS, FDM, PolyJet. Дизајн за AM, обрнути инжењеринг, избор технологије и материјала за стварне примене.",
    "do_1_t": "Адитивна производња и DfAM",
    "do_2_d": "Од прототипа до серије: токови производње, накнадна обрада, квалитет, трошкови. Страна AM коју видите само унутар радионице.",
    "do_2_t": "Индустријализација и производња",
    "do_3_d": "Комплетан развој, архитектуре облака, MES за AM, AI примењене на цитирање, производњу и производне операције.",
    "do_3_t": "Софтвер, AI и аутоматизација",
    "do_4_d": "Размишљање о производу примењено на производњу: шта изградити, за кога, са којим пословним моделом. Искуство из прве руке као оснивача, са малим и средњим предузећима и корпоративним окружењима.",
    "do_4_t": "Производ и стратегија",
    "do_5_d": "Изградња и вођење тимова који мешају радионицу и код: техничка култура, процеси, аутономија, власништво.",
    "do_5_t": "Технички тимови и операције",
    "do_h2": "Где додајем вредност",
    "do_kicker": "Шта ја радим",
    "hero_cta_work": "Ради са мном",
    "hero_kicker": "Адитивна производња · Софтвер · Технички тимови",
    "hero_lede": "15 година унутар индустријског 3Д штампања: машине, материјали, софтвер, посао и људи.",
    "hero_role": "Digital Manufacturing Entrepreneur — CEO @ JUNO.AM · Head of Products @ 3FESTO / ANY3DP",
    "hero_sub": "Градим производе, системе и тимове у дигиталној производњи, за мала и средња предузећа и велике индустријске групе. Од Болоње — у срцу Емилије-Ромање, између Motor Valley и Packaging Valley — водим адитивну производњу од израде прототипа до праве производње, са софтвером као полугом.",
    "hint_interact": "Превуците да бисте ротирали 3Д чврсти део",
    "nav_home": "Почетна",
    "nav_story": "Прича",
    "nav_work": "Ради са мном",
    "phil_kicker": "Висион",
    "phil_note": "Мој посао је да изградим и – и тимове који их чине да раде.",
    "phil_quote": "Дигитална производња је мост између идеја и предмета. Софтвер је нервни систем који га повећава.",
    "st_ch1_h2": "Прва машина",
    "st_ch1_p1": "Мој први сусрет са индустријским 3Д штампањем био је <strong>PolyJet, Objet EDEN500V</strong>: фотополимерна смола, слојеви од 16 микрона, ниво детаља који је у то време изгледао као научна фантастика. То није био хоби: било је право прототиповање, за праве производе.",
    "st_ch1_p2": "Та машина је дефинисала метод који и данас користим: разумети процес изнутра - материјале, ограничења, одржавање, трошкове - пре него што обећам његове резултате.",
    "st_ch2_h2": "Од прототипа до компаније: JUNO.AM",
    "st_ch2_p1": "Године 2012. почело је путовање које ће постати <strong>JUNO.AM</strong>: професионални биро за 3Д штампање изграђен од нуле, у Емилији, између Motor Valley и Packaging Valley — где компаније не купују обећања, оне купују делове који раде.",
    "st_ch2_p2": "Изградња AM предузећа у Италији значи учење свега одједном: технологије, продаје, операција, људи, тока новца. То је полигон који је техничара претворио у предузетника.",
    "st_ch3_h2": "ФабЛаб и култура произвођача",
    "st_ch3_p1": "Током година покрета за креаторе, помогао сам да се дигитална производња доведе ван компанија, са <strong>ФабЛаб Валсамоггиа</strong> и локалном заједницом: курсеви, отворене машине, деца и занатлије откривају шта можете да урадите са датотеком и штампачем.",
    "st_ch3_p2": "Одатле долази уверење које никада нисам напустио: технологија је важна колико и људи који знају како да је користе. Зато данас радим на тимовима колико и на машинама.",
    "st_ch4_h2": "Скок у производњу: HP Multi Jet Fusion",
    "st_ch4_p1": "Са <strong>HP Multi Jet Fusion</strong>, 3Д штампање је престало да буде само прототип: постало је серијска производња. Најлон, поновљивост, трошкови по делу почињу да се такмиче са обликовањем за мале и средње серије.",
    "st_ch4_p2": "Све се мења: више не „како је леп прототип“, већ доследан квалитет, накнадна обрада, логистика, токови. AM постаје ствар система, а не машина.",
    "st_ch5_h2": "Carbon DLS: Silicon Valley партнерство",
    "st_ch5_p1": "2020. године сам лично управљао партнерством са <strong>Carbon</strong>, компанијом Silicon Valley, да уведем <strong>DLS</strong> технологију у производњу: инжењерске материјале, еластомере, геометрије немогуће са другим процесима.",
    "st_ch5_p2": "Међународно партнерство није само технологија: то су две индустријске културе које морају да разумеју једна другу. Учинити то да функционише између Калифорније и Емилије била је лекција у пословању пре него што је то било у 3Д штампању.",
    "st_ch6_h2": "Софтвер за скалирање: 3FESTO",
    "st_ch6_p1": "Исте године, паралелно, почео је рад на <strong>3FESTO / ANY3DP</strong>: што производња расте, више се право уско грло помера са машина на софтвер који их покреће.",
    "st_ch6_p2": "MES за адитивну производњу, цитирање, аутоматизацију тока посла, прилагођени хардвер. Софтвер који су написали људи који заправо живе у производњи, а не замишљени у сали за састанке.",
    "st_ch7_h2": "AI, системи и људи",
    "st_ch7_p1": "Данас се ради на томе да се све ово приближи: <strong>AI примењено на производњу</strong>, аутоматизацију процеса, подаци о производњи претворени у одлуке. А тимови могу да се крећу између радионице и кода, а да се не изгубе.",
    "st_ch7_p2": "Петнаест година након тог првог PolyJet, питање је и даље исто: како претворити идеју у објекат, поновљиво и одрживо? Само се размера одговора променила.",
    "st_ch7_y": "данас",
    "st_cta_btn": "Видите како радим",
    "st_cta_h2": "Може ли вам ово искуство бити корисно?",
    "st_cta_mail": "Пишите ми",
    "st_intro": "Ово није блог и није резиме. То је путовање, у седам поглавља, о томе како је 3Д штампање прешло од лабораторијске радозналости до производног система — гледано изнутра, машина по машина.",
    "st_kicker": "Техничка биографија · 2009 → данас",
    "st_title": "15 година у 3Д штампању",
    "tl_2009": "<strong>Први контакт са индустријским 3Д штампањем.</strong> PolyJet, Objet EDEN500V: Никад нисам отишао.",
    "tl_2012": "<strong>Путовање JUNO.AM почиње.</strong> Од израде прототипа до професионалног сервисног бироа.",
    "tl_2014": "<strong>ФабЛаб Валсамоггиа и култура произвођача.{1}} Досег, заједница, приступ дигиталној производњи.",
    "tl_2017": "<strong>HP Multi Jet Fusion.</strong> Скок од израде прототипа до серијске производње.",
    "tl_2020a": "<strong>Партнерство са Carbon DLS.</strong> Технологија из Silicon Valley-ја, уведена у производњу и вођена из прве руке.",
    "tl_2020b": "<strong>3FESTO / ANY3DP је рођен.</strong> MES и софтвер за повећање адитивне производње.",
    "tl_h2": "15 година у седам редова",
    "tl_kicker": "Пут",
    "tl_more": "Прочитајте целу причу →",
    "tl_now": "<strong>AI и софтвер за производне системе.{1}} Аутоматизација, подаци и алати за људе који праве ствари.",
    "tl_now_y": "данас",
    "vat_label": "PDV (IT) 03577361201",
    "wm_cta_btn": "Пишите ми",
    "wm_cta_h2": "Реци ми о проблему",
    "wm_cta_intro": "Довољан је е-маил са два реда контекста. Ако могу да помогнем, решићемо то у првом позиву. Ако не могу, одмах ћу ти рећи.",
    "wm_cta_kicker": "Први корак",
    "wm_fit_h2": "Кад ради, кад не",
    "wm_fit_kicker": "Транспарентност",
    "wm_fit_no_1": "Тражите тело са пуним радним временом за изнајмљивање, на неодређено време.",
    "wm_fit_no_3": "Циљ је „урадити нешто са AI“ без проблема за решавање.",
    "wm_fit_no_h3": "Вероватно не ако",
    "wm_fit_yes_1": "Имате конкретан проблем производње, производа или процеса - а не маркетиншки проблем.",
    "wm_fit_yes_2": "Желите некога ко је видео машине, материјале и код, а не само слајдове.",
    "wm_fit_yes_3": "Желите образложене одлуке, чак и када је одговор „не ради то“.",
    "wm_fit_yes_4": "Спремни сте да укључите људе који раде посао, а не само оне који говоре о томе.",
    "wm_fit_yes_h3": "Има смисла радити заједно ако",
    "wm_how_h2": "Области рада",
    "wm_how_kicker": "Како могу помоћи",
    "wm_intro": "Индустријске групе, мала и средња предузећа, оснивачи и техничка одељења која раде на адитивној производњи, развоју производа, производном софтверу, аутоматизацији и техничким тимовима. Не бавим се консалтингом у вези са обимом: преузимам неколико ангажмана, где моје искуство из прве руке чини разлику.",
    "wm_kicker": "Саветовање · Пројекти · ПДВ",
    "wm_m1_d": "Први позив за разумевање проблема, ограничења и циљева. Без обавеза, без слајдова, без продаје.",
    "wm_m1_t": "Контекст",
    "wm_m2_d": "Анализа на терену: подаци, машине, токови, људи. Резултат је искрена слика и прави приоритети — чак и када је одговор „не треба вам AM“.",
    "wm_m2_t": "Процена",
    "wm_m3_d": "Испорука са јасним резултатима: извештаји, мапе пута, прототипови, обука тима. Са почетком, крајем и мерљивим резултатима.",
    "wm_m3_t": "Извршење",
    "wm_m_h2": "Како радим",
    "wm_m_kicker": "Метод",
    "wm_svc1_d": "Искрена процена колико је апликација, одељење или производ спреман за адитивну производњу: технологије, трошкови, уска грла, ризици.",
    "wm_svc1_t": "AM преглед спремности производње",
    "wm_svc2_d": "Преглед делова и склопова за адитивну производњу: геометрије, материјали, толеранције, накнадна обрада. Редизајнирајте за AM, немојте се само прилагођавати.",
    "wm_svc2_t": "DfAM и рецензија дизајна",
    "wm_svc3_d": "Анализа како се наруџбине, фајлови, машине и људи крећу кроз производњу. Где се губи време, где се губи маргина, шта да се аутоматизује.",
    "wm_svc3_t": "Ревизија тока посла и операција",
    "wm_svc4_d": "Подршка за одлуке о улагању: MJF, DLS, DMLS, FDM, PolyJet — или ниједна од њих. Радио сам са свима њима; Знам шта обећавају и шта испоручују.",
    "wm_svc4_t": "AM технолошке одлуке",
    "wm_svc5_d": "Шта има смисла изградити, купити или интегрисати: MES, цитирање, аутоматизација, примењено AI. Од некога ко је заиста направио софтвер за AM.",
    "wm_svc5_t": "Софтвер и AI мапа пута за производњу",
    "wm_svc6_d": "Привремено вођство над производом, AM или техничком области: да бисте попунили празнину, започните функцију или управљајте транзицијом.",
    "wm_svc6_t": "Привремено / фракционо вођство",
    "wm_svc7_d": "Практичне сесије о AM, DfAM, аутоматизацији и AI у производњи. Конкретно, у вашем контексту, без мотивационих слајдова.",
    "wm_svc7_t": "Радионице за техничке тимове и менаџмент",
    "wm_svc8_d": "За мала и средња предузећа и индустријске групе које желе да схвате шта заправо има смисла да раде – а шта не – са 3Д штампањем и AI у њиховој компанији.",
    "wm_svc8_t": "Смернице за AM и AI",
    "wm_title": "Радим селективно са људима који производе, дизајнирају или граде софтвер за производњу.",
    "wm_vat_note": "Радови се обављају према ПДВ (ИТ) 03577361201 — редовно фактурисање, NDA по потреби."
  },
  "ru": {
    "biz_3festo_d": "MES Программное обеспечение для аддитивного производства, специальное оборудование, операционные утилиты и расширенные ИТ-услуги для людей, которые действительно занимаются производством.",
    "biz_3festo_meta": "Head of Products · с 2020 г.",
    "biz_h2": "Где я работаю каждый день",
    "biz_juno_d": "Профессиональное сервисное бюро 3D-печати: быстрое прототипирование, серийное производство, промышленный дизайн для компаний и инжиниринговых фирм.",
    "biz_juno_meta": "CEO · с 2012 г.",
    "biz_kicker": "Венчуры",
    "biz_piva_cta": "как я работаю →",
    "biz_piva_d": "Прямое сотрудничество с компаниями и основателями AM, производителями программного обеспечения и техническими командами. Немного вещей, сделано хорошо.",
    "biz_piva_meta": "Независимая практика · НДС",
    "biz_piva_t": "Консультации и избранные проекты",
    "contact_h2": "Давайте поговорим",
    "contact_intro": "Если вы работаете в аддитивном производстве, разработке продуктов, производстве программного обеспечения или в технических командах, самый простой способ — написать мне.",
    "contact_kicker": "Контакт",
    "cred_1": "15+ лет в 3D-печати",
    "cred_4": "AM + Программное обеспечение + Персональные команды",
    "cred_5": "Болонья · Эмилия-Романья",
    "cred_6": "Motor Valley · Packaging Valley",
    "do_1_d": "HP MJF, Carbon DLS, DMLS, FDM, PolyJet. Проектирование AM, реверс-инжиниринг, выбор технологий и материалов для реального применения.",
    "do_1_t": "Аддитивное производство и DfAM",
    "do_2_d": "От прототипа к серии: технологические процессы производства, постобработка, качество, затраты. Сторону AM, которую вы видите только внутри мастерской.",
    "do_2_t": "Индустриализация и производство",
    "do_3_d": "Комплексная разработка, облачные архитектуры, MES для AM, AI, применяемые для ценообразования, производства и производственных операций.",
    "do_3_t": "Программное обеспечение, AI и автоматизация",
    "do_4_d": "Продуктовое мышление применительно к производству: что создавать, для кого, с какой бизнес-моделью. Непосредственный опыт основателя в сфере малого и среднего бизнеса и корпоративной среде.",
    "do_4_t": "Продукт и стратегия",
    "do_5_d": "Создание и управление командами, сочетающими мастерскую и код: техническая культура, процессы, автономия, ответственность.",
    "do_5_t": "Технические команды и операции",
    "do_h2": "Где я добавляю ценность",
    "do_kicker": "Что я делаю",
    "hero_cta_work": "Работа со мной",
    "hero_kicker": "Аддитивное производство · Программное обеспечение · Технические команды",
    "hero_lede": "15 лет в промышленной 3D-печати: машины, материалы, программное обеспечение, бизнес и люди.",
    "hero_role": "Digital Manufacturing Entrepreneur — CEO @ JUNO.AM · Head of Products @ 3FESTO / ANY3DP",
    "hero_sub": "Я создаю продукты, системы и команды в сфере цифрового производства для малого и среднего бизнеса и крупных промышленных групп. В Болонье — в самом сердце Эмилии-Романьи, между Motor Valley и Packaging Valley — я перевожу аддитивное производство от прототипирования к реальному производству, используя программное обеспечение в качестве рычага.",
    "hint_interact": "Перетащите, чтобы повернуть 3D-тело.",
    "nav_home": "Главная",
    "nav_story": "История",
    "nav_work": "Работа со мной",
    "phil_kicker": "Зрение",
    "phil_note": "Моя работа — создать и то и другое, а также команды, которые заставят их работать.",
    "phil_quote": "Цифровое производство — это мост между идеями и объектами. Программное обеспечение — это нервная система, которая обеспечивает его масштабирование.",
    "st_ch1_h2": "Первая машина",
    "st_ch1_p1": "Мое первое знакомство с промышленной 3D-печатью было <strong>PolyJet, Objet EDEN500V</strong>: фотополимерная смола, слои толщиной 16 микрон, уровень детализации, который в то время казался научной фантастикой. Это не было хобби: это было настоящее прототипирование реальных продуктов.",
    "st_ch1_p2": "Эта машина определила метод, который я использую до сих пор: понять процесс изнутри — материалы, ограничения, обслуживание, затраты — прежде чем обещать результаты.",
    "st_ch2_h2": "От прототипов до компании: JUNO.AM",
    "st_ch2_p1": "В 2012 году начался путь, который впоследствии стал <strong>JUNO.AM</strong>: профессиональное сервисное бюро 3D-печати, построенное с нуля в Эмилии, между Motor Valley и Packaging Valley — там, где компании не покупают обещания, они покупают детали, которые работают.",
    "st_ch2_p2": "Построить бизнес AM в Италии означает изучить все сразу: технологии, продажи, операции, людей, денежный поток. Это учебная площадка, которая превратила технического специалиста в предпринимателя.",
    "st_ch3_h2": "FabLab и культура производителей",
    "st_ch3_p1": "В годы движения производителей я помогал вывести цифровое производство за пределы компаний, используя <strong>FabLab Valsamoggia</strong> и местное сообщество: курсы, открытые машины, дети и ремесленники, открывающие, что можно сделать с файлом и принтером.",
    "st_ch3_p2": "Отсюда вытекает убеждение, от которого я никогда не отказывался: технологии имеют такое же значение, как и люди, которые знают, как их использовать. Вот почему сегодня я работаю не только над машинами, но и над командами.",
    "st_ch4_h2": "Переход к производству: HP Multi Jet Fusion",
    "st_ch4_p1": "С появлением <strong>HP Multi Jet Fusion</strong> 3D-печать перестала быть просто прототипированием: она превратилась в серийное производство. Нейлон, повторяемость, затраты на деталь начинают конкурировать с литьем при малых и средних партиях.",
    "st_ch4_p2": "Меняется все: уже не «насколько хорош прототип», а стабильное качество, постобработка, логистика, потоки. AM становится вопросом систем, а не машин.",
    "st_ch5_h2": "Carbon DLS: партнерство Silicon Valley",
    "st_ch5_p1": "В 2020 году я лично управлял партнерством с <strong>Carbon</strong>, компанией Silicon Valley, чтобы внедрить в производство технологию <strong>DLS</strong>: конструкционные материалы, эластомеры, геометрии, невозможные с помощью других процессов.",
    "st_ch5_p2": "Международное партнерство – это не просто технологии: это две индустриальные культуры, которые должны понимать друг друга. Достижение успеха между Калифорнией и Эмилией было уроком в бизнесе, а затем в 3D-печати.",
    "st_ch6_h2": "Программное обеспечение для масштабирования: 3FESTO",
    "st_ch6_p1": "В том же году параллельно началась работа над <strong>3FESTO / ANY3DP</strong>: чем больше растет производство, тем больше узких мест смещается от машин к программному обеспечению, которое ими управляет.",
    "st_ch6_p2": "MES для аддитивного производства, ценообразования, автоматизации рабочих процессов, специального оборудования. Программное обеспечение, написанное людьми, которые на самом деле живут в производстве, а не в конференц-зале.",
    "st_ch7_h2": "AI, системы и люди",
    "st_ch7_p1": "Сегодня работа объединяет все это: <strong>AI применяется к производству</strong>, автоматизации процессов, производственные данные превращаются в решения. И команды могут перемещаться между мастерской и кодом, не теряясь.",
    "st_ch7_p2": "Спустя пятнадцать лет после того первого PolyJet вопрос остается прежним: как превратить идею в объект, повторяемо и устойчиво? Изменился только масштаб ответа.",
    "st_ch7_y": "Сегодня",
    "st_cta_btn": "Посмотрите, как я работаю",
    "st_cta_h2": "Может ли этот опыт быть вам полезен?",
    "st_cta_mail": "Напишите мне",
    "st_intro": "Это не блог и не резюме. Это путешествие в семи главах о том, как 3D-печать прошла путь от лабораторного любопытства до производственной системы — если смотреть изнутри, машина за машиной.",
    "st_kicker": "Техническая биография · 2009 → сегодня",
    "st_title": "15 лет в 3D-печати",
    "tl_2009": "<strong>Первый контакт с промышленной 3D-печатью.</strong> PolyJet, Objet EDEN500V: Я никуда не уходил.",
    "tl_2012": "<strong>Путешествие JUNO.AM начинается.</strong> От прототипирования до профессионального сервисного бюро.",
    "tl_2014": "<strong>FabLab Valsamoggia и культура производителей.</strong> Информационная работа, сообщество, доступ к цифровому производству.",
    "tl_2017": "<strong>HP Multi Jet Fusion.</strong> Переход от прототипирования к серийному производству.",
    "tl_2020a": "<strong>Партнёрство с Carbon DLS.</strong> Технология из Silicon Valley, внедрённая в производство и управляемая напрямую.",
    "tl_2020b": "Рождение <strong>3FESTO / ANY3DP.</strong> MES и программное обеспечение для масштабирования аддитивного производства.",
    "tl_h2": "15 лет в семи строках",
    "tl_kicker": "Путь",
    "tl_more": "Читать всю историю →",
    "tl_now": "<strong>AI и программное обеспечение для производственных систем.</strong> Автоматизация, данные и инструменты для людей, которые что-то создают.",
    "tl_now_y": "Сегодня",
    "vat_label": "НДС (IT) 03577361201",
    "wm_cta_btn": "Напишите мне",
    "wm_cta_h2": "Расскажи мне о проблеме",
    "wm_cta_intro": "Достаточно электронного письма с двумя строками контекста. Если смогу помочь, разберемся при первом звонке. Если не смогу, сразу скажу.",
    "wm_cta_kicker": "Первый шаг",
    "wm_fit_h2": "Когда это работает, когда нет",
    "wm_fit_kicker": "Прозрачность",
    "wm_fit_no_1": "Вы ищете тело на полный рабочий день на неопределенный срок.",
    "wm_fit_no_3": "Цель — «сделать что-нибудь с AI» без проблем, которые нужно решить.",
    "wm_fit_no_h3": "Наверное, нет, если",
    "wm_fit_yes_1": "У вас есть конкретная проблема производства, продукта или процесса, а не проблема маркетинга.",
    "wm_fit_yes_2": "Вам нужен человек, который видел машины, материалы и код, а не только слайды.",
    "wm_fit_yes_3": "Вам нужны обоснованные решения, даже если ответ «не делайте этого».",
    "wm_fit_yes_4": "Вы готовы привлечь к работе людей, которые выполняют работу, а не только тех, кто о ней говорит.",
    "wm_fit_yes_h3": "Имеет смысл сотрудничать, если",
    "wm_how_h2": "Направления работы",
    "wm_how_kicker": "Как я могу помочь",
    "wm_intro": "Промышленные группы, малые и средние предприятия, учредители и технические отделы, работающие над аддитивным производством, разработкой продуктов, программным обеспечением для производства, автоматизацией и техническими группами. Я не занимаюсь массовыми консультациями: я беру на себя несколько работ, где мой личный опыт имеет значение.",
    "wm_kicker": "Консультации · Проекты · НДС",
    "wm_m1_d": "Первый звонок, чтобы понять проблему, ограничения и цели. Никаких обязательств, никаких слайдов, никаких продаж.",
    "wm_m1_t": "Контекст",
    "wm_m2_d": "Анализ в полевых условиях: данные, машины, потоки, люди. Результатом является честная картина и реальные приоритеты — даже если ответ «вам не нужен AM».",
    "wm_m2_t": "Оценка",
    "wm_m3_d": "Поставка с четкими результатами: отчеты, дорожные карты, прототипы, обучение команды. Имея начало, конец и измеримые результаты.",
    "wm_m3_t": "Исполнение",
    "wm_m_h2": "Как я работаю",
    "wm_m_kicker": "Метод",
    "wm_svc1_d": "Честная оценка того, насколько приложение, отдел или продукт готовы к аддитивному производству: технологии, затраты, узкие места, риски.",
    "wm_svc1_t": "AM проверка готовности к производству",
    "wm_svc2_d": "Обзор деталей и сборок для аддитивного производства: геометрии, материалы, допуски, постобработка. Редизайн для AM, а не просто адаптация.",
    "wm_svc2_t": "DfAM и проверка дизайна",
    "wm_svc3_d": "Анализ того, как заказы, файлы, машины и люди перемещаются по производству. Где теряется время, где теряется маржа, что автоматизировать.",
    "wm_svc3_t": "Аудит рабочих процессов и операций",
    "wm_svc4_d": "Поддержка инвестиционных решений: MJF, DLS, DMLS, FDM, PolyJet — или ни одного из них. Я работал со всеми из них; Я знаю, что они обещают и что они делают.",
    "wm_svc4_t": "AM технологические решения",
    "wm_svc5_d": "Что имеет смысл создавать, покупать или интегрировать: MES, квотирование, автоматизация, прикладной AI. От человека, который действительно создавал программное обеспечение для AM.",
    "wm_svc5_t": "Программное обеспечение и AI план действий для производства",
    "wm_svc6_d": "Временное лидерство в продукте, AM или технической области: чтобы заполнить пробел, запустить функцию или управлять переходом.",
    "wm_svc6_t": "Временное/фракционное руководство",
    "wm_svc7_d": "Практические занятия по AM, DfAM, автоматизации и AI в производстве. Конкретно, по вашему контексту, никаких мотивационных слайдов.",
    "wm_svc7_t": "Семинары для технических команд и менеджмента",
    "wm_svc8_d": "Для малых и средних предприятий и промышленных групп, которые хотят понять, что на самом деле имеет смысл делать — а что нет — с 3D-печатью и AI в своей компании.",
    "wm_svc8_t": "Рекомендации по AM и AI",
    "wm_title": "Я работаю выборочно с людьми, которые производят, проектируют или создают программное обеспечение для производства.",
    "wm_vat_note": "Работы выполняются по НДС (ИТ) 03577361201 — регулярное выставление счетов, NDA при необходимости."
  }
};

Object.keys(extraLanguageOverrides).forEach((lang) => {
  i18n[lang] = Object.assign({}, extraLanguageOverrides[lang]);
});

function applyLanguage(lang) {
  // Fallback policy:
  // - EN: full English baseline.
  // - Other languages: local keys + Italian baseline (never raw English leftovers).
  const baseDict = (lang === 'en')
    ? Object.assign({}, i18n.it, i18n.en)
    : Object.assign({}, i18n.en, i18n.it);
  const dict = Object.assign(baseDict, i18n[lang] || {});
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });
  const buttons = document.querySelectorAll('#lang-toggle button');
  buttons.forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
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