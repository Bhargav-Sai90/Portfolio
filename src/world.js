import * as THREE from 'three';

// Procedural game objects keep the scene independent of external model downloads.
export function createWorld(canvas, { motion = true, mood = 'mint' } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    document.documentElement.dataset.webgl = 'unavailable';
    return { setMotion() {}, setMood() {}, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 60);
  camera.position.z = 12;
  const objects = new THREE.Group();
  scene.add(objects);

  scene.add(new THREE.HemisphereLight(0xb8ffe0, 0x14231b, 2.2));
  const key = new THREE.DirectionalLight(0xd4ffed, 4);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x65f5ce, 65, 25, 2);
  rim.position.set(4, 2, 3);
  scene.add(rim);
  const fill = new THREE.PointLight(0x6e91d9, 45, 25, 2);
  fill.position.set(-5, -2, 4);
  scene.add(fill);
  const mint = new THREE.MeshStandardMaterial({ color: 0x3c967f, metalness: .55, roughness: .28 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x173c31, metalness: .4, roughness: .38 });
  const luminous = new THREE.MeshStandardMaterial({ color: 0x8effd4, emissive: 0x3bac84, emissiveIntensity: .4, metalness: .35, roughness: .25 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x071712, roughness: .7 });
  const silver = new THREE.MeshStandardMaterial({ color: 0x92bba6, roughness: .25, metalness: .75 });
  const palettes = { mint: [0x65f5ce, 0x3c967f, 0x6e91d9], violet: [0xb7a0ff, 0x7858b2, 0x58cbbc], amber: [0xffc783, 0xb98946, 0x62aeba] };
  const targetLight = new THREE.Color();
  const targetSurface = new THREE.Color();
  const targetFill = new THREE.Color();
  const targetEmission = new THREE.Color();

  function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }
  function roundedShape(width, height, radius) {
    const x = -width / 2, y = -height / 2;
    const s = new THREE.Shape();
    s.moveTo(x + radius, y);
    s.lineTo(x + width - radius, y);
    s.quadraticCurveTo(x + width, y, x + width, y + radius);
    s.lineTo(x + width, y + height - radius);
    s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    s.lineTo(x + radius, y + height);
    s.quadraticCurveTo(x, y + height, x, y + height - radius);
    s.lineTo(x, y + radius);
    s.quadraticCurveTo(x, y, x + radius, y);
    return s;
  }
  const controller = new THREE.Group();
  objects.add(controller);
  const body = new THREE.Shape();
  body.moveTo(-.65, .4);
  body.bezierCurveTo(-1, .4, -1.15, -.55, -.85, -.65);
  body.bezierCurveTo(-.58, -.8, -.35, -.25, -.2, -.25);
  body.lineTo(.2, -.25);
  body.bezierCurveTo(.35, -.25, .58, -.8, .85, -.65);
  body.bezierCurveTo(1.15, -.55, 1, .4, .65, .4);
  body.closePath();
  mesh(new THREE.ExtrudeGeometry(body, { depth: .24, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .1, bevelThickness: .1, curveSegments: 16 }), graphite, controller);
  mesh(new THREE.BoxGeometry(.4, .12, .08), dark, controller, -.53, .02, .38);
  mesh(new THREE.BoxGeometry(.12, .4, .08), dark, controller, -.53, .02, .39);
  [[.49, .15], [.65, -.02], [.33, -.02], [.49, -.19]].forEach(([x, y], i) => {
    const button = mesh(new THREE.CylinderGeometry(.07, .07, .06, 16), i % 2 ? silver : luminous, controller, x, y, .39);
    button.rotation.x = Math.PI / 2;
  });
  [-.22, .22].forEach(x => {
    const stick = mesh(new THREE.CylinderGeometry(.115, .13, .1, 20), dark, controller, x, -.12, .4);
    stick.rotation.x = Math.PI / 2;
  });
  mesh(new THREE.BoxGeometry(.13, .025, .035), luminous, controller, 0, .18, .37);

  const torus = new THREE.Group();
  objects.add(torus);
  mesh(new THREE.TorusGeometry(.65, .14, 16, 72), mint, torus);
  const orbit = mesh(new THREE.TorusGeometry(.94, .008, 6, 90), luminous, torus);
  orbit.rotation.x = .5;
  mesh(new THREE.SphereGeometry(.09, 16, 12), luminous, torus, .87, .25, .15);

  const code = new THREE.Group();
  objects.add(code);
  mesh(new THREE.ExtrudeGeometry(roundedShape(1.35, .95, .12), { depth: .1, bevelEnabled: true, bevelSize: .035, bevelThickness: .04, bevelSegments: 2, steps: 1 }), graphite, code);
  // Code brackets are physical bars, so the same lighting applies to every detail.
  for (const side of [-1, 1]) {
    for (const upper of [-1, 1]) {
      const bar = mesh(new THREE.BoxGeometry(.29, .045, .04), luminous, code, side * .35, upper * .09, .18);
      bar.rotation.z = side * upper * .7;
    }
  }
  const slash = mesh(new THREE.BoxGeometry(.04, .45, .04), silver, code, 0, 0, .18);
  slash.rotation.z = -.3;
  [-.48, -.35, -.22].forEach(x => mesh(new THREE.SphereGeometry(.023, 8, 6), luminous, code, x, .34, .18));

  const crystal = new THREE.Group();
  objects.add(crystal);
  mesh(new THREE.OctahedronGeometry(.57), mint, crystal);
  const crystalEdgesGeometry = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(.59));
  crystal.add(new THREE.LineSegments(crystalEdgesGeometry, new THREE.LineBasicMaterial({ color: 0x9af5cc, transparent: true, opacity: .35 })));
  const cube = new THREE.Group();
  objects.add(cube);
  mesh(new THREE.BoxGeometry(.43, .43, .43), graphite, cube);
  cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.45, .45, .45)), new THREE.LineBasicMaterial({ color: 0x65f5ce, transparent: true, opacity: .55 })));

  const arrangements = [
    { object: controller, x: -.78, y: .3, z: 0, scale: .83, rotation: [-.3, .28, -.28] },
    { object: torus, x: .77, y: .4, z: -1, scale: .9, rotation: [.48, -.45, .2] },
    { object: code, x: -.76, y: -.46, z: -.3, scale: .86, rotation: [.15, .35, .15] },
    { object: crystal, x: .78, y: -.5, z: 0, scale: 1, rotation: [.2, .4, -.2] },
    { object: cube, x: -.42, y: .72, z: -1.5, scale: .7, rotation: [.5, .5, .2] },
  ];

  // Deterministic stars avoid layout-to-layout randomness while debugging.
  let seed = 37;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const points = [];
  for (let i = 0; i < 250; i++) points.push((random() - .5) * 34, (random() - .5) * 22, -3 - random() * 12);
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xb1dcca, size: .025, transparent: true, opacity: .55, depthWrite: false }));
  scene.add(stars);

  let enabled = motion;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let disposed = false;
  let lost = false;
  let pointerX = 0, pointerY = 0;
  let easedX = 0, easedY = 0;
  let openingHeight = 1;
  let halfWidth = 1, halfHeight = 1;
  let progress = window.scrollY;
  function setMood(value) {
    const palette = palettes[value] || palettes.mint;
    targetLight.setHex(palette[0]);
    targetSurface.setHex(palette[1]);
    targetFill.setHex(palette[2]);
    targetEmission.copy(targetLight).multiplyScalar(.4);
    if (!enabled) {
      rim.color.copy(targetLight); mint.color.copy(targetSurface);
      luminous.color.copy(targetLight); luminous.emissive.copy(targetEmission);
      fill.color.copy(targetFill);
      render();
    }
  }
  function measure() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfWidth = halfHeight * camera.aspect;
    openingHeight = document.querySelector('.hero').offsetHeight;
    render();
  }
  function render(delta = 0) {
    if (lost || disposed) return;
    const mobile = window.innerWidth < 700;
    const opening = THREE.MathUtils.clamp(progress / openingHeight, 0, 1);
    // The objects recede into the margins as the projects take focus.
    canvas.style.opacity = String(1 - opening * .8);
    if (enabled) elapsed += Math.min(delta, .05);
    easedX += ((enabled ? pointerX : 0) - easedX) * .07;
    easedY += ((enabled ? pointerY : 0) - easedY) * .07;
    const poseOpening = enabled ? opening : 0;
    arrangements.forEach((item, i) => {
      const { object, x, y, z, scale, rotation } = item;
      const side = mobile ? Math.sign(x) * .95 : x;
      object.position.set(side * halfWidth + easedX * .2, y * halfHeight + Math.sin(elapsed * .45 + i * 1.7) * .09 + poseOpening * (i % 2 ? 1 : -1), z - poseOpening * 1.5);
      object.scale.setScalar(scale * (mobile ? .42 : Math.min(1, window.innerWidth / 1250)));
      object.rotation.set(rotation[0] + Math.sin(elapsed * .22 + i) * .13 + easedY * .12, rotation[1] + elapsed * (i === 3 ? .15 : .035) + easedX * .2, rotation[2] + Math.sin(elapsed * .3 + i) * .08);
    });
    rim.color.lerp(targetLight, .06);
    mint.color.lerp(targetSurface, .06);
    luminous.color.lerp(targetLight, .06);
    luminous.emissive.lerp(targetEmission, .06);
    fill.color.lerp(targetFill, .06);
    rim.position.x = 4 + easedX * 2;
    rim.position.y = 2 - easedY;
    stars.rotation.z = elapsed * .002;
    renderer.render(scene, camera);
  }
  function tick(time) {
    frame = 0;
    if (!enabled || document.hidden || lost || disposed) return;
    if (time - previousTime >= 30) {
      progress += (window.scrollY - progress) * .12;
      render((time - previousTime) / 1000);
      previousTime = time;
    }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame);
    previousTime = performance.now();
    if (enabled && !document.hidden && !lost && !disposed) frame = requestAnimationFrame(tick);
    else render();
  }
  function onPointer(event) { pointerX = event.clientX / window.innerWidth - .5; pointerY = event.clientY / window.innerHeight - .5; }
  function onScroll() { if (!enabled) { progress = window.scrollY; render(); } }
  function onLost(event) { event.preventDefault(); lost = true; cancelAnimationFrame(frame); document.documentElement.dataset.webgl = 'unavailable'; }
  function onRestored() { lost = false; document.documentElement.dataset.webgl = 'ready'; start(); }
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', start);
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(document.querySelector('.hero'));
  setMood(mood);
  rim.color.copy(targetLight); mint.color.copy(targetSurface); fill.color.copy(targetFill);
  measure();
  document.documentElement.dataset.webgl = 'ready';
  start();
  return {
    setMood,
    setMotion(value) { enabled = value; progress = window.scrollY; start(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', start);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      renderer.dispose();
    },
  };
}
