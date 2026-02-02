(() => {
  const space = document.getElementById('space');
  const world = document.getElementById('world');
  const svg = document.getElementById('constellation');

  const farCanvas = document.getElementById('starfieldFar');
  const farCtx = farCanvas.getContext('2d');

  const nearCanvas = document.getElementById('starfieldNear');
  const nearCtx = nearCanvas.getContext('2d');

  const shootCanvas = document.getElementById('shooting');
  const shootCtx = shootCanvas.getContext('2d');

  const peopleStars = Array.from(document.querySelectorAll('.star-wrapper'));

  // =========================================================
  // 1) РАСКЛАДКА (как было)
  // =========================================================
  function layoutBranchedBrokenRidge() {
    const n = peopleStars.length;
    if (!n) return;

    const X_MIN = 6,  X_MAX = 94;
    const Y_MIN = 18, Y_MAX = 92;

    const trunkEnd = Math.min(n, Math.max(10, Math.round(n * 0.68)));
    const rest = n - trunkEnd;

    const pos = new Array(n);

    const kink1 = Math.floor(trunkEnd * 0.28);
    const kink2 = Math.floor(trunkEnd * 0.56);
    const kink3 = Math.floor(trunkEnd * 0.80);

    for (let i = 0; i < trunkEnd; i++) {
      const t = trunkEnd === 1 ? 0.5 : i / (trunkEnd - 1);

      let x = X_MIN + (X_MAX - X_MIN) * t;

      let y = 56
        + Math.sin(t * Math.PI) * 6.5
        + Math.sin(t * 2.7) * 3.2;

      if (i >= kink1) y += 4.6;
      if (i >= kink2) y -= 7.2;
      if (i >= kink3) y += 5.2;

      x += (Math.random() - 0.5) * 1.0;
      y += (Math.random() - 0.5) * 1.0;

      y = Math.max(Y_MIN, Math.min(Y_MAX, y));
      pos[i] = { x, y };
    }

    const branchCount = Math.min(6, Math.max(4, Math.round(rest / 3)));
    const anchors = [];
    for (let b = 0; b < branchCount; b++) {
      const at = Math.floor(trunkEnd * (0.18 + b * (0.68 / Math.max(1, branchCount - 1))));
      anchors.push(Math.max(1, Math.min(trunkEnd - 2, at)));
    }

    const lens = new Array(branchCount).fill(0);
    let remaining = rest;
    for (let b = 0; b < branchCount; b++) {
      if (remaining <= 0) break;
      const take = (b === branchCount - 1)
        ? remaining
        : Math.max(1, Math.round(remaining / (branchCount - b)));
      lens[b] = Math.min(take, remaining);
      remaining -= lens[b];
    }

    let idx = trunkEnd;

    for (let b = 0; b < branchCount; b++) {
      const len = lens[b];
      if (len <= 0) continue;

      const a = anchors[b];
      const A = pos[a];

      const dirY = (b % 2 === 0) ? -1 : 1;
      const dirX = (A.x < 50) ? -1 : 1;

      const xLen = 7.5 + Math.random() * 5.5;
      const yLen = 9.5 + Math.random() * 6.5;

      for (let k = 0; k < len && idx < n; k++) {
        const t = (k + 1) / (len + 1);

        let x = A.x + dirX * (t * xLen) + Math.sin(t * Math.PI) * 1.0 * dirX;
        let y = A.y + dirY * (t * yLen) + Math.cos(t * Math.PI) * 0.9 * dirY;

        x += (Math.random() - 0.5) * 1.2;
        y += (Math.random() - 0.5) * 1.2;

        x = Math.max(X_MIN, Math.min(X_MAX, x));
        y = Math.max(Y_MIN, Math.min(Y_MAX, y));

        pos[idx++] = { x, y };
      }
    }

    while (idx < n) {
      pos[idx++] = {
        x: 50 + (Math.random() - 0.5) * 30,
        y: 55 + (Math.random() - 0.5) * 24
      };
    }

    const PULL = 0.78;
    for (let i = 0; i < n; i++) {
      const x = 50 + (pos[i].x - 50) * PULL;
      const y = 50 + (pos[i].y - 50) * PULL;
      peopleStars[i].dataset.x = String(x);
      peopleStars[i].dataset.y = String(y);
    }
  }

  // =========================================================
  // 2) СВЯЗИ (как было)
  // =========================================================
  function buildConnectionsStable(n) {
    const con = [];
    if (n <= 1) return con;

    const trunkEnd = Math.min(n, Math.max(10, Math.round(n * 0.68)));
    const rest = n - trunkEnd;

    for (let i = 0; i < trunkEnd - 1; i++) con.push([i, i + 1]);

    const branchCount = Math.min(6, Math.max(4, Math.round(rest / 3)));
    const anchors = [];
    for (let b = 0; b < branchCount; b++) {
      const at = Math.floor(trunkEnd * (0.18 + b * (0.68 / Math.max(1, branchCount - 1))));
      anchors.push(Math.max(1, Math.min(trunkEnd - 2, at)));
    }

    const lens = new Array(branchCount).fill(0);
    let remaining = rest;
    for (let b = 0; b < branchCount; b++) {
      if (remaining <= 0) break;
      const take = (b === branchCount - 1)
        ? remaining
        : Math.max(1, Math.round(remaining / (branchCount - b)));
      lens[b] = Math.min(take, remaining);
      remaining -= lens[b];
    }

    let idx = trunkEnd;
    for (let b = 0; b < branchCount; b++) {
      const len = lens[b];
      if (len <= 0) continue;

      const start = idx;
      const end = Math.min(n, idx + len);

      if (start < n) {
        con.push([anchors[b], start]);
        for (let i = start; i < end - 1; i++) con.push([i, i + 1]);
      }

      idx = end;
      if (idx >= n) break;
    }

    const must = new Set(con.map(([a,b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)));
    const addEdge = (a,b) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!must.has(key)) {
        must.add(key);
        con.push([a,b]);
      }
    };

    addEdge(0, 1);
    addEdge(n - 2, n - 1);

    if (n > 12) {
      addEdge(2, Math.min(trunkEnd - 1, 6));
      addEdge(Math.min(trunkEnd - 1, 4), Math.min(n - 1, trunkEnd + 2));
    }

    return con;
  }

  let connections = buildConnectionsStable(peopleStars.length);

  // =========================================================
  // 3) ПАНОРАМИРОВАНИЕ КОЛЁСИКОМ — rAF (как у тебя было без лагов)
  // =========================================================
  let panX = 0;
  let panY = 0;

  function clampPan(){
    const view = space.getBoundingClientRect();
    const wW = world.offsetWidth;
    const wH = world.offsetHeight;

    const minX = view.width - wW - 600;
    const maxX = 600;
    const minY = view.height - wH - 600;
    const maxY = 600;

    panX = Math.max(minX, Math.min(maxX, panX));
    panY = Math.max(minY, Math.min(maxY, panY));
  }

  let needDrawLines = false;
  const requestDrawLines = () => { needDrawLines = true; };

  function applyPan(){
    world.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
    requestDrawLines();
  }

  let wheelAccX = 0;
  let wheelAccY = 0;
  let wheelRaf = 0;

  function applyWheelPan() {
    wheelRaf = 0;
    const speed = 1.1;

    panX -= wheelAccX * speed;
    panY -= wheelAccY * speed;

    wheelAccX = 0;
    wheelAccY = 0;

    clampPan();
    applyPan();
  }

  space.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();

    wheelAccX += (e.deltaX || 0);
    wheelAccY += (e.deltaY || 0);

    wheelAccX = Math.max(-180, Math.min(180, wheelAccX));
    wheelAccY = Math.max(-180, Math.min(180, wheelAccY));

    if (!wheelRaf) wheelRaf = requestAnimationFrame(applyWheelPan);
  }, { passive:false });

  // =========================================================
  // 4) ПОЗИЦИИ (как было)
  // =========================================================
  function positionPeopleStars(){
    const w = world.offsetWidth;
    const h = world.offsetHeight;

    peopleStars.forEach(star => {
      const px = parseFloat(star.dataset.x || '50');
      const py = parseFloat(star.dataset.y || '50');
      star.style.left = (w * (px / 100)) + 'px';
      star.style.top  = (h * (py / 100)) + 'px';
    });
  }

  // =========================================================
  // 5) ЦЕНТРИРОВАНИЕ (как было)
  // =========================================================
  function centerWorldOnConstellation(){
    if (peopleStars.length === 0) return;

    const view = space.getBoundingClientRect();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const star of peopleStars){
      const el = star.querySelector('.person-star');
      if (!el) continue;

      const x = parseFloat(star.style.left || '0') + el.offsetWidth / 2;
      const y = parseFloat(star.style.top  || '0') + el.offsetHeight / 2;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    if (!isFinite(minX)) return;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    panX = (view.width / 2) - cx;
    panY = (view.height / 2) - cy;

    clampPan();
    applyPan();
  }

  // =========================================================
  // 6) ЛИНИИ (как было)
  // =========================================================
  function drawLines(){
    needDrawLines = false;

    const rect = world.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML = '';

    const centers = peopleStars.map(star => {
      const target = star.querySelector('.person-star');
      const r = target.getBoundingClientRect();
      return {
        x: (r.left - rect.left) + r.width / 2,
        y: (r.top  - rect.top)  + r.height / 2
      };
    });

    for (const [a,b] of connections){
      const A = centers[a], B = centers[b];
      if (!A || !B) continue;

      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', A.x);
      line.setAttribute('y1', A.y);
      line.setAttribute('x2', B.x);
      line.setAttribute('y2', B.y);
      svg.appendChild(line);
    }
  }

  // =========================================================
  // 7) ФОН + ПАДАЮЩИЕ (БЕЗ движения от курсора + больше звёзд)
  // =========================================================

  // КАЧЕСТВО
  // Важно: увеличиваем в основном FAR (дешёвые точки).
  // NEAR чуть-чуть, чтобы не убить FPS.
  const QUALITY = {
    maxDpr: 1.35,

    // FAR — много звёзд
    farMax: 24000,
    farMin: 9500,
    farDiv: 290,

    // NEAR — осторожно
    nearMax: 3200,
    nearMin: 1200,
    nearDiv: 2400,

    // меньше ореолов = быстрее
    haloOnlyIfR: 1.28,
  };

  function setupFixedCanvas(canvas, ctx){
    const dpr = Math.max(1, Math.min(QUALITY.maxDpr, window.devicePixelRatio || 1));
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: window.innerWidth, h: window.innerHeight };
  }

  let farStars = [];
  let nearStars = [];

  function initStarLayers(){
    const { w, h } = setupFixedCanvas(farCanvas, farCtx);
    setupFixedCanvas(nearCanvas, nearCtx);
    setupFixedCanvas(shootCanvas, shootCtx);

    const area = w * h;

    const farCount  = Math.max(QUALITY.farMin,  Math.min(QUALITY.farMax,  Math.floor(area / QUALITY.farDiv)));
    const nearCount = Math.max(QUALITY.nearMin, Math.min(QUALITY.nearMax, Math.floor(area / QUALITY.nearDiv)));

    farStars = [];
    nearStars = [];

    // FAR — мелкие и чуть ярче (кажется "ещё больше", но дешево по FPS)
    for(let i=0;i<farCount;i++){
      farStars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*0.45 + 0.07,
        a: Math.random()*0.30 + 0.06,
        tw: (Math.random()*1.0 + 0.25),
        ph: Math.random()*Math.PI*2,
        vx: (Math.random()-0.5)*0.010,
        vy: (Math.random()-0.5)*0.010
      });
    }

    for(let i=0;i<nearCount;i++){
      nearStars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*1.15 + 0.26,
        a: Math.random()*0.40 + 0.08,
        tw: (Math.random()*1.35 + 0.55),
        ph: Math.random()*Math.PI*2,
        vx: (Math.random()-0.5)*0.028,
        vy: (Math.random()-0.5)*0.028
      });
    }

    shootings.length = 0;
    nextShootAt = performance.now() + 1100 + Math.random()*2100;
  }

  const shootings = [];
  let nextShootAt = 0;
  const MAX_SHOOTINGS = 6;

  function spawnShootingStar(w, h){
    const fromTop = Math.random() < 0.65;
    const x0 = fromTop ? Math.random() * w : -200;
    const y0 = fromTop ? -200 : Math.random() * (h * 0.70);

    const angle = 0.70 + Math.random()*0.45;
    const speed = 900 + Math.random()*1100;

    return {
      x: x0,
      y: y0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.55 + Math.random()*0.60,
      tail: 300 + Math.random()*240
    };
  }

  function maybeSpawnShooting(now, w, h){
    if (now < nextShootAt) return;

    let burst = 1;
    if (Math.random() < 0.50) burst++;
    if (Math.random() < 0.20) burst++;

    for (let i = 0; i < burst; i++){
      if (shootings.length >= MAX_SHOOTINGS) break;
      const s = spawnShootingStar(w, h);
      s.x += (Math.random()-0.5) * 140;
      s.y += (Math.random()-0.5) * 90;
      shootings.push(s);
    }

    nextShootAt = now + 1050 + Math.random()*2300;
  }

  function drawShootings(dt, w, h){
    shootCtx.clearRect(0,0,w,h);
    if (shootings.length === 0) return;

    for (let i = shootings.length - 1; i >= 0; i--){
      const s = shootings[i];

      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      const t = s.life / s.maxLife;
      const alpha = Math.max(0, 1 - t);

      const tx = s.x - (s.vx / 1450) * s.tail;
      const ty = s.y - (s.vy / 1450) * s.tail;

      const grad = shootCtx.createLinearGradient(s.x, s.y, tx, ty);
      grad.addColorStop(0, `rgba(255,255,255,${0.90*alpha})`);
      grad.addColorStop(1, `rgba(255,255,255,0)`);

      shootCtx.lineWidth = 2;
      shootCtx.strokeStyle = grad;
      shootCtx.beginPath();
      shootCtx.moveTo(s.x, s.y);
      shootCtx.lineTo(tx, ty);
      shootCtx.stroke();

      shootCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      shootCtx.beginPath();
      shootCtx.arc(s.x, s.y, 2.0, 0, Math.PI*2);
      shootCtx.fill();

      if (t >= 1 || s.x > w+520 || s.y > h+520){
        shootings.splice(i, 1);
      }
    }
  }

  // Авто-урезание, если вдруг ноуту тяжело (без дерганья)
  let fpsAcc = 0, fpsCount = 0;
  let qualityDropped = false;

  function maybeDropQuality(dt){
    fpsAcc += dt;
    fpsCount += 1;

    if (fpsAcc < 2.6) return;
    const fps = fpsCount / fpsAcc;

    fpsAcc = 0;
    fpsCount = 0;

    if (!qualityDropped && fps < 45){
      qualityDropped = true;

      // режем near сильнее, far чуть-чуть
      nearStars = nearStars.slice(0, Math.max(900, Math.floor(nearStars.length * 0.65)));
      farStars  = farStars.slice(0, Math.max(7000, Math.floor(farStars.length * 0.80)));

      nextShootAt = performance.now() + 1500 + Math.random()*2600;
    }
  }

  let lastTime = performance.now();
  let linePulse = 0;

  function animate(now){
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    maybeDropQuality(dt);

    const w = window.innerWidth;
    const h = window.innerHeight;

    // ===== FAR (без параллакса от курсора: оффсеты = 0) =====
    farCtx.clearRect(0,0,w,h);

    for (const s of farStars){
      s.x += s.vx; s.y += s.vy;
      if (s.x < -12) s.x = w+12;
      if (s.x > w+12) s.x = -12;
      if (s.y < -12) s.y = h+12;
      if (s.y > h+12) s.y = -12;

      const twinkle = 0.60 + 0.40 * Math.sin(now/1000 * s.tw + s.ph);
      const a = s.a * twinkle;

      farCtx.beginPath();
      farCtx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      farCtx.fillStyle = `rgba(255,255,255,${a})`;
      farCtx.fill();
    }

    // ===== NEAR (без параллакса от курсора: оффсеты = 0) =====
    nearCtx.clearRect(0,0,w,h);

    for (const s of nearStars){
      s.x += s.vx; s.y += s.vy;
      if (s.x < -14) s.x = w+14;
      if (s.x > w+14) s.x = -14;
      if (s.y < -14) s.y = h+14;
      if (s.y > h+14) s.y = -14;

      const twinkle = 0.56 + 0.44 * Math.sin(now/1000 * s.tw + s.ph);
      const a = s.a * twinkle;

      if (s.r > QUALITY.haloOnlyIfR){
        nearCtx.beginPath();
        nearCtx.arc(s.x, s.y, s.r*3.0, 0, Math.PI*2);
        nearCtx.fillStyle = `rgba(255,255,255,${a*0.07})`;
        nearCtx.fill();
      }

      nearCtx.beginPath();
      nearCtx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      nearCtx.fillStyle = `rgba(255,255,255,${a})`;
      nearCtx.fill();
    }

    maybeSpawnShooting(now, w, h);
    drawShootings(dt, w, h);

    linePulse += dt;
    svg.style.opacity = String(0.60 + 0.08 * Math.sin(linePulse * 0.9));

    if (needDrawLines) drawLines();

    requestAnimationFrame(animate);
  }

  // =========================================================
  // INIT
  // =========================================================
  function initAll(){
    layoutBranchedBrokenRidge();
    connections = buildConnectionsStable(peopleStars.length);

    positionPeopleStars();
    centerWorldOnConstellation();

    initStarLayers();
    requestDrawLines();
    drawLines();
  }

  initAll();
  requestAnimationFrame(animate);

  setTimeout(() => { positionPeopleStars(); centerWorldOnConstellation(); requestDrawLines(); drawLines(); }, 220);
  setTimeout(() => { positionPeopleStars(); centerWorldOnConstellation(); requestDrawLines(); drawLines(); }, 900);

  window.addEventListener('resize', () => {
    qualityDropped = false;
    initAll();
  });
})();
