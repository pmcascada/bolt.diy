/* Protocolo NEXUS — motor do jogo na primeira pessoa (Three.js).
   O mundo é gerado em código (salas, corredores, portas, terminais, drones), sem modelos externos.
   As portas abrem com códigos descobertos por SQL ou quando o estado da base de dados da sala o permite. */
import * as THREE from 'three';
import { EffectComposer } from '../vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/postprocessing/OutputPass.js';

const ROOM_W = 14, ROOM_D = 14, ROOM_H = 5, CORR_L = 6, CORR_W = 3.2, SPACING = ROOM_D + CORR_L;
const EYE = 1.65, RADIUS = 0.35, WALK = 3.6, RUN = 6.2, DETECT = 2.6, EMP_TIME = 8;
const PALETTE = [0x22d3ee, 0xf59e0b, 0xa78bfa, 0x34d399, 0xf43f5e];

/**
 * Arranca o jogo dentro de `container`.
 * opts: { levels, story, startRoom, doneRooms: Set, quality: 'high'|'low', sensitivity,
 *         ui: { esc, hl, table, sqlError }, onRoomDone(id, info), onFinish(), onExit() }
 */
export function startGame(container, opts) {
  const { levels, story, ui } = opts;
  const esc = ui.esc;
  let quality = opts.quality || 'high';
  let sensitivity = opts.sensitivity || 1;

  /* ---------- DOM: canvas e interface ---------- */
  container.innerHTML = `
    <canvas class="gx-canvas"></canvas>
    <div class="gx-hud">
      <div class="gx-obj"><div class="gx-room"></div><div class="gx-skill"></div><div class="gx-objtext"></div></div>
      <div class="gx-top"><span class="gx-progress"></span><span class="gx-emp" title="Pulsos EMP: imobilizam os drones durante ${EMP_TIME} s"><span class="gx-key">Q</span> EMP <b>0</b><i></i></span><span class="gx-key">Esc</span> menu</div>
      <div class="gx-cross"></div>
      <div class="gx-prompt" hidden></div>
      <div class="gx-lock" hidden>Clique no ecrã para controlar a câmara com o rato</div>
      <div class="gx-log"></div>
    </div>
    <div class="gx-flash"></div>
    <div class="gx-panel" data-p="terminal" hidden></div>
    <div class="gx-panel" data-p="keypad" hidden></div>
    <div class="gx-panel gx-menu" data-p="menu" hidden></div>
    <div class="gx-panel gx-story" data-p="story" hidden></div>`;
  const $ = (s) => container.querySelector(s);
  const canvas = $('.gx-canvas');

  /* ---------- renderer, cena e câmara ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050b);
  scene.fog = new THREE.FogExp2(0x03050b, 0.05);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 120);
  const yaw = new THREE.Object3D(); const pitch = new THREE.Object3D();
  yaw.add(pitch); pitch.add(camera); scene.add(yaw);
  scene.add(new THREE.HemisphereLight(0x6f8fe6, 0x10121c, 1.1));
  scene.add(new THREE.AmbientLight(0x26324f, 1.0));

  let composer = null;
  function setupQuality() {
    renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 1.75) : 1);
    if (quality === 'high') {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 0.3));
      composer.addPass(new OutputPass());
    } else { if (composer) composer.dispose(); composer = null; }
    resize();
  }
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
  }

  /* ---------- texturas geradas ---------- */
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    t.anisotropy = 4; return t;
  }
  const floorTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#0a0e18'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#18233a'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
    g.strokeStyle = '#111a2c'; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, [ROOM_W / 2, ROOM_D / 2]);
  const wallTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#141d33'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b2742'; g.fillRect(8, 8, w - 16, h * 0.55); g.fillRect(8, h * 0.62, w - 16, h * 0.3);
    g.strokeStyle = '#2b3d63'; g.lineWidth = 2; g.strokeRect(8, 8, w - 16, h * 0.55); g.strokeRect(8, h * 0.62, w - 16, h * 0.3);
    g.fillStyle = '#26365a'; for (let i = 0; i < 4; i++) g.fillRect(20 + i * 12, h * 0.66, 6, 6);
  }, [3, 1]);
  const mat = {
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.55 }),
    wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.3 }),
    ceil: new THREE.MeshStandardMaterial({ color: 0x080b14, roughness: 0.9, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.35, metalness: 0.85 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18 }),
  };
  const glow = (color, k = 2.2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k });

  /* ---------- mundo ---------- */
  const world = new THREE.Group(); scene.add(world);
  const walkable = []; // retângulos onde o jogador pode andar: {x1,x2,z1,z2, door?}
  const solids = []; // objetos que bloqueiam a passagem (caixas, mesas, cápsulas…)
  const solid = (x, z, w, d) => solids.push({ x1: x - w / 2 - RADIUS, x2: x + w / 2 + RADIUS, z1: z - d / 2 - RADIUS, z2: z + d / 2 + RADIUS });
  const interactables = []; // {pos: Vector3, kind, room, label}
  const rooms = []; // por sala: {cz, door, terminalScreen, drones, light, color}
  const box = (w, h, d, m, x, y, z, parent = world) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, seg = 24, parent = world) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; };

  function signTex(title, sub, color) {
    return canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#05070d'; g.fillRect(0, 0, w, h);
      g.strokeStyle = color; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = color; g.font = '700 46px "JetBrains Mono", monospace'; g.textBaseline = 'middle'; g.fillText(title, 26, 48);
      g.fillStyle = '#9fb3d9'; g.font = '500 26px "JetBrains Mono", monospace'; g.fillText(sub, 28, 96);
    });
  }
  const hex = (c) => '#' + new THREE.Color(c).getHexString();

  function buildRoom(i, lv) {
    const cz = -i * SPACING, color = PALETTE[i % PALETTE.length], half = ROOM_W / 2, hd = ROOM_D / 2;
    const g = new THREE.Group(); world.add(g);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), mat.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, cz); g.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), mat.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, ROOM_H, cz); g.add(ceil);
    // paredes (com abertura para a porta da frente e de trás)
    const wallSeg = (w, x, z, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, ROOM_H), mat.wall); m.position.set(x, ROOM_H / 2, z); m.rotation.y = rot; g.add(m); };
    wallSeg(ROOM_D, -half, cz, Math.PI / 2); wallSeg(ROOM_D, half, cz, -Math.PI / 2);
    const side = (ROOM_W - CORR_W) / 2;
    for (const [z, rot] of [[cz + hd, Math.PI], [cz - hd, 0]]) {
      wallSeg(side, -(CORR_W / 2 + side / 2), z, rot); wallSeg(side, CORR_W / 2 + side / 2, z, rot);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(CORR_W, ROOM_H - 3), mat.wall); top.position.set(0, 3 + (ROOM_H - 3) / 2, z); top.rotation.y = rot; g.add(top);
    }
    // faixas de luz e painéis no teto
    const strip = glow(color, 1.6);
    for (const x of [-half + 0.02, half - 0.02]) { box(0.04, 0.06, ROOM_D, strip, x, 0.12, cz, g); box(0.04, 0.04, ROOM_D, strip, x, ROOM_H - 0.3, cz, g); }
    for (const z of [cz - 3.5, cz + 3.5]) for (const x of [-3, 3]) box(2.2, 0.04, 0.6, glow(0xcfe6ff, 1.1), x, ROOM_H - 0.03, z, g);
    const light = new THREE.PointLight(color, 70, 26, 1.25); light.position.set(0, ROOM_H - 0.6, cz); g.add(light);
    const fill = new THREE.PointLight(0xbfd7ff, 18, 16, 1.4); fill.position.set(0, 2.2, cz + 3); g.add(fill);
    // placa com o nome da sala (por cima da porta de saída)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: signTex(`SALA ${i + 1}`, lv ? lv.name.toUpperCase() : 'SETOR DE ENERGIA', hex(color)) }));
    sign.position.set(0, 3.55, cz - hd + 0.03); g.add(sign);
    walkable.push({ x1: -half + RADIUS, x2: half - RADIUS, z1: cz - hd + RADIUS, z2: cz + hd - RADIUS });
    return { cz, color, g, light };
  }

  function buildCorridor(i) {
    const z2 = -i * SPACING - ROOM_D / 2, z1 = z2 - CORR_L, cz = (z1 + z2) / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(CORR_W, CORR_L), mat.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, cz); world.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(CORR_W, CORR_L), mat.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3, cz); world.add(ceil);
    for (const [x, rot] of [[-CORR_W / 2, Math.PI / 2], [CORR_W / 2, -Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(CORR_L, 3), mat.wall); w.position.set(x, 1.5, cz); w.rotation.y = rot; world.add(w); }
    for (let k = 0; k < 3; k++) box(CORR_W - 0.6, 0.03, 0.2, glow(0x7dd3fc, 1.3), 0, 2.98, z2 - 1 - k * 2);
    const rect = { x1: -CORR_W / 2 + RADIUS, x2: CORR_W / 2 - RADIUS, z1: z1 - 0.5, z2: z2 + 0.5, door: i };
    walkable.push(rect);
  }

  function buildDoor(i, room) {
    const z = room.cz - ROOM_D / 2;
    const frameM = glow(0xef4444, 2.4);
    const frame = new THREE.Group(); world.add(frame);
    box(0.18, 3.1, 0.3, mat.metal, -CORR_W / 2 + 0.05, 1.55, z, frame); box(0.18, 3.1, 0.3, mat.metal, CORR_W / 2 - 0.05, 1.55, z, frame); box(CORR_W, 0.2, 0.3, mat.metal, 0, 3.05, z, frame);
    const edge = box(CORR_W - 0.3, 0.05, 0.32, frameM, 0, 2.92, z, frame);
    const panelM = new THREE.MeshStandardMaterial({ color: 0x1a2438, roughness: 0.4, metalness: 0.8 });
    const left = box(CORR_W / 2 - 0.1, 2.9, 0.12, panelM, -CORR_W / 4, 1.45, z);
    const right = box(CORR_W / 2 - 0.1, 2.9, 0.12, panelM, CORR_W / 4, 1.45, z);
    for (const p of [left, right]) box(0.06, 2.4, 0.14, frameM, p === left ? CORR_W / 4 - 0.15 : -CORR_W / 4 + 0.15, 0, 0, p);
    return { z, left, right, frameM, edge, open: false, t: 0 };
  }

  // Ecrã de terminal com texto desenhado num canvas (atualizável).
  function terminalScreen(color) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 320;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const draw = (lines, ok) => {
      const g = c.getContext('2d');
      g.fillStyle = '#020611'; g.fillRect(0, 0, 512, 320);
      g.strokeStyle = ok ? '#34d399' : hex(color); g.lineWidth = 6; g.strokeRect(3, 3, 506, 314);
      g.font = '600 30px "JetBrains Mono", monospace'; g.fillStyle = ok ? '#34d399' : hex(color);
      lines.forEach((l, k) => g.fillText(l, 26, 56 + k * 46));
      g.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = 0; y < 320; y += 4) g.fillRect(0, y, 512, 1);
      tex.needsUpdate = true;
    };
    return { tex, draw };
  }

  function buildTerminal(i, room) {
    const x = -ROOM_W / 2 + 1.1, z = room.cz + 3.6;
    solid(x, z, 0.7, 1.6);
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; world.add(g);
    box(1.6, 0.9, 0.7, mat.dark, 0, 0.45, 0, g); box(1.6, 0.05, 0.75, glow(room.color, 1.2), 0, 0.92, 0, g);
    const scr = terminalScreen(room.color);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.85), new THREE.MeshBasicMaterial({ map: scr.tex }));
    screen.position.set(0, 1.45, -0.18); screen.rotation.x = -0.22; g.add(screen);
    box(1.45, 0.95, 0.06, mat.metal, 0, 1.45, -0.22, g).rotation.x = -0.22;
    scr.draw(['TERMINAL ÓRION', `SALA ${i + 1}`, '> [E] LIGAR_', ''], false);
    interactables.push({ pos: new THREE.Vector3(x, 1, z), kind: 'terminal', room: i, label: 'Usar o terminal' });
    return scr;
  }

  function buildKeypad(i, room) {
    const x = CORR_W / 2 + 0.6, z = room.cz - ROOM_D / 2 + 0.06;
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.65), new THREE.MeshBasicMaterial({ map: canvasTex(128, 192, (g) => {
      g.fillStyle = '#05070d'; g.fillRect(0, 0, 128, 192); g.strokeStyle = hex(room.color); g.lineWidth = 4; g.strokeRect(2, 2, 124, 188);
      g.fillStyle = hex(room.color); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.fillRect(16 + c * 36, 56 + r * 32, 24, 22);
      g.fillStyle = '#ef4444'; g.fillRect(16, 16, 96, 26);
    }) }));
    pad.position.set(x, 1.45, z); world.add(pad);
    interactables.push({ pos: new THREE.Vector3(x, 1, z), kind: 'keypad', room: i, label: 'Introduzir o código da porta' });
  }

  // Elementos decorativos próprios de cada sala.
  function decorate(i, room) {
    const cz = room.cz, c = room.color;
    if (i === 0) for (const [x, z] of [[3.8, cz + 3], [3.8, cz - 0.2], [-3.2, cz - 2.6], [3.8, cz - 3.4]]) {
      solid(x, z, 1.2, 1.2); cyl(0.62, 0.62, 0.25, mat.metal, x, 0.12, z); cyl(0.55, 0.55, 2.1, mat.glass, x, 1.3, z, 28); cyl(0.2, 0.2, 1.9, glow(0x67e8f9, 1.6), x, 1.3, z, 16); cyl(0.62, 0.62, 0.2, mat.metal, x, 2.42, z);
    }
    if (i === 1) {
      for (const y of [3.6, 4.1]) { cyl(0.12, 0.12, ROOM_D, mat.metal, ROOM_W / 2 - 0.4, y, cz).rotation.x = Math.PI / 2; cyl(0.1, 0.1, ROOM_D, mat.metal, -ROOM_W / 2 + 0.4, y + 0.2, cz).rotation.x = Math.PI / 2; }
      for (const [x, z, s] of [[4.5, cz - 3.5, 1.2], [5.2, cz - 2.2, 0.8], [4.6, cz + 2.5, 1], [-4.8, cz - 3.8, 0.9]]) { solid(x, z, s, s); box(s, s, s, mat.dark, x, s / 2, z); box(s + 0.02, 0.05, s + 0.02, glow(c, 1.2), x, s * 0.75, z); }
    }
    if (i === 2) for (let k = 0; k < 4; k++) for (const x of [-4.2, 4.2]) {
      const z = cz - 4.5 + k * 2.6; if (x < 0 && k === 3) continue;
      solid(x, z, 1.2, 0.9); box(1.2, 3, 0.9, mat.dark, x, 1.5, z);
      for (let r = 0; r < 8; r++) box(0.9, 0.05, 0.02, glow(r % 3 ? c : 0x34d399, 1.8), x, 0.5 + r * 0.32, z + (x < 0 ? 0.46 : -0.46));
    }
    if (i === 3) {
      for (const [x, z] of [[4.4, cz + 2.5], [-4.2, cz + 0.2]]) { solid(x, z, 2.4, 1.1); box(2.4, 0.9, 1.1, mat.dark, x, 0.45, z); box(2.4, 0.04, 1.1, glow(c, 1), x, 0.92, z); }
      const holo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.8 }));
      holo.position.set(4.4, 1.8, cz + 2.5); world.add(holo); spinners.push(holo);
    }
  }
  const spinners = [];

  function buildDrone(spec, room) {
    const g = new THREE.Group(); world.add(g);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), mat.metal); g.add(body);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 40), mat.dark); ring.rotation.x = Math.PI / 2; g.add(ring);
    const eyeM = glow(0xff2d55, 4); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), eyeM); eye.position.set(0, 0, 0.36); g.add(eye);
    const beamM = new THREE.MeshBasicMaterial({ color: 0xff2d55, transparent: true, opacity: 0.08, depthWrite: false });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(DETECT * 0.9, DETECT, 24, 1, true), beamM); beam.rotation.x = Math.PI / 2; beam.position.z = DETECT / 2 + 0.3; g.add(beam);
    const pts = spec.path.map(([x, d]) => new THREE.Vector3(x, 1.7, room.cz - d));
    g.position.copy(pts[0]);
    return { spec, g, eyeM, beam, pts, seg: 0, active: true, fall: 0 };
  }

  // Pulsos EMP: cápsulas que imobilizam os drones durante alguns segundos.
  const pickups = [];
  function buildPickup(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0.9, z); world.add(g);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), glow(0x38bdf8, 3.2)); g.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 32), glow(0x7dd3fc, 2.2)); g.add(ring);
    const base = cyl(0.3, 0.38, 0.12, mat.metal, x, 0.06, z); box(0.5, 0.02, 0.5, glow(0x38bdf8, 1.4), x, 0.13, z);
    pickups.push({ g, core, ring, base, x, z, taken: false });
  }

  const doneRooms = new Set(opts.doneRooms || []);
  levels.forEach((lv, i) => {
    const room = buildRoom(i, lv);
    room.lv = lv; room.door = buildDoor(i, room); room.screen = buildTerminal(i, room);
    if (lv.door.code) buildKeypad(i, room);
    room.drones = (lv.drones || []).map((d) => buildDrone(d, room));
    decorate(i, room); buildCorridor(i); rooms.push(room);
    if (i >= 1) buildPickup(i % 2 ? 5.4 : -5.4, room.cz - 5.2 + (i === 3 ? 9.6 : 0));
  });
  // sala final (fase 2 em preparação)
  const endRoom = buildRoom(levels.length, null);
  box(4, 2.2, 0.2, mat.dark, 0, 1.6, endRoom.cz - ROOM_D / 2 + 0.2);
  const endSign = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.95), new THREE.MeshBasicMaterial({ map: signTex('ACESSO RESTRITO', 'FASE 2 EM PREPARAÇÃO', '#f43f5e') }));
  endSign.position.set(0, 1.6, endRoom.cz - ROOM_D / 2 + 0.31); world.add(endSign);

  // poeira suspensa
  const dustGeo = new THREE.BufferGeometry(); const N = 700, dp = new Float32Array(N * 3);
  const zMin = endRoom.cz - ROOM_D / 2, zMax = ROOM_D / 2;
  for (let k = 0; k < N; k++) { dp[k * 3] = (Math.random() - 0.5) * ROOM_W; dp[k * 3 + 1] = Math.random() * ROOM_H; dp[k * 3 + 2] = zMin + Math.random() * (zMax - zMin); }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fc7ff, size: 0.03, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  /* ---------- bases de dados das salas ---------- */
  const A = window.alasql;
  function makeDb(lv) {
    const name = 'nx' + lv.id + Math.random().toString(36).slice(2, 8);
    A('CREATE DATABASE ' + name); const db = new A.Database(name);
    for (const [t, spec] of Object.entries(lv.tables)) {
      const types = spec.cols.map((c, k) => (typeof spec.rows[0][k] === 'number' ? 'INT' : 'VARCHAR(80)'));
      db.exec(`CREATE TABLE ${t} (${spec.cols.map((c, k) => `${c} ${types[k]}`).join(', ')})`);
      for (const r of spec.rows) { const o = {}; spec.cols.forEach((c, k) => (o[c] = r[k])); db.tables[t].data.push(o); }
    }
    return db;
  }
  const dbs = levels.map(makeDb);
  const resetDb = (i) => { dbs[i] = makeDb(levels[i]); };
  const runSql = (i, sql) => {
    const s = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/`/g, '').trim().replace(/;+\s*$/, '');
    if (!s) throw new Error('Escreva uma instrução SQL.');
    if (s.includes(';')) throw new Error('Execute uma instrução de cada vez.');
    return dbs[i].exec(s);
  };

  /* ---------- estado do jogador ---------- */
  const state = { room: Math.max(0, Math.min(opts.startRoom || 0, levels.length - 1)), hints: {}, rev: {}, entered: new Set(), finished: false, mode: 'story', emp: 0, frozenUntil: 0, now: 0 };
  function updateEmp() {
    const el = $('.gx-emp'); el.querySelector('b').textContent = state.emp;
    const left = Math.max(0, state.frozenUntil - state.now);
    el.classList.toggle('on', left > 0); el.classList.toggle('has', state.emp > 0);
    el.querySelector('i').style.width = left > 0 ? `${(left / EMP_TIME) * 100}%` : '0';
  }
  function useEmp() {
    if (!state.emp) { log('Não tem pulsos EMP. Procure as cápsulas azuis nas salas.', 'SISTEMA'); return; }
    if (state.frozenUntil > state.now) return;
    state.emp--; state.frozenUntil = state.now + EMP_TIME;
    flash('rgba(56,189,248,.35)'); log(`Pulso EMP ativado: drones imobilizados durante ${EMP_TIME} segundos.`, 'SISTEMA', 'ok'); updateEmp();
  }
  const keys = {};
  const vel = new THREE.Vector3();
  let bob = 0;
  // portas das salas anteriores à sala inicial ficam abertas
  rooms.forEach((r, i) => { if (i < state.room) openDoor(i, true); });
  function spawn(i) { yaw.position.set(0, EYE, rooms[i].cz + ROOM_D / 2 - 1.6); yaw.rotation.y = 0; pitch.rotation.x = 0; }
  spawn(state.room);

  function openDoor(i, instant) {
    const d = rooms[i].door; if (d.open) return; d.open = true;
    d.frameM.emissive.set(0x22c55e);
    if (instant) d.t = 1;
    rooms[i].screen.draw(['TERMINAL ÓRION', `SALA ${i + 1}`, 'ACESSO CONCEDIDO', '> PORTA ABERTA'], true);
  }
  const inRect = (x, z, r) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2 && (r.door === undefined || (rooms[r.door] && rooms[r.door].door.open) || r.door >= rooms.length);
  const canStand = (x, z) => walkable.some((r) => inRect(x, z, r)) && !solids.some((o) => x > o.x1 && x < o.x2 && z > o.z1 && z < o.z2);

  /* ---------- interface: mensagens e painéis ---------- */
  function log(text, who = 'SISTEMA', cls = '') {
    const el = document.createElement('div'); el.className = 'gx-msg ' + cls; el.innerHTML = `<b>${esc(who)}</b> <span></span>`;
    $('.gx-log').append(el);
    const span = el.querySelector('span'); let k = 0;
    const tick = () => { span.textContent = text.slice(0, k += 2); if (k < text.length) setTimeout(tick, 16); };
    tick();
    setTimeout(() => el.classList.add('out'), 9000); setTimeout(() => el.remove(), 9800);
    const all = container.querySelectorAll('.gx-msg'); if (all.length > 4) all[0].remove();
  }
  function flash(color) { const f = $('.gx-flash'); f.style.background = color; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  function updateHud() {
    const i = state.room, lv = levels[i];
    $('.gx-room').textContent = `Sala ${i + 1} · ${lv.name}`;
    $('.gx-skill').textContent = lv.skill;
    $('.gx-objtext').textContent = rooms[i].door.open ? 'Porta aberta. Siga para a sala seguinte.' : lv.objective;
    $('.gx-progress').textContent = `${[...doneRooms].length}/${levels.length} salas`;
  }
  let panel = null;
  function showPanel(name) {
    panel = name;
    container.querySelectorAll('.gx-panel').forEach((p) => (p.hidden = p.dataset.p !== name));
    if (name && document.pointerLockElement === canvas) document.exitPointerLock();
    Object.keys(keys).forEach((k) => (keys[k] = false));
    $('.gx-prompt').hidden = true; near = null;
  }
  function play() { showPanel(null); state.mode = 'play'; canvas.requestPointerLock(); }

  // Terminal SQL da sala atual.
  function openTerminal(i) {
    const lv = levels[i], p = $('[data-p="terminal"]');
    p.innerHTML = `<div class="gx-term">
      <div class="gx-th"><span>TERMINAL ÓRION · Sala ${i + 1} — ${esc(lv.name)}</span><button class="gx-x" data-a="close" title="Voltar ao jogo (Esc)">✕</button></div>
      <div class="gx-tb">
        <aside>
          <h4>Missão</h4><p>${esc(lv.objective)}</p>
          <h4>Tabelas</h4>${Object.entries(lv.tables).map(([t, s]) => `<div class="gx-tab"><b>${t}</b>(${s.cols.map((c) => `<button data-col="${c}">${c}</button>`).join(', ')})</div>`).join('')}
          <div class="gx-help"><button data-a="hint">Dica (−5 XP)</button><button data-a="sol">Ver solução (perde o XP)</button><button data-a="reset">Repor dados</button></div>
          <div class="gx-hints"></div>
        </aside>
        <section>
          <textarea class="gx-sql" spellcheck="false" placeholder="SELECT …   (Ctrl+Enter para executar)"></textarea>
          <div class="gx-run"><button data-a="run">▶ Executar</button><span>Ctrl + Enter · Esc para voltar ao jogo</span></div>
          <div class="gx-out"></div>
        </section>
      </div></div>`;
    showPanel('terminal'); state.mode = 'terminal';
    const ta = p.querySelector('.gx-sql'), out = p.querySelector('.gx-out'), hintsBox = p.querySelector('.gx-hints');
    ta.value = state.lastSql?.[i] || ''; setTimeout(() => ta.focus(), 30);
    const showHints = () => { const n = state.hints[i] || 0; hintsBox.innerHTML = lv.hints.slice(0, n).map((h) => `<p>💡 ${esc(h)}</p>`).join('') + (state.rev[i] ? `<p class="sol">Solução: <code>${esc(lv.solution)}</code></p>` : ''); };
    showHints();
    const run = () => {
      state.lastSql = state.lastSql || {}; state.lastSql[i] = ta.value;
      try {
        const res = runSql(i, ta.value);
        out.innerHTML = Array.isArray(res) ? ui.table(res) : `<div class="gx-ok">${res} linha(s) afetada(s).</div>`;
        if (lv.door.state) checkState(i, out);
      } catch (e) { out.innerHTML = `<div class="gx-err">⚠ ${esc(ui.sqlError(e))}</div>`; }
    };
    p.querySelector('[data-a="run"]').onclick = run;
    ta.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } if (e.key === 'Escape') { e.preventDefault(); play(); } e.stopPropagation(); };
    p.querySelector('[data-a="close"]').onclick = play;
    p.querySelector('[data-a="hint"]').onclick = () => { state.hints[i] = Math.min((state.hints[i] || 0) + 1, lv.hints.length); showHints(); };
    p.querySelector('[data-a="sol"]').onclick = () => { if (!state.rev[i] && !confirm('Ver a solução desta sala? Perde o XP da sala, mas pode continuar a missão.')) return; state.rev[i] = true; ta.value = lv.solution; showHints(); };
    p.querySelector('[data-a="reset"]').onclick = () => { resetDb(i); out.innerHTML = '<div class="gx-ok">Dados da sala repostos.</div>'; };
    p.querySelectorAll('[data-col]').forEach((b) => (b.onclick = () => { const a = ta.selectionStart; ta.value = ta.value.slice(0, a) + b.dataset.col + ta.value.slice(ta.selectionEnd); ta.focus(); ta.setSelectionRange(a + b.dataset.col.length, a + b.dataset.col.length); }));
  }

  function checkState(i, out) {
    const r = levels[i].door.state((sql) => dbs[i].exec(sql));
    if (r.alarm) { resetDb(i); flash('rgba(239,68,68,.45)'); log(r.alarm, 'ALARME', 'bad'); if (out) out.innerHTML += `<div class="gx-err">🚨 ${esc(r.alarm)}</div>`; return; }
    rooms[i].drones.forEach((d) => { const row = dbs[i].exec(`SELECT ativo FROM drones WHERE numero_serie = '${d.spec.serial}'`)[0]; d.active = !row || Number(row.ativo) !== 0; });
    if (r.open && !rooms[i].door.open) { if (out) out.innerHTML += `<div class="gx-ok">✔ ${esc(r.msg)}</div>`; complete(i); }
  }

  function openKeypad(i) {
    const p = $('[data-p="keypad"]');
    p.innerHTML = `<div class="gx-key-box"><div class="gx-th"><span>PAINEL DA PORTA · Sala ${i + 1}</span><button class="gx-x" data-a="close">✕</button></div>
      <p>Introduza o código de acesso.</p><input class="gx-code" maxlength="8" inputmode="numeric" autocomplete="off"><div class="gx-kmsg"></div>
      <button class="gx-go" data-a="ok">Confirmar</button></div>`;
    showPanel('keypad'); state.mode = 'keypad';
    const inp = p.querySelector('.gx-code'); setTimeout(() => inp.focus(), 30);
    const ok = () => {
      if (inp.value.trim() === levels[i].door.code) { play(); complete(i); }
      else { p.querySelector('.gx-kmsg').textContent = 'Código incorreto. A NEXUS registou a tentativa.'; inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.select(); }
    };
    p.querySelector('[data-a="ok"]').onclick = ok;
    inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') play(); e.stopPropagation(); };
    p.querySelector('[data-a="close"]').onclick = play;
  }

  function complete(i) {
    if (rooms[i].door.open) return;
    openDoor(i);
    flash('rgba(52,211,153,.25)');
    log(i === levels.length - 1 ? 'Saída do laboratório aberta. O corredor conduz ao setor de energia.' : `Porta da sala ${i + 1} aberta.`, 'SISTEMA', 'ok');
    const first = !doneRooms.has(levels[i].id); doneRooms.add(levels[i].id);
    if (opts.onRoomDone) opts.onRoomDone(levels[i].id, { hints: state.hints[i] || 0, rev: !!state.rev[i], first });
    updateHud();
  }

  function menu() {
    const p = $('[data-p="menu"]');
    p.innerHTML = `<div class="gx-menu-box"><h2>Pausa</h2>
      <button data-a="resume" class="gx-go">Continuar</button>
      <button data-a="term">Abrir o terminal desta sala</button>
      <button data-a="restart">Voltar à entrada da sala</button>
      <label>Qualidade gráfica <select data-a="q"><option value="high">Alta (efeitos de luz)</option><option value="low">Baixa (computadores mais lentos)</option></select></label>
      <label>Sensibilidade do rato <input type="range" min="0.3" max="2" step="0.1" data-a="sens"></label>
      <div class="gx-ctl"><b>Controlos</b>: W A S D ou setas — mover · rato — olhar · Shift — correr · E — usar · Q — pulso EMP · Esc — pausa</div>
      <button data-a="exit">Sair do jogo</button></div>`;
    showPanel('menu'); state.mode = 'menu';
    p.querySelector('[data-a="q"]').value = quality; p.querySelector('[data-a="sens"]').value = sensitivity;
    p.querySelector('[data-a="resume"]').onclick = play;
    p.querySelector('[data-a="term"]').onclick = () => openTerminal(state.room);
    p.querySelector('[data-a="restart"]').onclick = () => { spawn(state.room); play(); };
    p.querySelector('[data-a="q"]').onchange = (e) => { quality = e.target.value; setupQuality(); opts.onSettings && opts.onSettings({ quality, sensitivity }); };
    p.querySelector('[data-a="sens"]').oninput = (e) => { sensitivity = Number(e.target.value); opts.onSettings && opts.onSettings({ quality, sensitivity }); };
    p.querySelector('[data-a="exit"]').onclick = () => opts.onExit && opts.onExit();
  }

  function storyScreen(lines, title, button, after) {
    const p = $('[data-p="story"]');
    p.innerHTML = `<div class="gx-story-box"><div class="gx-tag">ESTAÇÃO ÓRION · REGISTO DE EMERGÊNCIA</div><h1>${esc(title)}</h1>${lines.map((l, k) => `<p style="animation-delay:${0.4 + k * 0.9}s">${esc(l)}</p>`).join('')}
      <div class="gx-ctl"><b>Controlos</b>: W A S D — mover · rato — olhar · Shift — correr · E — usar terminais e painéis · Q — pulso EMP (imobiliza os drones) · Esc — pausa</div>
      <button class="gx-go" data-a="go">${esc(button)}</button></div>`;
    showPanel('story'); state.mode = 'story';
    p.querySelector('[data-a="go"]').onclick = after;
  }

  /* ---------- eventos ---------- */
  const onKey = (down) => (e) => {
    if (state.mode !== 'play') return;
    keys[e.code] = down;
    if (down && e.code === 'KeyE' && near) { if (near.kind === 'terminal') openTerminal(near.room); else openKeypad(near.room); }
    if (down && e.code === 'KeyQ' && !e.repeat) useEmp();
  };
  const kd = onKey(true), ku = onKey(false);
  const onMouse = (e) => {
    if (document.pointerLockElement !== canvas || state.mode !== 'play') return;
    yaw.rotation.y -= e.movementX * 0.0022 * sensitivity;
    pitch.rotation.x = Math.max(-1.35, Math.min(1.35, pitch.rotation.x - e.movementY * 0.0022 * sensitivity));
  };
  const onLock = () => { if (document.pointerLockElement !== canvas && state.mode === 'play') menu(); };
  const onClick = () => { if (state.mode === 'play' && document.pointerLockElement !== canvas) canvas.requestPointerLock(); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  document.addEventListener('mousemove', onMouse); document.addEventListener('pointerlockchange', onLock);
  canvas.addEventListener('click', onClick);
  const ro = new ResizeObserver(resize); ro.observe(container);

  /* ---------- ciclo do jogo ---------- */
  let near = null, raf = 0, last = performance.now(), caughtAt = 0;
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), tmp = new THREE.Vector3();
  function step(dt, t) {
    // movimento
    if (state.mode === 'play') {
      const sp = keys.ShiftLeft || keys.ShiftRight ? RUN : WALK;
      fwd.set(-Math.sin(yaw.rotation.y), 0, -Math.cos(yaw.rotation.y)); right.set(-fwd.z, 0, fwd.x);
      tmp.set(0, 0, 0);
      if (keys.KeyW || keys.ArrowUp) tmp.add(fwd); if (keys.KeyS || keys.ArrowDown) tmp.sub(fwd);
      if (keys.KeyD || keys.ArrowRight) tmp.add(right); if (keys.KeyA || keys.ArrowLeft) tmp.sub(right);
      if (tmp.lengthSq()) tmp.normalize().multiplyScalar(sp);
      vel.lerp(tmp, Math.min(1, dt * 10));
      const p = yaw.position;
      const nx = p.x + vel.x * dt, nz = p.z + vel.z * dt;
      if (canStand(nx, p.z)) p.x = nx;
      if (canStand(p.x, nz)) p.z = nz;
      const moving = vel.lengthSq() > 0.5; bob += moving ? dt * (sp === RUN ? 13 : 9) : 0;
      p.y = EYE + (moving ? Math.sin(bob) * 0.035 : 0);
      // sala atual
      const ri = Math.round(-p.z / SPACING);
      if (ri >= 0 && ri < rooms.length && Math.abs(p.z - rooms[ri].cz) < ROOM_D / 2 && ri !== state.room) { state.room = ri; updateHud(); }
      if (ri >= 0 && ri < rooms.length && !state.entered.has(ri) && Math.abs(p.z - rooms[ri].cz) < ROOM_D / 2 - 1) { state.entered.add(ri); const nx = levels[ri].intro.startsWith('NEXUS:'); log(nx ? levels[ri].intro.replace(/^NEXUS:\s*/, '') : levels[ri].intro, nx ? 'NEXUS' : 'SISTEMA', nx ? 'nexus' : ''); }
      if (!state.finished && p.z < endRoom.cz + ROOM_D / 2 - 2) finish();
      for (const k of pickups) if (!k.taken && Math.hypot(k.x - p.x, k.z - p.z) < 0.9) {
        k.taken = true; k.g.visible = false; state.emp++; updateEmp();
        log(`Recolheu um pulso EMP. Prima Q para imobilizar os drones durante ${EMP_TIME} s.`, 'SISTEMA', 'ok');
      }
      // objeto próximo para interagir
      // objeto com que se pode interagir: até 2,6 m e mais ou menos à frente; encostado (≤ 1,3 m) basta estar ao lado
      near = null; let best = Infinity;
      for (const it of interactables) {
        if (it.kind === 'keypad' && rooms[it.room].door.open) continue;
        const d = Math.hypot(it.pos.x - p.x, it.pos.z - p.z);
        if (d > 2.6 || d >= best) continue;
        tmp.set(it.pos.x - p.x, 0, it.pos.z - p.z).normalize();
        if (d <= 1.3 || tmp.dot(fwd) > 0.2) { best = d; near = it; }
      }
      const pr = $('.gx-prompt');
      if (near) { pr.hidden = false; pr.innerHTML = `<span class="gx-key">E</span> ${esc(near.label)}`; } else pr.hidden = true;
    }
    // portas
    rooms.forEach((r) => { const d = r.door; if (d.open && d.t < 1) d.t = Math.min(1, d.t + dt * 1.2); const off = d.t * (CORR_W / 2 - 0.05); d.left.position.x = -CORR_W / 4 - off; d.right.position.x = CORR_W / 4 + off; });
    state.now = t;
    const frozen = t < state.frozenUntil;
    if (frozen || $('.gx-emp').classList.contains('on')) updateEmp();
    pickups.forEach((k) => { if (!k.taken) { k.g.rotation.y += dt * 1.6; k.ring.rotation.x = t * 1.2; k.g.position.y = 0.9 + Math.sin(t * 2 + k.x) * 0.08; } });
    // drones
    rooms.forEach((r, ri) => r.drones.forEach((d) => {
      if (d.active && frozen) {
        d.eyeM.emissive.set(0x38bdf8); d.beam.visible = false;
        d.g.position.y = 1.55 + Math.sin(t * 9) * 0.015; d.g.rotation.z = Math.sin(t * 13) * 0.05;
      } else if (d.active) {
        d.g.rotation.z = 0;
        const a = d.pts[d.seg], b = d.pts[(d.seg + 1) % d.pts.length];
        tmp.subVectors(b, d.g.position); tmp.y = 0;
        if (tmp.length() < 0.1) d.seg = (d.seg + 1) % d.pts.length; else { tmp.normalize(); d.g.position.addScaledVector(tmp, dt * 2.1); d.g.rotation.y = Math.atan2(tmp.x, tmp.z); }
        d.g.position.y = 1.7 + Math.sin(t * 2.5) * 0.12; d.fall = 0; void a;
        d.eyeM.emissive.set(0xff2d55); d.beam.visible = true;
        const pl = yaw.position;
        if (state.mode === 'play' && ri === state.room && Math.hypot(pl.x - d.g.position.x, pl.z - d.g.position.z) < DETECT && t - caughtAt > 2) {
          caughtAt = t; flash('rgba(239,68,68,.55)'); log(`Detetado pelo drone ${d.spec.serial}! A NEXUS enviou-o de volta à entrada da sala.`, 'NEXUS', 'nexus'); spawn(ri);
        }
      } else {
        d.beam.visible = false; d.eyeM.emissive.set(0x1f2937);
        d.fall = Math.min(1, d.fall + dt * 1.5); d.g.position.y = Math.max(0.45, 1.7 - d.fall * 1.3); d.g.rotation.z = d.fall * 0.6;
      }
    }));
    spinners.forEach((s) => { s.rotation.y += dt * 0.6; s.rotation.x += dt * 0.25; });
    $('.gx-lock').hidden = !(state.mode === 'play' && document.pointerLockElement !== canvas);
    rooms.forEach((r, i) => { r.light.intensity = 66 + Math.sin(t * 1.3 + i) * 4 + (r.door.open ? 0 : Math.max(0, Math.sin(t * 7 + i * 3)) * (i === state.room ? 0 : 8)); });
    dust.rotation.y = Math.sin(t * 0.05) * 0.02;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now; // tolera computadores lentos
    step(dt, now / 1000);
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  function finish() {
    state.finished = true;
    if (opts.onFinish) opts.onFinish();
    storyScreen(story.end, 'Missão — parte 1 concluída', 'Voltar à MySQL Academy', () => opts.onExit && opts.onExit());
  }

  /* ---------- arranque ---------- */
  setupQuality(); updateHud();
  raf = requestAnimationFrame(frame);
  if (state.room === 0 && !doneRooms.size) storyScreen(story.intro, story.title, 'Iniciar missão', () => { play(); });
  else storyScreen([`Regressa à sala ${state.room + 1}: ${levels[state.room].name}.`, levels[state.room].objective], story.title, 'Continuar missão', () => { play(); });

  return {
    // Diagnóstico (só usado nos testes automáticos, com ?nxdebug no endereço).
    debug: {
      teleport(i, x, dz, yawDeg = 0) { yaw.position.set(x, EYE, rooms[i].cz - dz); yaw.rotation.y = (yawDeg * Math.PI) / 180; pitch.rotation.x = 0; },
      info: () => ({ mode: state.mode, room: state.room, near: near && near.kind, emp: state.emp, frozen: state.now < state.frozenUntil, doors: rooms.map((r) => r.door.open), drones: rooms.map((r) => r.drones.map((d) => d.active)), pos: [yaw.position.x, yaw.position.z] }),
    },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      document.removeEventListener('mousemove', onMouse); document.removeEventListener('pointerlockchange', onLock);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
      if (composer) composer.dispose(); renderer.dispose(); container.innerHTML = '';
    },
  };
}
