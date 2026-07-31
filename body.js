(() => {
  'use strict';

  const bgDiv = document.getElementById('bg3d');
  if (!bgDiv || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (renderer.outputColorSpace !== undefined) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if (renderer.outputEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  renderer.domElement.className = 'bg3d-canvas';
  bgDiv.appendChild(renderer.domElement);
  let hasFadedIn = false;

  const immersiveExperienceCopy = {
    it: {
      eyebrow: 'Pausa interattiva · 3D',
      continueLabel: 'Continua a leggere',
      returnLabel: 'Torna al 3D',
      legendLabel: 'Comandi dell’ambiente 3D',
      rotateAction: 'ruota',
      zoomAction: 'zoom',
      bounceAction: 'rimbalza',
      resetAction: 'reimposta',
      surfaceLabel: 'Area interattiva per manipolare la sfera 3D',
      active: 'Spazio 3D attivo. Per proseguire usa Continua a leggere.',
      compact: 'Spazio 3D ridotto. La lettura può continuare.'
    },
    en: {
      eyebrow: 'Interactive pause · 3D',
      continueLabel: 'Continue reading',
      returnLabel: 'Return to 3D',
      legendLabel: '3D environment controls',
      rotateAction: 'rotate',
      zoomAction: 'zoom',
      bounceAction: 'bounce',
      resetAction: 'reset',
      surfaceLabel: 'Interactive area for manipulating the 3D sphere',
      active: '3D space active. Use Continue reading to move on.',
      compact: '3D space minimised. Reading can continue.'
    },
    es: {
      eyebrow: 'Pausa interactiva · 3D',
      continueLabel: 'Seguir leyendo',
      returnLabel: 'Volver al 3D',
      legendLabel: 'Controles del entorno 3D',
      rotateAction: 'gira',
      zoomAction: 'zoom',
      bounceAction: 'rebota',
      resetAction: 'restablece',
      surfaceLabel: 'Área interactiva para manipular la esfera 3D',
      active: 'Espacio 3D activo. Usa Seguir leyendo para continuar.',
      compact: 'Espacio 3D reducido. Puedes seguir leyendo.'
    },
    ca: {
      eyebrow: 'Pausa interactiva · 3D',
      continueLabel: 'Continua llegint',
      returnLabel: 'Torna al 3D',
      legendLabel: 'Controls de l’entorn 3D',
      rotateAction: 'gira',
      zoomAction: 'zoom',
      bounceAction: 'rebota',
      resetAction: 'restableix',
      surfaceLabel: 'Àrea interactiva per manipular l’esfera 3D',
      active: 'Espai 3D actiu. Utilitza Continua llegint per avançar.',
      compact: 'Espai 3D reduït. Pots continuar llegint.'
    },
    fr: {
      eyebrow: 'Pause interactive · 3D',
      continueLabel: 'Continuer la lecture',
      returnLabel: 'Retourner à la 3D',
      legendLabel: 'Commandes de l’environnement 3D',
      rotateAction: 'tourner',
      zoomAction: 'zoom',
      bounceAction: 'rebondir',
      resetAction: 'réinitialiser',
      surfaceLabel: 'Zone interactive pour manipuler la sphère 3D',
      active: 'Espace 3D actif. Utilisez Continuer la lecture pour avancer.',
      compact: 'Espace 3D réduit. La lecture peut continuer.'
    },
    sr: {
      eyebrow: 'Интерактивна пауза · 3D',
      continueLabel: 'Наставите са читањем',
      returnLabel: 'Назад у 3D',
      legendLabel: 'Контроле 3D окружења',
      rotateAction: 'ротирај',
      zoomAction: 'зум',
      bounceAction: 'одскочи',
      resetAction: 'ресетуј',
      surfaceLabel: 'Интерактивна област за управљање 3D сфером',
      active: '3D простор је активан. Изаберите Наставите са читањем да бисте продужили.',
      compact: '3D простор је смањен. Можете наставити са читањем.'
    },
    ru: {
      eyebrow: 'Интерактивная пауза · 3D',
      continueLabel: 'Продолжить чтение',
      returnLabel: 'Вернуться в 3D',
      legendLabel: 'Управление 3D-пространством',
      rotateAction: 'вращать',
      zoomAction: 'масштаб',
      bounceAction: 'отскок',
      resetAction: 'сбросить',
      surfaceLabel: 'Интерактивная область для управления 3D-сферой',
      active: '3D-пространство активно. Нажмите Продолжить чтение, чтобы двигаться дальше.',
      compact: '3D-пространство уменьшено. Можно продолжить чтение.'
    }
  };

  const particleCount = 200;
  const particlePalette = [
    [0.44, 0.78, 0.86],
    [0.55, 0.63, 0.72],
    [0.72, 0.79, 0.84]
  ];
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particleCount * 3);
  const particlesColors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlesPositions[i] = (Math.random() - 0.5) * 200;
    particlesPositions[i + 1] = (Math.random() - 0.5) * 200;
    particlesPositions[i + 2] = (Math.random() - 0.5) * 200;

    const colorSet = particlePalette[Math.floor(Math.random() * particlePalette.length)];
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
    color: 0x1d2b34,
    metalness: 0.38,
    roughness: 0.62,
    emissive: 0x000000,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  // WebGL line width is mostly ignored across browsers; stack edge shells
  // slightly outside the mesh. Keep them soft so they don't fight hero text.
  const edges = new THREE.EdgesGeometry(geometry, 12);
  const edgeLayers = [
    { color: 0x8ebcc8, opacity: 0.72, scale: 1.002 },
    { color: 0x6fa8b6, opacity: 0.48, scale: 1.008 },
    { color: 0x548a98, opacity: 0.28, scale: 1.016 },
    { color: 0x3f6f7b, opacity: 0.16, scale: 1.024 }
  ];
  edgeLayers.forEach(({ color, opacity, scale }) => {
    const wireMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: true,
      depthWrite: false
    });
    const wireframe = new THREE.LineSegments(edges, wireMaterial);
    wireframe.renderOrder = 2;
    wireframe.scale.setScalar(scale);
    mesh.add(wireframe);
  });
  scene.add(mesh);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85);
  directionalLight.position.set(5, 6, 10);
  scene.add(directionalLight);

  let mouseX = 0;
  let mouseY = 0;
  let interactionEnabled = false;
  let dragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let pointerMoved = false;
  let pinchDistance = 0;
  const activePointers = new Map();
  let theta = 0.8;
  let phi = 1.1;
  let radius = 30;
  let targetRotationY = 0;
  let bounceStartedAt = 0;
  let particleKick = 0;
  let lastSurfaceTapAt = 0;
  let interactionSurface = null;
  let immersiveSection = null;
  let statusRegion = null;
  let continueButton = null;
  let continueTarget = null;
  let continueScrollTimer = 0;
  let immersiveObserver = null;
  let returnToThreeDButton = null;
  let threeDMode = 'idle';
  let lastRenderWidth = window.innerWidth;
  let lastRenderHeight = window.innerHeight;

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

  document.addEventListener('mousemove', (event) => {
    if (!interactionEnabled && threeDMode !== 'compact') {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    }
  });

  function createClickEffect(x, y) {
    const effect = document.createElement('div');
    effect.className = 'click-ripple';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;

    document.body.appendChild(effect);
    window.setTimeout(() => effect.remove(), 600);
  }

  function resetThreeDView() {
    theta = 0.8;
    phi = 1.1;
    radius = 30;
    bounceStartedAt = 0;
    particleKick = 0;
    lastSurfaceTapAt = 0;
    updateCameraFromSpherical();
  }

  function adjustZoom(direction, intensity = 1) {
    const safeIntensity = Math.max(0.2, Math.min(1.5, intensity));
    radius *= Math.exp((direction > 0 ? 1 : -1) * 0.075 * safeIntensity);
    radius = Math.max(12, Math.min(60, radius));
    updateCameraFromSpherical();
  }

  function triggerBounce() {
    flashMesh();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    bounceStartedAt = performance.now();
    particleKick = 0.018;
  }

  function resizeRendererToContainer() {
    const width = Math.max(1, Math.round(bgDiv.clientWidth || window.innerWidth));
    const height = Math.max(1, Math.round(bgDiv.clientHeight || window.innerHeight));
    if (width === lastRenderWidth && height === lastRenderHeight) return;
    lastRenderWidth = width;
    lastRenderHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    updateCameraFromSpherical();
  }

  function flashMesh() {
    mesh.material.color.setHex(0x6fc7db);
    if (mesh.material.emissive) mesh.material.emissive.setHex(0x06222b);
    window.setTimeout(() => {
      mesh.material.color.setHex(0x2b3d48);
      if (mesh.material.emissive) mesh.material.emissive.setHex(0x000000);
    }, 250);
  }

  function currentLocale() {
    return document.querySelector('.site-header')?.dataset.locale
      || document.documentElement.lang?.split('-')[0]
      || 'it';
  }

  function currentExperienceCopy() {
    const locale = currentLocale();
    return immersiveExperienceCopy[locale] || immersiveExperienceCopy.it;
  }

  function setExperienceMode(mode, options = {}) {
    const copy = currentExperienceCopy();
    threeDMode = mode;
    interactionEnabled = mode === 'explore';
    dragging = false;
    activePointers.clear();
    pinchDistance = 0;
    interactionSurface?.classList.remove('is-dragging');
    document.body.classList.toggle('three-d-explore', mode === 'explore');
    document.body.classList.toggle('three-d-compact', mode === 'compact');
    document.body.classList.toggle('three-d-locked', mode === 'explore');
    document.documentElement.classList.toggle('three-d-locked', mode === 'explore');
    immersiveSection?.classList.toggle('is-exploring', mode === 'explore');
    immersiveSection?.classList.toggle('is-compact', mode === 'compact');
    if (continueButton) {
      continueButton.hidden = mode !== 'explore';
      continueButton.setAttribute('aria-hidden', mode === 'explore' ? 'false' : 'true');
      continueButton.tabIndex = mode === 'explore' ? 0 : -1;
    }
    if (returnToThreeDButton) {
      returnToThreeDButton.hidden = mode !== 'compact';
    }

    if (statusRegion) {
      statusRegion.textContent = mode === 'explore'
        ? copy.active
        : mode === 'compact'
          ? copy.compact
          : '';
    }

    window.requestAnimationFrame(() => {
      resizeRendererToContainer();
      if (mode === 'explore' && options.focus !== false) {
        interactionSurface?.focus({ preventScroll: true });
      }
    });
  }

  function enterImmersiveExperience() {
    if (!immersiveSection || threeDMode !== 'idle') return;
    window.clearTimeout(continueScrollTimer);
    continueScrollTimer = 0;
    immersiveSection.scrollIntoView({ behavior: 'auto', block: 'start' });
    setExperienceMode('explore');
  }

  function leaveImmersiveExperience() {
    if (threeDMode !== 'explore') return;
    setExperienceMode('compact', { focus: false });
    immersiveObserver?.disconnect();

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.clearTimeout(continueScrollTimer);
    continueScrollTimer = window.setTimeout(() => {
      continueScrollTimer = 0;
      continueTarget?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      continueTarget?.focus?.({ preventScroll: true });
    }, reducedMotion ? 0 : 320);
  }

  function reopenImmersiveExperience() {
    if (threeDMode !== 'compact') return;
    window.clearTimeout(continueScrollTimer);
    continueScrollTimer = 0;
    document.activeElement?.blur?.();
    immersiveSection?.classList.add('is-reopening');
    setExperienceMode('idle', { focus: false });
    void immersiveSection?.offsetHeight;
    enterImmersiveExperience();
    window.requestAnimationFrame(() => immersiveSection?.classList.remove('is-reopening'));
  }

  function buildImmersiveExperience() {
    const main = document.querySelector('main');
    if (!main || !document.body.classList.contains('home-page')) return;

    const copy = currentExperienceCopy();
    const section = document.createElement('section');
    section.className = 'end-experience';
    section.id = 'ambiente-3d';
    section.setAttribute('aria-label', copy.eyebrow);
    section.innerHTML = `
      <div class="three-d-surface" role="group" tabindex="0" aria-label="${copy.surfaceLabel}">
        <div class="end-experience__prompt">
          <span class="kicker">${copy.eyebrow}</span>
          <ul class="end-experience__legend" aria-label="${copy.legendLabel}">
            <li><span aria-hidden="true">↔</span>${copy.rotateAction}</li>
            <li><span aria-hidden="true">±</span>${copy.zoomAction}</li>
            <li><span aria-hidden="true">●</span>${copy.bounceAction}</li>
            <li><span aria-hidden="true">↺</span>${copy.resetAction}</li>
          </ul>
        </div>
        <button class="end-experience__continue" type="button">
          <span>${copy.continueLabel}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M3.5 5.5h5.25A3.25 3.25 0 0 1 12 8.75V20a4.25 4.25 0 0 0-4.25-4.25H3.5V5.5Z"></path>
            <path d="M20.5 5.5h-5.25A3.25 3.25 0 0 0 12 8.75V20a4.25 4.25 0 0 1 4.25-4.25h4.25V5.5Z"></path>
          </svg>
        </button>
      </div>
      <p class="sr-only end-experience__status" role="status" aria-live="polite"></p>
    `;

    continueTarget = main.querySelector('.section[aria-labelledby="contact-title"]');
    if (continueTarget) {
      continueTarget.insertAdjacentElement('beforebegin', section);
    } else {
      main.insertAdjacentElement('beforeend', section);
      continueTarget = document.querySelector('footer');
    }
    continueTarget?.setAttribute('tabindex', '-1');

    immersiveSection = section;
    statusRegion = section.querySelector('.end-experience__status');
    interactionSurface = section.querySelector('.three-d-surface');
    continueButton = section.querySelector('.end-experience__continue');
    continueButton.hidden = true;
    continueButton.setAttribute('aria-hidden', 'true');
    continueButton.tabIndex = -1;
    continueButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      leaveImmersiveExperience();
    });

    returnToThreeDButton = document.createElement('button');
    returnToThreeDButton.className = 'three-d-return';
    returnToThreeDButton.type = 'button';
    returnToThreeDButton.hidden = true;
    returnToThreeDButton.setAttribute('aria-label', copy.returnLabel);
    returnToThreeDButton.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="m12 3 7.5 4.3v9.4L12 21l-7.5-4.3V7.3L12 3Z"></path>
        <path d="m4.5 7.3 7.5 4.4 7.5-4.4M12 11.7V21"></path>
      </svg>
      <span>${copy.returnLabel}</span>
    `;
    returnToThreeDButton.addEventListener('click', reopenImmersiveExperience);
    document.body.appendChild(returnToThreeDButton);

    document.addEventListener('keydown', (event) => {
      if (threeDMode !== 'explore') return;
      if (event.key !== 'Escape') return;
      event.preventDefault();
      leaveImmersiveExperience();
    });

    interactionSurface.addEventListener('pointerdown', (event) => {
      if (!interactionEnabled) return;
      if (event.target.closest('button')) return;
      if (activePointers.size === 0) pointerMoved = false;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      dragging = activePointers.size === 1;
      if (activePointers.size === 2) {
        const [first, second] = [...activePointers.values()];
        pinchDistance = Math.hypot(second.x - first.x, second.y - first.y);
        dragging = false;
      }
      interactionSurface.setPointerCapture?.(event.pointerId);
      interactionSurface.classList.add('is-dragging');
    });
    interactionSurface.addEventListener('pointermove', (event) => {
      if (!interactionEnabled || !activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (activePointers.size >= 2) {
        const [first, second] = [...activePointers.values()];
        const nextPinchDistance = Math.hypot(second.x - first.x, second.y - first.y);
        if (pinchDistance > 0 && nextPinchDistance > 0) {
          radius *= pinchDistance / nextPinchDistance;
          radius = Math.max(12, Math.min(60, radius));
          updateCameraFromSpherical();
        }
        pinchDistance = nextPinchDistance;
        pointerMoved = true;
        return;
      }

      if (!dragging) return;
      const deltaX = event.clientX - lastMouseX;
      const deltaY = event.clientY - lastMouseY;
      if (Math.hypot(deltaX, deltaY) > 2) pointerMoved = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      theta -= deltaX * 0.006;
      phi -= deltaY * 0.006;
      phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi));
      updateCameraFromSpherical();
    });
    const stopDragging = (event) => {
      activePointers.delete(event.pointerId);
      pinchDistance = 0;
      if (activePointers.size === 1) {
        const [remaining] = activePointers.values();
        lastMouseX = remaining.x;
        lastMouseY = remaining.y;
        dragging = true;
        return;
      }
      dragging = false;
      if (activePointers.size === 0) interactionSurface.classList.remove('is-dragging');
    };
    interactionSurface.addEventListener('pointerup', stopDragging);
    interactionSurface.addEventListener('pointercancel', stopDragging);
    interactionSurface.addEventListener('wheel', (event) => {
      if (!interactionEnabled) return;
      event.preventDefault();
      const intensity = Math.max(0.25, Math.min(1.5, Math.abs(event.deltaY) / 90));
      adjustZoom(event.deltaY > 0 ? 1 : -1, intensity);
    }, { passive: false });
    interactionSurface.addEventListener('dblclick', resetThreeDView);
    interactionSurface.addEventListener('click', (event) => {
      if (!interactionEnabled || dragging || event.target.closest('button')) return;
      if (pointerMoved) {
        lastSurfaceTapAt = 0;
        return;
      }
      const tapTime = performance.now();
      if (tapTime - lastSurfaceTapAt < 320) {
        lastSurfaceTapAt = 0;
        resetThreeDView();
        return;
      }
      lastSurfaceTapAt = tapTime;
      triggerBounce();
      createClickEffect(event.clientX, event.clientY);
    });
    interactionSurface.addEventListener('keydown', (event) => {
      if (!interactionEnabled) return;
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === continueButton ? interactionSurface : continueButton)
          ?.focus({ preventScroll: true });
        return;
      }
      if (event.target === continueButton && (event.key === 'Enter' || event.key === ' ')) {
        return;
      }
      const keyActions = {
        ArrowLeft: () => { theta += 0.12; },
        ArrowRight: () => { theta -= 0.12; },
        ArrowUp: () => { phi = Math.max(0.15, phi - 0.12); },
        ArrowDown: () => { phi = Math.min(Math.PI - 0.15, phi + 0.12); },
        '+': () => adjustZoom(-1),
        '=': () => adjustZoom(-1),
        '-': () => adjustZoom(1),
        '0': resetThreeDView,
        ' ': triggerBounce,
        Enter: triggerBounce
      };
      if (!keyActions[event.key]) {
        if (['PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
        }
        return;
      }
      event.preventDefault();
      keyActions[event.key]();
      updateCameraFromSpherical();
    });

    interactionSurface.addEventListener('focus', enterImmersiveExperience);

    if ('IntersectionObserver' in window) {
      immersiveObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.42)) {
          enterImmersiveExperience();
        }
      }, {
        threshold: [0.42, 0.55, 0.7],
        rootMargin: '0px 0px -8% 0px'
      });
      immersiveObserver.observe(section);
    }

    if (window.location.hash === '#ambiente-3d') {
      window.requestAnimationFrame(enterImmersiveExperience);
    }
  }

  if ('ResizeObserver' in window) {
    const rendererResizeObserver = new ResizeObserver(resizeRendererToContainer);
    rendererResizeObserver.observe(bgDiv);
  } else {
    bgDiv.addEventListener('transitionend', resizeRendererToContainer);
  }

  updateCameraFromSpherical();

  function animate(timestamp) {
    requestAnimationFrame(animate);
    const frameTime = timestamp || performance.now();
    const scrollY = window.scrollY || window.pageYOffset;
    const docH = document.documentElement.scrollHeight;
    const windowH = window.innerHeight;
    const maxScroll = Math.max(docH - windowH, 1);
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    // Landing is close enough to feel immersive, but still shows the edges;
    // scrolling eases out to the readable silhouette of the 3D pause.
    const isMobile = window.innerWidth < 700;
    let baseScale = isMobile
      ? 4.55 - (scrollProgress * 2.55)
      : 4.35 - (scrollProgress * 2.15);
    baseScale = Math.max(baseScale, isMobile ? 1.7 : 2.0);
    if (threeDMode === 'explore') baseScale = isMobile ? 2.35 : 2.2;
    if (threeDMode === 'compact') baseScale = 0.95;
    particleKick *= 0.94;
    particles.rotation.x += 0.001 + particleKick * 0.35;
    particles.rotation.y += 0.002 + particleKick;
    targetRotationY = interactionEnabled || threeDMode === 'compact' ? 0 : mouseX * 0.5;
    mesh.rotation.y += (targetRotationY - mesh.rotation.y) * 0.05;
    mesh.rotation.x += (mouseY * 0.5 - mesh.rotation.x) * 0.05;
    mesh.rotation.z += 0.0045;

    let bounceY = 0;
    let squash = 0;
    if (bounceStartedAt) {
      const progress = Math.min((frameTime - bounceStartedAt) / 1100, 1);
      const envelope = Math.pow(1 - progress, 1.25);
      const hop = Math.abs(Math.sin(progress * Math.PI * 3));
      bounceY = hop * 3.4 * envelope;
      squash = (1 - hop) * 0.1 * envelope;
      if (progress >= 1) bounceStartedAt = 0;
    }

    mesh.scale.set(
      baseScale * (1 + squash),
      baseScale * (1 - squash * 1.35),
      baseScale * (1 + squash)
    );
    mesh.position.set(0, bounceY, 0);
    renderer.render(scene, camera);
    if (!hasFadedIn) {
      renderer.domElement.classList.add('is-visible');
      hasFadedIn = true;
    }
  }

  window.addEventListener('resize', resizeRendererToContainer);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildImmersiveExperience();
      animate();
    }, { once: true });
  } else {
    buildImmersiveExperience();
    animate();
  }

})();
