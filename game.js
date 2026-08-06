(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const quick = Boolean(window.__QUICK__) || new URLSearchParams(location.search).has('quick');
  const W = 1280, H = 720;
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');

  const ASSETS = {
    far: 'assets/backgrounds/far.png',
    mid: 'assets/backgrounds/mid.png',
    foreground: 'assets/backgrounds/foreground.png',
    ricky: 'assets/characters/ricky.png',
    bubbles: 'assets/characters/bubbles.png',
    julian: 'assets/characters/julian.png',
    car: 'assets/vehicle/shitmobile.png',
    carDamaged: 'assets/vehicle/shitmobile_damaged.png',
    carUpgraded: 'assets/vehicle/shitmobile_upgraded.png',
    platform: 'assets/layers/scrap_platform.svg',
    workshop: 'assets/layers/workshop_platform.svg',
    axle: 'assets/layers/emergency_axle.svg',
    chainsaw: 'assets/weapons/chainsaw.svg',
    nailgun: 'assets/weapons/nailgun.svg',
    rocket: 'assets/weapons/rocket.svg',
    flamer: 'assets/weapons/flamer.svg',
    boomerang: 'assets/weapons/boomerang.svg',
    drunk: 'assets/enemies/drunk_runner.png',
    bottle: 'assets/enemies/bottle_punk.png',
    bruiser: 'assets/enemies/scrap_bruiser.png',
    raccoon: 'assets/enemies/raccoon_swarm.png',
    agent: 'assets/enemies/seizure_agent.png'
  };

  const CHARACTERS = {
    ricky: { name: 'Ricky', ability: 'Shitstorm Barrage', cooldown: 22, color: '#c45c31' },
    bubbles: { name: 'Bubbles', ability: 'Emergency Rebuild', cooldown: 25, color: '#61755d' },
    julian: { name: 'Julian', ability: 'Plan B Shield', cooldown: 24, color: '#383f3e' }
  };

  const WEAPONS = {
    chainsaw: { name: 'Shopping-Cart Chainsaw', rate: .08, range: 168, damage: 7.2, value: 1 },
    nailgun: { name: 'Nail Gun', rate: .22, range: 720, damage: 17, speed: 650, value: 2 },
    rocket: { name: 'Bottle Rocket Rack', rate: 1.35, range: 910, damage: 70, speed: 340, splash: 110, value: 4 },
    flamer: { name: 'Propane Flamethrower', rate: .10, range: 330, damage: 8.5, value: 3 },
    boomerang: { name: 'Duct-Tape Boomerang', rate: .95, range: 650, damage: 38, speed: 430, value: 3 }
  };

  const ENEMIES = {
    drunk: { hp: 72, speed: 88, damage: 13, rate: .85, size: 112, reward: 1, target: 'bottom' },
    bottle: { hp: 92, speed: 51, damage: 17, rate: 1.8, size: 103, reward: 1, target: 'random', ranged: true },
    bruiser: { hp: 270, speed: 34, damage: 38, rate: 1.35, size: 146, reward: 2, target: 'bottom' },
    raccoon: { hp: 76, speed: 104, damage: 12, rate: .62, size: 88, reward: 1, target: 'top', climber: true },
    agent: { hp: 210, speed: 43, damage: 24, rate: 1.35, size: 135, reward: 2, target: 'valuable', ranged: true }
  };

  const images = {};
  let selected = 'ricky';
  let state = 'menu';
  let run = null;
  let last = performance.now();
  let globalTime = 0;
  let audioCtx = null;
  let muted = false;
  let bannerTimer = 0;

  function loadImages() {
    return Promise.all(Object.entries(ASSETS).map(([key, src]) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => { console.warn('Asset failed', src); resolve(); };
      img.src = src;
    })));
  }

  function setScreen(name) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    $(name).classList.add('active');
    state = name;
  }

  function layerY(index) {
    const baseY = 590;
    return baseY - index * 126;
  }

  function makeLayer(kind, weapon, name, hp) {
    return {
      id: `${kind}-${Math.random().toString(36).slice(2)}`,
      kind, weapon, name, maxHp: hp, hp,
      fireTimer: rand(0, .4), dropOffset: 0, recoil: 0,
      shield: 0, disabled: 0, flash: 0
    };
  }

  function createRun() {
    const bonus = selected === 'julian' ? 1.18 : 1;
    const duration = quick ? 48 : 105;
    return {
      elapsed: 0,
      duration,
      scroll: 0,
      scrollSpeed: 132,
      layers: [
        makeLayer('base', 'chainsaw', 'Shitmobile chassis', Math.round(250 * bonus)),
        makeLayer('platform', 'nailgun', 'Shopping-cart deck', Math.round(145 * bonus))
      ],
      enemies: [], projectiles: [], enemyProjectiles: [], particles: [],
      scrap: 0, scrapGoal: 6, repairKits: 2,
      spawnTimer: 1, difficulty: 1, kills: 0, damage: 0,
      abilityCooldown: 0, stun: 0, shieldTime: 0, collapseTime: 0,
      paused: false, over: false, won: false,
      buildQueued: false, boss: null, bossTriggered: false,
      shake: 0, flash: 0, emergencyAxle: false, buildCount: 0,
      lastSpawnType: '', tutorialBuildShown: false
    };
  }

  function startRun() {
    run = createRun();
    setScreen('game');
    $('driver-img').src = ASSETS[selected];
    $('driver-name').textContent = CHARACTERS[selected].name;
    $('ability-title').textContent = CHARACTERS[selected].ability;
    closeAllModals();
    announce('Two decks. Keep them alive.');
    beep(120, .08, 'sawtooth', .025);
    updateHud();
  }

  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  }

  function pauseGame(force) {
    if (!run || run.over || state !== 'game') return;
    run.paused = force ?? !run.paused;
    $('pause-modal').classList.toggle('hidden', !run.paused);
  }

  function returnMenu() {
    closeAllModals();
    run = null;
    setScreen('menu');
  }

  function targetLayerIndex(mode) {
    if (!run.layers.length) return -1;
    if (mode === 'bottom') return 0;
    if (mode === 'top') return run.layers.length - 1;
    if (mode === 'random') return Math.floor(Math.random() * run.layers.length);
    if (mode === 'valuable') {
      let best = 0;
      run.layers.forEach((l, i) => {
        if (WEAPONS[l.weapon].value > WEAPONS[run.layers[best].weapon].value) best = i;
      });
      return best;
    }
    return 0;
  }

  function spawnEnemy(type) {
    const d = ENEMIES[type];
    const targetIndex = targetLayerIndex(d.target);
    run.enemies.push({
      id: Math.random().toString(36).slice(2), type, x: W + rand(30, 170), y: 625,
      hp: d.hp * run.difficulty, maxHp: d.hp * run.difficulty,
      attackTimer: rand(.2, d.rate), targetLayerId: run.layers[targetIndex]?.id,
      dead: false, flash: 0, burn: 0, slow: 0, climb: 0
    });
  }

  function chooseSpawn() {
    const t = run.elapsed;
    const pool = ['drunk', 'drunk', 'bottle'];
    if (t > 15) pool.push('raccoon');
    if (t > 25) pool.push('bruiser');
    if (t > 42) pool.push('agent');
    let type = pick(pool);
    if (type === run.lastSpawnType && Math.random() < .45) type = pick(pool);
    run.lastSpawnType = type;
    spawnEnemy(type);
  }

  function findLayerIndexById(id) {
    const i = run.layers.findIndex(l => l.id === id);
    return i >= 0 ? i : 0;
  }

  function damageLayer(index, amount, source = '') {
    const layer = run.layers[index];
    if (!layer || run.over) return;
    if (run.shieldTime > 0 || layer.shield > 0) amount *= .22;
    layer.hp -= amount;
    layer.flash = .16;
    run.flash = Math.max(run.flash, .08);
    run.shake = Math.max(run.shake, Math.min(12, amount * .16));
    beep(55, .035, 'square', .012);
    if (layer.hp <= 0) destroyLayer(index, source);
  }

  function destroyLayer(index, source) {
    const lost = run.layers[index];
    if (!lost) return;
    const wasBase = lost.kind === 'base';
    const drop = 126;
    for (let i = index + 1; i < run.layers.length; i++) run.layers[i].dropOffset -= drop;
    run.layers.splice(index, 1);
    run.collapseTime = .95;
    run.stun = 1.05;
    run.shake = 22;
    if (wasBase && run.layers.length) run.emergencyAxle = true;
    for (const layer of run.layers) {
      layer.hp -= Math.max(5, layer.maxHp * .08);
      if (layer.hp < 1) layer.hp = 1;
    }
    burst(330, layerY(index) - 35, '#8b5636', 32, 250);
    announce(`${lost.name} destroyed — stack collapse!`);
    toast(`${WEAPONS[lost.weapon].name} was lost.`);
    beep(45, .42, 'sawtooth', .05);
    if (!run.layers.length) finish(false);
  }

  function repairWeakest() {
    if (!run || run.paused || run.over || run.repairKits <= 0) return;
    const layer = [...run.layers].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (!layer || layer.hp >= layer.maxHp) return toast('Nothing needs duct tape yet.');
    const mult = selected === 'bubbles' ? 1.45 : 1;
    const heal = layer.maxHp * .34 * mult;
    layer.hp = Math.min(layer.maxHp, layer.hp + heal);
    run.repairKits--;
    burst(315, layerY(run.layers.indexOf(layer)) - 40, '#b7d68c', 18, 100);
    toast(`${layer.name} repaired.`);
    beep(280, .16, 'triangle', .025);
  }

  function useAbility() {
    if (!run || run.paused || run.over || run.abilityCooldown > 0) return;
    const c = CHARACTERS[selected];
    run.abilityCooldown = c.cooldown;
    if (selected === 'ricky') {
      run.enemies.forEach((e, i) => {
        if (!e.dead) setTimeout(() => {
          if (!run || e.dead) return;
          explode(e.x, e.y - 30, 120, 95);
        }, i * 60);
      });
      if (run.boss) run.boss.hp -= 210;
      announce('Shitstorm barrage!');
    } else if (selected === 'julian') {
      run.shieldTime = 8;
      run.layers.forEach(l => l.shield = 8);
      announce('Plan B — all decks shielded');
    } else {
      const recentlyLost = run.layers.length < 3;
      if (recentlyLost) {
        const hp = Math.round(105 * (selected === 'julian' ? 1.18 : 1));
        run.layers.push(makeLayer('workshop', 'nailgun', 'Rebuilt workshop deck', hp));
        run.layers[run.layers.length - 1].dropOffset = -160;
        run.emergencyAxle = !run.layers.some(l => l.kind === 'base');
        announce('Bubbles rebuilt a deck');
      } else {
        run.layers.forEach(l => l.hp = Math.min(l.maxHp, l.hp + l.maxHp * .28));
        announce('Bubble Bot repairs all decks');
      }
    }
    beep(440, .25, 'sawtooth', .035);
  }

  function fireWeapons(dt) {
    if (run.stun > 0) return;
    run.layers.forEach((layer, index) => {
      if (layer.disabled > 0) return;
      const w = WEAPONS[layer.weapon];
      layer.fireTimer -= dt;
      layer.recoil = Math.max(0, layer.recoil - dt * 5);
      if (layer.fireTimer > 0) return;
      const origin = { x: 455, y: layerY(index) - (layer.kind === 'base' ? 68 : 72) + layer.dropOffset };
      const targets = run.enemies.filter(e => !e.dead && e.x > origin.x - 20);
      if (run.boss && !run.boss.dead) targets.push(run.boss);
      const nearest = targets.sort((a, b) => Math.abs(a.x - origin.x) - Math.abs(b.x - origin.x))[0];
      if (!nearest || nearest.x - origin.x > w.range) return;
      layer.fireTimer = w.rate;
      layer.recoil = 1;
      if (layer.weapon === 'chainsaw') {
        for (const e of run.enemies) {
          if (!e.dead && e.x - origin.x < w.range && Math.abs(e.y - 620) < 80) hitEnemy(e, w.damage, 'chainsaw');
        }
        if (run.boss && run.boss.x - origin.x < w.range) hitBoss(w.damage * .7);
        burst(origin.x + 105, 602, '#d8d2c2', 2, 45);
        layer.fireTimer = .08;
      } else if (layer.weapon === 'flamer') {
        for (const e of run.enemies) {
          const dy = Math.abs((e.y - ENEMIES[e.type].size * .4) - origin.y);
          if (!e.dead && e.x > origin.x && e.x - origin.x < w.range && dy < 150) {
            hitEnemy(e, w.damage, 'fire'); e.burn = Math.max(e.burn, 2.8);
          }
        }
        if (run.boss && run.boss.x - origin.x < w.range) hitBoss(w.damage);
        run.particles.push({ x: origin.x + 40, y: origin.y, vx: rand(220, 390), vy: rand(-55, 55), life: .45, maxLife: .45, color: '#ed8b35', size: rand(10, 21), flame: true });
        layer.fireTimer = .09;
      } else {
        const dx = nearest.x - origin.x;
        const targetY = nearest === run.boss ? nearest.y + 80 : nearest.y - ENEMIES[nearest.type].size * .55;
        const dy = targetY - origin.y;
        const len = Math.hypot(dx, dy) || 1;
        run.projectiles.push({
          kind: layer.weapon, x: origin.x, y: origin.y,
          vx: dx / len * w.speed, vy: dy / len * w.speed,
          damage: w.damage * (selected === 'ricky' && layer.weapon === 'rocket' ? 1.25 : 1),
          life: 2.8, targetId: nearest.id || 'boss', outbound: true, ownerLayerId: layer.id
        });
        beep(layer.weapon === 'rocket' ? 110 : 210, .035, 'square', .008);
      }
    });
  }

  function updateProjectiles(dt) {
    for (const p of run.projectiles) {
      p.life -= dt;
      if (p.kind === 'boomerang') {
        if (p.outbound && (p.x > 980 || p.life < 1.55)) { p.outbound = false; p.vx = -Math.abs(p.vx); }
        if (!p.outbound) {
          const ownerIndex = findLayerIndexById(p.ownerLayerId);
          const oy = layerY(ownerIndex) - 70;
          const dx = 455 - p.x, dy = oy - p.y, l = Math.hypot(dx, dy) || 1;
          p.vx += dx / l * 650 * dt; p.vy += dy / l * 650 * dt;
          if (Math.abs(dx) < 35 && Math.abs(dy) < 35) p.life = 0;
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'rocket') p.vy += 34 * dt;
      let hit = false;
      for (const e of run.enemies) {
        if (e.dead) continue;
        const size = ENEMIES[e.type].size;
        if (Math.hypot(p.x - e.x, p.y - (e.y - size * .45)) < size * .32 + 12) {
          if (p.kind === 'rocket') explode(p.x, p.y, WEAPONS.rocket.splash, p.damage);
          else hitEnemy(e, p.damage, p.kind);
          if (p.kind !== 'boomerang') { p.life = 0; hit = true; }
          else p.outbound = false;
          break;
        }
      }
      if (!hit && run.boss && !run.boss.dead && Math.hypot(p.x - run.boss.x, p.y - (run.boss.y + 70)) < 95) {
        if (p.kind === 'rocket') explode(p.x, p.y, 120, p.damage);
        else hitBoss(p.damage);
        if (p.kind !== 'boomerang') p.life = 0; else p.outbound = false;
      }
    }
    run.projectiles = run.projectiles.filter(p => p.life > 0 && p.x < 1450 && p.x > -100 && p.y > -100 && p.y < 820);
  }

  function hitEnemy(e, amount, kind) {
    if (e.dead) return;
    e.hp -= amount;
    e.flash = .08;
    run.damage += amount;
    if (kind === 'fire') e.burn = Math.max(e.burn, 2.4);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true; e.deathTime = .5;
    run.kills++;
    run.scrap += ENEMIES[e.type].reward;
    burst(e.x, e.y - 40, '#7b4b32', 12, 120);
    if (Math.random() < .07) { run.repairKits++; toast('Found a repair kit.'); }
    if (run.scrap >= run.scrapGoal && !run.buildQueued) {
      run.buildQueued = true;
      $('build-ready').classList.remove('hidden');
      if (!run.tutorialBuildShown) { toast('Six scrap: add a deck or improve the stack.'); run.tutorialBuildShown = true; }
    }
  }

  function explode(x, y, radius, damage) {
    for (const e of run.enemies) {
      if (!e.dead) {
        const d = Math.hypot(e.x - x, (e.y - 50) - y);
        if (d < radius) hitEnemy(e, damage * (1 - d / radius * .55), 'explosion');
      }
    }
    if (run.boss && Math.hypot(run.boss.x - x, run.boss.y + 70 - y) < radius + 70) hitBoss(damage * .8);
    burst(x, y, '#e78536', 26, 240);
    run.shake = Math.max(run.shake, 11);
    beep(65, .16, 'sawtooth', .035);
  }

  function hitBoss(amount) {
    const b = run.boss;
    if (!b || b.dead) return;
    b.hp -= amount; b.flash = .1; run.damage += amount;
    if (b.hp <= 0) { b.dead = true; finish(true); }
  }

  function updateEnemies(dt) {
    for (const e of run.enemies) {
      if (e.dead) { e.deathTime -= dt; continue; }
      const d = ENEMIES[e.type];
      e.flash = Math.max(0, e.flash - dt);
      if (e.burn > 0) { e.burn -= dt; e.hp -= 7 * dt; if (e.hp <= 0) killEnemy(e); }
      if (e.dead) continue;
      let targetIndex = findLayerIndexById(e.targetLayerId);
      if (!run.layers[targetIndex]) targetIndex = targetLayerIndex(d.target);
      e.targetLayerId = run.layers[targetIndex]?.id;
      const targetY = layerY(targetIndex) - (run.layers[targetIndex]?.kind === 'base' ? 40 : 58);
      if (d.climber && e.x < 610) {
        e.climb = clamp(e.climb + dt * 1.8, 0, 1);
        e.y += (targetY + 80 - e.y) * dt * 4;
      }
      const attackX = d.ranged ? 850 : d.climber ? 525 : 505;
      if (e.x > attackX) e.x -= d.speed * (e.slow > 0 ? .62 : 1) * dt;
      e.attackTimer -= dt;
      if (e.x <= attackX + 5 && e.attackTimer <= 0) {
        e.attackTimer = d.rate;
        if (d.ranged) {
          const sx = e.x - 30, sy = e.y - d.size * .62;
          const tx = 430, ty = targetY;
          const travel = Math.max(.55, (sx - tx) / 520);
          run.enemyProjectiles.push({ x: sx, y: sy, vx: (tx - sx) / travel, vy: (ty - sy) / travel - 120, gravity: 260, life: travel + .25, damage: d.damage, targetLayerId: e.targetLayerId, kind: e.type === 'agent' ? 'paper' : 'bottle' });
        } else {
          damageLayer(targetIndex, d.damage, e.type);
          if (e.type === 'bruiser') burst(490, targetY, '#8c5a3b', 8, 100);
        }
      }
    }
    run.enemies = run.enemies.filter(e => !e.dead || e.deathTime > 0);
  }

  function updateEnemyProjectiles(dt) {
    for (const p of run.enemyProjectiles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x <= 450 && p.life > 0) {
        const index = findLayerIndexById(p.targetLayerId);
        damageLayer(index, p.damage, p.kind);
        burst(p.x, p.y, p.kind === 'paper' ? '#d8cfb2' : '#6d4a33', 8, 90);
        p.life = 0;
      }
    }
    run.enemyProjectiles = run.enemyProjectiles.filter(p => p.life > 0 && p.y < 800);
  }

  function spawnBoss() {
    run.bossTriggered = true;
    run.enemies.length = 0;
    run.boss = { id: 'boss', x: 1380, y: 370, hp: 1500, maxHp: 1500, phase: 1, attackTimer: 2.5, summonTimer: 5, flash: 0, dead: false };
    $('boss-hud').classList.remove('hidden');
    announce('Government seizure captain');
  }

  function updateBoss(dt) {
    const b = run.boss;
    if (!b || b.dead) return;
    b.flash = Math.max(0, b.flash - dt);
    if (b.x > 995) b.x -= 70 * dt;
    const ratio = b.hp / b.maxHp;
    b.phase = ratio < .35 ? 3 : ratio < .68 ? 2 : 1;
    b.attackTimer -= dt;
    b.summonTimer -= dt;
    if (b.attackTimer <= 0 && b.x <= 1010) {
      b.attackTimer = b.phase === 3 ? 1.05 : b.phase === 2 ? 1.45 : 1.9;
      const targets = b.phase === 1 ? [targetLayerIndex('valuable')] : b.phase === 2 ? [0, run.layers.length - 1] : run.layers.map((_, i) => i);
      [...new Set(targets)].forEach((index, n) => {
        const layer = run.layers[index]; if (!layer) return;
        setTimeout(() => {
          if (!run || run.over || !run.layers.length) return;
          const actual = findLayerIndexById(layer.id);
          damageLayer(actual, 24 + b.phase * 7, 'boss');
          burst(430, layerY(actual) - 45, '#b6b0a0', 18, 160);
        }, n * 120);
      });
    }
    if (b.summonTimer <= 0) {
      b.summonTimer = b.phase === 3 ? 4 : 6;
      spawnEnemy(b.phase === 1 ? 'drunk' : Math.random() < .5 ? 'raccoon' : 'agent');
    }
  }

  function openBuild() {
    if (!run || run.paused || run.over || run.scrap < run.scrapGoal) return;
    run.paused = true;
    const options = [];
    if (run.layers.length < 3) {
      $('build-title').textContent = 'Add the third layer';
      options.push(
        { id: 'add-rocket', img: ASSETS.rocket, title: 'Rocket deck', text: '120 HP. Slow splash damage from the top of the stack.', tag: 'Bottle rockets' },
        { id: 'add-flamer', img: ASSETS.flamer, title: 'Flamethrower deck', text: '145 HP. Short-range crowd control and burning damage.', tag: 'Propane fire' },
        { id: 'add-boomerang', img: ASSETS.boomerang, title: 'Boomerang deck', text: '130 HP. A returning projectile can hit enemies twice.', tag: 'Duct-tape tech' }
      );
    } else {
      $('build-title').textContent = 'Rework the stack';
      options.push(
        { id: 'reinforce', img: ASSETS.platform, title: 'Reinforce bottom', text: 'Add 70 maximum HP and fully restore the lowest deck.', tag: 'Keep the base alive' },
        { id: 'replace-rocket', img: ASSETS.rocket, title: 'Install rockets', text: 'Replace the weakest weapon with a bottle-rocket rack.', tag: 'Splash damage' },
        { id: 'field-repair', img: ASSETS.workshop, title: 'Full field repair', text: 'Restore 55% health to every surviving deck.', tag: 'Stabilize the stack' }
      );
    }
    $('build-options').innerHTML = options.map(o => `<button class="build-option" data-choice="${o.id}"><img src="${o.img}" alt=""><div><h3>${o.title}</h3><p>${o.text}</p><small>${o.tag}</small></div></button>`).join('');
    $('build-options').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => applyBuild(btn.dataset.choice), { once: true }));
    $('build-modal').classList.remove('hidden');
  }

  function applyBuild(choice) {
    run.scrap -= run.scrapGoal;
    run.scrapGoal = Math.min(9, run.scrapGoal + 1);
    run.buildQueued = run.scrap >= run.scrapGoal;
    run.buildCount++;
    if (choice.startsWith('add-')) {
      const weapon = choice.replace('add-', '');
      const hp = weapon === 'flamer' ? 145 : weapon === 'boomerang' ? 130 : 120;
      const kind = weapon === 'flamer' ? 'workshop' : 'platform';
      const layer = makeLayer(kind, weapon, weapon === 'rocket' ? 'Rocket rack deck' : weapon === 'flamer' ? 'Propane workshop' : 'Boomerang platform', hp * (selected === 'julian' ? 1.18 : 1));
      layer.dropOffset = -185;
      run.layers.push(layer);
      announce('Third deck welded on');
    } else if (choice === 'reinforce') {
      const l = run.layers[0]; l.maxHp += 70; l.hp = l.maxHp; announce('Bottom deck reinforced');
    } else if (choice === 'replace-rocket') {
      const target = [...run.layers].sort((a, b) => WEAPONS[a.weapon].value - WEAPONS[b.weapon].value)[0];
      target.weapon = 'rocket'; target.fireTimer = .3; announce('Rocket rack installed');
    } else if (choice === 'field-repair') {
      run.layers.forEach(l => l.hp = Math.min(l.maxHp, l.hp + l.maxHp * .55)); announce('Stack patched up');
    }
    $('build-modal').classList.add('hidden');
    $('build-ready').classList.toggle('hidden', !run.buildQueued);
    run.paused = false;
    beep(320, .2, 'square', .025);
  }

  function update(dt) {
    if (!run || run.paused || run.over) return;
    run.elapsed += dt;
    run.scroll += run.scrollSpeed * dt;
    run.difficulty = 1 + run.elapsed / run.duration * .75;
    run.abilityCooldown = Math.max(0, run.abilityCooldown - dt);
    run.stun = Math.max(0, run.stun - dt);
    run.collapseTime = Math.max(0, run.collapseTime - dt);
    run.shieldTime = Math.max(0, run.shieldTime - dt);
    run.shake = Math.max(0, run.shake - dt * 28);
    run.flash = Math.max(0, run.flash - dt * 3);
    for (const layer of run.layers) {
      layer.dropOffset += (0 - layer.dropOffset) * Math.min(1, dt * 7);
      layer.flash = Math.max(0, layer.flash - dt);
      layer.shield = Math.max(0, layer.shield - dt);
      layer.disabled = Math.max(0, layer.disabled - dt);
    }

    if (!run.bossTriggered) {
      run.spawnTimer -= dt;
      if (run.spawnTimer <= 0) {
        chooseSpawn();
        if (run.elapsed > 28 && Math.random() < .22) chooseSpawn();
        run.spawnTimer = Math.max(.48, 1.65 - run.elapsed / run.duration * .82) * rand(.75, 1.2);
      }
      if (run.elapsed >= run.duration * .72) spawnBoss();
    }

    fireWeapons(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updateEnemyProjectiles(dt);
    updateBoss(dt);
    updateParticles(dt);
    if (run.bossTriggered && run.boss?.dead) finish(true);
    updateHud();
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(speed * .25, speed);
      run.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * .2, life: rand(.25, .75), maxLife: .75, color, size: rand(2, 7) });
    }
  }

  function updateParticles(dt) {
    for (const p of run.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.flame ? -45 : 260) * dt; p.vx *= .985;
    }
    run.particles = run.particles.filter(p => p.life > 0);
  }

  function drawImageLoop(img, speed, y, height, alpha = 1) {
    if (!img) return;
    const ratio = img.width / img.height;
    const width = height * ratio;
    const offset = -((run.scroll * speed) % width);
    ctx.save(); ctx.globalAlpha = alpha;
    for (let x = offset - width; x < W + width; x += width) ctx.drawImage(img, x, y, width, height);
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = '#8fb9c2'; ctx.fillRect(0, 0, W, H);
    drawImageLoop(images.far, .16, 0, 720, 1);
    drawImageLoop(images.mid, .44, 82, 625, .88);
    ctx.fillStyle = 'rgba(196,206,195,.10)'; ctx.fillRect(0,245,W,260);
    ctx.fillStyle = '#59534a'; ctx.fillRect(0, 620, W, 100);
    ctx.fillStyle = '#777064';
    for (let i = 0; i < 14; i++) {
      const x = ((i * 140 - run.scroll * 1.15) % 1540 + 1540) % 1540 - 80;
      ctx.fillRect(x, 674 + (i % 2) * 8, 72, 6);
    }
  }

  function drawStack() {
    const baseExists = run.layers.some(l => l.kind === 'base');
    const base = run.layers.find(l => l.kind === 'base');
    if (base) {
      const i = run.layers.indexOf(base);
      const hpRatio = base.hp / base.maxHp;
      const img = hpRatio < .35 ? images.carDamaged : run.layers.length === 3 ? images.carUpgraded : images.car;
      const y = layerY(i) - 136 + base.dropOffset;
      const driver = images[selected];
      ctx.save();
      ctx.beginPath(); ctx.rect(331, y + 38, 76, 58); ctx.clip();
      if (driver) ctx.drawImage(driver, 322, y + 6, 92, 155);
      ctx.restore();
      if (img) ctx.drawImage(img, 80, y, 470, 142);
    }
    if (!baseExists && run.layers.length && images.axle) ctx.drawImage(images.axle, 115, 565, 390, 93);

    run.layers.forEach((layer, index) => {
      const y = layerY(index) + layer.dropOffset;
      if (layer.kind !== 'base') {
        const img = layer.kind === 'workshop' ? images.workshop : images.platform;
        if (img) ctx.drawImage(img, 150, y - 116, 350, 125);
      }
      drawLayerWeapon(layer, index, y);
      drawLayerHpWorld(layer, y);
      if (layer.flash > 0) {
        ctx.fillStyle = `rgba(255,245,210,${layer.flash * 2.5})`;
        ctx.fillRect(150, y - 118, 350, 115);
      }
      if (run.shieldTime > 0 || layer.shield > 0) {
        ctx.strokeStyle = `rgba(123,221,228,${.45 + Math.sin(globalTime * 8) * .18})`;
        ctx.lineWidth = 5; ctx.strokeRect(140, y - 124, 372, 126);
      }
    });

    if (run.collapseTime > 0) {
      ctx.fillStyle = `rgba(235,195,91,${run.collapseTime * .18})`;
      ctx.fillRect(70, 180, 480, 500);
    }
  }

  function drawLayerWeapon(layer, index, y) {
    const img = images[layer.weapon];
    if (!img) return;
    const recoil = layer.recoil * 10;
    let x = 405 - recoil, wy = y - 92, w = 150, h = 82;
    if (layer.weapon === 'chainsaw') { x = 430; wy = y - 65; w = 175; h = 80; }
    if (layer.weapon === 'flamer') { w = 155; h = 82; }
    ctx.drawImage(img, x, wy, w, h);
    if (layer.weapon === 'chainsaw' && run.stun <= 0) {
      ctx.strokeStyle = 'rgba(230,230,215,.65)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + 153, wy + 43, 29 + Math.sin(globalTime * 18) * 3, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawLayerHpWorld(layer, y) {
    const ratio = clamp(layer.hp / layer.maxHp, 0, 1);
    ctx.fillStyle = '#17110e'; ctx.fillRect(172, y - 133, 215, 12);
    ctx.fillStyle = ratio < .3 ? '#b44332' : ratio < .6 ? '#c58d3f' : '#86aa53';
    ctx.fillRect(174, y - 131, 211 * ratio, 8);
    ctx.fillStyle='#e4c55e';ctx.strokeStyle='#17110e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(140,y-89,16,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#17110e';ctx.font='900 16px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(run.layers.indexOf(layer)+1),140,y-88);
  }

  function drawEnemies() {
    const sorted = [...run.enemies].sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      const d = ENEMIES[e.type];
      const img = images[e.type];
      const bob = Math.sin(globalTime * (e.type === 'raccoon' ? 12 : 6) + e.x * .03) * 3;
      ctx.save();
      if (e.dead) ctx.globalAlpha = clamp(e.deathTime / .5, 0, 1);
      if (e.flash > 0) ctx.filter = 'brightness(1.8) saturate(.35)';
      if (img) ctx.drawImage(img, e.x - d.size * .48, e.y - d.size + bob, d.size, d.size);
      ctx.restore();
      if (!e.dead && e.hp < e.maxHp) {
        ctx.fillStyle = '#1c1511'; ctx.fillRect(e.x - d.size * .28, e.y - d.size - 8, d.size * .56, 6);
        ctx.fillStyle = '#9e4b36'; ctx.fillRect(e.x - d.size * .28 + 1, e.y - d.size - 7, (d.size * .56 - 2) * clamp(e.hp / e.maxHp, 0, 1), 4);
      }
      if (e.burn > 0) {
        ctx.fillStyle = 'rgba(238,117,42,.65)'; ctx.beginPath(); ctx.arc(e.x, e.y - 35, 17 + Math.sin(globalTime * 9) * 5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawBoss() {
    const b = run.boss;
    if (!b || b.dead) return;
    ctx.save(); if (b.flash > 0) ctx.filter = 'brightness(1.8) saturate(.4)';
    const scale = b.phase === 3 ? 1.18 : b.phase === 2 ? 1.08 : 1;
    if (images.agent) ctx.drawImage(images.agent, b.x - 110 * scale, b.y, 220 * scale, 330 * scale);
    ctx.restore();
    if (b.phase >= 2) { ctx.strokeStyle = `rgba(171,55,38,${.35 + Math.sin(globalTime * 6) * .15})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(b.x, b.y + 185, 100 + b.phase * 10, 0, Math.PI * 2); ctx.stroke(); }
  }

  function drawProjectiles() {
    for (const p of run.projectiles) {
      ctx.save(); ctx.translate(p.x, p.y); const a = Math.atan2(p.vy, p.vx); ctx.rotate(a);
      if (p.kind === 'rocket') {
        ctx.fillStyle = '#b94e2e'; ctx.strokeStyle = '#21150f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(15,0);ctx.lineTo(-9,-7);ctx.lineTo(-9,7);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle = '#f0a03f';ctx.beginPath();ctx.moveTo(-7,-5);ctx.lineTo(-25,0);ctx.lineTo(-7,5);ctx.fill();
      } else if (p.kind === 'boomerang') {
        ctx.rotate(globalTime * 14); ctx.strokeStyle='#21150f';ctx.lineWidth=7;ctx.fillStyle='#a8793f';ctx.beginPath();ctx.arc(0,0,14,.2,Math.PI*1.55);ctx.lineTo(2,2);ctx.closePath();ctx.fill();ctx.stroke();
      } else {
        ctx.strokeStyle='#e5dfd0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(4,0);ctx.stroke();
      }
      ctx.restore();
    }
    for (const p of run.enemyProjectiles) {
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(globalTime*7);ctx.fillStyle=p.kind==='paper'?'#ded3b3':'#6d4730';ctx.strokeStyle='#21150f';ctx.lineWidth=3;
      if(p.kind==='paper')ctx.fillRect(-9,-13,18,26);else{ctx.beginPath();ctx.roundRect(-6,-12,12,24,4);ctx.fill();ctx.stroke()}ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of run.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawForeground() {
    drawImageLoop(images.foreground, 1.28, 70, 650, .96);
    ctx.fillStyle = 'rgba(20,15,11,.06)'; ctx.fillRect(0,0,W,H);
  }

  function draw() {
    if (!run || state !== 'game') return;
    const sx = run.shake > 0 ? rand(-run.shake, run.shake) : 0;
    const sy = run.shake > 0 ? rand(-run.shake*.45, run.shake*.45) : 0;
    ctx.save(); ctx.translate(sx, sy);
    drawBackground(); drawForeground(); drawStack(); drawEnemies(); drawBoss(); drawProjectiles(); drawParticles();
    if (run.flash > 0) { ctx.fillStyle = `rgba(176,41,30,${run.flash*.22})`; ctx.fillRect(-20,-20,W+40,H+40); }
    ctx.restore();
  }

  function updateHud() {
    if (!run) return;
    $('distance').textContent = `${Math.min(100, Math.floor(run.elapsed / run.duration * 100))}%`;
    $('scrap').textContent = `${run.scrap} / ${run.scrapGoal}`;
    $('kills').textContent = run.kills;
    $('repair-count').textContent = `${run.repairKits} kit${run.repairKits === 1 ? '' : 's'}`;
    $('repair-btn').disabled = run.repairKits <= 0;
    $('ability-state').textContent = run.abilityCooldown > 0 ? `${run.abilityCooldown.toFixed(run.abilityCooldown > 10 ? 0 : 1)}s` : 'Ready';
    $('ability-btn').disabled = run.abilityCooldown > 0;
    $('layer-count').textContent = `${run.layers.length} / 3`;
    $('layer-list').innerHTML = [...run.layers].reverse().map((l, rev) => {
      const index = run.layers.length - 1 - rev;
      const ratio = clamp(l.hp / l.maxHp,0,1);
      return `<div class="layer-row"><span class="layer-index">${index+1}</span><div><strong><span>${l.name}</span><span>${Math.ceil(l.hp)}/${Math.ceil(l.maxHp)}</span></strong><small>${WEAPONS[l.weapon].name}</small><div class="hp-track"><i class="${ratio<.35?'low':''}" style="width:${ratio*100}%"></i></div></div></div>`;
    }).join('');
    $('build-ready').classList.toggle('hidden', !run.buildQueued || run.paused || run.over);
    if (run.boss) {
      $('boss-fill').style.width = `${clamp(run.boss.hp/run.boss.maxHp,0,1)*100}%`;
      $('boss-phase').textContent = `Phase ${run.boss.phase}`;
    }
  }

  function finish(won) {
    if (!run || run.over) return;
    run.over = true; run.won = won; run.paused = true;
    $('end-kicker').textContent = won ? 'Prototype cleared' : 'Stack destroyed';
    $('end-title').textContent = won ? 'The seizure crew backed off' : 'The road won this one';
    $('end-copy').textContent = won ? 'The three-layer combat loop, targeted damage, and collapse mechanic all survived the run.' : 'The stack lost every surviving deck. Use lower-deck armor and keep a repair kit for collapse damage.';
    $('end-stats').innerHTML = [
      ['Distance', `${Math.min(100,Math.floor(run.elapsed/run.duration*100))}%`],
      ['Kills', run.kills], ['Decks left', run.layers.length], ['Build stops', run.buildCount]
    ].map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('');
    $('end-modal').classList.remove('hidden');
  }

  function announce(text) {
    $('banner').textContent = text; $('banner').classList.remove('hidden');
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => $('banner').classList.add('hidden'), 1700);
  }

  function toast(text) {
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = text; $('toast-stack').appendChild(el); setTimeout(()=>el.remove(),2800);
  }

  function beep(freq, dur, type='sine', volume=.02) {
    if (muted) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(volume,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur); o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
    } catch {}
  }

  function frame(now) {
    const dt = Math.min(.035, (now - last) / 1000 || .016); last = now; globalTime += dt;
    update(dt); draw(); requestAnimationFrame(frame);
  }

  document.querySelectorAll('.character-card').forEach(btn => btn.addEventListener('click', () => {
    selected = btn.dataset.character;
    document.querySelectorAll('.character-card').forEach(b => b.classList.toggle('selected', b === btn));
  }));
  $('start-btn').addEventListener('click', startRun);
  $('how-btn').addEventListener('click', () => $('how-modal').classList.remove('hidden'));
  document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => b.closest('.modal').classList.add('hidden')));
  $('pause-btn').addEventListener('click', () => pauseGame());
  $('resume-btn').addEventListener('click', () => pauseGame(false));
  $('restart-btn').addEventListener('click', startRun);
  $('quit-btn').addEventListener('click', returnMenu);
  $('repair-btn').addEventListener('click', repairWeakest);
  $('ability-btn').addEventListener('click', useAbility);
  $('build-btn').addEventListener('click', openBuild);
  $('again-btn').addEventListener('click', startRun);
  $('menu-btn').addEventListener('click', returnMenu);
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); useAbility(); }
    else if (e.key.toLowerCase() === 'r') repairWeakest();
    else if (e.key.toLowerCase() === 'p' || e.key === 'Escape') pauseGame();
    else if (e.key.toLowerCase() === 'b' && run?.buildQueued) openBuild();
  });
  addEventListener('blur', () => { if (run && !run.over && state === 'game') pauseGame(true); });

  window.__SV_DEBUG__ = {
    getSnapshot: () => run ? { layers: run.layers.map(l => ({ id:l.id,name:l.name,hp:l.hp,maxHp:l.maxHp,weapon:l.weapon })), scrap:run.scrap, kills:run.kills, boss:run.boss?.hp ?? null } : null,
    giveScrap: (n=10) => { if(!run) return; run.scrap += n; run.buildQueued = run.scrap >= run.scrapGoal; updateHud(); },
    damageLayer: (index, amount=999) => { if(run) damageLayer(index, amount, 'debug'); },
    destroyBottom: () => { if(run) damageLayer(0, 9999, 'debug'); },
    spawn: type => { if(run && ENEMIES[type]) spawnEnemy(type); },
    spawnBoss: () => { if(run && !run.bossTriggered) spawnBoss(); },
    killBoss: () => { if(run?.boss) { run.boss.hp=1; hitBoss(10); } }
  };

  loadImages().then(() => {
    $('start-btn').disabled = false;
    requestAnimationFrame(frame);
  });
})();
