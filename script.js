/* ============================================================
   Kingdom Protista — Presentation Logic
   ปุ่มลัด: ← → / Space เปลี่ยนหน้า · N = บทพูด · F = เต็มจอ
            1-9 = เลือกแท็บ / ขั้นตอน / คำตอบในหน้านั้น
   ============================================================ */
(() => {
  'use strict';

  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const notes = document.getElementById('notes');
  const notesBody = document.getElementById('notesBody');
  const bar = document.getElementById('bar');
  const counter = document.getElementById('counter');
  const dotsBox = document.getElementById('dots');
  let cur = -1;

  /* ---------- Fit stage to window ---------- */
  // จอกว้าง (แนวนอน): ย่อ/ขยาย stage 1280×720 ให้พอดีจอ
  // จอแคบหรือแนวตั้ง (มือถือ/แท็บเล็ต): ใช้เลย์เอาต์ไหลตามจอ เลื่อนขึ้นลงในแต่ละหน้าได้
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const mobile = w < 900 || w / h < 1.15;
    document.body.classList.toggle('mobile', mobile);
    if (mobile) {
      stage.style.transform = '';
    } else {
      const s = Math.min(w / 1280, h / 720);
      stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    }
  }
  window.addEventListener('resize', () => { fit(); centerArt(); });
  fit();

  // มือถือ: ภาพที่เลื่อนแนวนอนได้ ให้เริ่มที่กึ่งกลาง
  function centerArt() {
    if (!document.body.classList.contains('mobile')) return;
    requestAnimationFrame(() => document.querySelectorAll('.pane.active .pane-art').forEach((a) => {
      a.scrollLeft = (a.scrollWidth - a.clientWidth) / 2;
    }));
  }

  /* ---------- Navigation ---------- */
  slides.forEach((s, i) => {
    const d = document.createElement('button');
    d.className = 'dot';
    d.title = `หน้า ${i + 1}`;
    d.setAttribute('aria-label', `ไปยังหน้า ${i + 1}`);
    d.addEventListener('click', (e) => { go(i); e.currentTarget.blur(); });
    dotsBox.appendChild(d);
  });
  const dots = [...dotsBox.children];

  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur) return;
    cur = n;
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      s.classList.toggle('prev', i < n);
    });
    slides[n].scrollTop = 0;
    setTimeout(centerArt, 60);
    dots.forEach((d, i) => d.classList.toggle('on', i === n));
    bar.style.width = ((n + 1) / slides.length * 100) + '%';
    counter.textContent = `${n + 1} / ${slides.length}`;
    document.body.dataset.slide = n;
    const nt = slides[n].querySelector('.notes');
    notesBody.innerHTML = nt ? nt.innerHTML : '<p class="muted">— ไม่มีบทพูดในหน้านี้ —</p>';
    try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) { /* ignore */ }
  }
  const next = () => go(cur + 1);
  const prev = () => go(cur - 1);

  document.getElementById('prevBtn').addEventListener('click', (e) => { prev(); e.currentTarget.blur(); });
  document.getElementById('nextBtn').addEventListener('click', (e) => { next(); e.currentTarget.blur(); });
  document.querySelector('.zone.l').addEventListener('click', (e) => { prev(); e.currentTarget.blur(); });
  document.querySelector('.zone.r').addEventListener('click', (e) => { next(); e.currentTarget.blur(); });

  /* ---------- Notes & fullscreen ---------- */
  const notesBtn = document.getElementById('notesBtn');
  function toggleNotes() {
    const open = notes.classList.toggle('open');
    notesBtn.classList.toggle('on', open);
  }
  function toggleFS() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }
  notesBtn.addEventListener('click', (e) => { toggleNotes(); e.currentTarget.blur(); });
  document.getElementById('fsBtn').addEventListener('click', (e) => { toggleFS(); e.currentTarget.blur(); });

  /* ---------- Keyboard ---------- */
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === ' ') { e.preventDefault(); e.shiftKey ? prev() : next(); }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(slides.length - 1); }
    else if (k === 'n' || k === 'N') toggleNotes();
    else if (k === 'f' || k === 'F') toggleFS();
    else if (/^[1-9]$/.test(k)) {
      const items = [...slides[cur].querySelectorAll('.tab, .step, .opt')]
        .filter((el) => el.offsetParent !== null && !el.disabled);
      const el = items[parseInt(k, 10) - 1];
      if (el) el.click();
    }
  });

  /* ---------- Touch swipe ---------- */
  let tx = 0, ty = 0, noSwipe = false;
  window.addEventListener('touchstart', (e) => {
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    // ไม่ให้ปัดเปลี่ยนหน้าตอนกำลังเลื่อนตาราง/ภาพที่เลื่อนแนวนอนได้
    noSwipe = !!e.target.closest('.tbl, .pane-art, #notes');
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (noSwipe) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  }, { passive: true });

  /* ---------- Idle UI hide ---------- */
  let idleTimer;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 3000);
  }
  ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
  wake();

  /* ---------- Tabs / steppers (.viewer) ---------- */
  document.querySelectorAll('.viewer').forEach((v) => {
    const tabs = [...v.querySelectorAll('.tab, .step')];
    const panes = [...v.querySelectorAll('.pane')];
    tabs.forEach((t) => {
      t.addEventListener('click', () => {
        tabs.forEach((x) => x.classList.toggle('active', x === t));
        panes.forEach((p) => p.classList.toggle('active', p.id === t.dataset.pane));
        t.blur();
        centerArt();
      });
    });
  });

  /* ---------- Table labels (ใช้ตอนแสดงเป็นการ์ดบนมือถือ) ---------- */
  document.querySelectorAll('.tbl').forEach((t) => {
    const heads = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
    t.querySelectorAll('tbody tr').forEach((r) => [...r.children].forEach((c, i) => { c.dataset.label = heads[i] || ''; }));
  });

  /* ---------- Quiz ---------- */
  const Q = [
    {
      q: 'ข้อใดเป็นลักษณะที่พบในโพรทิสต์ทุกชนิด?',
      o: ['เป็นสิ่งมีชีวิตเซลล์เดียวเท่านั้น', 'เป็นยูคาริโอต (Eukaryote)', 'สังเคราะห์ด้วยแสงได้', 'ไม่มีผนังเซลล์'],
      a: 1,
      e: 'โพรทิสต์ทุกชนิดเป็นยูคาริโอต แต่บางกลุ่มเป็นหลายเซลล์ (เช่น สาหร่ายสีน้ำตาล) บางกลุ่มสังเคราะห์ด้วยแสงไม่ได้ และบางกลุ่มมีผนังเซลล์'
    },
    {
      q: 'โพรโทซัวชนิดใดเคลื่อนที่ด้วยซิเลีย (Cilia)?',
      o: ['Amoeba', 'Paramecium', 'Trypanosoma', 'Plasmodium'],
      a: 1,
      e: 'Paramecium จัดอยู่ในกลุ่ม Ciliate เคลื่อนที่ด้วยซิเลียที่คลุมผิวเซลล์ ส่วน Amoeba ใช้เท้าเทียม และ Trypanosoma ใช้แฟลเจลลัม'
    },
    {
      q: 'สาหร่ายกลุ่มใดมีผนังเซลล์เป็นซิลิกา (SiO₂) ประกอบกันเป็นสองฝา?',
      o: ['Chlorophyta', 'Phaeophyta', 'Chrysophyta (ไดอะตอม)', 'Rhodophyta'],
      a: 2,
      e: 'ไดอะตอมมีผนังเซลล์ซิลิกาเรียกว่า Frustule ซากที่ทับถมกันกลายเป็น Diatomaceous earth'
    },
    {
      q: 'ข้อใดจับคู่เชื้อกับโรคได้ถูกต้อง?',
      o: ['Plasmodium — มาลาเรีย', 'Entamoeba histolytica — โรคเหงาหลับ', 'Trypanosoma — บิดอะมีบา', 'Giardia — มาลาเรีย'],
      a: 0,
      e: 'Plasmodium ก่อโรคมาลาเรีย (มียุงก้นปล่องเป็นพาหะ) · Entamoeba ก่อบิดอะมีบา · Trypanosoma ก่อโรคเหงาหลับ · Giardia ก่อโรคท้องเสีย'
    },
    {
      q: 'ราน้ำ (Water mold) แตกต่างจากราแท้ (Fungi) อย่างไร?',
      o: ['ผนังเซลล์เป็นไคติน', 'สร้างซูสปอร์ที่มีแฟลเจลลัมเคลื่อนที่ได้', 'สังเคราะห์ด้วยแสงได้', 'ไม่มีเส้นใย'],
      a: 1,
      e: 'ราน้ำมีผนังเซลล์เป็นเซลลูโลสและสร้างซูสปอร์ที่มีแฟลเจลลัม ขณะที่ราแท้มีผนังเซลล์เป็นไคติน'
    }
  ];
  const box = document.getElementById('quizBox');
  let qi = 0, score = 0;

  function renderQ() {
    if (qi >= Q.length) {
      const pct = score / Q.length;
      const msg = pct === 1 ? 'เยี่ยมมาก! เข้าใจเนื้อหาครบถ้วน' : pct >= 0.6 ? 'ดีมาก ทบทวนอีกเล็กน้อยก็สมบูรณ์' : 'ลองทบทวนหน้าก่อนหน้าอีกครั้งนะ';
      box.innerHTML = `<div class="score"><div class="num">${score}/${Q.length}</div><p>${msg}</p>
        <button class="btn" id="retry">ทำใหม่อีกครั้ง</button></div>`;
      box.querySelector('#retry').addEventListener('click', (e) => { qi = 0; score = 0; renderQ(); e.currentTarget.blur(); });
      return;
    }
    const item = Q[qi];
    box.innerHTML = `
      <div class="q-meta"><span>QUIZ · ข้อ ${qi + 1} / ${Q.length}</span><span>กด 1–4 เพื่อตอบ</span></div>
      <div class="q-text">${item.q}</div>
      <div class="opts">${item.o.map((t, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${t}</span></button>`).join('')}</div>
      <div class="q-exp" id="qexp"></div>`;
    box.querySelectorAll('.opt').forEach((b) => {
      b.addEventListener('click', () => {
        const pick = parseInt(b.dataset.i, 10);
        const opts = [...box.querySelectorAll('.opt')];
        opts.forEach((o, i) => {
          o.disabled = true;
          if (i === item.a) o.classList.add('right');
          else if (i === pick) o.classList.add('wrong');
        });
        if (pick === item.a) score++;
        const exp = box.querySelector('#qexp');
        exp.innerHTML = `<b>${pick === item.a ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'}</b> — ${item.e}<br>
          <button class="btn" id="nextQ">${qi + 1 < Q.length ? 'ข้อถัดไป' : 'ดูคะแนน'}</button>`;
        exp.querySelector('#nextQ').addEventListener('click', (e) => { qi++; renderQ(); e.currentTarget.blur(); });
        b.blur();
      });
    });
  }
  renderQ();

  /* ---------- Ambient background (floating microbes) ---------- */
  const cv = document.getElementById('bg');
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0;
  const blobs = [];
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', () => { sizeCanvas(); if (reduce) draw(); });
  for (let i = 0; i < 38; i++) {
    blobs.push({
      x: Math.random(), y: Math.random(),
      r: 4 + Math.random() * 34,
      vx: (Math.random() - 0.5) * 0.00006,
      vy: -0.00003 - Math.random() * 0.00006,
      a: 0.25 + Math.random() * 0.75,
      ph: Math.random() * 6.28,
      nuc: Math.random() > 0.6
    });
  }
  function draw(t = 0) {
    ctx.clearRect(0, 0, W, H);
    for (const b of blobs) {
      const x = b.x * W + Math.sin(t / 2600 + b.ph) * 14;
      const y = b.y * H + Math.cos(t / 3100 + b.ph) * 10;
      ctx.beginPath();
      ctx.ellipse(x, y, b.r, b.r * (0.85 + 0.1 * Math.sin(t / 1800 + b.ph)), b.ph, 0, 6.283);
      ctx.fillStyle = `rgba(103,232,249,${b.a * 0.06})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(153,246,228,${b.a * 0.2})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      if (b.nuc && b.r > 12) {
        ctx.beginPath();
        ctx.arc(x + b.r * 0.15, y - b.r * 0.1, b.r * 0.28, 0, 6.283);
        ctx.fillStyle = `rgba(167,139,250,${b.a * 0.14})`;
        ctx.fill();
      }
    }
  }
  function loop(t) {
    for (const b of blobs) {
      b.x += b.vx * 16; b.y += b.vy * 16;
      if (b.y < -0.08) { b.y = 1.08; b.x = Math.random(); }
      if (b.x < -0.08) b.x = 1.08;
      if (b.x > 1.08) b.x = -0.08;
    }
    draw(t);
    requestAnimationFrame(loop);
  }
  if (reduce) draw(); else requestAnimationFrame(loop);

  /* ---------- Start ---------- */
  const start = parseInt((location.hash || '').replace('#', ''), 10);
  go(Number.isFinite(start) ? start - 1 : 0);
  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.replace('#', ''), 10);
    if (Number.isFinite(n)) go(n - 1);
  });
})();
