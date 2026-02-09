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
  // 1) РАСКЛАДКА: КУЧНЕЕ + ЛОМАНЫЙ ХРЕБЕТ + ВЕТКИ
  // =========================================================
  function layoutBranchedBrokenRidge() {
    const n = peopleStars.length;
    if (!n) return;

    // Чуть компактнее и аккуратнее по краям (чтобы «концы» выглядели лучше)
    // (звезды могут всё ещё выходить за экран за счёт большого world)
    const X_MIN = 10, X_MAX = 90;
    const Y_MIN = 20, Y_MAX = 88;

    // больше звёзд на хребте, чтобы созвездие было компактнее и связнее
    const trunkEnd = Math.min(n, Math.max(10, Math.round(n * 0.68)));
    const rest = n - trunkEnd;

    const pos = new Array(n);

    // точки переломов
    const kink1 = Math.floor(trunkEnd * 0.28);
    const kink2 = Math.floor(trunkEnd * 0.56);
    const kink3 = Math.floor(trunkEnd * 0.80);

    // --- Хребет ---
    for (let i = 0; i < trunkEnd; i++) {
      const t = trunkEnd === 1 ? 0.5 : i / (trunkEnd - 1);

      let x = X_MIN + (X_MAX - X_MIN) * t;

      // меньше амплитуда => кучнее
      let y = 56
        + Math.sin(t * Math.PI) * 6.5
        + Math.sin(t * 2.7) * 3.2;

      // ломаность (чуть мягче, чтобы не разносило по высоте)
      if (i >= kink1) y += 4.6;
      if (i >= kink2) y -= 7.2;
      if (i >= kink3) y += 5.2;

      // микро-хаос меньше
      x += (Math.random() - 0.5) * 1.0;
      y += (Math.random() - 0.5) * 1.0;

      y = Math.max(Y_MIN, Math.min(Y_MAX, y));
      pos[i] = { x, y };
    }

    // --- Ветки ---
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

      // Ветки: более «прямой угол» к хребту и ближе к нему
      // Берём локальный тангенс хребта и строим перпендикуляр.
      const prev = pos[Math.max(0, a - 1)] || A;
      const next = pos[Math.min(trunkEnd - 1, a + 1)] || A;
      let tx = next.x - prev.x;
      let ty = next.y - prev.y;
      const tLen = Math.hypot(tx, ty) || 1;
      tx /= tLen;
      ty /= tLen;

      // перпендикуляр к хребту
      let px = -ty;
      let py = tx;

      // чередуем вверх/вниз (стабильнее и красивее)
      const side = (b % 2 === 0) ? -1 : 1;
      px *= side;
      py *= side;

      // длина ветки (не слишком далеко от хребта)
      const lenBase = 10 + Math.random() * 4 + Math.min(6, len) * 1.6;
      // небольшой «вынос» вдоль хребта, чтобы угол был живее, но всё ещё близок к 90°
      const along = 0.12 + Math.random() * 0.08;

      for (let k = 0; k < len && idx < n; k++) {
        const t = (k + 1) / (len + 1);

        // равномернее разводим 2+ звезды на ветке, чтобы не слипались
        const tt = (k + 1) / (len + 0.7);

        let x = A.x + px * (tt * lenBase) + tx * (tt * lenBase * along);
        let y = A.y + py * (tt * lenBase) + ty * (tt * lenBase * along);

        // лёгкая дуга (очень мягко)
        x += Math.sin(tt * Math.PI) * 0.7 * px;
        y += Math.sin(tt * Math.PI) * 0.7 * py;

        // микро-хаос
        x += (Math.random() - 0.5) * 0.9;
        y += (Math.random() - 0.5) * 0.9;

        x = Math.max(X_MIN, Math.min(X_MAX, x));
        y = Math.max(Y_MIN, Math.min(Y_MAX, y));

        pos[idx++] = { x, y };
      }
    }

    // если осталось — ближе к центру
    while (idx < n) {
      pos[idx++] = {
        x: 50 + (Math.random() - 0.5) * 30,
        y: 55 + (Math.random() - 0.5) * 24
      };
    }

    // “стяжка” сильнее => расстояния меньше
    const PULL = 0.78; // было ~0.86; меньше => кучнее
    for (let i = 0; i < n; i++) {
      const x = 50 + (pos[i].x - 50) * PULL;
      const y = 50 + (pos[i].y - 50) * PULL;
      peopleStars[i].dataset.x = String(x);
      peopleStars[i].dataset.y = String(y);
    }
  }

  // =========================================================
  // 2) СВЯЗИ: ХРЕБЕТ + ВЕТКИ + ГАРАНТИЯ КРАЁВ
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

    // мягкие перемычки
   
    return con;
  }

  let connections = buildConnectionsStable(peopleStars.length);

  // =========================================================
  // 3) ПАНОРАМИРОВАНИЕ КОЛЁСИКОМ
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
  // линии НЕ нужно перерисовывать при панорамировании
}


  space.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();

    const speed = 1.1;
    panX -= (e.deltaX || 0) * speed;
    panY -= (e.deltaY || 0) * speed;

    clampPan();
    applyPan();
  }, { passive:false });

// =========================================================
// 3.1) ПАНОРАМИРОВАНИЕ ПЕРЕТАСКИВАНИЕМ (мышь / тач)
// =========================================================

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let panStartX = 0;
let panStartY = 0;

// отключаем нативный тач-скролл страницы
space.style.touchAction = 'none';

space.addEventListener('pointerdown', (e) => {
  if (e.button !== undefined && e.button !== 0) return;

  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  panStartX = panX;
  panStartY = panY;

  space.setPointerCapture(e.pointerId);
  space.classList.add('is-grabbing');
});

space.addEventListener('pointermove', (e) => {
  if (!isDragging) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  panX = panStartX + dx;
  panY = panStartY + dy;

  clampPan();
  applyPan();
});

function stopDrag(e) {
  if (!isDragging) return;
  isDragging = false;
  space.classList.remove('is-grabbing');
  try { space.releasePointerCapture(e.pointerId); } catch {}
}

space.addEventListener('pointerup', stopDrag);
space.addEventListener('pointercancel', stopDrag);
space.addEventListener('pointerleave', stopDrag);


  // =========================================================
  // 4) ПОЗИЦИИ
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
  // 5) АВТО-ЦЕНТРИРОВАНИЕ ПРИ ОТКРЫТИИ (чтобы звезды были видны)
  // =========================================================
  function centerWorldOnConstellation(){
    if (peopleStars.length === 0) return;

    const view = space.getBoundingClientRect();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // берем центры .person-star в координатах WORLD
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

    // хотим, чтобы cx/cy попали в центр viewport
    panX = (view.width / 2) - cx;
    panY = (view.height / 2) - cy;

    clampPan();
    applyPan();
  }

  // =========================================================
  // 6) ЛИНИИ
  // =========================================================
  function drawLines(){
    needDrawLines = false;

const w = world.offsetWidth;
const h = world.offsetHeight;

svg.setAttribute('width', w);
svg.setAttribute('height', h);
svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
svg.innerHTML = '';

const centers = peopleStars.map(star => {
  const x = parseFloat(star.style.left || '0');
  const y = parseFloat(star.style.top  || '0');
  return { x, y };
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
  // 7) ФОН + ПАДАЮЩИЕ (как было)
  // =========================================================
  let mouseX = 0, mouseY = 0;
  let pX = 0, pY = 0;

  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseX = (e.clientX - cx) / window.innerWidth;
    mouseY = (e.clientY - cy) / window.innerHeight;
  });
  window.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });

  function setupFixedCanvas(canvas, ctx){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
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

    const farCount  = Math.max(7000, Math.min(26000, Math.floor(area / 360)));
    const nearCount = Math.max(1700, Math.min(6200,  Math.floor(area / 1800)));

    farStars = [];
    nearStars = [];

    for(let i=0;i<farCount;i++){
      farStars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        // меньше размер фоновых звёзд
        r: Math.random()*0.40 + 0.08,
        a: Math.random()*0.26 + 0.04,
        tw: (Math.random()*1.0 + 0.25),
        ph: Math.random()*Math.PI*2,
        vx: (Math.random()-0.5)*0.012,
        vy: (Math.random()-0.5)*0.012
      });
    }

    for(let i=0;i<nearCount;i++){
      nearStars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        // ближний слой тоже чуть меньше, чтобы не «шуметь»
        r: Math.random()*0.95 + 0.20,
        a: Math.random()*0.42 + 0.08,
        tw: (Math.random()*1.35 + 0.55),
        ph: Math.random()*Math.PI*2,
        vx: (Math.random()-0.5)*0.034,
        vy: (Math.random()-0.5)*0.034
      });
    }

    shootings.length = 0;
    nextShootAt = performance.now() + 900 + Math.random()*1900;
  }

  const shootings = [];
  let nextShootAt = 0;
  const MAX_SHOOTINGS = 6;

  function spawnShootingStar(w, h){
    const fromTop = Math.random() < 0.65;
    const x0 = fromTop ? Math.random() * w : -200;
    const y0 = fromTop ? -200 : Math.random() * (h * 0.70);

    const angle = 0.70 + Math.random()*0.45;
    const speed = 950 + Math.random()*1200;

    return {
      x: x0,
      y: y0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.55 + Math.random()*0.60,
      tail: 320 + Math.random()*260
    };
  }

  function maybeSpawnShooting(now, w, h){
    if (now < nextShootAt) return;

    let burst = 1;
    if (Math.random() < 0.55) burst++;
    if (Math.random() < 0.25) burst++;

    for (let i = 0; i < burst; i++){
      if (shootings.length >= MAX_SHOOTINGS) break;
      const s = spawnShootingStar(w, h);
      s.x += (Math.random()-0.5) * 140;
      s.y += (Math.random()-0.5) * 90;
      shootings.push(s);
    }

    nextShootAt = now + 850 + Math.random()*2000;
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

  let lastTime = performance.now();
  let linePulse = 0;

  function animate(now){
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    const w = window.innerWidth;
    const h = window.innerHeight;

    pX += (mouseX - pX) * 0.055;
    pY += (mouseY - pY) * 0.055;

    // FAR
    farCtx.clearRect(0,0,w,h);
    const farOffX = pX * 12;
    const farOffY = pY * 12;

    for (const s of farStars){
      s.x += s.vx; s.y += s.vy;
      if (s.x < -12) s.x = w+12;
      if (s.x > w+12) s.x = -12;
      if (s.y < -12) s.y = h+12;
      if (s.y > h+12) s.y = -12;

      const twinkle = 0.60 + 0.40 * Math.sin(now/1000 * s.tw + s.ph);
      const a = s.a * twinkle;

      const xx = ((s.x + farOffX) % w + w) % w;
      const yy = ((s.y + farOffY) % h + h) % h;

      farCtx.beginPath();
      farCtx.arc(xx, yy, s.r, 0, Math.PI*2);
      farCtx.fillStyle = `rgba(255,255,255,${a})`;
      farCtx.fill();
    }

    // NEAR
    nearCtx.clearRect(0,0,w,h);
    const nearOffX = pX * 30;
    const nearOffY = pY * 30;

    for (const s of nearStars){
      s.x += s.vx; s.y += s.vy;
      if (s.x < -14) s.x = w+14;
      if (s.x > w+14) s.x = -14;
      if (s.y < -14) s.y = h+14;
      if (s.y > h+14) s.y = -14;

      const twinkle = 0.56 + 0.44 * Math.sin(now/1000 * s.tw + s.ph);
      const a = s.a * twinkle;

      const xx = ((s.x + nearOffX) % w + w) % w;
      const yy = ((s.y + nearOffY) % h + h) % h;

      if (s.r > 1.05){
        nearCtx.beginPath();
        nearCtx.arc(xx, yy, s.r*3.4, 0, Math.PI*2);
        nearCtx.fillStyle = `rgba(255,255,255,${a*0.08})`;
        nearCtx.fill();
      }

      nearCtx.beginPath();
      nearCtx.arc(xx, yy, s.r, 0, Math.PI*2);
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

    // Главное: при открытии центрируем созвездие в экран
    centerWorldOnConstellation();

    initStarLayers();
    requestDrawLines();
    drawLines();
  }

  initAll();
  requestAnimationFrame(animate);

  // перестраховка на случай поздней загрузки шрифтов/верстки
  setTimeout(() => { positionPeopleStars(); centerWorldOnConstellation(); requestDrawLines(); drawLines(); }, 220);
  setTimeout(() => { positionPeopleStars(); centerWorldOnConstellation(); requestDrawLines(); drawLines(); }, 900);

  window.addEventListener('resize', initAll);

// =========================
// BLUR UNDER TOOLTIP (stars/lines only)
// =========================
function rectsIntersect(a, b){
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function addTooltipOcclusionBlur(){
  const wrappers = Array.from(document.querySelectorAll('.star-wrapper'));

  let active = {
    hovering: false,
    raf: 0,
    owner: null
  };

  function clearBlur(){
    wrappers.forEach(w => w.classList.remove('blurred'));
    const lines = svg.querySelectorAll('line.blurred');
    lines.forEach(l => l.classList.remove('blurred'));
  }

  function tick(){
    if (!active.hovering || !active.owner) return;

    const tooltip = active.owner.querySelector('.tooltip');
    if (!tooltip) return;

    const tRect = tooltip.getBoundingClientRect();

    // небольшой запас, чтобы выглядело естественно
    const pad = 10;
    const padded = {
      left: tRect.left - pad,
      top: tRect.top - pad,
      right: tRect.right + pad,
      bottom: tRect.bottom + pad
    };

    clearBlur();

    // 1) Размываем чужие звёзды, которые попали под карточку
    for (const w of wrappers){
      if (w === active.owner) continue;

      const starEl = w.querySelector('.person-star');
      if (!starEl) continue;

      const sRect = starEl.getBoundingClientRect();
      if (rectsIntersect(padded, sRect)){
        w.classList.add('blurred');
      }
    }

    // 2) Размываем линии, которые попали под карточку
    const lines = svg.querySelectorAll('line');
    for (const line of lines){
      const lRect = line.getBoundingClientRect();
      if (rectsIntersect(padded, lRect)){
        line.classList.add('blurred');
      }
    }

    active.raf = requestAnimationFrame(tick);
  }

  wrappers.forEach(w => {
    w.addEventListener('mouseenter', () => {
      active.hovering = true;
      active.owner = w;
      cancelAnimationFrame(active.raf);
      active.raf = requestAnimationFrame(tick);
    });

    w.addEventListener('mouseleave', () => {
      active.hovering = false;
      active.owner = null;
      cancelAnimationFrame(active.raf);
      clearBlur();
    });
  });

  // на случай прокрутки/панорамирования колёсиком во время hover
  space.addEventListener('wheel', () => {
    if (active.hovering) {
      cancelAnimationFrame(active.raf);
      active.raf = requestAnimationFrame(tick);
    }
  }, { passive: true });
}

// Запускаем после первой отрисовки линий
setTimeout(addTooltipOcclusionBlur, 300);

// =========================
// TOOLTIP in fixed layer (real backdrop blur)
// =========================
(function attachFixedTooltips(){
  const layer = document.getElementById('tooltip-layer');
  if (!layer) return;

  const wrappers = Array.from(document.querySelectorAll('.star-wrapper'));

  wrappers.forEach(w => {
    const tip = w.querySelector('.tooltip');
    if (!tip) return;

    // место, куда вернём tooltip обратно
    const homeParent = tip.parentNode;
    const homeNext = tip.nextSibling;

    function place(){
      const starEl = w.querySelector('.person-star') || w;
      const r = starEl.getBoundingClientRect();

      // позиция как раньше: по центру звезды и "ниже"
      tip.style.left = (r.left + r.width / 2) + 'px';
      tip.style.top  = (r.bottom + 10) + 'px';
    }

    w.addEventListener('mouseenter', () => {
      layer.appendChild(tip);
      place();
      tip.classList.add('is-show');
    });

    w.addEventListener('mouseleave', () => {
      tip.classList.remove('is-show');
      // вернуть обратно в DOM звезды
      if (homeNext) homeParent.insertBefore(tip, homeNext);
      else homeParent.appendChild(tip);
    });

    // чтобы tooltip не "отставал" при панорамировании
    const update = () => {
      if (tip.parentNode === layer && tip.classList.contains('is-show')) place();
    };

    space.addEventListener('wheel', update, { passive: true });
    space.addEventListener('pointermove', update, { passive: true });
    window.addEventListener('resize', update);
  });
})();


})();

