/* Protocolo NEXUS — motor do jogo na primeira pessoa (Three.js).
   O mundo é gerado em código (salas, corredores, portas, terminais, drones), sem modelos externos.
   Cada sala tem duas zonas separadas por um campo de forças e um terminal em cada zona: as tarefas SQL
   desligam o campo de forças, abrem a porta e mudam a sala (luzes, drones, lasers).
   Há um tempo-limite por sala; quando acaba, a NEXUS ativa o bloqueio total (drones e lasers mais rápidos). */
import * as THREE from 'three';
import { EffectComposer } from '../vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/postprocessing/OutputPass.js';

const ROOM_W = 22, ROOM_D = 24, ROOM_H = 5.5, CORR_L = 7, CORR_W = 3.2, SPACING = ROOM_D + CORR_L;
const BAR = 2; // o campo de forças fica 2 m à frente do centro da sala (do lado da entrada)
const EYE = 1.65, RADIUS = 0.35, WALK = 3.8, RUN = 6.6, EMP_TIME = 8;
const TIME_BONUS = 45, CLOCK_STOP = 25, ALERT = 30; // ALERT: nos últimos 30 s entra o bloqueio total; a 0 s a missão termina // cápsulas de tempo: +45 s; cápsula de relógio parado: 25 s sem contar
const VIEW = 7.5, FOV = 0.62, CATCH = 1.25, PATROL = 2.2, CHASE = 3.6, GRACE = 2.5;
const CAM_RANGE = 11, CAM_FOV = 0.28;
const PALETTE = [0x22d3ee, 0xf59e0b, 0xa78bfa, 0x34d399, 0xfacc15, 0x818cf8];

/**
 * Arranca o jogo dentro de `container`.
 * opts: { levels (GAME.generate), story, startRoom, doneRooms, ranked, best, seed, quality, sensitivity, sound,
 *         ui: { esc, table, sqlError }, roomScore, onRoomDone(id, info), onRunEnd(run) → Promise<string>,
 *         loadBoard() → Promise<[{name, turma, score, rooms, time, runs}]>, me (nome do jogador),
 *         onSettings(s), onRestart(), onExit() }
 */
export function startGame(container, opts) {
  const { levels, story, ui } = opts;
  const esc = ui.esc, roomScore = opts.roomScore;
  let quality = opts.quality || 'high';
  let sensitivity = opts.sensitivity || 1;
  const rng = (() => { let a = (opts.seed || 1) ^ 0x5bd1e995; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const rnd = (lo, hi) => lo + rng() * (hi - lo);

  /* ---------- som (sintetizado com WebAudio, sem ficheiros) ---------- */
  const sfx = (() => {
    let ac = null, master = null, on = opts.sound !== false;
    const ctx = () => {
      if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); master = ac.createGain(); master.gain.value = 0.32; master.connect(ac.destination); }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    };
    function tone(f, d, type = 'sine', v = 0.3, f2 = 0, delay = 0) {
      if (!on) return; const a = ctx(); if (!a) return;
      const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
    }
    return {
      start: ctx, get on() { return on; }, set on(v) { on = v; },
      tick: (hi) => tone(hi ? 1400 : 1000, 0.07, 'square', 0.1),
      key: () => tone(900, 0.04, 'square', 0.06),
      ok: () => { tone(660, 0.16, 'triangle', 0.28); tone(880, 0.16, 'triangle', 0.28, 0, 0.12); tone(1320, 0.32, 'triangle', 0.28, 0, 0.24); },
      bad: () => tone(240, 0.35, 'sawtooth', 0.22, 110),
      caught: () => { tone(900, 0.55, 'sawtooth', 0.28, 90); tone(120, 0.6, 'square', 0.18); },
      alarm: () => { for (let k = 0; k < 4; k++) tone(k % 2 ? 620 : 880, 0.27, 'square', 0.14, 0, k * 0.3); },
      spot: () => { tone(1500, 0.08, 'square', 0.16); tone(1500, 0.08, 'square', 0.16, 0, 0.12); },
      emp: () => tone(180, 0.7, 'sine', 0.4, 1900),
      unlock: () => { tone(300, 0.5, 'sine', 0.3, 1100); tone(450, 0.5, 'triangle', 0.15, 1600, 0.05); },
      beat: () => { tone(70, 0.12, 'sine', 0.5); tone(60, 0.14, 'sine', 0.4, 0, 0.16); },
    };
  })();

  /* ---------- DOM: canvas e interface ---------- */
  container.innerHTML = `
    <canvas class="gx-canvas"></canvas>
    <div class="gx-vig"></div>
    <div class="gx-hud">
      <div class="gx-obj"><div class="gx-room"></div><div class="gx-skill"></div><div class="gx-tasks"></div><div class="gx-objtext"></div></div>
      <div class="gx-clock"><div class="gx-time">--:--</div><div class="gx-pts"><span>${opts.ranked ? 'PONTOS' : 'PONTOS · TREINO'}</span><b>0</b></div></div>
      <div class="gx-top"><span class="gx-progress"></span><span class="gx-emp" title="Pulsos EMP: imobilizam drones e câmaras durante ${EMP_TIME} s"><span class="gx-key">Q</span> EMP <b>0</b><i></i></span><span class="gx-key">Esc</span> menu</div>
      <div class="gx-alert" hidden>⚠ BLOQUEIO TOTAL — a sala fecha quando o tempo acabar</div>
      <div class="gx-cross"></div>
      <div class="gx-prompt" hidden></div>
      <div class="gx-lock" hidden>Clique no ecrã para controlar a câmara com o rato</div>
      <div class="gx-log"></div>
      <div class="gx-pop" hidden></div>
    </div>
    <div class="gx-flash"></div>
    <div class="gx-panel" data-p="terminal" hidden></div>
    <div class="gx-panel" data-p="keypad" hidden></div>
    <div class="gx-panel gx-menu" data-p="menu" hidden></div>
    <div class="gx-panel gx-menu" data-p="board" hidden></div>
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
  scene.fog = new THREE.FogExp2(0x03050b, 0.034);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 140);
  const yaw = new THREE.Object3D(); const pitch = new THREE.Object3D();
  yaw.add(pitch); pitch.add(camera); scene.add(yaw);
  const hemi = new THREE.HemisphereLight(0x6f8fe6, 0x10121c, 1.1); scene.add(hemi);
  scene.add(new THREE.AmbientLight(0x26324f, 0.9));

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
  }, [4, 1]);
  const fieldTex = canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(125,211,252,0.9)'; g.lineWidth = 2;
    for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(125,211,252,0.35)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 16, h); g.stroke(); }
  }, [ROOM_W / 3, ROOM_H / 3]);
  const mat = {
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.55 }),
    wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.75, metalness: 0.3 }),
    ceil: new THREE.MeshStandardMaterial({ color: 0x080b14, roughness: 0.9, metalness: 0.2 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.35, metalness: 0.85 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.7 }),
    crate: new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.6, metalness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18 }),
  };
  const glow = (color, k = 2.2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: k });

  /* ---------- mundo ---------- */
  const world = new THREE.Group(); scene.add(world);
  const walkable = []; // retângulos onde o jogador pode andar: {x1,x2,z1,z2, door?}
  const solids = []; // obstáculos: {x1,x2,z1,z2, on?()} (on: só bloqueiam enquanto ativos)
  const covers = []; // obstáculos altos que tapam a visão dos drones e das câmaras
  const solid = (x, z, w, d, h = 1) => {
    solids.push({ x1: x - w / 2 - RADIUS, x2: x + w / 2 + RADIUS, z1: z - d / 2 - RADIUS, z2: z + d / 2 + RADIUS });
    if (h >= 1) covers.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2 });
  };
  const interactables = []; // {pos, kind: 'terminal'|'keypad', room, zone?, task?, label}
  const rooms = []; // por sala: {cz, color, lights, door, barrier, screens, drones, lasers, cameras, …}
  const box = (w, h, d, m, x, y, z, parent = world) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, seg = 24, parent = world) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; };
  const hex = (c) => '#' + new THREE.Color(c).getHexString();

  function signTex(title, sub, color) {
    return canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#05070d'; g.fillRect(0, 0, w, h);
      g.strokeStyle = color; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = color; g.font = '700 46px "JetBrains Mono", monospace'; g.textBaseline = 'middle'; g.fillText(title, 26, 48);
      g.fillStyle = '#9fb3d9'; g.font = '500 26px "JetBrains Mono", monospace'; g.fillText(sub, 28, 96);
    });
  }

  function buildRoom(i, lv) {
    const cz = -i * SPACING, color = PALETTE[i % PALETTE.length], half = ROOM_W / 2, hd = ROOM_D / 2;
    const g = new THREE.Group(); world.add(g);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), mat.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, cz); g.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_D), mat.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, ROOM_H, cz); g.add(ceil);
    const wallSeg = (w, x, z, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, ROOM_H), mat.wall); m.position.set(x, ROOM_H / 2, z); m.rotation.y = rot; g.add(m); };
    wallSeg(ROOM_D, -half, cz, Math.PI / 2); wallSeg(ROOM_D, half, cz, -Math.PI / 2);
    const side = (ROOM_W - CORR_W) / 2;
    for (const [z, rot] of [[cz + hd, Math.PI], [cz - hd, 0]]) {
      wallSeg(side, -(CORR_W / 2 + side / 2), z, rot); wallSeg(side, CORR_W / 2 + side / 2, z, rot);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(CORR_W, ROOM_H - 3), mat.wall); top.position.set(0, 3 + (ROOM_H - 3) / 2, z); top.rotation.y = rot; g.add(top);
    }
    const strip = glow(color, 1.6);
    for (const x of [-half + 0.02, half - 0.02]) { box(0.04, 0.06, ROOM_D, strip, x, 0.12, cz, g); box(0.04, 0.04, ROOM_D, strip, x, ROOM_H - 0.3, cz, g); }
    const panel = glow(0xcfe6ff, 1.1);
    for (const z of [cz - 8, cz - 2.5, cz + 4, cz + 9]) for (const x of [-6, 0, 6]) box(2.4, 0.04, 0.6, panel, x, ROOM_H - 0.03, z, g);
    const light = new THREE.PointLight(color, 90, 34, 1.2); light.position.set(0, ROOM_H - 0.6, cz - 2); g.add(light);
    const fill = new THREE.PointLight(0xbfd7ff, 24, 20, 1.4); fill.position.set(0, 2.4, cz + 6); g.add(fill);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: signTex(`SALA ${i + 1}`, lv ? lv.name.toUpperCase() : 'NÚCLEO DA NEXUS', hex(color)) }));
    sign.position.set(0, 3.55, cz - hd + 0.03); g.add(sign);
    walkable.push({ x1: -half + RADIUS, x2: half - RADIUS, z1: cz - hd + RADIUS, z2: cz + hd - RADIUS });
    return { cz, color, g, light, fill, strip, panel, dark: false, drones: [], lasers: [], cameras: [], screens: [] };
  }

  function buildCorridor(i) {
    const z2 = -i * SPACING - ROOM_D / 2, z1 = z2 - CORR_L, cz = (z1 + z2) / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(CORR_W, CORR_L), mat.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, cz); world.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(CORR_W, CORR_L), mat.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3, cz); world.add(ceil);
    for (const [x, rot] of [[-CORR_W / 2, Math.PI / 2], [CORR_W / 2, -Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(CORR_L, 3), mat.wall); w.position.set(x, 1.5, cz); w.rotation.y = rot; world.add(w); }
    for (let k = 0; k < 3; k++) box(CORR_W - 0.6, 0.03, 0.2, glow(0x7dd3fc, 1.3), 0, 2.98, z2 - 1 - k * 2.4);
    walkable.push({ x1: -CORR_W / 2 + RADIUS, x2: CORR_W / 2 - RADIUS, z1: z1 - 0.5, z2: z2 + 0.5, door: i });
  }

  function buildDoor(room) {
    const z = room.cz - ROOM_D / 2;
    const frameM = glow(0xef4444, 2.4);
    const frame = new THREE.Group(); world.add(frame);
    box(0.18, 3.1, 0.3, mat.metal, -CORR_W / 2 + 0.05, 1.55, z, frame); box(0.18, 3.1, 0.3, mat.metal, CORR_W / 2 - 0.05, 1.55, z, frame); box(CORR_W, 0.2, 0.3, mat.metal, 0, 3.05, z, frame);
    box(CORR_W - 0.3, 0.05, 0.32, frameM, 0, 2.92, z, frame);
    const panelM = new THREE.MeshStandardMaterial({ color: 0x1a2438, roughness: 0.4, metalness: 0.8 });
    const left = box(CORR_W / 2 - 0.1, 2.9, 0.12, panelM, -CORR_W / 4, 1.45, z);
    const right = box(CORR_W / 2 - 0.1, 2.9, 0.12, panelM, CORR_W / 4, 1.45, z);
    for (const p of [left, right]) box(0.06, 2.4, 0.14, frameM, p === left ? CORR_W / 4 - 0.15 : -CORR_W / 4 + 0.15, 0, 0, p);
    return { z, left, right, frameM, open: false, t: 0 };
  }

  // Campo de forças entre a zona 1 (entrada) e a zona 2 de cada sala.
  function buildBarrier(room) {
    const z = room.cz + BAR;
    const m = new THREE.MeshBasicMaterial({ map: fieldTex.clone(), color: 0x38bdf8, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    m.map.needsUpdate = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, ROOM_H), m); mesh.position.set(0, ROOM_H / 2, z); world.add(mesh);
    const edgeM = glow(0x38bdf8, 2.6);
    const edges = [box(ROOM_W, 0.08, 0.12, edgeM, 0, 0.04, z), box(ROOM_W, 0.08, 0.12, edgeM, 0, ROOM_H - 0.05, z)];
    const b = { z, mesh, m, edgeM, edges, on: true, fade: 1 };
    solids.push({ x1: -ROOM_W, x2: ROOM_W, z1: z - 0.15 - RADIUS, z2: z + 0.15 + RADIUS, on: () => b.on });
    return b;
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

  function buildTerminal(i, room, zone) {
    const x = -ROOM_W / 2 + 1.1, z = zone === 0 ? room.cz + ROOM_D / 2 - 4.5 : room.cz + BAR - 2.6;
    solid(x, z, 0.7, 1.6, 0.9);
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; world.add(g);
    box(1.6, 0.9, 0.7, mat.dark, 0, 0.45, 0, g); box(1.6, 0.05, 0.75, glow(room.color, 1.2), 0, 0.92, 0, g);
    const scr = terminalScreen(room.color);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.85), new THREE.MeshBasicMaterial({ map: scr.tex }));
    screen.position.set(0, 1.45, -0.18); screen.rotation.x = -0.22; g.add(screen);
    box(1.45, 0.95, 0.06, mat.metal, 0, 1.45, -0.22, g).rotation.x = -0.22;
    scr.draw(['TERMINAL ÓRION', `SALA ${i + 1} · ZONA ${zone + 1}`, '> [E] LIGAR_', ''], false);
    interactables.push({ pos: new THREE.Vector3(x, 1, z), kind: 'terminal', room: i, zone, label: `Usar o terminal (zona ${zone + 1})` });
    return scr;
  }

  const padTex = (color) => canvasTex(128, 192, (g) => {
    g.fillStyle = '#05070d'; g.fillRect(0, 0, 128, 192); g.strokeStyle = hex(color); g.lineWidth = 4; g.strokeRect(2, 2, 124, 188);
    g.fillStyle = hex(color); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.fillRect(16 + c * 36, 56 + r * 32, 24, 22);
    g.fillStyle = '#ef4444'; g.fillRect(16, 16, 96, 26);
  });
  function buildDoorKeypad(i, room, task) {
    const x = CORR_W / 2 + 0.6, z = room.cz - ROOM_D / 2 + 0.06;
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.65), new THREE.MeshBasicMaterial({ map: padTex(room.color) }));
    pad.position.set(x, 1.45, z); world.add(pad);
    interactables.push({ pos: new THREE.Vector3(x, 1, z), kind: 'keypad', room: i, task, label: 'Introduzir o código da porta' });
  }
  function buildBarrierKeypad(i, room, task) {
    const x = 2.8, z = room.cz + BAR + 0.9;
    solid(x, z, 0.5, 0.4, 0.5);
    box(0.5, 1.1, 0.4, mat.metal, x, 0.55, z); box(0.52, 0.04, 0.42, glow(0x38bdf8, 2), x, 1.1, z);
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.58), new THREE.MeshBasicMaterial({ map: padTex(0x38bdf8) }));
    pad.position.set(x, 1.45, z + 0.12); pad.rotation.x = -0.5; world.add(pad);
    interactables.push({ pos: new THREE.Vector3(x, 1, z), kind: 'keypad', room: i, task, label: 'Introduzir o código do campo de forças' });
  }

  // Zonas reservadas (caminhos, terminais, painéis) onde não se põem obstáculos.
  function free(room, x, z, w, d) {
    const cz = room.cz, hd = ROOM_D / 2, half = ROOM_W / 2;
    const r = { x1: x - w / 2 - 0.6, x2: x + w / 2 + 0.6, z1: z - d / 2 - 0.6, z2: z + d / 2 + 0.6 };
    const hit = (a) => r.x1 < a.x2 && r.x2 > a.x1 && r.z1 < a.z2 && r.z2 > a.z1;
    const reserved = [
      { x1: -1.8, x2: 1.8, z1: cz - hd, z2: cz + hd }, // corredor central
      { x1: -half, x2: -half + 3.2, z1: cz + hd - 6.5, z2: cz + hd - 2.5 }, { x1: -half, x2: -half + 3.2, z1: cz + BAR - 4.6, z2: cz + BAR - 0.6 }, // terminais
      { x1: -half, x2: half, z1: cz + BAR - 1.4, z2: cz + BAR + 2 }, // campo de forças e painel
      { x1: -half, x2: half, z1: cz + hd - 2.5, z2: cz + hd }, { x1: -4, x2: 4, z1: cz - hd, z2: cz - hd + 2.6 }, // entrada e porta
      ...room.lasers.map((l) => ({ x1: -half, x2: half, z1: l.z - 1, z2: l.z + 1 })),
    ];
    return x - w / 2 > -half + 0.3 && x + w / 2 < half - 0.3 && !reserved.some(hit) && !solids.some((o) => !o.on && hit({ x1: o.x1 + RADIUS - 0.4, x2: o.x2 - RADIUS + 0.4, z1: o.z1 + RADIUS - 0.4, z2: o.z2 - RADIUS + 0.4 }));
  }
  // Caixas e pilares espalhados ao acaso: servem de esconderijo contra drones e câmaras.
  function scatter(i, room, n) {
    const cz = room.cz, hd = ROOM_D / 2;
    for (let k = 0, tries = 0; k < n && tries < 200; tries++) {
      const w = rnd(1, 1.8), d = rnd(1, 1.8), h = rnd(1.1, 1.7);
      const x = rnd(-ROOM_W / 2 + 1, ROOM_W / 2 - 1), z = rnd(cz - hd + 2, cz + hd - 2);
      if (!free(room, x, z, w, d)) continue;
      solid(x, z, w, d, h); box(w, h, d, mat.crate, x, h / 2, z); box(w + 0.02, 0.05, d + 0.02, glow(room.color, 1.1), x, h * 0.72, z);
      k++;
    }
  }
  // Elementos decorativos próprios de cada sala (encostados às paredes).
  function decorate(i, room) {
    const cz = room.cz, c = room.color, half = ROOM_W / 2;
    if (i === 0) for (const [x, z] of [[half - 1.2, cz + 8], [half - 1.2, cz + 5], [half - 1.2, cz - 4], [-half + 1.2, cz - 6], [-half + 1.2, cz - 9], [half - 1.2, cz - 8]]) {
      solid(x, z, 1.2, 1.2, 2.4); cyl(0.62, 0.62, 0.25, mat.metal, x, 0.12, z); cyl(0.55, 0.55, 2.1, mat.glass, x, 1.3, z, 28); cyl(0.2, 0.2, 1.9, glow(0x67e8f9, 1.6), x, 1.3, z, 16); cyl(0.62, 0.62, 0.2, mat.metal, x, 2.42, z);
    }
    if (i === 1 || i === 5) for (const y of [3.9, 4.5]) { cyl(0.14, 0.14, ROOM_D, mat.metal, half - 0.4, y, cz).rotation.x = Math.PI / 2; cyl(0.11, 0.11, ROOM_D, mat.metal, -half + 0.4, y + 0.2, cz).rotation.x = Math.PI / 2; }
    if (i === 2) for (let k = 0; k < 5; k++) for (const x of [-half + 0.8, half - 0.8]) {
      const z = cz - 10 + k * 2.6; if (x < 0 && k >= 4) continue;
      solid(x, z, 0.9, 1.6, 3); box(0.9, 3, 1.6, mat.dark, x, 1.5, z);
      for (let r = 0; r < 8; r++) box(0.02, 0.05, 1.2, glow(r % 3 ? c : 0x34d399, 1.8), x + (x < 0 ? 0.46 : -0.46), 0.5 + r * 0.32, z);
    }
    if (i === 3) {
      for (const [x, z] of [[half - 2, cz + 7], [half - 2, cz - 6]]) { solid(x, z, 2.4, 1.1, 0.9); box(2.4, 0.9, 1.1, mat.dark, x, 0.45, z); box(2.4, 0.04, 1.1, glow(c, 1), x, 0.92, z); }
      const holo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: 0.8 }));
      holo.position.set(half - 2, 1.8, cz + 7); world.add(holo); spinners.push(holo);
    }
    if (i === 4) for (const [x, z] of [[-half + 1.5, cz - 4], [-half + 1.5, cz - 9], [half - 1.5, cz - 4], [half - 1.5, cz - 9], [half - 1.5, cz + 7]]) {
      solid(x, z, 2, 2, 3); cyl(0.95, 0.95, 3, mat.metal, x, 1.5, z); for (const y of [0.8, 1.6, 2.4]) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 32), glow(c, 2)); r.rotation.x = Math.PI / 2; r.position.set(x, y, z); world.add(r); }
    }
    if (i === 5) { // nave estacionada no hangar
      const x = half - 3.5, z = cz - 6; solid(x, z, 3.4, 6, 2);
      const hull = cyl(0.9, 1.6, 6, mat.metal, x, 1.4, z, 8); hull.rotation.x = Math.PI / 2;
      box(5.5, 0.15, 2, mat.dark, x, 1.2, z + 1.4); box(0.3, 0.3, 0.3, glow(0xf43f5e, 3), x, 1.4, z + 3.1);
    }
  }
  const spinners = [];

  /* ---------- ameaças: drones, lasers e câmaras ---------- */
  function zoneBounds(room, zone) {
    const cz = room.cz, hd = ROOM_D / 2, half = ROOM_W / 2;
    return zone === 0 ? { x1: -half + 1, x2: half - 1, z1: cz + BAR + 0.9, z2: cz + hd - 1 } : { x1: -half + 1, x2: half - 1, z1: cz - hd + 1, z2: cz + BAR - 0.9 };
  }
  function patrolPath(room, zone, sql) {
    const cz = room.cz, hd = ROOM_D / 2;
    const zr = zone === 0 ? [cz + BAR + 1.5, cz + 6.5] : sql ? [cz - hd + 2.5, cz - 5] : [cz - hd + 2.5, cz - 2.2];
    const xr = zone === 0 ? [2.5, 8.5] : [-8.5, 8.5];
    const z = rnd(zr[0], zr[1]), kind = rng();
    if (kind < 0.4) return [[xr[0], z], [xr[1], z]]; // vaivém de lado a lado
    const x1 = rnd(xr[0], (xr[0] + xr[1]) / 2 - 1), x2 = rnd((xr[0] + xr[1]) / 2 + 1, xr[1]), z1 = rnd(zr[0], (zr[0] + zr[1]) / 2), z2 = Math.min(zr[1], z1 + rnd(2.5, 5));
    return kind < 0.75 ? [[x1, z1], [x2, z1], [x2, z2], [x1, z2]] : [[x1, z2], [x2, z1], [x1, z1], [x2, z2]];
  }
  function buildDrone(room, zone, serial) {
    const g = new THREE.Group(); world.add(g);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), mat.metal); g.add(body);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 40), mat.dark); ring.rotation.x = Math.PI / 2; g.add(ring);
    const eyeM = glow(0xff2d55, 4); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), eyeM); eye.position.set(0, 0, 0.36); g.add(eye);
    const beamM = new THREE.MeshBasicMaterial({ color: 0xff2d55, transparent: true, opacity: 0.06, depthWrite: false });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(Math.tan(FOV) * VIEW, VIEW, 24, 1, true), beamM); beam.rotation.x = -Math.PI / 2; beam.position.set(0, -0.5, VIEW / 2 + 0.3); g.add(beam);
    const pts = patrolPath(room, zone, !!serial).map(([x, z]) => new THREE.Vector3(x, 1.7, z));
    g.position.copy(pts[0]);
    return { serial, zone, g, eyeM, beamM, beam, pts, seg: 1, active: true, fall: 0, mode: 'patrol', seen: -99, bounds: zoneBounds(room, zone) };
  }
  function buildLaser(room, z, sql) {
    const half = ROOM_W / 2, g = new THREE.Group(); world.add(g);
    const m = new THREE.MeshBasicMaterial({ color: sql ? 0xff7a1a : 0xff2040, transparent: true, opacity: 0.95 });
    const beams = [0.35, 0.95, 1.55, 2.15].map((y) => box(ROOM_W - 0.4, 0.035, 0.035, m, 0, y, z, g));
    for (const x of [-half + 0.15, half - 0.15]) { box(0.25, 2.6, 0.35, mat.metal, x, 1.3, z, g); box(0.27, 2.4, 0.06, glow(sql ? 0xff7a1a : 0xff2040, 2.5), x, 1.3, z + 0.18, g); }
    const L = { z, g, m, beams, sql, on: true, period: rnd(3.1, 3.7), onFor: rnd(1.7, 2), phase: rnd(0, 3) };
    if (sql) solids.push({ x1: -ROOM_W, x2: ROOM_W, z1: z - 0.05 - RADIUS, z2: z + 0.05 + RADIUS, on: () => L.on });
    return L;
  }
  function buildCamera(room) {
    const half = ROOM_W / 2, side = rng() < 0.5 ? -1 : 1, z = rnd(room.cz - ROOM_D / 2 + 4, room.cz - 3);
    const x = side * (half - 0.3), base = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const pivot = new THREE.Group(); pivot.position.set(x, 4.4, z); world.add(pivot);
    box(0.3, 0.3, 0.3, mat.metal, side * 0.15, 0.25, 0, pivot);
    const tilt = new THREE.Group(); tilt.rotation.x = 0.32; pivot.add(tilt);
    box(0.32, 0.28, 0.6, mat.dark, 0, 0, 0.1, tilt);
    const lensM = glow(0xff9f1a, 3); const lens = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), lensM); lens.position.set(0, 0, 0.42); tilt.add(lens);
    const coneM = new THREE.MeshBasicMaterial({ color: 0xffa31a, transparent: true, opacity: 0.07, depthWrite: false });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.tan(CAM_FOV) * CAM_RANGE, CAM_RANGE, 20, 1, true), coneM); cone.rotation.x = -Math.PI / 2; cone.position.z = CAM_RANGE / 2 + 0.4; tilt.add(cone);
    return { x, z, pivot, base, lensM, coneM, cone, phase: rnd(0, 6), speed: rnd(0.45, 0.7), dir: base, last: -99 };
  }
  // Cápsulas (power-ups): EMP (azul) imobiliza drones e câmaras; tempo (verde) dá +45 s ao relógio da sala;
  // relógio parado (roxo) suspende a contagem durante 25 s.
  const pickups = [];
  const PICKUP_COLOR = { emp: [0x38bdf8, 0x7dd3fc], time: [0x22c55e, 0x86efac], stop: [0xa855f7, 0xd8b4fe] };
  function buildPickup(x, z, kind, room) {
    const [c1, c2] = PICKUP_COLOR[kind];
    const g = new THREE.Group(); g.position.set(x, 0.9, z); world.add(g);
    if (kind === 'time') { // ampulheta
      for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.26, 16), glow(c1, 3)); c.position.y = s * 0.13; c.rotation.x = s > 0 ? Math.PI : 0; g.add(c); }
    } else g.add(new THREE.Mesh(kind === 'stop' ? new THREE.IcosahedronGeometry(0.22, 0) : new THREE.OctahedronGeometry(0.22, 0), glow(c1, 3.2)));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 32), glow(c2, 2.2)); g.add(ring);
    cyl(0.3, 0.38, 0.12, mat.metal, x, 0.06, z); box(0.5, 0.02, 0.5, glow(c1, 1.4), x, 0.13, z);
    pickups.push({ g, ring, x, z, kind, room, taken: false });
  }
  function placePickup(room, zone, kind, i, retry = true) {
    const b = zoneBounds(room, zone);
    for (let k = 0; k < 150; k++) {
      const x = rnd(b.x1 + 1, b.x2 - 1), z = rnd(b.z1 + 1, b.z2 - 1);
      if (Math.abs(x) > 2.2 && free(room, x, z, 0.6, 0.6) && !solids.some((o) => !o.on && x > o.x1 && x < o.x2 && z > o.z1 && z < o.z2) && !pickups.some((q) => Math.hypot(q.x - x, q.z - z) < 2.5)) { buildPickup(x, z, kind, i); return; }
    }
    if (retry) placePickup(room, 1 - zone, kind, i, false); // zona cheia: tenta a outra zona da sala
  }

  const doneRooms = new Set(opts.doneRooms || []);
  levels.forEach((lv, i) => {
    const room = buildRoom(i, lv);
    room.lv = lv; room.door = buildDoor(room); room.barrier = buildBarrier(room);
    room.screens = [buildTerminal(i, room, 0), buildTerminal(i, room, 1)];
    const [ta, tb] = lv.tasks;
    if (ta.code) buildBarrierKeypad(i, room, ta);
    if (tb.code) buildDoorKeypad(i, room, tb);
    const th = lv.threats || {};
    const lz = [room.cz - 4, room.cz - 7.5, room.cz - 10];
    for (let k = 0; k < (th.lasers || 0); k++) room.lasers.push(buildLaser(room, lz[k] + rnd(-0.5, 0.5), false));
    if ((tb.effects || []).includes('lasers')) room.lasers.push(buildLaser(room, room.cz - ROOM_D / 2 + 1.6, true));
    decorate(i, room);
    scatter(i, room, 5 + Math.min(i, 3));
    (th.drones || []).forEach((n, zone) => { for (let k = 0; k < n; k++) room.drones.push(buildDrone(room, zone)); });
    for (const d of lv.drones || []) room.drones.push(buildDrone(room, 1, d.serial));
    for (let k = 0; k < (th.cameras || 0); k++) room.cameras.push(buildCamera(room));
    if (lv.dark) room.dark = true;
    buildCorridor(i); rooms.push(room);
    placePickup(room, 0, 'time', i); placePickup(room, 1, 'time', i);
    if (i >= 1) placePickup(room, i >= 4 ? 1 : 0, 'emp', i);
    if (i >= 2) placePickup(room, 1, 'stop', i);
  });
  // sala final: antecâmara do núcleo (parte 2 em preparação)
  const endRoom = buildRoom(levels.length, null);
  box(4, 2.2, 0.2, mat.dark, 0, 1.6, endRoom.cz - ROOM_D / 2 + 0.2);
  const endSign = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.95), new THREE.MeshBasicMaterial({ map: signTex('ACESSO RESTRITO', 'NÚCLEO · PARTE 2 EM PREPARAÇÃO', '#f43f5e') }));
  endSign.position.set(0, 1.6, endRoom.cz - ROOM_D / 2 + 0.31); world.add(endSign);

  // poeira suspensa
  const dustGeo = new THREE.BufferGeometry(); const N = 900, dp = new Float32Array(N * 3);
  const zMin = endRoom.cz - ROOM_D / 2, zMax = ROOM_D / 2;
  for (let k = 0; k < N; k++) { dp[k * 3] = (Math.random() - 0.5) * ROOM_W; dp[k * 3 + 1] = Math.random() * ROOM_H; dp[k * 3 + 2] = zMin + Math.random() * (zMax - zMin); }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fc7ff, size: 0.03, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  /* ---------- bases de dados das salas ---------- */
  const A = window.alasql;
  let dbn = 0;
  function makeDb(lv) {
    const name = 'nx' + lv.id + Date.now().toString(36) + dbn++;
    A('CREATE DATABASE ' + name); const db = new A.Database(name);
    for (const [t, spec] of Object.entries(lv.tables)) {
      const types = spec.cols.map((c, k) => (typeof spec.rows[0][k] === 'number' ? 'INT' : 'VARCHAR(200)'));
      db.exec(`CREATE TABLE ${t} (${spec.cols.map((c, k) => `${c} ${types[k]}`).join(', ')})`);
      for (const r of spec.rows) { const o = {}; spec.cols.forEach((c, k) => (o[c] = r[k])); db.tables[t].data.push(o); }
    }
    return db;
  }
  const dbs = levels.map(makeDb);
  const resetDb = (i) => { dbs[i] = makeDb(levels[i]); };
  // Cada terminal só vê as tabelas da sua zona e das anteriores.
  const runSql = (i, zone, sql) => {
    const s = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/`/g, '').trim().replace(/;+\s*$/, '');
    if (!s) throw new Error('Escreva uma instrução SQL.');
    if (s.includes(';')) throw new Error('Execute uma instrução de cada vez.');
    for (const [t, spec] of Object.entries(levels[i].tables)) if (spec.zone > zone && new RegExp(`\\b${t}\\b`, 'i').test(s)) throw new Error(`Acesso negado: a tabela ${t} só está acessível no terminal da zona ${spec.zone + 1}.`);
    return dbs[i].exec(s);
  };

  /* ---------- estado do jogador e da missão ---------- */
  const start = Math.max(0, Math.min(opts.startRoom || 0, levels.length - 1));
  const state = { room: start, hints: {}, rev: {}, tdone: new Set(), entered: new Set(), finished: false, mode: 'story', emp: 1, frozenUntil: 0, clockStop: 0, now: 0, safe: false, alertUntil: 0 };
  // registo da pontuação de cada sala nesta missão
  const rec = levels.map((lv) => ({ tasks: 0, hints: 0, caught: 0, alarms: 0, wrong: 0, rev: 0, left: lv.par, lockdown: false, started: false, done: false, used: 0, score: 0, wrongStreak: 0 }));
  const scoreOf = (i) => roomScore(rec[i]);
  // pontos já ganhos: salas concluídas + tarefas da sala atual menos as penalizações (o bónus de tempo entra no fim da sala)
  const totalScore = () => rec.reduce((s, r, i) => { if (r.done) return s + r.score; if (!r.started) return s; const k = scoreOf(i); return s + Math.max(0, k.tasks - k.pen); }, 0);
  function updateEmp() {
    const el = $('.gx-emp'); el.querySelector('b').textContent = state.emp;
    const left = Math.max(0, state.frozenUntil - state.now);
    el.classList.toggle('on', left > 0); el.classList.toggle('has', state.emp > 0);
    el.querySelector('i').style.width = left > 0 ? `${(left / EMP_TIME) * 100}%` : '0';
  }
  function useEmp() {
    if (!state.emp) { log('Não tem pulsos EMP. Procure as cápsulas azuis nas salas.', 'SISTEMA'); return; }
    if (state.frozenUntil > state.now) return;
    state.emp--; state.frozenUntil = state.now + EMP_TIME; sfx.emp();
    rooms[state.room].drones.forEach((d) => { if (d.mode === 'chase') d.mode = 'return'; });
    flash('rgba(56,189,248,.35)'); log(`Pulso EMP ativado: drones e câmaras imobilizados durante ${EMP_TIME} segundos.`, 'SISTEMA', 'ok'); updateEmp();
  }
  const keys = {};
  const vel = new THREE.Vector3();
  let bob = 0;
  // salas anteriores à sala inicial ficam resolvidas (sem pontuação)
  rooms.forEach((r, i) => {
    if (i >= start) return;
    levels[i].tasks.forEach((t) => state.tdone.add(t.key));
    r.barrier.on = false; r.barrier.fade = 0; r.barrier.mesh.visible = false; r.barrier.edges.forEach((e) => (e.visible = false));
    r.dark = false; r.lasers.forEach((l) => { if (l.sql) l.on = false; });
    r.drones.forEach((d) => { if (d.serial) d.active = false; });
    openDoor(i, true);
  });
  function spawn(i) {
    const r = rooms[i];
    yaw.position.set(0, EYE, r.barrier.on ? r.cz + ROOM_D / 2 - 1.6 : r.cz + BAR - 1.3); yaw.rotation.y = 0; pitch.rotation.x = 0; vel.set(0, 0, 0);
  }
  spawn(state.room);

  function openDoor(i, instant) {
    const d = rooms[i].door; if (d.open) return; d.open = true;
    d.frameM.emissive.set(0x22c55e);
    if (instant) d.t = 1;
    rooms[i].screens.forEach((s, z) => s.draw(['TERMINAL ÓRION', `SALA ${i + 1} · ZONA ${z + 1}`, 'ACESSO CONCEDIDO', '> PORTA ABERTA'], true));
  }
  const inRect = (x, z, r) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2 && (r.door === undefined || (rooms[r.door] && rooms[r.door].door.open) || r.door >= rooms.length);
  const blocked = (x, z) => solids.some((o) => (!o.on || o.on()) && x > o.x1 && x < o.x2 && z > o.z1 && z < o.z2);
  const canStand = (x, z) => walkable.some((r) => inRect(x, z, r)) && !blocked(x, z);
  // Linha de visão livre entre dois pontos (as caixas e os equipamentos altos tapam a vista).
  function clearView(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.4);
    for (let k = 1; k < n; k++) { const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n; if (covers.some((o) => x > o.x1 && x < o.x2 && z > o.z1 && z < o.z2)) return false; }
    return true;
  }
  const zoneOf = (i, z) => (z > rooms[i].cz + BAR ? 0 : 1);
  const currentTask = (i) => levels[i].tasks.find((t) => !state.tdone.has(t.key));

  /* ---------- interface: mensagens e painéis ---------- */
  function log(text, who = 'SISTEMA', cls = '') {
    const el = document.createElement('div'); el.className = 'gx-msg ' + cls; el.innerHTML = `<b>${esc(who)}</b> <span></span>`;
    $('.gx-log').append(el);
    const span = el.querySelector('span'); let k = 0;
    const tick = () => { span.textContent = text.slice(0, k += 2); if (k < text.length) setTimeout(tick, 14); };
    tick();
    setTimeout(() => el.classList.add('out'), 10000); setTimeout(() => el.remove(), 10800);
    const all = container.querySelectorAll('.gx-msg'); if (all.length > 4) all[0].remove();
  }
  const speak = (line) => { const m = /^(NEXUS|VEGA):\s*«?(.*?)»?$/.exec(line); if (m) log(m[2], m[1], m[1] === 'NEXUS' ? 'nexus' : 'vega'); else log(line, 'SISTEMA'); };
  function flash(color) { const f = $('.gx-flash'); f.style.background = color; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function updateHud() {
    const i = state.room, lv = levels[i], cur = currentTask(i);
    $('.gx-room').textContent = `Sala ${i + 1} · ${lv.name}`;
    $('.gx-skill').textContent = lv.skill;
    $('.gx-tasks').innerHTML = lv.tasks.map((t) => `<div class="${state.tdone.has(t.key) ? 'ok' : t === cur ? 'cur' : ''}">${state.tdone.has(t.key) ? '✔' : t === cur ? '▸' : '·'} ${esc(t.title)} <small>zona ${t.zone + 1}</small></div>`).join('');
    $('.gx-objtext').textContent = rooms[i].door.open ? 'Porta aberta. Siga para a sala seguinte.' : cur ? `Vá ao terminal da zona ${cur.zone + 1}.` : '';
    $('.gx-progress').textContent = `${rec.filter((r) => r.done).length + start}/${levels.length} salas`;
  }
  function updateClock() {
    const i = state.room, r = rec[i];
    const t = $('.gx-time');
    t.textContent = rooms[i].door.open && !r.started ? '--:--' : mmss(r.left);
    t.classList.toggle('warn', r.started && !r.done && r.left <= 60 && !r.lockdown);
    t.classList.toggle('lock', r.lockdown && !r.done);
    $('.gx-pts b').textContent = totalScore();
    $('.gx-alert').hidden = !(r.lockdown && !r.done);
    const tc = container.querySelector('.gx-tclock'); if (tc) { tc.textContent = r.started && !r.done ? `⏱ ${mmss(r.left)}` : ''; tc.classList.toggle('warn', r.left <= 30); }
  }
  let panel = null;
  function showPanel(name) {
    panel = name;
    container.querySelectorAll('.gx-panel').forEach((p) => (p.hidden = p.dataset.p !== name));
    if (name && document.pointerLockElement === canvas) document.exitPointerLock();
    Object.keys(keys).forEach((k) => (keys[k] = false));
    $('.gx-prompt').hidden = true; near = null;
  }
  function play() { showPanel(null); state.mode = 'play'; caughtAt = Math.max(caughtAt, state.now - GRACE + 1.2); canvas.requestPointerLock(); }

  // Terminal SQL de uma zona da sala.
  function openTerminal(i, zone) {
    const lv = levels[i], p = $('[data-p="terminal"]'), cur = currentTask(i);
    const here = cur && cur.zone === zone ? cur : null;
    const tabs = Object.entries(lv.tables);
    p.innerHTML = `<div class="gx-term">
      <div class="gx-th"><span>TERMINAL ÓRION · Sala ${i + 1} — ${esc(lv.name)} · zona ${zone + 1}</span><span class="gx-tclock"></span><button class="gx-x" data-a="close" title="Voltar ao jogo (Esc)">✕</button></div>
      <div class="gx-tb">
        <aside>
          <h4>Tarefas da sala</h4><div class="gx-tlist">${lv.tasks.map((t) => `<div class="${state.tdone.has(t.key) ? 'ok' : t === cur ? 'cur' : ''}">${state.tdone.has(t.key) ? '✔' : t === cur ? '▸' : '·'} ${esc(t.title)} <small>zona ${t.zone + 1}</small></div>`).join('')}</div>
          <h4>Missão</h4><p>${here ? esc(here.objective) : cur ? `A tarefa atual («${esc(cur.title)}») é no terminal da zona ${cur.zone + 1}.` : 'Tarefas desta sala concluídas.'}</p>
          <h4>Tabelas deste terminal</h4>${tabs.filter(([, s]) => s.zone <= zone).map(([t, s]) => `<div class="gx-tab"><b>${t}</b>(${s.cols.map((c) => `<button data-col="${c}">${c}</button>`).join(', ')})</div>`).join('')}
          ${tabs.filter(([, s]) => s.zone > zone).map(([t, s]) => `<div class="gx-tab locked">🔒 <b>${t}</b> — terminal da zona ${s.zone + 1}</div>`).join('')}
          ${here ? `<div class="gx-help"><button data-a="hint">Dica (−${100} pontos · −5 XP)</button><button data-a="sol">Ver solução (perde os pontos da tarefa)</button><button data-a="reset">Repor dados</button></div><div class="gx-hints"></div>` : ''}
        </aside>
        <section>
          <textarea class="gx-sql" spellcheck="false" placeholder="SELECT …   (Ctrl+Enter para executar)"></textarea>
          <div class="gx-run"><button data-a="run">▶ Executar</button><span>Ctrl + Enter · Esc para voltar ao jogo</span></div>
          <div class="gx-out"></div>
        </section>
      </div></div>`;
    showPanel('terminal'); state.mode = 'terminal'; updateClock();
    const ta = p.querySelector('.gx-sql'), out = p.querySelector('.gx-out'), hintsBox = p.querySelector('.gx-hints');
    const k = `${i}.${zone}`;
    ta.value = (state.lastSql && state.lastSql[k]) || ''; setTimeout(() => ta.focus(), 30);
    const showHints = () => { if (!here) return; const n = state.hints[here.key] || 0; hintsBox.innerHTML = here.hints.slice(0, n).map((h) => `<p>💡 ${esc(h)}</p>`).join('') + (state.rev[here.key] ? `<p class="sol">Solução: <code>${esc(here.solution)}</code></p>` : ''); };
    showHints();
    const run = () => {
      state.lastSql = state.lastSql || {}; state.lastSql[k] = ta.value;
      try {
        const res = runSql(i, zone, ta.value);
        out.innerHTML = Array.isArray(res) ? ui.table(res) : `<div class="gx-ok">${res} linha(s) afetada(s).</div>`;
        checkState(i, out);
      } catch (e) { out.innerHTML = `<div class="gx-err">⚠ ${esc(ui.sqlError(e))}</div>`; }
    };
    p.querySelector('[data-a="run"]').onclick = run;
    ta.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } if (e.key === 'Escape') { e.preventDefault(); play(); } e.stopPropagation(); };
    p.querySelector('[data-a="close"]').onclick = play;
    if (here) {
      p.querySelector('[data-a="hint"]').onclick = () => {
        const n = state.hints[here.key] || 0; if (n >= here.hints.length) return;
        state.hints[here.key] = n + 1; rec[i].hints++; showHints(); updateClock();
      };
      p.querySelector('[data-a="sol"]').onclick = () => {
        if (!state.rev[here.key] && !confirm('Ver a solução desta tarefa? Perde os pontos da tarefa e o XP da sala, mas pode continuar a missão.')) return;
        if (!state.rev[here.key]) rec[i].rev++;
        state.rev[here.key] = true; ta.value = here.solution; showHints();
      };
      p.querySelector('[data-a="reset"]').onclick = () => { resetDb(i); syncDrones(i); out.innerHTML = '<div class="gx-ok">Dados da sala repostos.</div>'; };
    }
    p.querySelectorAll('[data-col]').forEach((b) => (b.onclick = () => { const a = ta.selectionStart; ta.value = ta.value.slice(0, a) + b.dataset.col + ta.value.slice(ta.selectionEnd); ta.focus(); ta.setSelectionRange(a + b.dataset.col.length, a + b.dataset.col.length); }));
  }

  function syncDrones(i) {
    rooms[i].drones.forEach((d) => { if (!d.serial) return; const row = dbs[i].tables.drones && dbs[i].exec(`SELECT ativo FROM drones WHERE numero_serie = '${d.serial}'`)[0]; d.active = !row || Number(row.ativo) !== 0; });
  }
  function checkState(i, out) {
    const t = currentTask(i);
    if (t && t.state) {
      const r = t.state((sql) => dbs[i].exec(sql));
      if (r.alarm) {
        resetDb(i); syncDrones(i); rec[i].alarms++; state.alertUntil = state.now + 7; sfx.alarm();
        flash('rgba(239,68,68,.45)'); log(r.alarm, 'ALARME', 'bad'); if (out) out.innerHTML += `<div class="gx-err">🚨 ${esc(r.alarm)} (−200 pontos; os drones foram alertados)</div>`;
        return;
      }
      syncDrones(i);
      if (r.open) { if (out) out.innerHTML += `<div class="gx-ok">✔ ${esc(r.msg)}</div>`; completeTask(i, t); }
    } else syncDrones(i);
  }

  function openKeypad(i, task) {
    const p = $('[data-p="keypad"]'), isDoor = task.unlock === 'door';
    p.innerHTML = `<div class="gx-key-box"><div class="gx-th"><span>${isDoor ? 'PAINEL DA PORTA' : 'CAMPO DE FORÇAS'} · Sala ${i + 1}</span><span class="gx-tclock"></span><button class="gx-x" data-a="close">✕</button></div>
      <p>${esc(task.title)}: introduza o código de acesso.</p><input class="gx-code" maxlength="8" inputmode="numeric" autocomplete="off"><div class="gx-kmsg"></div>
      <button class="gx-go" data-a="ok">Confirmar</button></div>`;
    showPanel('keypad'); state.mode = 'keypad'; updateClock();
    const inp = p.querySelector('.gx-code'); setTimeout(() => inp.focus(), 30);
    const ok = () => {
      if (inp.value.trim() === task.code) { rec[i].wrongStreak = 0; play(); completeTask(i, task); return; }
      const r = rec[i]; r.wrong++; r.wrongStreak++; sfx.bad();
      let msg = 'Código incorreto (−50 pontos). A NEXUS registou a tentativa.';
      if (r.wrongStreak >= 3) { r.wrongStreak = 0; state.alertUntil = state.now + 6; msg = 'Três códigos errados: a NEXUS alertou os drones!'; flash('rgba(239,68,68,.35)'); }
      p.querySelector('.gx-kmsg').textContent = msg; inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.select(); updateClock();
    };
    p.querySelector('[data-a="ok"]').onclick = ok;
    inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); else if (e.key === 'Escape') play(); else sfx.key(); e.stopPropagation(); };
    p.querySelector('[data-a="close"]').onclick = play;
  }

  // Uma tarefa concluída: desliga o campo de forças ou abre a porta, e aplica os efeitos na sala.
  function completeTask(i, t) {
    if (state.tdone.has(t.key)) return;
    state.tdone.add(t.key);
    const r = rec[i], room = rooms[i];
    if (!state.rev[t.key]) r.tasks++;
    for (const e of t.effects || []) {
      if (e === 'lights') { room.dark = false; flash('rgba(255,255,255,.35)'); }
      if (e === 'lasers') room.lasers.forEach((l) => { if (l.sql) l.on = false; });
    }
    if (t.unlock === 'barrier') { room.barrier.on = false; sfx.unlock(); flash('rgba(56,189,248,.3)'); log('Campo de forças desligado. Zona 2 desbloqueada.', 'SISTEMA', 'ok'); }
    else { openDoor(i); sfx.ok(); flash('rgba(52,211,153,.25)'); completeRoom(i); }
    if (t.done) setTimeout(() => log(t.done.text, t.done.who, t.done.who === 'NEXUS' ? 'nexus' : 'vega'), 900);
    updateHud(); updateClock();
  }
  function completeRoom(i) {
    const r = rec[i]; if (r.done) return;
    r.done = true; r.lockdown = false; const s = scoreOf(i); r.score = s.total;
    const lv = levels[i];
    const pop = $('.gx-pop');
    pop.innerHTML = `<h3>Sala ${i + 1} concluída</h3>
      <div><span>Tarefas (${r.tasks}/${lv.tasks.length})</span><b>+${s.tasks}</b></div>
      <div><span>Tempo restante (${mmss(r.left)})</span><b>+${s.time}</b></div>
      ${s.perfect ? `<div><span>Sala perfeita</span><b>+${s.perfect}</b></div>` : ''}
      ${s.pen ? `<div class="pen"><span>Dicas, capturas, alarmes e erros</span><b>−${s.pen}</b></div>` : ''}
      <div class="tot"><span>Pontos da sala</span><b>${s.total}</b></div>`;
    pop.hidden = false; pop.classList.remove('on'); void pop.offsetWidth; pop.classList.add('on');
    clearTimeout(pop._t); pop._t = setTimeout(() => (pop.hidden = true), 6000);
    const first = !doneRooms.has(lv.id); doneRooms.add(lv.id);
    const hints = lv.tasks.reduce((n, t) => n + (state.hints[t.key] || 0), 0), rev = lv.tasks.some((t) => state.rev[t.key]);
    if (opts.onRoomDone) opts.onRoomDone(lv.id, { hints, rev, first });
  }

  function menu() {
    const p = $('[data-p="menu"]');
    p.innerHTML = `<div class="gx-menu-box"><h2>Pausa</h2>
      <p class="gx-ctl">O tempo da sala está parado. ${opts.ranked ? `Pontuação atual: <b>${totalScore()}</b>.` : 'Modo treino: comece na sala 1 para entrar na tabela de melhores jogadores.'}</p>
      <button data-a="resume" class="gx-go">Continuar</button>
      <button data-a="restart">Voltar ao início da zona</button>
      ${opts.loadBoard ? '<button data-a="board">🏆 Pontuações máximas</button>' : ''}
      <label>Qualidade gráfica <select data-a="q"><option value="high">Alta (efeitos de luz)</option><option value="low">Baixa (computadores mais lentos)</option></select></label>
      <label>Sensibilidade do rato <input type="range" min="0.3" max="2" step="0.1" data-a="sens"></label>
      <label class="gx-chk"><input type="checkbox" data-a="snd"> Som</label>
      <div class="gx-ctl"><b>Controlos</b>: W A S D ou setas — mover · rato — olhar · Shift — correr · E — usar · Q — pulso EMP · Esc — pausa</div>
      <button data-a="exit">Sair do jogo</button></div>`;
    showPanel('menu'); state.mode = 'menu';
    const settings = () => opts.onSettings && opts.onSettings({ quality, sensitivity, sound: sfx.on });
    p.querySelector('[data-a="q"]').value = quality; p.querySelector('[data-a="sens"]').value = sensitivity; p.querySelector('[data-a="snd"]').checked = sfx.on;
    p.querySelector('[data-a="resume"]').onclick = play;
    p.querySelector('[data-a="restart"]').onclick = () => { spawn(state.room); play(); };
    p.querySelector('[data-a="q"]').onchange = (e) => { quality = e.target.value; setupQuality(); settings(); };
    p.querySelector('[data-a="sens"]').oninput = (e) => { sensitivity = Number(e.target.value); settings(); };
    p.querySelector('[data-a="snd"]').onchange = (e) => { sfx.on = e.target.checked; settings(); };
    p.querySelector('[data-a="exit"]').onclick = () => opts.onExit && opts.onExit();
    const bb = p.querySelector('[data-a="board"]'); if (bb) bb.onclick = boardPanel;
  }
  /* ---------- pontuações máximas (melhor missão de cada jogador: nível atingido e pontos) ---------- */
  function boardHtml(rows) {
    if (!rows) return '<p class="gx-ctl">A carregar…</p>';
    if (!rows.length) return '<p class="gx-ctl">Ainda não há pontuações. Seja o primeiro!</p>';
    const me = String(opts.me || '').toLowerCase(), N = levels.length;
    return `<table class="gx-res gx-board"><thead><tr><th>#</th><th>Agente</th><th>Nível atingido</th><th>Pontos</th><th>Tempo</th></tr></thead><tbody>${rows.slice(0, 10).map((r, k) => `<tr class="${r.name.toLowerCase() === me ? 'me' : ''}"><td>${k + 1}</td><td>${esc(r.name)}</td><td>${r.rooms >= N ? `✔ Missão completa` : `Sala ${r.rooms + 1} <small>(${r.rooms}/${N})</small>`}</td><td><b>${r.score}</b></td><td>${mmss(r.time)}</td></tr>`).join('')}</tbody></table>`;
  }
  function fillBoard(el) {
    el.innerHTML = boardHtml(null);
    Promise.resolve(opts.loadBoard()).then((rows) => (el.innerHTML = boardHtml(rows || []))).catch(() => (el.innerHTML = '<p class="gx-ctl">Tabela indisponível (sem ligação ou sem conta).</p>'));
  }
  function boardPanel() {
    const p = $('[data-p="board"]');
    p.innerHTML = `<div class="gx-menu-box gx-board-box"><h2>🏆 Pontuações máximas</h2><p class="gx-ctl">Melhor missão de cada jogador: primeiro o nível atingido, depois os pontos.</p><div class="gx-bt"></div><button data-a="back" class="gx-go">Voltar</button></div>`;
    showPanel('board'); state.mode = 'menu';
    fillBoard(p.querySelector('.gx-bt'));
    p.querySelector('[data-a="back"]').onclick = menu;
  }

  const CONTROLS = '<div class="gx-ctl"><b>Controlos</b>: W A S D — mover · rato — olhar · Shift — correr · E — usar terminais e painéis · Q — pulso EMP (imobiliza drones e câmaras) · Esc — pausa</div>';
  function storyScreen(lines, title, button, after, extra = '') {
    const p = $('[data-p="story"]');
    p.innerHTML = `<div class="gx-story-box"><div class="gx-tag">ESTAÇÃO ÓRION · REGISTO DE EMERGÊNCIA</div><h1>${esc(title)}</h1>${lines.map((l, k) => `<p style="animation-delay:${0.4 + k * 0.8}s">${esc(l)}</p>`).join('')}
      ${extra}<button class="gx-go" data-a="go">${esc(button)}</button></div>`;
    showPanel('story'); state.mode = 'story';
    p.querySelector('[data-a="go"]').onclick = () => { sfx.start(); after(); };
  }

  /* ---------- eventos ---------- */
  const onKey = (down) => (e) => {
    if (state.mode !== 'play') return;
    keys[e.code] = down;
    if (down && e.code === 'KeyE' && near) { if (near.kind === 'terminal') openTerminal(near.room, near.zone); else openKeypad(near.room, near.task); }
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
  let near = null, raf = 0, last = performance.now(), caughtAt = -99, lastBeat = 0, lastSiren = 0;
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), tmp = new THREE.Vector3();
  const RED = new THREE.Color(0xff1a1a);
  function caught(i, text) {
    if (state.safe) return;
    caughtAt = state.now; rec[i].caught++; sfx.caught();
    flash('rgba(239,68,68,.6)'); log(`${text} (−150 pontos)`, 'NEXUS', 'nexus'); spawn(i);
    rooms[i].drones.forEach((d) => { if (d.mode === 'chase') d.mode = 'return'; });
    updateClock();
  }
  function step(dt, t) {
    state.now = t;
    const i = state.room, r = rec[i];
    const p = yaw.position;
    // movimento
    if (state.mode === 'play') {
      const sp = keys.ShiftLeft || keys.ShiftRight ? RUN : WALK;
      fwd.set(-Math.sin(yaw.rotation.y), 0, -Math.cos(yaw.rotation.y)); right.set(-fwd.z, 0, fwd.x);
      tmp.set(0, 0, 0);
      if (keys.KeyW || keys.ArrowUp) tmp.add(fwd); if (keys.KeyS || keys.ArrowDown) tmp.sub(fwd);
      if (keys.KeyD || keys.ArrowRight) tmp.add(right); if (keys.KeyA || keys.ArrowLeft) tmp.sub(right);
      if (tmp.lengthSq()) tmp.normalize().multiplyScalar(sp);
      vel.lerp(tmp, Math.min(1, dt * 10));
      const nx = p.x + vel.x * dt, nz = p.z + vel.z * dt;
      if (canStand(nx, p.z)) p.x = nx;
      if (canStand(p.x, nz)) p.z = nz;
      const moving = vel.lengthSq() > 0.5; bob += moving ? dt * (sp === RUN ? 13 : 9) : 0;
      p.y = EYE + (moving ? Math.sin(bob) * 0.035 : 0);
      // sala atual
      const ri = Math.round(-p.z / SPACING);
      if (ri >= 0 && ri < rooms.length && Math.abs(p.z - rooms[ri].cz) < ROOM_D / 2 && ri !== state.room) { state.room = ri; updateHud(); updateClock(); }
      if (ri >= 0 && ri < rooms.length && !state.entered.has(ri) && Math.abs(p.z - rooms[ri].cz) < ROOM_D / 2 - 1) {
        state.entered.add(ri); speak(levels[ri].intro);
        if (!rooms[ri].door.open) { rec[ri].started = true; if (rooms[ri].dark) setTimeout(() => log('Sala sem iluminação. Só as luzes de emergência funcionam.', 'SISTEMA'), 1500); }
      }
      if (!state.finished && p.z < endRoom.cz + ROOM_D / 2 - 2) finish();
      for (const k of pickups) if (!k.taken && Math.hypot(k.x - p.x, k.z - p.z) < 0.9) {
        k.taken = true; k.g.visible = false;
        const rk = rec[k.room], live = rk.started && !rk.done;
        if (k.kind === 'emp') { state.emp++; updateEmp(); sfx.key(); log(`Recolheu um pulso EMP. Prima Q para imobilizar drones e câmaras durante ${EMP_TIME} s.`, 'SISTEMA', 'ok'); }
        else if (!live) log('Cápsula de tempo recolhida, mas o relógio desta sala já parou.', 'SISTEMA');
        else if (k.kind === 'time') {
          rk.left += TIME_BONUS; sfx.unlock(); flash('rgba(34,197,94,.3)');
          if (rk.lockdown && rk.left > ALERT) { rk.lockdown = false; log(`+${TIME_BONUS} segundos! O bloqueio total foi suspenso.`, 'VEGA', 'vega'); }
          else log(`+${TIME_BONUS} segundos no relógio da sala.`, 'SISTEMA', 'ok');
          updateClock();
        } else { state.clockStop = Math.max(state.now, state.clockStop) + CLOCK_STOP; sfx.emp(); flash('rgba(168,85,247,.3)'); log(`Relógio parado durante ${CLOCK_STOP} segundos.`, 'SISTEMA', 'ok'); updateClock(); }
      }
      // objeto com que se pode interagir: até 2,6 m e mais ou menos à frente; encostado (≤ 1,3 m) basta estar ao lado
      near = null; let best = Infinity;
      for (const it of interactables) {
        if (it.kind === 'keypad' && state.tdone.has(it.task.key)) continue;
        const d = Math.hypot(it.pos.x - p.x, it.pos.z - p.z);
        if (d > 2.6 || d >= best) continue;
        tmp.set(it.pos.x - p.x, 0, it.pos.z - p.z).normalize();
        if (d <= 1.3 || tmp.dot(fwd) > 0.2) { best = d; near = it; }
      }
      const pr = $('.gx-prompt');
      if (near) { pr.hidden = false; pr.innerHTML = `<span class="gx-key">E</span> ${esc(near.label)}`; } else pr.hidden = true;
    }
    // cronómetro da sala (para no menu e nos ecrãs de história)
    const stopped = t < state.clockStop;
    $('.gx-time').classList.toggle('stop', stopped);
    if (r.started && !r.done && !stopped && ['play', 'terminal', 'keypad'].includes(state.mode)) {
      const before = r.left; r.left = Math.max(0, r.left - dt); r.used += dt;
      if (r.left <= 30 && Math.ceil(r.left) !== Math.ceil(before) && r.left > 0) sfx.tick(r.left <= 10);
      if (r.left <= ALERT && !r.lockdown && r.left > 0) {
        r.lockdown = true; sfx.alarm(); lastSiren = t; flash('rgba(239,68,68,.5)');
        log(`Restam ${ALERT} segundos. Bloqueio total: drones e lasers acelerados. Quando o tempo acabar, a sala fecha e a missão termina.`, 'NEXUS', 'nexus');
      }
      if (r.left > ALERT && r.lockdown) r.lockdown = false; // ganhou tempo com uma cápsula
      if (Math.ceil(r.left) !== Math.ceil(before) || r.lockdown) updateClock();
      if (r.left === 0 && !state.safe) { gameOver(i); return; }
    }
    const lock = r.lockdown && !r.done;
    if (lock && state.mode === 'play' && t - lastSiren > 4) { lastSiren = t; sfx.alarm(); }
    // portas e campos de forças
    rooms.forEach((rm) => {
      const d = rm.door; if (d.open && d.t < 1) d.t = Math.min(1, d.t + dt * 1.2); const off = d.t * (CORR_W / 2 - 0.05); d.left.position.x = -CORR_W / 4 - off; d.right.position.x = CORR_W / 4 + off;
      const b = rm.barrier;
      if (b.mesh.visible) {
        if (!b.on) { b.fade = Math.max(0, b.fade - dt * 1.4); if (b.fade === 0) { b.mesh.visible = false; b.edges.forEach((e) => (e.visible = false)); } }
        b.m.opacity = (0.3 + Math.sin(t * 3) * 0.08) * b.fade; b.m.map.offset.y = t * 0.15; b.edgeM.emissiveIntensity = 2.6 * b.fade;
      }
    });
    const frozen = t < state.frozenUntil;
    if (frozen || $('.gx-emp').classList.contains('on')) updateEmp();
    pickups.forEach((k) => { if (!k.taken) { k.g.rotation.y += dt * 1.6; k.ring.rotation.x = t * 1.2; k.g.position.y = 0.9 + Math.sin(t * 2 + k.x) * 0.08; } });
    const playing = state.mode === 'play' && !state.safe && t - caughtAt > GRACE;
    const pz = zoneOf(i, p.z);
    // lasers
    rooms.forEach((rm, ri) => rm.lasers.forEach((L) => {
      let on;
      if (L.sql) on = L.on;
      else { const per = lock && ri === i ? L.period * 0.7 : L.period, ph = (t + L.phase) % per, onFor = lock && ri === i ? per * 0.72 : L.onFor; on = ph < onFor; L.warn = !on && per - ph < 0.45; L.on = on; }
      L.g.visible = on || !!L.warn; L.m.opacity = on ? 0.95 : 0.25 + Math.sin(t * 60) * 0.15;
      if (on && !L.sql && ri === i && playing && Math.abs(p.z - L.z) < RADIUS + 0.06) caught(i, 'Atingido por uma barreira laser! Volta ao início da zona.');
    }));
    // câmaras de segurança
    let chased = false;
    rooms.forEach((rm, ri) => rm.cameras.forEach((c) => {
      if (ri !== i && Math.abs(ri - i) > 1) return;
      if (frozen && ri === i) { c.lensM.emissive.set(0x38bdf8); c.coneM.opacity = 0.02; return; }
      c.dir = c.base + Math.sin(t * c.speed + c.phase) * 0.9; c.pivot.rotation.y = c.dir;
      c.lensM.emissive.set(0xff9f1a); c.coneM.opacity = 0.07;
      if (ri !== i || !playing || pz !== 1) return;
      const dx = p.x - c.x, dz = p.z - c.z, dist = Math.hypot(dx, dz);
      const ang = Math.acos(Math.max(-1, Math.min(1, (dx * Math.sin(c.dir) + dz * Math.cos(c.dir)) / dist)));
      if (dist < CAM_RANGE && ang < CAM_FOV && clearView(c.x, c.z, p.x, p.z)) {
        c.lensM.emissive.set(0xff0000); c.coneM.opacity = 0.16;
        if (t - c.last > 5) { c.last = t; state.alertUntil = t + 5; rec[i].alarms++; sfx.spot(); flash('rgba(255,159,26,.3)'); log('Câmara de segurança: intruso detetado! Drones alertados (−200 pontos).', 'NEXUS', 'nexus'); updateClock(); }
      }
    }));
    // drones
    const alerted = t < state.alertUntil;
    rooms.forEach((rm, ri) => rm.drones.forEach((d) => {
      if (Math.abs(ri - i) > 1) return;
      if (!d.active) {
        d.beam.visible = false; d.eyeM.emissive.set(0x1f2937);
        d.fall = Math.min(1, d.fall + dt * 1.5); d.g.position.y = Math.max(0.45, 1.7 - d.fall * 1.3); d.g.rotation.z = d.fall * 0.6;
        return;
      }
      if (frozen && ri === i) { d.eyeM.emissive.set(0x38bdf8); d.beam.visible = false; d.g.position.y = 1.55 + Math.sin(t * 9) * 0.015; d.g.rotation.z = Math.sin(t * 13) * 0.05; return; }
      d.g.rotation.z = 0; d.beam.visible = true;
      const here = ri === i && playing && pz === d.zone;
      const dx = p.x - d.g.position.x, dz = p.z - d.g.position.z, dist = Math.hypot(dx, dz);
      if (here) {
        const fx = Math.sin(d.g.rotation.y), fz = Math.cos(d.g.rotation.y);
        const sees = dist < VIEW && (dx * fx + dz * fz) / dist > Math.cos(FOV) && clearView(d.g.position.x, d.g.position.z, p.x, p.z);
        if (sees || (alerted && dist < 30) || dist < 1.6) { if (d.mode !== 'chase') { sfx.spot(); } d.mode = 'chase'; d.seen = t; }
      }
      if (d.mode === 'chase' && (!here || t - d.seen > 2.5)) d.mode = 'return';
      const speed = (d.mode === 'chase' ? CHASE : PATROL) * (lock && ri === i ? 1.4 : 1);
      if (d.mode === 'chase') {
        chased = true;
        const b = d.bounds;
        tmp.set(Math.max(b.x1, Math.min(b.x2, p.x)) - d.g.position.x, 0, Math.max(b.z1, Math.min(b.z2, p.z)) - d.g.position.z);
        if (tmp.length() > 0.05) { tmp.normalize(); d.g.position.addScaledVector(tmp, dt * speed); d.g.rotation.y = Math.atan2(tmp.x, tmp.z); }
        if (dist < CATCH) caught(i, `Apanhado pelo drone${d.serial ? ' ' + d.serial : ''}! A NEXUS enviou-o de volta ao início da zona.`);
      } else {
        const target = d.pts[d.seg];
        tmp.subVectors(target, d.g.position); tmp.y = 0;
        if (tmp.length() < 0.1) { d.seg = (d.seg + 1) % d.pts.length; if (d.mode === 'return') d.mode = 'patrol'; }
        else { tmp.normalize(); d.g.position.addScaledVector(tmp, dt * speed); const want = Math.atan2(tmp.x, tmp.z); let da = want - d.g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); d.g.rotation.y += da * Math.min(1, dt * 6); }
      }
      d.g.position.y = 1.7 + Math.sin(t * 2.5 + d.pts[0].x) * 0.12; d.fall = 0;
      const red = d.mode === 'chase' ? (Math.sin(t * 20) > 0 ? 0xff0000 : 0xffffff) : 0xff2d55;
      d.eyeM.emissive.set(red); d.beamM.opacity = d.mode === 'chase' ? 0.12 : 0.06;
    }));
    container.classList.toggle('gx-chased', chased && state.mode === 'play');
    if (chased && state.mode === 'play' && t - lastBeat > 0.55) { lastBeat = t; sfx.beat(); }
    spinners.forEach((s) => { s.rotation.y += dt * 0.6; s.rotation.x += dt * 0.25; });
    $('.gx-lock').hidden = !(state.mode === 'play' && document.pointerLockElement !== canvas);
    // iluminação: só as salas próximas têm luz (poupa o processador gráfico)
    rooms.forEach((rm, k) => {
      const nearR = Math.abs(k - i) <= 1, rl = rec[k], lk = rl.lockdown && !rl.done;
      if (!nearR) { rm.light.intensity = 0; rm.fill.intensity = 0; return; }
      if (rm.dark) { rm.light.color.set(0xff2a2a); rm.light.intensity = 10 + Math.max(0, Math.sin(t * 2.2)) * 10; rm.fill.intensity = 0; rm.strip.emissiveIntensity = 0.25; rm.panel.emissiveIntensity = 0.05; return; }
      rm.strip.emissiveIntensity = 1.6; rm.panel.emissiveIntensity = 1.1;
      if (lk) { rm.light.color.copy(RED); rm.light.intensity = 40 + Math.max(0, Math.sin(t * 6)) * 60; rm.fill.intensity = 6; return; }
      rm.light.color.set(rm.color); rm.fill.intensity = 24;
      rm.light.intensity = 86 + Math.sin(t * 1.3 + k) * 4 + (rm.door.open ? 0 : Math.max(0, Math.sin(t * 7 + k * 3)) * (k === i ? 0 : 8));
    });
    endRoom.light.intensity = Math.abs(levels.length - i) <= 1 ? 60 + Math.sin(t * 3) * 20 : 0;
    endRoom.fill.intensity = 0; endRoom.light.color.set(0xf43f5e);
    dust.rotation.y = Math.sin(t * 0.05) * 0.02;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now; // tolera computadores lentos
    step(dt, now / 1000);
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  // Fim da missão: completa (chegou à saída) ou falhada (o tempo de uma sala chegou a 0).
  function endRun(failedRoom) {
    state.finished = true;
    const played = rec.map((r, i) => ({ r, i })).filter(({ i }) => i >= start && (rec[i].started || rec[i].done));
    const score = totalScore(), time = Math.round(played.reduce((s, { r }) => s + r.used, 0));
    const rooms = rec.filter((r, i) => i >= start && r.done).length, complete = failedRoom === undefined;
    const ranked = !!opts.ranked && start === 0;
    const rows = played.map(({ r, i }) => `<tr${i === failedRoom ? ' class="bad"' : ''}><td>${i + 1}. ${esc(levels[i].name)}</td><td>${r.tasks}/${levels[i].tasks.length}</td><td>${i === failedRoom ? 'esgotado' : mmss(r.used)}</td><td>${r.caught + r.alarms + r.hints + r.wrong || '—'}</td><td><b>${r.done ? r.score : scoreOf(i).tasks - scoreOf(i).pen > 0 ? scoreOf(i).tasks - scoreOf(i).pen : 0}</b></td></tr>`).join('');
    const N = levels.length, level = complete ? 'Missão completa' : `Sala ${failedRoom + 1} de ${N} (${rooms} concluída${rooms === 1 ? '' : 's'})`;
    const extra = `<table class="gx-res"><thead><tr><th>Sala</th><th>Tarefas</th><th>Tempo</th><th>Penalizações</th><th>Pontos</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td>Total · ${esc(level)}</td><td></td><td>${mmss(time)}</td><td></td><td><b>${score}</b></td></tr></tfoot></table>
      <p class="gx-rank">${ranked ? 'A registar a pontuação…' : 'Modo treino: comece a missão na sala 1 para entrar na tabela de pontuações máximas.'}</p>
      ${opts.loadBoard ? '<h3 class="gx-bh">🏆 Pontuações máximas</h3><div class="gx-bt"></div>' : ''}
      <button class="gx-go" data-a="again" style="margin-right:8px">Jogar de novo (novos códigos)</button>`;
    const lines = complete ? story.end : [`A NEXUS fechou a sala ${failedRoom + 1} — ${levels[failedRoom].name}. O bloqueio total tornou-se definitivo.`, `Chegou à sala ${failedRoom + 1} de ${N} e concluiu ${rooms} sala${rooms === 1 ? '' : 's'}. Os pontos que já ganhou contam para a tabela.`];
    storyScreen(lines, complete ? `Missão concluída · ${score} pontos` : `Tempo esgotado · ${score} pontos`, 'Sair do jogo', () => opts.onExit && opts.onExit(), extra);
    const p = $('[data-p="story"]');
    p.querySelector('[data-a="again"]').onclick = () => opts.onRestart && opts.onRestart();
    const bt = p.querySelector('.gx-bt');
    if (complete) sfx.ok(); else { sfx.caught(); setTimeout(() => sfx.alarm(), 400); }
    const done = opts.onRunEnd ? Promise.resolve(opts.onRunEnd({ score, time, rooms, complete, ranked })).then((msg) => { if (msg) p.querySelector('.gx-rank').textContent = msg; }).catch(() => {}) : Promise.resolve();
    if (bt) done.then(() => fillBoard(bt));
  }
  function finish() { endRun(); }
  function gameOver(i) {
    if (state.finished) return;
    flash('rgba(239,68,68,.7)'); log('Tempo esgotado. A NEXUS selou a sala.', 'NEXUS', 'nexus');
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    endRun(i);
  }

  /* ---------- arranque ---------- */
  setupQuality(); updateHud(); updateClock(); updateEmp();
  raf = requestAnimationFrame(frame);
  const rules = `<p class="gx-rules">⏱ Cada sala tem um tempo-limite: quanto mais depressa, mais pontos. <b>Se o tempo de uma sala chegar a 0, a missão termina</b> — nos últimos ${ALERT} s a NEXUS ativa o bloqueio total. Cada tarefa vale ${500} pontos; dicas, capturas, alarmes e códigos errados descontam. Os códigos mudam em cada jogo.</p><p class="gx-rules">Cápsulas: <span style="color:#4ade80">⧗ verde</span> +${TIME_BONUS} s · <span style="color:#c084fc">◆ roxa</span> para o relógio ${CLOCK_STOP} s · <span style="color:#38bdf8">◆ azul</span> pulso EMP.</p>${CONTROLS}`;
  if (start === 0) storyScreen(story.intro, story.title, opts.ranked ? 'Iniciar missão' : 'Iniciar treino', () => play(), rules);
  else storyScreen([`Regressa à sala ${start + 1}: ${levels[start].name}.`, 'Modo treino: a pontuação só conta para a tabela de melhores jogadores quando a missão começa na sala 1.'], story.title, 'Continuar missão', () => play(), rules);

  return {
    // Diagnóstico (só usado nos testes automáticos, com ?nxdebug no endereço).
    debug: {
      teleport(i, x, dz, yawDeg = 0) { yaw.position.set(x, EYE, rooms[i].cz - dz); yaw.rotation.y = (yawDeg * Math.PI) / 180; pitch.rotation.x = 0; },
      levels, menu: () => menu(), safe(v = true) { state.safe = v; },
      setTime(i, s) { rec[i].left = s; },
      solve(i) { const t = currentTask(i); if (t) completeTask(i, t); },
      info: () => ({
        mode: state.mode, room: state.room, near: near && near.kind, emp: state.emp, frozen: state.now < state.frozenUntil,
        doors: rooms.map((r) => r.door.open), barriers: rooms.map((r) => r.barrier.on), dark: rooms.map((r) => r.dark),
        drones: rooms.map((r) => r.drones.map((d) => d.active)), chasing: rooms.map((r) => r.drones.filter((d) => d.mode === 'chase').length),
        lasers: rooms.map((r) => r.lasers.map((l) => l.on)), tasks: [...state.tdone], score: totalScore(),
        rec: rec.map((r) => ({ left: Math.round(r.left), started: r.started, done: r.done, lockdown: r.lockdown, caught: r.caught, score: r.score })),
        pickups: pickups.map((k) => ({ kind: k.kind, room: k.room, x: k.x, z: k.z, taken: k.taken })), clockStop: state.now < state.clockStop,
        pos: [yaw.position.x, yaw.position.z], finished: state.finished,
      }),
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
