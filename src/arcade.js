// Canvas mini-games for the portfolio arcade. Every game draws in a fixed
// 360×480 space that the engine scales to the canvas, and updates on a fixed
// timestep so gameplay feels the same on 60 Hz and 120 Hz screens.
const W = 360;
const H = 480;
const STEP = 1 / 120;
const C = {
  bg: '#061110', grid: '#12302a', accent: '#65f5ce', violet: '#b7a0ff', amber: '#ffc783',
  pink: '#ff7aa8', text: '#e6f0ec', muted: '#9aafa7',
};
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const hash = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}
function text(ctx, value, x, y, { size = 16, color = C.text, align = 'center', weight = 600, mono = false } = {}) {
  ctx.font = `${weight} ${size}px ${mono ? '"Space Mono", monospace' : 'Barlow, sans-serif'}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function circleRect(cx, cy, r, x, y, w, h) {
  const nx = clamp(cx, x, x + w);
  const ny = clamp(cy, y, y + h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}
const near = (a, b, distance) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < distance * distance;
function capsule(ctx, x, y, color, label) {
  ctx.save();
  glow(ctx, color, 12);
  ctx.fillStyle = color;
  roundRect(ctx, x - 13, y - 8, 26, 16, 8);
  ctx.fill();
  ctx.restore();
  text(ctx, label, x, y + 1, { size: 10, color: '#06120f', weight: 700, mono: true });
}
function lifeIcons(ctx, lives, color) {
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = color;
    circle(ctx, 18 + i * 14, 18, 4);
    ctx.fill();
  }
}

function snakeGame() {
  const CELL = 20;
  const COLS = W / CELL;
  const ROWS = H / CELL;
  const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  let body, dir, queue, timer, eaten, food, bonus;
  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const center = (cell) => ({ x: cell.x * CELL + CELL / 2, y: cell.y * CELL + CELL / 2 });
  function freeCell() {
    const free = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const cell = { x, y };
      if (!body.some((part) => same(part, cell)) && !same(food, cell) && !same(bonus, cell)) free.push(cell);
    }
    return free.length ? pick(free) : null;
  }
  return {
    id: 'snake', title: 'Neon Snake', color: C.accent,
    tagline: 'Eat, grow, and never bite your tail.',
    controls: ['ARROWS / WASD TO STEER', 'SWIPE ON TOUCH SCREENS'],
    reset() {
      body = [{ x: 6, y: 12 }, { x: 5, y: 12 }, { x: 4, y: 12 }];
      dir = DIRS.right;
      queue = [];
      timer = 0;
      eaten = 0;
      food = null;
      bonus = null;
      food = freeCell();
    },
    key(name) {
      const next = DIRS[name];
      if (!next) return;
      // Queue turns so quick double-taps register, but never allow a reversal.
      const previous = queue.at(-1) ?? dir;
      if (next === previous || (next.x === -previous.x && next.y === -previous.y)) return;
      if (queue.length < 3) queue.push(next);
    },
    swipe(name) { this.key(name); },
    update(dt, api) {
      if (bonus && (bonus.life -= dt) <= 0) bonus = null;
      timer += dt;
      const interval = Math.max(0.065, 0.14 - eaten * 0.0035);
      if (timer < interval) return;
      timer -= interval;
      if (queue.length) dir = queue.shift();
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      const eats = same(head, food);
      // The tail moves away this step unless the snake is growing.
      const hitsBody = body.slice(0, eats ? body.length : -1).some((part) => same(part, head));
      if (hitsBody || head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) {
        const point = center(body[0]);
        api.burst(point.x, point.y, C.accent, 30, 220);
        api.shake(8, 0.3);
        api.over();
        return;
      }
      body.unshift(head);
      if (eats) {
        eaten++;
        api.addScore(10);
        api.sound('eat');
        const point = center(food);
        api.burst(point.x, point.y, C.pink, 12, 120);
        food = freeCell();
        if (!food) { api.over(); return; }
        const cell = eaten % 5 === 0 && !bonus ? freeCell() : null;
        if (cell) bonus = { ...cell, life: 6 };
      } else body.pop();
      if (same(head, bonus)) {
        api.addScore(50);
        api.sound('coin');
        const point = center(bonus);
        api.burst(point.x, point.y, C.amber, 20, 160);
        bonus = null;
      }
    },
    draw(ctx, api) {
      ctx.fillStyle = C.grid;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
      ctx.save();
      const pulse = 1 + Math.sin(api.clock * 8) * 0.15;
      const foodPoint = center(food);
      glow(ctx, C.pink, 18);
      ctx.fillStyle = C.pink;
      circle(ctx, foodPoint.x, foodPoint.y, 6 * pulse);
      ctx.fill();
      if (bonus && (bonus.life > 2 || Math.sin(api.clock * 24) > 0)) {
        const point = center(bonus);
        glow(ctx, C.amber, 20);
        ctx.fillStyle = C.amber;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = api.clock * 2 + (i * Math.PI) / 5;
          const radius = i % 2 ? 4 : 9;
          ctx.lineTo(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius);
        }
        ctx.fill();
      }
      ctx.restore();
      for (let i = body.length - 1; i >= 0; i--) {
        const part = body[i];
        ctx.save();
        if (i === 0) glow(ctx, C.accent, 16);
        ctx.fillStyle = `hsl(164, 88%, ${68 - (i / body.length) * 34}%)`;
        roundRect(ctx, part.x * CELL + 2, part.y * CELL + 2, CELL - 4, CELL - 4, i === 0 ? 7 : 5);
        ctx.fill();
        ctx.restore();
      }
      const head = center(body[0]);
      ctx.fillStyle = '#06120f';
      for (const side of [-1, 1]) {
        circle(ctx, head.x + dir.x * 3 + dir.y * side * 4, head.y + dir.y * 3 - dir.x * side * 4, 2.2);
        ctx.fill();
      }
    },
  };
}

function breakoutGame() {
  const LEVELS = [
    ['11111111', '11111111', '11111111', '11111111', '11111111'],
    ['22222222', '21111112', '21111112', '21111112', '22222222'],
    ['01111110', '12222221', '12333321', '12333321', '12222221', '01111110'],
    ['30303030', '03030303', '22222222', '22222222', '11111111', '11111111'],
    ['11000011', '22100122', '33211233', '33211233', '22100122', '11000011'],
  ];
  const BW = 38.5;
  const BH = 16;
  const GAP = 4;
  const PADDLE_Y = 440;
  const PH = 10;
  const R = 6;
  const MAX_SPEED = 520;
  const HP_COLORS = ['', C.accent, C.violet, C.amber];
  let paddle, balls, bricks, drops, lives, level, banner, targetX, speed;
  function serve() {
    balls = [{ x: paddle.x, y: PADDLE_Y - R - 1, vx: 0, vy: 0, stuck: true }];
    drops = [];
  }
  function buildLevel() {
    bricks = [];
    LEVELS[(level - 1) % LEVELS.length].forEach((row, r) => [...row].forEach((value, c) => {
      const hp = Number(value);
      if (hp) bricks.push({ x: 12 + c * (BW + GAP), y: 64 + r * (BH + GAP), hp, max: hp, flash: 0 });
    }));
    speed = Math.min(290 + (level - 1) * 25, 440);
    banner = 1.6;
    serve();
  }
  function launch(api) {
    balls.forEach((ball) => {
      if (!ball.stuck) return;
      const angle = rand(-0.45, 0.45);
      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
      ball.stuck = false;
      api.sound('paddle');
    });
  }
  // Keep the ball from settling into slow, almost horizontal bounces.
  function keepAngle(ball) {
    const s = Math.hypot(ball.vx, ball.vy);
    if (Math.abs(ball.vy) >= s * 0.3) return;
    ball.vy = (ball.vy < 0 ? -1 : 1) * s * 0.3;
    ball.vx = (ball.vx < 0 ? -1 : 1) * Math.sqrt(s * s - ball.vy * ball.vy);
  }
  function hitBrick(brick, api) {
    brick.hp--;
    brick.flash = 0.12;
    speed = Math.min(speed + 3, MAX_SPEED);
    if (brick.hp > 0) { api.sound('tick'); return; }
    const x = brick.x + BW / 2;
    const y = brick.y + BH / 2;
    api.addScore(10 * brick.max);
    api.burst(x, y, HP_COLORS[brick.max], 14, 150);
    api.sound('brick');
    if (Math.random() < 0.14) drops.push({ x, y, type: pick(['wide', 'wide', 'multi', 'multi', 'life']) });
  }
  function collect(drop, api) {
    api.sound('power');
    api.addScore(25);
    if (drop.type === 'wide') paddle.wide = 12;
    if (drop.type === 'life') lives = Math.min(5, lives + 1);
    if (drop.type === 'multi') {
      if (balls.every((ball) => ball.stuck)) launch(api);
      const extra = [];
      balls.slice(0, 3).forEach((ball) => {
        const s = Math.hypot(ball.vx, ball.vy);
        const angle = Math.atan2(ball.vx, -ball.vy);
        for (const turn of [-0.4, 0.4]) extra.push({ x: ball.x, y: ball.y, vx: s * Math.sin(angle + turn), vy: -s * Math.cos(angle + turn) });
      });
      balls = balls.concat(extra).slice(0, 8);
    }
  }
  return {
    id: 'breakout', title: 'Brick Breaker', color: C.violet,
    tagline: 'Smash every brick. Catch the power-ups.',
    controls: ['MOUSE, DRAG, OR ARROWS TO MOVE', 'SPACE OR TAP TO LAUNCH'],
    reset() {
      paddle = { x: W / 2, w: 68, wide: 0 };
      lives = 3;
      level = 1;
      targetX = null;
      buildLevel();
    },
    key(name, api) { if (name === 'action' || name === 'up') launch(api); },
    pointer(type, point, api) {
      if (type === 'up') return;
      targetX = point.x;
      if (type === 'down') launch(api);
    },
    update(dt, api) {
      banner = Math.max(0, banner - dt);
      paddle.wide = Math.max(0, paddle.wide - dt);
      paddle.w += ((paddle.wide > 0 ? 104 : 68) - paddle.w) * Math.min(1, dt * 10);
      const move = (api.keys.has('right') ? 1 : 0) - (api.keys.has('left') ? 1 : 0);
      if (move) { targetX = null; paddle.x += move * 460 * dt; } else if (targetX !== null) paddle.x += (targetX - paddle.x) * Math.min(1, dt * 25);
      paddle.x = clamp(paddle.x, paddle.w / 2, W - paddle.w / 2);
      for (const ball of balls) {
        if (ball.stuck) { ball.x = paddle.x; ball.y = PADDLE_Y - R - 1; continue; }
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }
        if (ball.vy > 0 && ball.y + R >= PADDLE_Y && ball.y - R <= PADDLE_Y + PH && Math.abs(ball.x - paddle.x) <= paddle.w / 2 + R) {
          // Where the ball lands on the paddle decides the bounce angle.
          const angle = clamp((ball.x - paddle.x) / (paddle.w / 2), -1, 1) * 1.1;
          ball.vx = speed * Math.sin(angle);
          ball.vy = -speed * Math.cos(angle);
          ball.y = PADDLE_Y - R;
          api.sound('paddle');
        }
        for (const brick of bricks) {
          if (brick.hp <= 0 || !circleRect(ball.x, ball.y, R, brick.x, brick.y, BW, BH)) continue;
          const cx = brick.x + BW / 2;
          const cy = brick.y + BH / 2;
          const overlapX = BW / 2 + R - Math.abs(ball.x - cx);
          const overlapY = BH / 2 + R - Math.abs(ball.y - cy);
          // Bounce along the axis with the smallest overlap and push the ball out.
          if (overlapX < overlapY) {
            const side = ball.x >= cx ? 1 : -1;
            ball.vx = side * Math.abs(ball.vx);
            ball.x += side * overlapX;
          } else {
            const side = ball.y >= cy ? 1 : -1;
            ball.vy = side * Math.abs(ball.vy);
            ball.y += side * overlapY;
          }
          hitBrick(brick, api);
          break;
        }
        keepAngle(ball);
      }
      balls = balls.filter((ball) => ball.y - R < H);
      if (!balls.length) {
        lives--;
        api.shake(8, 0.3);
        if (lives <= 0) { api.over(); return; }
        api.sound('lose');
        paddle.wide = 0;
        serve();
        return;
      }
      for (const drop of drops) {
        drop.y += 120 * dt;
        if (drop.y + 8 >= PADDLE_Y && drop.y - 8 <= PADDLE_Y + PH && Math.abs(drop.x - paddle.x) <= paddle.w / 2 + 13) {
          drop.done = true;
          collect(drop, api);
        }
      }
      drops = drops.filter((drop) => !drop.done && drop.y < H + 10);
      bricks.forEach((brick) => { brick.flash = Math.max(0, brick.flash - dt); });
      if (bricks.every((brick) => brick.hp <= 0)) {
        level++;
        api.addScore(100 * (level - 1));
        api.sound('power');
        buildLevel();
      }
    },
    draw(ctx, api) {
      for (const brick of bricks) {
        if (brick.hp <= 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.45 + (brick.hp / 3) * 0.55;
        ctx.fillStyle = brick.flash > 0 ? '#ffffff' : HP_COLORS[brick.hp];
        roundRect(ctx, brick.x, brick.y, BW, BH, 4);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(brick.x + 4, brick.y + 3, BW - 8, 2);
        ctx.restore();
      }
      drops.forEach((drop) => capsule(ctx, drop.x, drop.y, drop.type === 'life' ? C.pink : drop.type === 'wide' ? C.accent : C.amber, { wide: 'W', multi: 'x3', life: '+1' }[drop.type]));
      ctx.save();
      glow(ctx, paddle.wide > 0 ? C.accent : C.violet, 16);
      ctx.fillStyle = paddle.wide > 0 ? C.accent : C.violet;
      roundRect(ctx, paddle.x - paddle.w / 2, PADDLE_Y, paddle.w, PH, 5);
      ctx.fill();
      glow(ctx, '#ffffff', 14);
      ctx.fillStyle = '#ffffff';
      balls.forEach((ball) => { circle(ctx, ball.x, ball.y, R); ctx.fill(); });
      ctx.restore();
      lifeIcons(ctx, lives, C.violet);
      text(ctx, `LEVEL ${level}`, W - 14, 18, { size: 10, align: 'right', mono: true, color: C.muted, weight: 700 });
      if (api.state !== 'playing') return;
      if (banner > 0) text(ctx, `LEVEL ${level}`, W / 2, 300, { size: 30, weight: 800, color: C.violet });
      else if (balls.some((ball) => ball.stuck)) text(ctx, 'SPACE OR TAP TO LAUNCH', W / 2, 330, { size: 10, mono: true, color: C.muted });
    },
  };
}

function hopperGame() {
  const GROUND = H - 48;
  const PW = 58;
  const SPACING = 200;
  const BIRD_X = 96;
  let bird, pipes, speed, passed, scroll;
  function addPipe(x) {
    const gap = Math.max(118, 160 - passed * 2.2);
    let center = rand(70 + gap / 2, GROUND - 50 - gap / 2);
    // Limit how far consecutive gaps jump so every course stays fair.
    const previous = pipes.at(-1);
    if (previous) center = clamp(center, previous.center - 150, previous.center + 150);
    pipes.push({ x, center, gap, passed: false });
  }
  function flap(api) {
    bird.vy = -420;
    bird.flap = 0.15;
    api.sound('flap');
  }
  return {
    id: 'hopper', title: 'Sky Hopper', color: C.amber,
    tagline: 'One button. Endless pipes. Pure nerve.',
    controls: ['SPACE, UP, CLICK, OR TAP TO FLAP'],
    reset() {
      bird = { y: 220, vy: 0, flap: 0 };
      pipes = [];
      speed = 150;
      passed = 0;
      scroll = 0;
      addPipe(W + 80);
    },
    key(name, api) { if (name === 'action' || name === 'up') flap(api); },
    pointer(type, point, api) { if (type === 'down') flap(api); },
    update(dt, api) {
      bird.vy = Math.min(bird.vy + 1500 * dt, 640);
      bird.y += bird.vy * dt;
      bird.flap = Math.max(0, bird.flap - dt);
      if (bird.y < 12) { bird.y = 12; bird.vy = Math.max(0, bird.vy); }
      scroll += speed * dt;
      for (const pipe of pipes) {
        pipe.x -= speed * dt;
        if (!pipe.passed && pipe.x + PW < BIRD_X) {
          pipe.passed = true;
          passed++;
          speed = Math.min(230, speed + 2.5);
          api.addScore(1);
          api.sound('coin');
        }
      }
      pipes = pipes.filter((pipe) => pipe.x + PW > -10);
      while (pipes.at(-1).x < W + 40) addPipe(pipes.at(-1).x + SPACING);
      // The hitbox is a little smaller than the drawn bird to keep near misses fun.
      const r = 10;
      const hitPipe = pipes.some((pipe) => circleRect(BIRD_X, bird.y, r, pipe.x, -100, PW, pipe.center - pipe.gap / 2 + 100)
        || circleRect(BIRD_X, bird.y, r, pipe.x, pipe.center + pipe.gap / 2, PW, H));
      if (hitPipe || bird.y + r >= GROUND) {
        bird.y = Math.min(bird.y, GROUND - r);
        api.burst(BIRD_X, bird.y, C.amber, 30, 200);
        api.shake(9, 0.3);
        api.over();
      }
    },
    draw(ctx, api) {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0a1a2a');
      sky.addColorStop(1, '#0b2420');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff22';
      for (let i = 0; i < 30; i++) ctx.fillRect(hash(i) * W, hash(i + 50) * 260, 1.5, 1.5);
      // Two skyline layers scroll at different speeds for depth.
      for (const [rate, color, base] of [[0.2, '#10283a', 120], [0.45, '#0f3029', 70]]) {
        const offset = scroll * rate;
        const first = Math.floor(offset / 40);
        ctx.fillStyle = color;
        for (let i = first; i < first + 11; i++) {
          const height = base + hash(i * (rate * 10)) * 80;
          ctx.fillRect(i * 40 - offset, GROUND - height, 38, height);
        }
      }
      for (const pipe of pipes) {
        const top = pipe.center - pipe.gap / 2;
        const bottom = pipe.center + pipe.gap / 2;
        ctx.fillStyle = '#1d5c4b';
        ctx.fillRect(pipe.x, 0, PW, top);
        ctx.fillRect(pipe.x, bottom, PW, GROUND - bottom);
        ctx.fillStyle = '#ffffff18';
        ctx.fillRect(pipe.x + 8, 0, 6, top);
        ctx.fillRect(pipe.x + 8, bottom, 6, GROUND - bottom);
        ctx.save();
        glow(ctx, C.accent, 10);
        ctx.fillStyle = C.accent;
        roundRect(ctx, pipe.x - 4, top - 18, PW + 8, 18, 4);
        ctx.fill();
        roundRect(ctx, pipe.x - 4, bottom, PW + 8, 18, 4);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#0c201c';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = C.accent;
      ctx.fillRect(0, GROUND, W, 2);
      ctx.fillStyle = '#65f5ce22';
      for (let x = -(scroll % 24); x < W; x += 24) ctx.fillRect(x, GROUND + 10, 12, 4);
      const y = api.state === 'ready' ? bird.y + Math.sin(api.clock * 4) * 8 : bird.y;
      ctx.save();
      ctx.translate(BIRD_X, y);
      ctx.rotate(clamp(bird.vy / 900, -0.45, 0.9));
      glow(ctx, C.amber, 16);
      ctx.fillStyle = C.amber;
      circle(ctx, 0, 0, 13);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff9d5c';
      ctx.beginPath();
      ctx.ellipse(-4, bird.flap > 0 ? -6 : 3, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circle(ctx, 5, -4, 4.5);
      ctx.fill();
      ctx.fillStyle = '#06120f';
      circle(ctx, 6.5, -4, 2);
      ctx.fill();
      ctx.fillStyle = C.pink;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(19, 3);
      ctx.lineTo(11, 6);
      ctx.fill();
      ctx.restore();
      if (api.state === 'playing') text(ctx, String(api.score), W / 2, 56, { size: 44, weight: 800, color: '#ffffffd0' });
    },
  };
}

function blasterGame() {
  const TYPES = {
    drone: { hp: 1, r: 12, speed: 110, score: 10, color: C.pink },
    zig: { hp: 2, r: 13, speed: 85, score: 25, color: C.violet },
    tank: { hp: 6, r: 20, speed: 45, score: 60, color: C.amber },
  };
  const DROP_COLORS = { triple: C.accent, shield: C.violet, life: C.pink };
  const stars = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H), speed: rand(10, 70), r: rand(0.5, 1.6) }));
  let ship, shots, enemies, enemyShots, drops, lives, invuln, fireTimer, spawnTimer, elapsed, triple, shield, target;
  function spawn() {
    const roll = Math.random();
    let type = 'drone';
    if (elapsed > 15 && roll < 0.35) type = 'zig';
    if (elapsed > 35 && roll < 0.12 + Math.min(elapsed / 600, 0.15)) type = 'tank';
    const spec = TYPES[type];
    const x = type === 'zig' ? rand(70, W - 70) : rand(24, W - 24);
    enemies.push({
      type, x, baseX: x, y: -30, hp: spec.hp, r: spec.r, t: 0, flash: 0, phase: rand(0, Math.PI * 2),
      vy: spec.speed * rand(0.9, 1.15) * (1 + elapsed / 240), fire: rand(0.8, 1.8),
    });
  }
  function kill(enemy, api) {
    const spec = TYPES[enemy.type];
    enemy.hp = 0;
    api.addScore(spec.score);
    api.burst(enemy.x, enemy.y, spec.color, enemy.type === 'tank' ? 34 : 16, enemy.type === 'tank' ? 220 : 160);
    api.sound(enemy.type === 'tank' ? 'boom' : 'pop');
    if (enemy.type === 'tank') api.shake(5, 0.2);
    if (Math.random() < (enemy.type === 'tank' ? 0.5 : 0.07)) drops.push({ x: enemy.x, y: enemy.y, type: pick(['triple', 'triple', 'shield', 'shield', 'life']) });
  }
  function hitShip(api) {
    if (shield) {
      shield = false;
      invuln = 1;
      api.sound('lose');
      api.burst(ship.x, ship.y, C.violet, 18, 160);
      return;
    }
    lives--;
    invuln = 2;
    api.shake(10, 0.35);
    api.burst(ship.x, ship.y, C.accent, lives > 0 ? 20 : 50, lives > 0 ? 180 : 260);
    api.sound('boom');
    if (lives <= 0) api.over();
  }
  return {
    id: 'blaster', title: 'Astro Blaster', color: C.pink,
    tagline: 'Auto-fire on. Survive the swarm.',
    controls: ['ARROWS / WASD OR MOUSE TO FLY', 'DRAG ON TOUCH SCREENS'],
    reset() {
      ship = { x: W / 2, y: H - 60 };
      shots = [];
      enemies = [];
      enemyShots = [];
      drops = [];
      lives = 3;
      invuln = 0;
      fireTimer = 0;
      spawnTimer = 1;
      elapsed = 0;
      triple = 0;
      shield = false;
      target = null;
    },
    pointer(type, point) {
      if (type === 'up') { if (point.type !== 'mouse') target = null; return; }
      // On touch the ship flies above the finger so it stays visible.
      target = { x: point.x, y: point.type === 'mouse' ? point.y : point.y - 70 };
    },
    update(dt, api) {
      elapsed += dt;
      const dx = (api.keys.has('right') ? 1 : 0) - (api.keys.has('left') ? 1 : 0);
      const dy = (api.keys.has('down') ? 1 : 0) - (api.keys.has('up') ? 1 : 0);
      if (dx || dy) {
        target = null;
        const length = Math.hypot(dx, dy);
        ship.x += (dx / length) * 300 * dt;
        ship.y += (dy / length) * 300 * dt;
      } else if (target) {
        const distance = Math.hypot(target.x - ship.x, target.y - ship.y);
        const step = Math.min(distance, 560 * dt);
        if (distance > 0.5) {
          ship.x += ((target.x - ship.x) / distance) * step;
          ship.y += ((target.y - ship.y) / distance) * step;
        }
      }
      ship.x = clamp(ship.x, 16, W - 16);
      ship.y = clamp(ship.y, H * 0.4, H - 24);
      triple = Math.max(0, triple - dt);
      invuln = Math.max(0, invuln - dt);
      fireTimer -= dt;
      if (fireTimer <= 0) {
        fireTimer = 0.17;
        shots.push({ x: ship.x, y: ship.y - 14, vx: 0 });
        if (triple > 0) shots.push({ x: ship.x - 6, y: ship.y - 8, vx: -120 }, { x: ship.x + 6, y: ship.y - 8, vx: 120 });
        api.sound('shoot');
      }
      for (const shot of shots) { shot.x += shot.vx * dt; shot.y -= 560 * dt; }
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawn();
        spawnTimer = Math.max(0.32, 1.05 - elapsed * 0.01) * rand(0.7, 1.2);
      }
      for (const enemy of enemies) {
        enemy.t += dt;
        enemy.y += enemy.vy * dt;
        enemy.flash = Math.max(0, enemy.flash - dt);
        if (enemy.type === 'zig') enemy.x = enemy.baseX + Math.sin(enemy.t * 3 + enemy.phase) * 50;
        else enemy.x += Math.sin(enemy.t * 2 + enemy.phase) * 20 * dt;
        if (enemy.type === 'tank' && (enemy.fire -= dt) <= 0 && enemy.y > 20 && enemy.y < H * 0.6) {
          enemy.fire = 1.8;
          const angle = Math.atan2(ship.y - enemy.y, ship.x - enemy.x);
          enemyShots.push({ x: enemy.x, y: enemy.y + 10, vx: Math.cos(angle) * 190, vy: Math.sin(angle) * 190 });
        }
      }
      for (const shot of shots) {
        for (const enemy of enemies) {
          if (enemy.hp <= 0 || !near(shot, enemy, enemy.r + 3)) continue;
          shot.done = true;
          enemy.hp--;
          enemy.flash = 0.08;
          if (enemy.hp <= 0) kill(enemy, api);
          break;
        }
      }
      for (const shot of enemyShots) { shot.x += shot.vx * dt; shot.y += shot.vy * dt; }
      if (invuln <= 0) {
        const rammed = enemies.find((enemy) => enemy.hp > 0 && near(enemy, ship, enemy.r + 9));
        const shotHit = enemyShots.find((shot) => near(shot, ship, 13));
        if (rammed) kill(rammed, api);
        if (shotHit) shotHit.done = true;
        if (rammed || shotHit) hitShip(api);
      }
      for (const drop of drops) {
        drop.y += 90 * dt;
        if (near(drop, ship, 24)) {
          drop.done = true;
          api.sound('power');
          api.addScore(15);
          if (drop.type === 'triple') triple = 8;
          if (drop.type === 'shield') shield = true;
          if (drop.type === 'life') lives = Math.min(5, lives + 1);
        }
      }
      shots = shots.filter((shot) => !shot.done && shot.y > -10);
      enemyShots = enemyShots.filter((shot) => !shot.done && shot.y < H + 10 && shot.x > -10 && shot.x < W + 10);
      enemies = enemies.filter((enemy) => enemy.hp > 0 && enemy.y < H + 40);
      drops = drops.filter((drop) => !drop.done && drop.y < H + 10);
    },
    draw(ctx, api) {
      for (const star of stars) {
        ctx.fillStyle = `rgba(230, 240, 236, ${star.r / 2})`;
        ctx.fillRect(star.x, (star.y + api.clock * star.speed) % H, star.r, star.r);
      }
      ctx.save();
      glow(ctx, C.accent, 10);
      ctx.fillStyle = C.accent;
      shots.forEach((shot) => ctx.fillRect(shot.x - 1.5, shot.y - 7, 3, 12));
      glow(ctx, C.amber, 10);
      ctx.fillStyle = C.amber;
      enemyShots.forEach((shot) => { circle(ctx, shot.x, shot.y, 4); ctx.fill(); });
      ctx.restore();
      for (const enemy of enemies) {
        const { color } = TYPES[enemy.type];
        const r = enemy.r;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        glow(ctx, color, 14);
        ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : color;
        ctx.beginPath();
        if (enemy.type === 'drone') {
          ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
        } else if (enemy.type === 'zig') {
          ctx.moveTo(-r, -r * 0.6); ctx.lineTo(0, -r * 0.2); ctx.lineTo(r, -r * 0.6); ctx.lineTo(0, r);
        } else {
          for (let i = 0; i < 6; i++) ctx.lineTo(Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#06120f';
        circle(ctx, 0, enemy.type === 'zig' ? -2 : 0, r * 0.28);
        ctx.fill();
        if (enemy.type === 'tank' && enemy.hp < TYPES.tank.hp) {
          ctx.fillStyle = '#ffffff30';
          ctx.fillRect(-r, r + 6, r * 2, 3);
          ctx.fillStyle = C.amber;
          ctx.fillRect(-r, r + 6, (r * 2 * enemy.hp) / TYPES.tank.hp, 3);
        }
        ctx.restore();
      }
      drops.forEach((drop) => capsule(ctx, drop.x, drop.y, DROP_COLORS[drop.type], { triple: '≡', shield: '◎', life: '+1' }[drop.type]));
      if (lives > 0 && Math.floor(invuln * 12) % 2 === 0) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.fillStyle = C.amber;
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(0, 16 + Math.random() * 8);
        ctx.lineTo(5, 10);
        ctx.fill();
        glow(ctx, C.accent, 16);
        ctx.fillStyle = C.accent;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(13, 12);
        ctx.lineTo(0, 6);
        ctx.lineTo(-13, 12);
        ctx.closePath();
        ctx.fill();
        if (shield) {
          ctx.strokeStyle = C.violet;
          ctx.lineWidth = 2;
          circle(ctx, 0, 0, 22);
          ctx.stroke();
        }
        ctx.restore();
      }
      lifeIcons(ctx, lives, C.accent);
      if (triple > 0) {
        ctx.fillStyle = '#ffffff20';
        ctx.fillRect(W - 84, 15, 70, 4);
        ctx.fillStyle = C.accent;
        ctx.fillRect(W - 84, 15, (70 * triple) / 8, 4);
      }
    },
  };
}

function puzzleGame() {
  const N = 4;
  const GAP = 8;
  const CELL = 72;
  const SIZE = N * CELL + (N + 1) * GAP;
  const BX = (W - SIZE) / 2;
  const BY = 112;
  const ANIM = 0.11;
  const VECTORS = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };
  const TILE_COLORS = {
    2: ['#17332c', '#d5efe5'], 4: ['#1e4238', '#e6f5ee'], 8: ['#2b6b57', '#f0fff9'], 16: ['#3a9478', '#05130f'],
    32: ['#65f5ce', '#05130f'], 64: ['#8794ff', '#ffffff'], 128: ['#b7a0ff', '#120a26'], 256: ['#d59cff', '#1a0b26'],
    512: ['#ffc783', '#2a1600'], 1024: ['#ffa95e', '#2a1200'], 2048: ['#ff7aa8', '#2a0012'],
  };
  let tiles, ghosts, anim, overTimer, reached, banner;
  function grid() {
    const cells = Array.from({ length: N }, () => Array(N).fill(null));
    tiles.forEach((tile) => { cells[tile.r][tile.c] = tile; });
    return cells;
  }
  function addTile(born = -1) {
    const cells = grid();
    const free = [];
    cells.forEach((row, r) => row.forEach((tile, c) => { if (!tile) free.push({ r, c }); }));
    if (!free.length) return;
    const { r, c } = pick(free);
    tiles.push({ v: Math.random() < 0.9 ? 2 : 4, r, c, fr: r, fc: c, born, pop: 0, pending: false });
  }
  function canMove() {
    const cells = grid();
    if (cells.some((row) => row.includes(null))) return true;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if ((c < N - 1 && cells[r][c + 1].v === cells[r][c].v) || (r < N - 1 && cells[r + 1][c].v === cells[r][c].v)) return true;
    }
    return false;
  }
  function finishAnim() {
    anim = 1;
    ghosts = [];
    tiles.forEach((tile) => {
      if (!tile.pending) return;
      tile.pending = false;
      tile.pop = 1;
    });
  }
  function move(direction, api) {
    const vector = VECTORS[direction];
    if (!vector || overTimer !== null) return;
    finishAnim();
    const [dr, dc] = vector;
    const order = [0, 1, 2, 3];
    const rows = dr === 1 ? [...order].reverse() : order;
    const cols = dc === 1 ? [...order].reverse() : order;
    const cells = grid();
    const merged = new Set();
    let moved = false;
    let gained = 0;
    tiles.forEach((tile) => { tile.fr = tile.r; tile.fc = tile.c; });
    for (const r of rows) for (const c of cols) {
      const tile = cells[r][c];
      if (!tile) continue;
      let nr = r;
      let nc = c;
      let mergedInto = null;
      while (true) {
        const tr = nr + dr;
        const tc = nc + dc;
        if (tr < 0 || tr >= N || tc < 0 || tc >= N) break;
        const other = cells[tr][tc];
        if (!other) { nr = tr; nc = tc; continue; }
        if (other.v === tile.v && !merged.has(other)) mergedInto = other;
        break;
      }
      cells[r][c] = null;
      if (mergedInto) {
        // The merged tile slides into its partner as a ghost, then the partner doubles.
        tile.r = mergedInto.r;
        tile.c = mergedInto.c;
        ghosts.push(tile);
        tiles.splice(tiles.indexOf(tile), 1);
        mergedInto.v *= 2;
        mergedInto.pending = true;
        merged.add(mergedInto);
        gained += mergedInto.v;
        moved = true;
        continue;
      }
      cells[nr][nc] = tile;
      if (nr !== r || nc !== c) { tile.r = nr; tile.c = nc; moved = true; }
    }
    if (!moved) return;
    anim = 0;
    addTile();
    if (gained) { api.addScore(gained); api.sound('merge'); } else api.sound('slide');
    if (!reached && tiles.some((tile) => tile.v >= 2048)) {
      reached = true;
      banner = 2.5;
      api.sound('power');
      api.burst(W / 2, BY + SIZE / 2, C.pink, 50, 260);
    }
    if (!canMove()) overTimer = 0.8;
  }
  const cellX = (c) => BX + GAP + c * (CELL + GAP);
  const cellY = (r) => BY + GAP + r * (CELL + GAP);
  function drawTile(ctx, tile, ease) {
    const x = cellX(tile.fc + (tile.c - tile.fc) * ease);
    const y = cellY(tile.fr + (tile.r - tile.fr) * ease);
    const value = tile.pending ? tile.v / 2 : tile.v;
    const [bg, fg] = TILE_COLORS[value] ?? ['#ffffff', '#05130f'];
    const scale = clamp(tile.born, 0, 1) * (1 + Math.sin(tile.pop * Math.PI) * 0.12);
    if (scale <= 0) return;
    ctx.save();
    ctx.translate(x + CELL / 2, y + CELL / 2);
    ctx.scale(scale, scale);
    if (value >= 128) glow(ctx, bg, 18);
    ctx.fillStyle = bg;
    roundRect(ctx, -CELL / 2, -CELL / 2, CELL, CELL, 8);
    ctx.fill();
    ctx.restore();
    const digits = String(value).length;
    ctx.save();
    ctx.translate(x + CELL / 2, y + CELL / 2);
    ctx.scale(scale, scale);
    text(ctx, String(value), 0, 2, { size: digits < 3 ? 30 : digits < 4 ? 25 : 20, weight: 800, color: fg });
    ctx.restore();
  }
  return {
    id: 'merge', title: '2048', color: C.accent,
    tagline: 'Slide, merge, and reach the 2048 tile.',
    controls: ['ARROWS / WASD TO SLIDE', 'SWIPE ON TOUCH SCREENS'],
    reset() {
      tiles = [];
      ghosts = [];
      anim = 1;
      overTimer = null;
      reached = false;
      banner = 0;
      addTile(1);
      addTile(1);
    },
    key(name, api) { move(name, api); },
    swipe(name, api) { move(name, api); },
    update(dt, api) {
      anim = Math.min(1, anim + dt / ANIM);
      if (anim >= 1 && (ghosts.length || tiles.some((tile) => tile.pending))) finishAnim();
      tiles.forEach((tile) => {
        tile.born = Math.min(1, tile.born + dt / ANIM);
        tile.pop = Math.max(0, tile.pop - dt / 0.15);
      });
      banner = Math.max(0, banner - dt);
      if (overTimer !== null && (overTimer -= dt) <= 0) {
        overTimer = null;
        api.shake(6, 0.25);
        api.over();
      }
    },
    draw(ctx) {
      text(ctx, '2048', BX, 56, { size: 40, weight: 800, align: 'left', color: C.accent });
      text(ctx, 'MERGE · MATCH · MULTIPLY', BX + 2, 86, { size: 9, align: 'left', mono: true, color: C.muted, weight: 400 });
      const best = tiles.reduce((max, tile) => Math.max(max, tile.v), 0);
      text(ctx, 'TOP TILE', BX + SIZE, 46, { size: 9, align: 'right', mono: true, color: C.muted, weight: 400 });
      text(ctx, String(best), BX + SIZE, 70, { size: 22, align: 'right', weight: 700, color: C.text });
      ctx.fillStyle = '#0c201c';
      roundRect(ctx, BX, BY, SIZE, SIZE, 12);
      ctx.fill();
      ctx.fillStyle = '#12302a';
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        roundRect(ctx, cellX(c), cellY(r), CELL, CELL, 8);
        ctx.fill();
      }
      const ease = 1 - (1 - anim) ** 3;
      ghosts.forEach((tile) => drawTile(ctx, tile, ease));
      tiles.forEach((tile) => drawTile(ctx, tile, ease));
      if (banner > 0) text(ctx, '2048! KEEP GOING', W / 2, BY + SIZE + 34, { size: 18, weight: 800, color: C.pink });
      else text(ctx, 'SWIPE OR USE THE ARROW KEYS', W / 2, BY + SIZE + 34, { size: 9, mono: true, color: C.muted, weight: 400 });
    },
  };
}

export const GAMES = [snakeGame(), breakoutGame(), hopperGame(), blasterGame(), puzzleGame()];

const KEYS = {
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  ' ': 'action', Enter: 'action', p: 'pause', P: 'pause',
};

export function createArcade(canvas, { storage, motion, onChange }) {
  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const particles = [];
  let game = GAMES[0];
  let state = 'ready';
  let score = 0;
  let best = 0;
  let newBest = false;
  let overAt = 0;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let scale = 1;
  let shake = { time: 0, duration: 1, magnitude: 0 };
  let gesture = null;
  let muted = storage.get('arcade-sound') === 'off';
  let audio = null;

  function tone(freq, duration, { type = 'square', volume = 0.04, to = freq, delay = 0 } = {}) {
    if (muted) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const start = audio.currentTime + delay;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(to, start + duration);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch { /* Sound is optional. */ }
  }
  const sounds = {
    start: () => [440, 660, 880].forEach((f, i) => tone(f, 0.09, { type: 'triangle', delay: i * 0.08 })),
    eat: () => tone(520, 0.09, { to: 980, type: 'triangle', volume: 0.05 }),
    coin: () => { tone(880, 0.06, { volume: 0.025 }); tone(1320, 0.1, { volume: 0.025, delay: 0.06 }); },
    tick: () => tone(300, 0.04, { volume: 0.02 }),
    paddle: () => tone(220, 0.06, { to: 330, volume: 0.025 }),
    brick: () => tone(660, 0.07, { to: 440, type: 'triangle', volume: 0.05 }),
    flap: () => tone(380, 0.08, { to: 620, type: 'sine', volume: 0.05 }),
    shoot: () => tone(900, 0.05, { to: 500, volume: 0.006 }),
    pop: () => tone(240, 0.12, { to: 60, type: 'sawtooth', volume: 0.035 }),
    boom: () => tone(160, 0.35, { to: 30, type: 'sawtooth', volume: 0.07 }),
    power: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, { type: 'triangle', delay: i * 0.07 })),
    merge: () => tone(330, 0.08, { to: 660, type: 'triangle', volume: 0.04 }),
    slide: () => tone(200, 0.04, { type: 'sine', volume: 0.02 }),
    lose: () => tone(300, 0.25, { to: 90, type: 'triangle', volume: 0.06 }),
    over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.14, { type: 'triangle', volume: 0.05, delay: i * 0.12 })),
  };

  const bestKey = () => `arcade-best-${game.id}`;
  const saveBest = () => storage.set(bestKey(), String(best));
  const notify = () => onChange({ id: game.id, title: game.title, index: GAMES.indexOf(game), score, best, state, muted });
  const api = {
    keys,
    get clock() { return performance.now() / 1000; },
    get state() { return state; },
    get score() { return score; },
    addScore(points) {
      score += points;
      if (score > best) { best = score; newBest = true; }
      notify();
    },
    burst(x, y, color, count = 12, speed = 150) {
      for (let i = 0; i < count && particles.length < 400; i++) {
        const angle = rand(0, Math.PI * 2);
        const velocity = rand(0.2, 1) * speed;
        const life = rand(0.35, 0.8);
        particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life, max: life, color, size: rand(1.5, 3.5) });
      }
    },
    shake(magnitude, duration) {
      if (motion()) shake = { time: duration, duration, magnitude };
    },
    sound(name) { sounds[name]?.(); },
    over() {
      if (state !== 'playing') return;
      state = 'over';
      overAt = performance.now();
      keys.clear();
      saveBest();
      sounds.over();
      notify();
    },
  };

  function begin() {
    game.reset(api);
    score = 0;
    newBest = false;
    particles.length = 0;
    shake.time = 0;
    acc = 0;
    state = 'playing';
    sounds.start();
    notify();
  }
  // Ignore retries for a moment so a frantic last input doesn't restart instantly.
  const canRetry = () => performance.now() - overAt > 600;
  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    keys.clear();
    saveBest();
    notify();
  }
  function resume() {
    if (state !== 'paused') return;
    state = 'playing';
    last = performance.now();
    notify();
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio);
    if (!width) return;
    canvas.width = width;
    canvas.height = Math.round((width * H) / W);
    scale = width / W;
  }
  const observer = new ResizeObserver(resize);

  function drawOverlay() {
    if (state === 'playing') return;
    ctx.fillStyle = 'rgba(3, 9, 8, 0.74)';
    ctx.fillRect(0, 0, W, H);
    const blink = Math.sin(api.clock * 5) > -0.4;
    ctx.save();
    if (state === 'ready') {
      glow(ctx, game.color, 24);
      text(ctx, game.title.toUpperCase(), W / 2, 160, { size: 38, weight: 800, color: game.color });
      ctx.restore();
      text(ctx, game.tagline, W / 2, 202, { size: 15, weight: 500 });
      game.controls.forEach((line, i) => text(ctx, line, W / 2, 256 + i * 22, { size: 10, mono: true, color: C.muted, weight: 400 }));
      if (blink) text(ctx, 'TAP OR PRESS SPACE TO START', W / 2, 340, { size: 11, mono: true, weight: 700, color: C.accent });
      if (best) text(ctx, `BEST ${best}`, W / 2, 376, { size: 10, mono: true, color: C.amber, weight: 700 });
      return;
    }
    if (state === 'paused') {
      text(ctx, 'PAUSED', W / 2, 200, { size: 38, weight: 800 });
      ctx.restore();
      if (blink) text(ctx, 'TAP OR PRESS P TO RESUME', W / 2, 250, { size: 11, mono: true, weight: 700, color: C.accent });
      return;
    }
    glow(ctx, C.pink, 24);
    text(ctx, 'GAME OVER', W / 2, 150, { size: 40, weight: 800, color: C.pink });
    ctx.restore();
    text(ctx, 'SCORE', W / 2, 205, { size: 10, mono: true, color: C.muted, weight: 400 });
    text(ctx, String(score), W / 2, 240, { size: 46, weight: 800 });
    if (newBest) text(ctx, '★ NEW BEST ★', W / 2, 285, { size: 13, mono: true, weight: 700, color: C.amber });
    else text(ctx, `BEST ${best}`, W / 2, 285, { size: 11, mono: true, color: C.muted, weight: 400 });
    if (canRetry() && blink) text(ctx, 'TAP OR PRESS SPACE TO PLAY AGAIN', W / 2, 340, { size: 11, mono: true, weight: 700, color: C.accent });
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (state === 'playing') {
      acc += dt;
      while (acc >= STEP) {
        game.update(STEP, api);
        acc -= STEP;
        if (state !== 'playing') { acc = 0; break; }
      }
    }
    if (state !== 'paused') {
      shake.time = Math.max(0, shake.time - dt);
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= dt;
      }
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (shake.time > 0) {
      const power = shake.magnitude * (shake.time / shake.duration);
      ctx.translate(rand(-power, power), rand(-power, power));
    }
    game.draw(ctx, api);
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
    drawOverlay();
  }

  function onKey(event, down) {
    const name = KEYS[event.key];
    if (!name || event.metaKey || event.ctrlKey || event.altKey) return;
    if (!down) { keys.delete(name); return; }
    // Let Space and Enter activate focused buttons such as the game tabs.
    if (name === 'action' && event.target instanceof Element && event.target.closest('button, a')) return;
    event.preventDefault();
    if (name === 'pause') { if (state === 'paused') resume(); else pause(); return; }
    if (state === 'paused') { if (name === 'action') resume(); return; }
    if (state === 'over' && (name !== 'action' || !canRetry())) return;
    if (state !== 'playing') {
      begin();
      game.key?.(name, api);
      return;
    }
    keys.add(name);
    if (!event.repeat) game.key?.(name, api);
  }
  const onKeyDown = (event) => onKey(event, true);
  const onKeyUp = (event) => onKey(event, false);
  function toPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * W, y: ((event.clientY - rect.top) / rect.height) * H, type: event.pointerType };
  }
  function onPointerDown(event) {
    if (event.button > 0) return;
    canvas.focus({ preventScroll: true });
    const point = toPoint(event);
    gesture = { x: point.x, y: point.y };
    canvas.setPointerCapture?.(event.pointerId);
    if (state === 'paused') { resume(); return; }
    if (state === 'over') { if (canRetry()) begin(); return; }
    if (state === 'ready') begin();
    game.pointer?.('down', point, api);
  }
  function onPointerMove(event) {
    const point = toPoint(event);
    if (state === 'playing') game.pointer?.('move', point, api);
    if (!gesture || state !== 'playing' || !game.swipe) return;
    // Swipes fire as soon as the finger travels far enough, then re-anchor for chained turns.
    const dx = point.x - gesture.x;
    const dy = point.y - gesture.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    game.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), api);
    gesture = { x: point.x, y: point.y };
  }
  function onPointerUp(event) {
    gesture = null;
    if (state === 'playing') game.pointer?.('up', toPoint(event), api);
  }
  const onBlur = () => pause();
  const onVisibility = () => { if (document.hidden) pause(); };

  return {
    select(id) {
      const next = GAMES.find((item) => item.id === id) ?? GAMES[0];
      // Reopening the game that was paused picks up where the player left off.
      if (next === game && state === 'paused') { notify(); return; }
      if (state === 'playing' || state === 'paused') saveBest();
      game = next;
      game.reset(api);
      state = 'ready';
      score = 0;
      newBest = false;
      particles.length = 0;
      best = Number(storage.get(bestKey())) || 0;
      notify();
    },
    open() {
      if (raf) return;
      observer.observe(canvas);
      resize();
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);
      document.addEventListener('visibilitychange', onVisibility);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    close() {
      pause();
      cancelAnimationFrame(raf);
      raf = 0;
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
    togglePause() { if (state === 'paused') resume(); else pause(); },
    toggleSound() {
      muted = !muted;
      storage.set('arcade-sound', muted ? 'off' : 'on');
      notify();
    },
  };
}
