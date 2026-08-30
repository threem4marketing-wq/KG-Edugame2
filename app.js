/* ==============================================
   مجلة إنقاذ الكوكب الأزرق — app.js
   ============================================== */


(function() {
  /* نستخدم visualViewport API لتثبيت ارتفاع shell وعدم السماح للوحة المفاتيح
     بإعادة تدفق عناصر الصفحة — هذا هو الإصلاح الاحترافي لمشكلة iOS/Android */
  function setVVH() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--vvh', h + 'px');
  }
  setVVH();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVVH);
    window.visualViewport.addEventListener('scroll', setVVH);
  }
  window.addEventListener('resize', setVVH);
})();



/* ============ الحالة العامة والمتغيرات ============ */
const PAGES = [];
const State = { stars: new Set(), childName: '' };



/* ============ الدوال المساعدة والتحكم بالتفاعل المتجاوب ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

/* رسم شخصية "غيث" المبتسم ذو الخوذة الفضائية البراقة */
const GAITH = `<svg class="av" viewBox="0 0 64 64" aria-hidden="true">
<ellipse cx="32" cy="58" rx="18" ry="5" fill="rgba(15,23,42,0.18)"/>
<rect x="16" y="32" width="32" height="24" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
<rect x="25" y="38" width="14" height="10" rx="4" fill="#38bdf8"/>
<circle cx="32" cy="22" r="19" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
<path d="M18 22a14 14 0 0 1 28 0 14 14 0 0 1-28 0z" fill="#312e81"/>
<circle cx="26" cy="20" r="3.2" fill="#ffffff"/><circle cx="38" cy="20" r="3.2" fill="#ffffff"/>
<circle cx="27" cy="20" r="1.5" fill="#0f172a"/><circle cx="37" cy="20" r="1.5" fill="#0f172a"/>
<path d="M26 27q6 5 12 0" stroke="#fbbf24" stroke-width="3.2" fill="none" stroke-linecap="round"/>
<path d="M46 14l6-4 2 5-6 4z" fill="#ff4757"/>
<circle cx="48" cy="12" r="3" fill="#ffc107"/>
</svg>`;

function say(text) {
  return `<div class="say">${GAITH}<div><b>غيث:</b> ${text}</div></div>`;
}

/* توليد الأصوات التفاعلية المبهجة باستخدام Web Audio API */
let AC;
function chime(freqs = [660, 880, 1180]) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g);
      g.connect(AC.destination);
      const t = AC.currentTime + i * 0.08;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.start(t);
      o.stop(t + 0.45);
    });
  } catch (e) {}
}

/* نطق التعليمات بصوت واضح للمجلة */
function speak(txt) {
  try {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'ar-SA';
    u.rate = .88;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  } catch (e) {}
}

function readBtn(txt) {
  const b = document.createElement('button');
  b.className = 'btn ghost';
  b.style.fontSize = '12px';
  b.innerHTML = '🔊 اسمع التعليمات';
  b.onclick = () => speak(txt);
  return b;
}

/* منح النجم والمؤثرات البصرية عند النجاح */
function awardStar(idx, node, msg) {
  if (State.stars.has(idx)) {
    if (node) flash(node, msg || 'أحسنت! لقد أنجزت المهمة بنجاح.');
    return;
  }
  State.stars.add(idx);
  chime([523, 659, 784, 1046]);
  paintTrack();

  const b = document.createElement('div');
  b.className = 'burst';
  b.innerHTML = '<div class="s">⭐</div>';
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1200);

  if (node) flash(node, msg || 'رائع جدًا! حصلت على نجمة فضائية مضيئة ⭐');
}

function flash(node, msg, warn) {
  if (!node) return;
  node.className = 'fb show' + (warn ? ' warn' : '');
  node.innerHTML = msg;
}

function paintTrack() {
  $('#starCount').textContent = State.stars.size;
  $$('#track .dot').forEach((d, i) => d.classList.toggle('on', State.stars.has(i + 1)));
}

/* دعم السحب والإسقاط باللمس والفأرة المتجاوب للموبايل */
function makeDraggable(node, box) {
  let sx, sy, ox, oy;
  const down = e => {
    e.preventDefault();
    node.classList.add('drag');
    node.setPointerCapture(e.pointerId);
    const r = box.getBoundingClientRect();
    sx = e.clientX; sy = e.clientY;
    ox = node.offsetLeft; oy = node.offsetTop;
    box._r = r;
  };
  const move = e => {
    if (!node.classList.contains('drag')) return;
    let x = ox + (e.clientX - sx), y = oy + (e.clientY - sy);
    x = Math.max(-10, Math.min(box._r.width - 25, x));
    y = Math.max(-10, Math.min(box._r.height - 25, y));
    node.style.left = x + 'px';
    node.style.top = y + 'px';
  };
  const up = () => node.classList.remove('drag');
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
  node.addEventListener('dblclick', () => node.remove());
}

function placer(stage, getTool, size = 38) {
  stage.addEventListener('pointerdown', e => {
    if (e.target !== stage) return;
    const t = getTool();
    if (!t) return;
    const r = stage.getBoundingClientRect();
    const n = document.createElement('div');
    n.className = 'item';
    n.textContent = t;
    n.style.fontSize = size + 'px';
    n.style.left = (e.clientX - r.left - size / 2) + 'px';
    n.style.top = (e.clientY - r.top - size / 2) + 'px';
    stage.appendChild(n);
    makeDraggable(n, stage);
    chime([580]);
  });
}

function chipRow(items, onPick, label) {
  const w = document.createElement('div');
  w.className = 'tools';
  if (label) w.innerHTML = `<div class="lbl">${label}</div>`;
  items.forEach(it => {
    const c = document.createElement('button');
    c.className = 'chip';
    c.innerHTML = it.html || it;
    c.onclick = () => {
      $$('.chip', w).forEach(x => x.classList.remove('on'));
      c.classList.add('on');
      onPick(it.val !== undefined ? it.val : it, c);
    };
    w.appendChild(c);
  });
  return w;
}

/* رسم الحر بالفرشاة الملونة للموبايل */
function initDraw(cv, getColor, width = 6) {
  const ctx = cv.getContext('2d');
  let drawing = false;
  const fit = () => {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    const d = document.createElement('canvas');
    d.width = cv.width; d.height = cv.height;
    d.getContext('2d').drawImage(cv, 0, 0);
    cv.width = r.width; cv.height = r.height;
    ctx.drawImage(d, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  };
  new ResizeObserver(fit).observe(cv);
  const pos = e => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener('pointerdown', e => {
    drawing = true;
    cv.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    ctx.strokeStyle = getColor();
    ctx.lineWidth = width;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
    cv._pts = [[x, y]];
  });
  cv.addEventListener('pointermove', e => {
    if (!drawing) return;
    const [x, y] = pos(e);
    ctx.lineTo(x, y); ctx.stroke();
    cv._pts.push([x, y]);
  });
  const end = () => { drawing = false; };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.clearAll = () => ctx.clearRect(0, 0, cv.width, cv.height);
  return ctx;
}

/* مسجل الصوت التفاعلي المبهج */
function recorder() {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  const b = document.createElement('button');
  b.className = 'btn coral';
  b.textContent = '🎙️ سجّل صوتك';
  const p = document.createElement('button');
  p.className = 'btn ghost';
  p.textContent = '▶ استمع';
  p.style.display = 'none';
  const note = document.createElement('span');
  note.style.fontSize = '11px'; note.style.fontWeight = '800';
  let rec, chunks = [], url = null, on = false;

  b.onclick = async () => {
    if (on) {
      rec.stop(); on = false;
      b.textContent = '🎙️ سجّل صوتك'; b.className = 'btn coral';
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      rec = new MediaRecorder(s); chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        url = URL.createObjectURL(new Blob(chunks));
        p.style.display = '';
        note.textContent = 'تم حفظ صوتك الرائع ✅';
        s.getTracks().forEach(t => t.stop());
      };
      rec.start(); on = true;
      b.textContent = '⏹️ إيقاف';
      b.className = 'btn mint';
      note.textContent = 'جارٍ التسجيل…';
    } catch (err) {
      note.textContent = 'الميكروفون غير متاح — قل إجابتك بصوتك مسموع 😊';
    }
  };
  p.onclick = () => { if (url) new Audio(url).play(); };
  wrap.append(b, p, note);
  return wrap;
}



/* ============ رسم الصاروخ التفاعلي (نشاط 1 ونشاط 10) ============ */
const NOSES = [
  "M100 12 L140 110 H60 Z",
  "M100 15 C135 45 140 80 140 110 H60 C60 80 65 45 100 15 Z",
  "M65 110 V62 a35 35 0 0 1 70 0 v48 Z",
  "M100 20 q45 55 35 90 H65 q-10-35 35-90 Z",
  "M100 10 l25 45 -12 18 27 37 H60 l27-37 -12-18 Z",
  "M100 18 c30 22 40 58 40 92 H60 c0-34 10-70 40-92 Z",
  "M75 110 q0-70 25-98 q25 28 25 98 Z",
  "M60 110 q10-50 40-70 q30 20 40 70 Z"
];
const FINS = [
  "M65 200 L30 265 65 250 Z M135 200 L170 265 135 250 Z",
  "M65 210 q-40 20-35 55 l35-15 Z M135 210 q40 20 35 55 l-35-15 Z",
  "M65 190 L35 260 H65 Z M135 190 L165 260 H135 Z",
  "M65 215 C30 225 25 250 35 262 L65 252 Z M135 215 C170 225 175 250 165 262 L135 252 Z",
  "M65 205 l-45 55 45 0 Z M135 205 l45 55 -45 0 Z",
  "M65 220 q-35 5-40 40 l40-10 Z M135 220 q35 5 40 40 l-40-10 Z"
];
const ENGS = [
  "M75 260 h50 l8 30 H67 Z",
  "M70 260 h60 v18 a30 14 0 0 1-60 0 Z",
  "M78 260 h44 l14 34 H64 Z",
  "M72 260 h56 l-6 26 h-44 Z",
  "M72 260 h22 l6 30 H66 Z M106 260 h22 l6 30 h-34 Z",
  "M76 260 h48 q10 20 0 32 h-48 q-10-12 0-32 Z",
  "M80 258 h40 l16 40 H64 Z",
  "M70 260 h60 l-10 22 q-20 10 -40 0 Z"
];
function winShape(i, c = '#42e3b4') {
  const g = (s) => `<g fill="${c}" stroke="#1e295b" stroke-width="4">${s}</g>`;
  return [
    g('<circle cx="100" cy="160" r="26"/>'),
    g('<circle cx="100" cy="160" r="26"/><circle cx="100" cy="160" r="13" fill="#ffffff"/>'),
    g('<rect x="74" y="140" width="52" height="40" rx="12"/>'),
    g('<polygon points="100,132 110,154 134,157 116,173 121,196 100,184 79,196 84,173 66,157 90,154"/>'),
    g('<circle cx="82" cy="160" r="15"/><circle cx="118" cy="160" r="15"/>'),
    g('<polygon points="100,132 126,146 126,174 100,188 74,174 74,146"/>'),
    g('<path d="M100 186c-30-20-26-46-10-46 6 0 10 4 10 8 0-4 4-8 10-8 16 0 20 26-10 46z"/>'),
    g('<circle cx="100" cy="160" r="24"/><path d="M76 160h48M100 136v48" stroke="#1e295b" stroke-width="5"/>'),
    g('<path d="M100 134 L126 182 H74 Z"/>'),
    g('<ellipse cx="100" cy="160" rx="30" ry="19"/>')
  ][i];
}
function rocketSVG(cfg) {
  const c = Object.assign({ nose: 0, fin: 0, eng: 0, win: 0, body: '#ff6b81', noseC: '#ffc83b', winC: '#42e3b4', solar: false, arm: false, fire: false }, cfg);
  return `<svg viewBox="0 0 200 360" style="width:100%;height:100%">
  ${c.solar ? `<g fill="#8b5cf6" stroke="#1e295b" stroke-width="4"><rect x="8" y="150" width="52" height="46" rx="6"/><rect x="140" y="150" width="52" height="46" rx="6"/></g>
    <g stroke="#ffffff" stroke-width="3"><path d="M8 173h52M34 150v46M140 173h52M166 150v46"/></g>` : ''}
  ${c.arm ? `<g fill="none" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"><path d="M135 130 l40 -10 l6 34"/></g><circle cx="181" cy="154" r="10" fill="#ffc83b" stroke="#1e295b" stroke-width="4"/>` : ''}
  <path d="${FINS[c.fin]}" fill="#ff9f43" stroke="#1e295b" stroke-width="5" stroke-linejoin="round"/>
  <rect x="65" y="100" width="70" height="164" rx="20" fill="${c.body}" stroke="#1e295b" stroke-width="5"/>
  <path d="${NOSES[c.nose]}" fill="${c.noseC}" stroke="#1e295b" stroke-width="5" stroke-linejoin="round"/>
  ${winShape(c.win, c.winC)}
  <rect x="65" y="222" width="70" height="16" rx="8" fill="#ffffff" opacity=".85"/>
  <path d="${ENGS[c.eng]}" fill="#94a3b8" stroke="#1e295b" stroke-width="5" stroke-linejoin="round"/>
  ${c.fire ? `<g class="flame"><path d="M100 292 q22 26 0 62 q-22-36 0-62z" fill="#ffc83b"/><path d="M100 300 q12 18 0 42 q-12-24 0-42z" fill="#ff6b81"/></g>` : ''}
  </svg>`;
}



/* ============ 1. الغلاف والمقدمة ============ */
PAGES.push({
  html: `<div class="pg dark"><div class="cover">
  <div class="float" style="font-size:clamp(48px, 8vw, 70px)">🚀</div>
  <div class="sub">المجلة الإلكترونية الأولى لأطفال الروضة 🌟</div>
  <h1>مغامرة إنقاذ<br>الكوكب الأزرق</h1>
  <div class="meta">
    <span class="tag">🌌 الفضاء والنجوم</span><span class="tag">👶 5–6 سنوات</span>
    <span class="tag">🎮 16 نشاطًا تفاعليًا</span><span class="tag">🏅 وسام بطل الفضاء</span>
  </div>
  <div id="coverName" style="background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.4);border-radius:999px;padding:6px 20px;font-weight:800;color:#fffae6;font-size:clamp(13px,1.8vw,17px);display:none"></div>
  <div class="row" style="justify-content:center;gap:8px">
    <button class="btn ghost" id="nameBtn" style="font-size:15px">✍️ اكتب اسمك</button>
    <button class="btn mint" id="startBtn">ابدأ الرحلة ◀</button>
  </div>
  <div class="fb" id="coverFb" style="max-width:520px"></div>
</div></div>`,
  init(r) {
    const fb = $('#coverFb', r);
    const nameDisplay = $('#coverName', r);

    /* زر فتح نافذة إدخال الاسم المنبثقة الآمنة */
    $('#nameBtn', r).onclick = () => {
      const modal = document.createElement('div');
      modal.className = 'name-modal';
      modal.innerHTML = `
        <div class="name-modal-box">
          <div class="em">🧑‍🚀</div>
          <h3>من أنت يا بطل الفضاء؟</h3>
          <p>اكتب اسمك لتحصل على وسام شرف خاص باسمك!</p>
          <input type="text" id="modalName" placeholder="اكتب اسمك هنا…" maxlength="30" autocomplete="off">
          <div class="modal-btns">
            <button class="btn ghost" id="skipModal">تخطّي</button>
            <button class="btn mint" id="saveModal">حفظ الاسم ✓</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      const inp = modal.querySelector('#modalName');
      /* تأخير بسيط لضمان رسم العنصر أولاً قبل التركيز — يمنع القفز على iOS */
      setTimeout(() => inp.focus(), 150);

      const save = () => {
        const v = inp.value.trim();
        State.childName = v;
        if (v) {
          nameDisplay.textContent = '👋 أهلاً يا ' + v + '!';
          nameDisplay.style.display = '';
        }
        modal.remove();
      };
      modal.querySelector('#saveModal').onclick = save;
      modal.querySelector('#skipModal').onclick = () => modal.remove();
      /* إغلاق عند الضغط خارج الصندوق */
      modal.onclick = e => { if (e.target === modal) modal.remove(); };
    };

    $('#startBtn', r).onclick = () => {
      chime([523, 659, 784]);
      flash(fb, State.childName
        ? `أهلًا بك يا ${State.childName}! غيث ينتظرك في الصفحة التالية 🌟`
        : 'هيا بنا! اضغط زر «التالي» للانطلاق في الرحلة 🌟');
    };
  }
});


PAGES.push({
  html: `<div class="pg"><div class="pg-head"><span class="badge">المقدمة</span><h2>رسالة استغاثة من الفضاء 🛰️</h2></div>
<div class="body">
  <div class="col main">
    ${say('بينما كنت أستكشف الفضاء، وصلتني رسالة عاجلة من <b>الكوكب الأزرق</b>: محطة الفضاء تعطّلت، والنجوم التي تضيء الطريق ضاعت في المجرة!')}
    <div class="mini">أحتاج مساعدتك الشجاعة في <u>16 مهمة تفاعلية</u>. في نهاية كل مهمة تربح <u>نجمة مضيئة ⭐</u>، وعندما تجمع النجوم تصبح <u>قائد الرحلة الفضائية</u> 🏅</div>
    <div class="row" id="introRow"></div>
    <div class="mini">💡 عاداتنا الثلاث في رحلتنا: <u>الإبداع والابتكار</u> — <u>المثابرة</u> — <u>المرونة والتكيّف</u>.</div>
  </div>
  <div class="col side center" style="align-items:center">
    <div class="float" style="font-size:clamp(55px, 8vw, 100px)">🌍</div>
    <div class="big">الكوكب الأزرق ينتظر بطلًا شجاعًا!</div>
  </div>
</div></div>`,
  init(r) {
    $('#introRow', r).append(readBtn('وصلتني رسالة استغاثة من الكوكب الأزرق. أحتاج مساعدتك في ست عشرة مهمة، وفي كل مهمة تربح نجمة ذهبية.'));
  }
});



/* ============ الأنشطة من 1 إلى 4 ============ */

/* النشاط 1: صمم صاروخ المستقبل */
PAGES.push({
  html: `<div class="pg"><div class="pg-head"><span class="badge">النشاط 1</span><h2>صمّم صاروخ المستقبل 🚀</h2>
 <span class="habit">الإبداع والابتكار</span></div>
<div class="body">
 <div class="col side">
   ${say('لا أستطيع الوصول إلى الكوكب الأزرق، صاروخي قديم جداً! أحتاج صاروخاً <b>لم يصنعه أحد من قبل</b>. هل تستطيع مساعدتي؟')}
   <div id="t1"></div>
 </div>
 <div class="col main">
   <div class="stage" id="s1" style="display:flex;align-items:center;justify-content:center;background:#f8fafc"></div>
   <div class="row">
     <input type="text" id="rname" placeholder="اسم صاروخك المبتكر؟">
     <button class="btn mint" id="fire1">🔥 تجربة الإقلاع</button>
     <button class="btn" id="done1">أرسل تصميمك لغيث</button>
   </div>
   <div class="mini">🎙️ أخبر غيث: <u>ما المهمة التي يستطيع صاروخك القيام بها؟</u></div>
   <div class="row" id="rec1"></div>
   <div class="fb" id="f1"></div>
 </div>
</div></div>`,
  init(r) {
    const cfg = { nose: 0, fin: 0, eng: 0, win: 0, body: '#ff6b81', noseC: '#ffc83b', winC: '#42e3b4', solar: false, arm: false, fire: false };
    const stage = $('#s1', r), fb = $('#f1', r);
    const holder = document.createElement('div');
    holder.style.cssText = 'width:60%;max-width:140px;height:95%;position:relative;pointer-events:none';
    stage.appendChild(holder);
    const draw = () => holder.innerHTML = rocketSVG(cfg);
    draw();
    const t = $('#t1', r);
    const prev = (vb, d, fill) => `<svg viewBox="${vb}"><path d="${d}" fill="${fill}" stroke="#1e295b" stroke-width="8"/></svg>`;
    t.append(chipRow(NOSES.map((d, i) => ({ html: prev('40 0 120 130', d, '#ffc83b'), val: i })), v => { cfg.nose = v; draw(); }, 'مقدمة الصاروخ (8)'));
    t.append(chipRow(ENGS.map((d, i) => ({ html: prev('55 248 90 60', d, '#94a3b8'), val: i })), v => { cfg.eng = v; draw(); }, 'المحركات (8)'));
    t.append(chipRow(FINS.map((d, i) => ({ html: prev('20 180 160 100', d, '#ff9f43'), val: i })), v => { cfg.fin = v; draw(); }, 'الأجنحة (6)'));
    t.append(chipRow([...Array(10)].map((_, i) => ({ html: `<svg viewBox="60 125 80 70">${winShape(i, '#42e3b4')}</svg>`, val: i })), v => { cfg.win = v; draw(); }, 'النوافذ (10)'));
    
    const colors = ['#ff6b81', '#42e3b4', '#ffc83b', '#8b5cf6', '#38cbfd', '#ffffff'];
    const cw = document.createElement('div'); cw.className = 'tools'; cw.innerHTML = '<div class="lbl">لون هيكل الصاروخ</div>';
    colors.forEach(c => {
      const s = document.createElement('div'); s.className = 'sw'; s.style.background = c;
      s.onclick = () => { $$('.sw', cw).forEach(x => x.classList.remove('on')); s.classList.add('on'); cfg.body = c; draw(); };
      cw.appendChild(s);
    });
    t.append(cw);

    const ew = document.createElement('div'); ew.className = 'tools'; ew.innerHTML = '<div class="lbl">إضافات فائقة</div>';
    [['☀️ ألواح شمسية', 'solar'], ['🦾 ذراع روبوتية', 'arm']].forEach(([lbl, k]) => {
      const b = document.createElement('button'); b.className = 'chip'; b.style.fontSize = '12px'; b.textContent = lbl;
      b.onclick = () => { cfg[k] = !cfg[k]; b.classList.toggle('on', cfg[k]); draw(); }; ew.appendChild(b);
    });

    const st = document.createElement('div'); st.className = 'tools'; st.innerHTML = '<div class="lbl">ملصقات زينة (اضغط ثم ضعها على المسرح)</div>';
    let tool = null;
    ['⭐', '🌙', '❤️', '🔥', '🌈', '👽', '🛰️', '⚡'].forEach(e => {
      const b = document.createElement('button'); b.className = 'chip'; b.textContent = e;
      b.onclick = () => { $$('.chip', st).forEach(x => x.classList.remove('on')); b.classList.add('on'); tool = e; }; st.appendChild(b);
    });
    t.append(ew, st);
    placer(stage, () => tool, 34);

    $('#fire1', r).onclick = () => { cfg.fire = true; draw(); chime([300, 420, 560, 720]); setTimeout(() => { cfg.fire = false; draw(); }, 1800); };
    $('#rec1', r).append(recorder(), readBtn('صمم صاروخًا لم يصنعه أحد من قبل، ثم أخبرني باسمه وما المهمة التي يستطيع القيام بها.'));
    $('#done1', r).onclick = () => {
      const n = $('#rname', r).value.trim();
      awardStar(1, fb, `تصميم مبهر! صاروخ <b>${n || 'المستقبل'}</b> رائع ومختلف عن كل الصواريخ! هل تستطيع إضافة فكرة أخرى تجعله أكثر تميزًا؟ ⭐`);
    };
  }
});

/* النشاط 2: ابنِ كوكبًا جديدًا */
PAGES.push({
  html: `<div class="pg dark"><div class="pg-head"><span class="badge">النشاط 2</span><h2>ابنِ كوكبًا جديدًا 🪐</h2>
 <span class="habit">الإبداع والابتكار</span></div>
<div class="body">
 <div class="col side">
   ${say('وجدت هذا الكوكب في المجرة، لكنه <b>فارغ تمامًا</b>. أريدك أن تجعل الحياة فيه جميلة وملونة!')}
   <div id="t2"></div>
   <div class="mini">اضغط عنصرًا ثم اضغط الكوكب لوضعه • اسحبه لتحريكه • مرتان للحذف</div>
 </div>
 <div class="col main">
   <div class="stage night" id="s2"></div>
   <div class="mini" style="background:rgba(255,255,255,0.92)">🎙️ <u>من يعيش هنا؟ وكيف يقضي سكان الكوكب يومهم؟</u></div>
   <div class="row" id="rec2"></div>
   <div class="row"><button class="btn" id="done2">أرسل كوكبك لغيث</button><button class="btn ghost" id="clr2">تنظيف الكوكب</button></div>
   <div class="fb" id="f2"></div>
 </div>
</div></div>`,
  init(r) {
    const stage = $('#s2', r), fb = $('#f2', r);
    const planet = document.createElement('div');
    planet.style.cssText = 'position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);width:60%;max-width:140px;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#a7f3d0,#10b981 60%,#047857);box-shadow:0 0 60px rgba(52,211,153,0.35);pointer-events:none';
    stage.appendChild(planet);
    let tool = null;
    const groups = { 'الطبيعة 🌿': ['🌊', '⛰️', '🌲', '🌺', '💧', '🌾'], 'المباني 🏠': ['🏠', '🏰', '🏙️', '⛺'], 'الكائنات 👾': ['🤖', '👽', '🐙', '🦄', '🐣'], 'السماء ✨': ['🌙', '☁️', '🌈', '⭐', '☄️'] };
    const t = $('#t2', r);
    Object.entries(groups).forEach(([lbl, arr]) => { t.append(chipRow(arr, v => tool = v, lbl)); });
    placer(stage, () => tool, 38);
    $('#rec2', r).append(recorder(), readBtn('اجعل هذا الكوكب مليئًا بالحياة. من يعيش هنا؟ وكيف يقضي سكانه يومهم؟'));
    $('#clr2', r).onclick = () => { $$('.item', stage).forEach(x => x.remove()); };
    $('#done2', r).onclick = () => {
      const n = $$('.item', stage).length;
      if (n < 3) return flash(fb, 'كوكبك ما زال فارغًا… أضف 3 عناصر على الأقل ليصبح عامراً بالحياة 🌱', true);
      awardStar(2, fb, 'فكرة إبداعية رائعة! هل يستطيع سكان هذا الكوكب العيش بطريقة مختلفة عن سكان الأرض؟ ⭐');
    };
  }
});

/* النشاط 3: النجمة الضائعة */
PAGES.push({
  html: `<div class="pg dark"><div class="pg-head"><span class="badge">النشاط 3</span><h2>النجمة الضائعة ✨</h2>
 <span class="habit">المثابرة</span></div>
<div class="body">
 <div class="col side">
   ${say('إحدى النجوم المضيئة اختفت داخل الفضاء! ابحث خلف الصخور والسحب والكواكب حتى تجدها.')}
   <div class="mini">🔎 محاولاتك الشجاعة: <u id="tries3">0</u><br>واصل البحث… النجمة قريبة!</div>
   <div class="row" id="rd3"></div>
   <div class="fb" id="f3"></div>
 </div>
 <div class="col main"><div class="stage night" id="s3"></div></div>
</div></div>`,
  init(r) {
    const stage = $('#s3', r), fb = $('#f3', r);
    let tries = 0, found = false, hinted = false;
    const spots = [['🪨', 14, 20], ['☁️', 64, 15], ['🪐', 76, 58], ['🪨', 32, 65], ['☁️', 46, 38], ['🌑', 20, 80], ['🪐', 88, 28], ['🪨', 60, 78]];
    const win = Math.floor(Math.random() * spots.length);
    spots.forEach(([em, x, y], i) => {
      const d = document.createElement('div');
      d.className = 'item';
      d.style.cssText = `left:${x}%;top:${y}%;font-size:44px;cursor:pointer`;
      d.textContent = em;
      d.onclick = () => {
        if (found) return;
        tries++;
        $('#tries3', r).textContent = tries;
        if (i === win) {
          found = true; d.textContent = '⭐'; d.style.transform = 'scale(1.4)';
          awardStar(3, fb, 'أعجبتني محاولاتك المتعددة… لقد وجدت النجمة لأنك <b>لم تستسلم</b>! ⭐');
        } else {
          d.style.transition = '.3s'; d.style.transform = 'translateY(-14px) rotate(-15deg)';
          setTimeout(() => d.style.transform = '', 400);
          chime([240]);
          flash(fb, rnd(['ليست هنا… لكن المحاولة ممتازة، جرّب مكانًا آخر 💪', 'لم نجدها بعد… المثابرون يجربون مرة أخرى!', 'اقتربت جداً! ابحث في مكان آخر 🌟']), true);
          if (tries >= 4 && !hinted) {
            hinted = true;
            const w = stage.children[win];
            w.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(2)' }, { filter: 'brightness(1)' }], { duration: 1000, iterations: Infinity });
            flash(fb, '💡 تلميح بسيط: أحد الأجرام يلمع قليلًا… راقب جيدًا!', true);
          }
        }
      };
      stage.appendChild(d);
    });
    $('#rd3', r).append(readBtn('إحدى النجوم اختفت. ابحث خلف الصخور والسحب والكواكب حتى تجدها.'));
  }
});

/* النشاط 4: أصلح الصاروخ */
PAGES.push({
  html: `<div class="pg"><div class="pg-head"><span class="badge">النشاط 4</span><h2>أصلح الصاروخ 🔧</h2>
 <span class="habit">المثابرة</span></div>
<div class="body">
 <div class="col side">
   ${say('تعطّل محرك الصاروخ ولا يستطيع الإقلاع! جرّب قطعة، وإن لم تنجح… جرّب غيرها بدون استسلام.')}
   <div class="mini">المؤشر السلوكي: <u>يجرّب أكثر من محاولة حتى يصل إلى الحل الصحيح</u>.</div>
   <div class="row" id="rd4"></div>
   <div class="fb" id="f4"></div>
 </div>
 <div class="col main"><div class="stage" id="s4" style="display:flex;align-items:center;justify-content:center;padding:6px"><div class="grid3" id="g4"></div></div></div>
</div></div>`,
  init(r) {
    const g = $('#g4', r), fb = $('#f4', r);
    let done = false, tries = 0;
    const parts = [['🔋', 'بطارية طاقة'], ['🔌', 'أسلاك كهرباء'], ['🔧', 'مفتاح ربط'], ['🔆', 'لوح شمسي'], ['⚙️', 'محرك احتياطي']];
    parts.forEach(([em, name], i) => {
      const c = document.createElement('div');
      c.className = 'card';
      c.innerHTML = `<div class="em">${em}</div>${name}`;
      c.onclick = () => {
        if (done) return;
        tries++;
        if (i === 4) {
          done = true; c.classList.add('ok'); c.querySelector('.em').textContent = '🚀';
          awardStar(4, fb, `أحسنت! بعد <b>${tries}</b> محاولات عمل المحرك وانطلق الصاروخ. المثابرة هي سر النجاح ⭐`);
        } else {
          c.classList.add('no'); setTimeout(() => c.classList.remove('no'), 450); chime([220]);
          flash(fb, 'هذه المحاولة لم تنجح بعد… ماذا يمكن أن نجرّب الآن؟ 🤔', true);
        }
      };
      g.appendChild(c);
    });
    $('#rd4', r).append(readBtn('تعطل محرك الصاروخ. جرب قطعة، وإن لم تنجح جرب غيرها حتى ينطلق الصاروخ.'));
  }
});



/* ============ الأنشطة من 5 إلى 8 ============ */

/* النشاط 5: أكثر من طريق إلى القمر */
PAGES.push({
  html: `<div class="pg dark"><div class="pg-head"><span class="badge">النشاط 5</span><h2>أكثر من طريق إلى القمر 🌙</h2>
 <span class="habit">المرونة والتكيّف</span></div>
<div class="body">
 <div class="col side">
   ${say('هناك أكثر من طريق للوصول إلى القمر. اختر طريقًا… ثم أرِني <b>طريقة أخرى</b> مختلفة!')}
   <div class="mini">الطرق التي اكتشفتها: <u id="cnt5">0</u> من 3</div>
   <div class="row" id="btns5"></div>
   <div class="fb" id="f5"></div>
 </div>
 <div class="col main"><div class="stage night" id="s5"></div></div>
</div></div>`,
  init(r) {
    const stage = $('#s5', r), fb = $('#f5', r);
    const used = new Set();
    stage.innerHTML = `<svg id="sv5" viewBox="0 0 600 340" style="width:100%;height:100%">
   <g stroke-dasharray="10 10" stroke-width="5" fill="none" stroke-opacity=".65">
    <path id="p0" d="M540 280 C 420 280 400 120 300 120 C 200 120 160 60 70 70" stroke="#42e3b4"/>
    <path id="p1" d="M540 280 C 460 200 380 260 300 200 C 220 140 160 160 70 70" stroke="#ffc83b"/>
    <path id="p2" d="M540 280 C 500 120 340 40 240 60 C 160 76 120 60 70 70" stroke="#ff6b81"/>
   </g>
   <circle cx="70" cy="70" r="32" fill="#fef08a"/><circle cx="60" cy="62" r="8" fill="#fde047"/><circle cx="82" cy="84" r="5" fill="#fde047"/>
   <text x="70" y="126" fill="#ffffff" font-size="16" font-weight="700" text-anchor="middle" font-family="Tajawal">القمر</text>
   <text id="rk5" x="540" y="286" font-size="36" text-anchor="middle">🚀</text></svg>`;
    const svg = $('#sv5', r), rk = $('#rk5', r);
    const go = (i) => {
      const p = $('#p' + i, svg), L = p.getTotalLength();
      let t = 0;
      const step = () => {
        t += 7;
        const pt = p.getPointAtLength(Math.min(t, L));
        rk.setAttribute('x', pt.x); rk.setAttribute('y', pt.y + 10);
        if (t < L) requestAnimationFrame(step);
        else {
          used.add(i); $('#cnt5', r).textContent = used.size; chime([520, 660]);
          setTimeout(() => { rk.setAttribute('x', 540); rk.setAttribute('y', 286); }, 700);
          if (used.size === 1) flash(fb, 'وصلنا! لكن… <b>هل توجد طريقة أخرى؟</b> جرّب طريقًا مختلفًا 🤔', true);
          else awardStar(5, fb, 'ممتاز! عرفت أن للمشكلة أكثر من حل، وهذه هي <b>المرونة</b> ⭐');
        }
      };
      step();
    };
    const row = $('#btns5', r);
    [['الطريق الأخضر', 0, 'mint'], ['الطريق الأصفر', 1, ''], ['الطريق الوردي', 2, 'coral']].forEach(([lbl, i, cl]) => {
      const b = document.createElement('button'); b.className = 'btn ' + cl; b.textContent = lbl; b.onclick = () => go(i); row.appendChild(b);
    });
    row.append(readBtn('هناك أكثر من طريق للوصول إلى القمر. اختر طريقًا ثم جرب طريقة أخرى مختلفة.'));
  }
});

/* النشاط 6: كيف سنساعد الكائن الفضائي؟ */
PAGES.push({
  html: `<div class="pg"><div class="pg-head"><span class="badge">النشاط 6</span><h2>كيف سنساعد الكائن الفضائي؟ 👽</h2>
 <span class="habit">المرونة والتكيّف</span></div>
<div class="body">
 <div class="col side">
   ${say('تعطّلت مركبة صديقنا الفضائي. كل الأدوات مفيدة… <b>المهم أن تخبرني لماذا اخترتها.</b>')}
   <div class="mini">لا توجد إجابة خاطئة 💛 اختر أداة ثم اشرح فكرتك بصوتك.</div>
   <div class="row" id="rec6"></div>
   <button class="btn" id="done6">أخبرت غيث بفكرتي</button>
   <div class="fb" id="f6"></div>
 </div>
 <div class="col main"><div class="stage" id="s6" style="display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:6px">
     <div style="font-size:clamp(32px,6vw,48px);text-align:center;line-height:1;margin-top:2px">👽 <span style="font-size:clamp(24px,4.5vw,36px)">🛸</span></div>
     <div class="grid3" id="g6"></div>
   </div></div>
</div></div>`,
  init(r) {
    const g = $('#g6', r), fb = $('#f6', r); let picked = null;
    [['🔧', 'مفتاح ربط'], ['🪢', 'حبل متين'], ['🔋', 'بطارية طاقة'], ['🧲', 'مغناطيس'], ['🚀', 'صاروخي'], ['🩹', 'شريط لاصق']].forEach(([em, n]) => {
      const c = document.createElement('div'); c.className = 'card'; c.style.fontSize = '12px'; c.innerHTML = `<div class="em">${em}</div>${n}`;
      c.onclick = () => {
        $$('.card', g).forEach(x => x.classList.remove('ok'));
        c.classList.add('ok'); picked = n; chime([600]);
        flash(fb, `اخترت <b>${n}</b> — فكرة جميلة! الآن أخبرني: <u>لماذا اخترتها؟</u>`, true);
      };
      g.appendChild(c);
    });
    $('#rec6', r).append(recorder(), readBtn('تعطلت مركبة الكائن الفضائي. اختر أداة تساعده، ثم اشرح لماذا اخترتها.'));
    $('#done6', r).onclick = () => {
      if (!picked) return flash(fb, 'اختر أداة أولًا 🙂', true);
      awardStar(6, fb, `شرحك رائع! كل أداة يمكن أن تنجح إذا فكّرنا بمرونة. شكرًا لمساعدتك صديقنا ⭐`);
    };
  }
});

/* النشاط 7: مهمة الإنقاذ الكبرى */
PAGES.push({
  html: `<div class="pg dark"><div class="pg-head"><span class="badge">النشاط 7</span><h2>مهمة الإنقاذ الكبرى 📡</h2>
 <span class="habit">الإبداع + المرونة + المثابرة</span></div>
<div class="body">
 <div class="col side">
   ${say('<b>انقطع الاتصال بمحطة الفضاء!</b> ابتكر جهاز إرسال: اختر مصدر طاقة، وهوائيًا، وصندوقًا… ثم شغّله.')}
   <div id="t7"></div>
   <div class="row"><button class="btn mint" id="run7">▶ تشغيل الجهاز</button></div>
   <div class="fb" id="f7"></div>
 </div>
 <div class="col main"><div class="stage night" id="s7" style="display:flex;align-items:center;justify-content:center">
   <div id="dev7" style="text-align:center;font-size:clamp(45px, 7vw, 72px);line-height:1.15"></div>
 </div></div>
</div></div>`,
  init(r) {
    const fb = $('#f7', r), dev = $('#dev7', r), t = $('#t7', r);
    const pick = { p: null, a: null, b: null }; let attempts = 0;
    const draw = () => dev.innerHTML = `<div>${pick.a || '📡'}</div><div>${pick.b || '📦'}</div><div style="font-size:38px">${pick.p || '🔋'}</div>`;
    draw();
    t.append(chipRow(['🔋', '☀️', '⚡', '🌟'], v => { pick.p = v; draw(); }, 'مصدر الطاقة'));
    t.append(chipRow(['📡', '🛰️', '📶', '🎈'], v => { pick.a = v; draw(); }, 'الهوائي'));
    t.append(chipRow(['📦', '🧰', '🥁', '🪣'], v => { pick.b = v; draw(); }, 'صندوق الجهاز'));
    $('#run7', r).onclick = () => {
      if (!pick.p || !pick.a || !pick.b) return flash(fb, 'اختر القطع الثلاث أولًا: طاقة + هوائي + صندوق 🔧', true);
      attempts++;
      if (attempts === 1) {
        chime([220, 180]); dev.animate([{ transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(0)' }], { duration: 400, iterations: 2 });
        return flash(fb, 'الإشارة ضعيفة… لم تعمل بعد. <b>غيّر قطعة واحدة</b> وحاول مرة أخرى 💪', true);
      }
      chime([520, 660, 880]); dev.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 600 });
      awardStar(7, fb, '📶 عاد الاتصال بمحطة الفضاء! ابتكرت، وجربت، وعدّلت فكرتك حتى نجحت ⭐');
    };
  }
});

/* النشاط 8: قصة من الفضاء */
PAGES.push({
  html: `<div class="pg cream"><div class="pg-head"><span class="badge">النشاط 8</span><h2>قصة من الفضاء 📖</h2>
 <span class="habit">الإبداع والابتكار</span></div>
<div class="body">
 <div class="col side">
   ${say('رتّب الصور الثلاث كما تحب، ثم <b>احكِ لي قصتك الممتعة</b>… واختر لها نهاية.')}
   <div class="mini">استخدم الأسهم لتغيير ترتيب الصور، ثم اختر النهاية وسجّل قصتك.</div>
   <div class="row" id="rec8"></div>
   <button class="btn" id="done8">احكِ القصة لغيث</button>
   <div class="fb" id="f8"></div>
 </div>
 <div class="col main">
   <div class="stage" id="s8" style="background:#fff;display:flex;flex-direction:column;gap:6px;padding:8px">
     <div id="strip8" style="display:flex;gap:6px;flex:1"></div>
     <div id="ends8" style="display:flex;gap:5px"></div>
   </div>
 </div>
</div></div>`,
  init(r) {
    const strip = $('#strip8', r), ends = $('#ends8', r), fb = $('#f8', r);
    let order = ['🚀', '🪐', '🤖'], ending = null;
    const render = () => {
      strip.innerHTML = '';
      order.forEach((em, i) => {
        const c = document.createElement('div'); c.className = 'card'; c.style.flex = '1';
        c.innerHTML = `<div class="em">${em}</div>
        <div class="row" style="justify-content:center"><button class="btn ghost" data-d="1" style="padding:2px 8px;min-height:32px">▶</button>
        <button class="btn ghost" data-d="-1" style="padding:2px 8px;min-height:32px">◀</button></div>`;
        c.querySelectorAll('button').forEach(b => b.onclick = e => {
          e.stopPropagation();
          const j = i + +b.dataset.d; if (j < 0 || j > 2) return;
          [order[i], order[j]] = [order[j], order[i]]; render(); chime([480]);
        });
        strip.appendChild(c);
      });
    };
    render();
    ['🌈 نهاية سعيدة', '😲 نهاية مفاجئة', '🤝 نهاية بصداقة'].forEach(txt => {
      const b = document.createElement('button'); b.className = 'btn ghost'; b.style.flex = '1'; b.textContent = txt;
      b.onclick = () => { $$('button', ends).forEach(x => x.className = 'btn ghost'); b.className = 'btn mint'; ending = txt; chime([600]); };
      ends.appendChild(b);
    });
    $('#rec8', r).append(recorder(), readBtn('رتب الصور الثلاث، ثم احك قصتك واختر لها نهاية.'));
    $('#done8', r).onclick = () => {
      if (!ending) return flash(fb, 'اختر نهاية لقصتك أولًا 🌈', true);
      awardStar(8, fb, `قصة مدهشة! ترتيبك كان ${order.join(' ← ')} و${ending}. هل يمكن أن تحكيها بنهاية أخرى؟ ⭐`);
    };
  }
});



/* ============ الأنشطة من 9 إلى 12 ============ */

/* النشاط 9: أي قبعة تناسب رائد الفضاء؟ */
PAGES.push({
  html: `<div class="pg"><div class="pg-head"><span class="badge">النشاط 9</span><h2>أي قبعة تناسب رائد الفضاء؟ 🪖</h2>
 <span class="habit">المرونة والتكيّف</span></div>
<div class="body">
 <div class="col side">
   ${say('<span id="q9">أي قبعة أرتدي عندما أذهب إلى <b>الفضاء</b>؟ ولماذا؟</span>')}
   <div class="mini">المرحلة: <u id="st9">1</u> من 2 — <span id="hint9">اختر ما يناسب رحلة الفضاء</span></div>
   <div class="row" id="rd9"></div>
   <div class="fb" id="f9"></div>
 </div>
 <div class="col main"><div class="stage" id="s9" style="display:flex;align-items:center;justify-content:center;padding:6px"><div class="grid3" id="g9"></div></div></div>
</div></div>`,
  init(r) {
    const g = $('#g9', r), fb = $('#f9', r); let round = 1;
    const hats = [['🪖', 'خوذة الفضاء'], ['🎉', 'قبعة حفلة'], ['👒', 'قبعة شاطئ']];
    hats.forEach(([em, n], i) => {
      const c = document.createElement('div'); c.className = 'card'; c.innerHTML = `<div class="em">${em}</div>${n}`;
      c.onclick = () => {
        const right = (round === 1) ? 0 : 1;
        if (i === right) {
          chime([600, 760]); c.classList.add('ok'); setTimeout(() => c.classList.remove('ok'), 700);
          if (round === 1) {
            round = 2; $('#st9', r).textContent = '2';
            $('#q9', r).innerHTML = 'الآن سأذهب إلى <b>حفلة على القمر</b>… هل سأرتدي القبعة نفسها؟';
            $('#hint9', r).textContent = 'الموقف تغيّر… فهل يتغيّر اختيارك؟';
            flash(fb, 'صحيح! خوذة الفضاء تحميني. لكن انتبه… الموقف سيتغير الآن 🌙', true);
            speak('الآن سأذهب إلى حفلة على القمر، هل سأرتدي القبعة نفسها؟');
          } else awardStar(9, fb, 'ممتاز! تعلّمت أن <b>الحل قد يتغيّر بتغيّر الموقف</b> — هذه هي المرونة ⭐');
        } else {
          c.classList.add('no'); setTimeout(() => c.classList.remove('no'), 450); chime([220]);
          flash(fb, round === 1 ? 'فكّر: ما الذي يحميني من برد الفضاء وقلّة الهواء؟ 🤔' : 'في الحفلة نلبس شيئًا مبهجًا… جرّب مرة أخرى 🎈', true);
        }
      };
      g.appendChild(c);
    });
    $('#rd9', r).append(readBtn('أي قبعة أرتدي عندما أذهب إلى الفضاء؟ ولماذا؟'));
  }
});

/* النشاط 10: زيّن صاروخك */
PAGES.push({
  html: `<div class="pg cream"><div class="pg-head"><span class="badge">النشاط 10</span><h2>زيّن صاروخك 🎨</h2>
 <span class="habit">الإبداع والابتكار</span></div>
<div class="body">
 <div class="col side">
   ${say('هذا صاروخ أبيض… <b>اجعله مختلفًا عن صواريخ أصدقائك.</b> لا يوجد تصميم صحيح وآخر خاطئ!')}
   <div id="t10"></div>
   <button class="btn" id="done10">انتهيت من التزيين</button>
   <div class="fb" id="f10"></div>
 </div>
 <div class="col main"><div class="stage" id="s10" style="display:flex;align-items:center;justify-content:center"></div></div>
</div></div>`,
  init(r) {
    const stage = $('#s10', r), fb = $('#f10', r);
    const cfg = { nose: 1, fin: 2, eng: 1, win: 0, body: '#ffffff', noseC: '#ffffff', winC: '#ffffff' };
    const holder = document.createElement('div'); holder.style.cssText = 'width:60%;max-width:130px;height:95%;pointer-events:none'; stage.appendChild(holder);
    const draw = () => holder.innerHTML = rocketSVG(cfg); draw();
    let tool = null; const t = $('#t10', r);
    const cw = document.createElement('div'); cw.className = 'tools'; cw.innerHTML = '<div class="lbl">تلوين الصاروخ</div>';
    ['#ff6b81', '#42e3b4', '#ffc83b', '#8b5cf6', '#38cbfd', '#ff9f43'].forEach(c => {
      const s = document.createElement('div'); s.className = 'sw'; s.style.background = c;
      s.onclick = () => { cfg.body = c; cfg.noseC = c; draw(); chime([560]); }; cw.appendChild(s);
    });
    const cw2 = document.createElement('div'); cw2.className = 'tools'; cw2.innerHTML = '<div class="lbl">لون النافذة</div>';
    ['#42e3b4', '#ffc83b', '#ff6b81', '#8b5cf6'].forEach(c => {
      const s = document.createElement('div'); s.className = 'sw'; s.style.background = c;
      s.onclick = () => { cfg.winC = c; draw(); }; cw2.appendChild(s);
    });
    t.append(cw, cw2);
    t.append(chipRow(['⭐', '🌟', '🪐', '🌙', '😀', '🐱', '🌈', '❤️', '🔥', '🦄'], v => tool = v, 'ملصقات زينة — اضغط ثم ضعها بجانب الصاروخ'));
    placer(stage, () => tool, 32);
    $('#done10', r).onclick = () => awardStar(10, fb, 'صاروخك يشبهك أنت فقط! هذا هو الإبداع الحقيقي ⭐');
  }
});

/* النشاط 11: أين اختبأت النجمة؟ */
PAGES.push({
  html: `<div class="pg dark"><div class="pg-head"><span class="badge">النشاط 11</span><h2>أين اختبأت النجمة؟ ☁️⭐</h2>
 <span class="habit">المثابرة</span></div>
<div class="body">
 <div class="col side">
   ${say('النجمة تختبئ خلف إحدى السحب الخمس. إن لم تجدها… <b>لنجرّب سحابة أخرى.</b>')}
   <div class="mini">المحاولات: <u id="tr11">0</u></div>
   <div class="row" id="rd11"></div>
   <div class="fb" id="f11"></div>
 </div>
 <div class="col main"><div class="stage night" id="s11" style="display:flex;align-items:center;justify-content:space-around;flex-wrap:wrap"></div></div>
</div></div>`,
  init(r) {
    const stage = $('#s11', r), fb = $('#f11', r); const win = Math.floor(Math.random() * 5); let n = 0, done = false;
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('div'); d.style.cssText = 'font-size:clamp(42px, 5.5vw, 64px);cursor:pointer;user-select:none;transition:.3s';
      d.textContent = '☁️';
      d.onclick = () => {
        if (done || d.dataset.o) return; n++; $('#tr11', r).textContent = n; d.dataset.o = 1;
        if (i === win) {
          done = true; d.textContent = '⭐'; d.style.transform = 'scale(1.4)';
          awardStar(11, fb, 'وجدتها! إعادة المحاولة هي سرّ النجاح ⭐');
        } else {
          d.textContent = '💨'; d.style.opacity = '.4'; chime([220]);
          flash(fb, 'اقتربت… لنجرّب سحابة أخرى ☁️', true);
        }
      };
      stage.appendChild(d);
    }
    $('#rd11', r).append(readBtn('النجمة تختبئ خلف إحدى السحب الخمس. اضغط على السحب حتى تجدها.'));
  }
});

/* النشاط 12: أطعم الكائن الفضائي */
PAGES.push({
  html: `<div class="pg"><div class="pg-head"><span class="badge">النشاط 12</span><h2>أطعِم الكائن الفضائي 👾</h2>
 <span class="habit">المثابرة</span></div>
<div class="body">
 <div class="col side">
   ${say('صديقي الفضائي جائع، لكنه <b>ليس مثلنا</b>! جرّب طعامًا… وإن رفضه، جرّب غيره.')}
   <div class="row" id="rd12"></div>
   <div class="fb" id="f12"></div>
 </div>
 <div class="col main"><div class="stage" id="s12" style="display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:6px">
     <div id="alien" style="font-size:clamp(38px,7vw,56px);line-height:1;margin-top:2px">👾</div>
     <div class="grid3" id="g12"></div>
   </div></div>
</div></div>`,
  init(r) {
    const g = $('#g12', r), fb = $('#f12', r), al = $('#alien', r); let done = false, n = 0;
    [['🍎', 'تفاحة حمراء'], ['🔩', 'برغي حديدي'], ['🌽', 'ذرة حلوة']].forEach(([em, name], i) => {
      const c = document.createElement('div'); c.className = 'card'; c.innerHTML = `<div class="em">${em}</div>${name}`;
      c.onclick = () => {
        if (done) return; n++;
        if (i === 1) {
          done = true; c.classList.add('ok'); al.textContent = '😋'; chime([600, 780, 980]);
          awardStar(12, fb, 'يحبّ البراغي لأنه كائن آلي! لم تستسلم من أول محاولة ⭐');
        } else {
          c.classList.add('no'); setTimeout(() => c.classList.remove('no'), 450); al.textContent = '😖';
          setTimeout(() => al.textContent = '👾', 700); chime([220]);
          flash(fb, 'رفضه! لا بأس… ما رأيك أن نجرّب طعامًا آخر؟ 🤔', true);
        }
      };
      g.appendChild(c);
    });
    $('#rd12', r).append(readBtn('الكائن الفضائي جائع. جرب طعامًا، وإن رفضه جرب غيره.'));
  }
});



/* ============ الأنشطة من 13 إلى 16 والختام ============ */

/* النشاط 13: كوّن كوكبًا */
PAGES.push({
  html: `<div class="pg dark"><div class="pg-head"><span class="badge">النشاط 13</span><h2>كوّن كوكبًا ☄️</h2>
 <span class="habit">الإبداع والابتكار</span></div>
<div class="body">
 <div class="col side">
   ${say('رتّب هذه العناصر كما تريد على كوكبك… ثم أخبرني: <b>ماذا يعيش في كوكبك؟</b>')}
   <div id="t13"></div>
   <div class="row" id="rec13"></div>
   <button class="btn" id="done13">كوكبي جاهز</button>
   <div class="fb" id="f13"></div>
 </div>
 <div class="col main"><div class="stage night" id="s13"></div></div>
</div></div>`,
  init(r) {
    const stage = $('#s13', r), fb = $('#f13', r);
    const p = document.createElement('div');
    p.style.cssText = 'position:absolute;left:50%;bottom:-30%;transform:translateX(-50%);width:105%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 40% 20%,#fed7aa,#f97316 55%,#c2410c);pointer-events:none';
    stage.appendChild(p);
    let tool = null;
    $('#t13', r).append(chipRow(['🌲', '🏠', '🏞️', '⛰️', '🌙'], v => tool = v, 'العناصر — اضغط ثم ضعها على الكوكب'));
    placer(stage, () => tool, 36);
    $('#rec13', r).append(recorder(), readBtn('كوّن كوكبك كما تحب، ثم أخبرني ماذا يعيش فيه.'));
    $('#done13', r).onclick = () => {
      if ($$('.item', stage).length < 3) return flash(fb, 'ضع ثلاثة عناصر على الأقل على كوكبك 🌍', true);
      awardStar(13, fb, 'كوكب جميل! أخبرني بصوتك: من يسكنه؟ وماذا يفعل سكانه؟ ⭐');
    };
  }
});

/* النشاط 14: غيّر الطريق */
PAGES.push({
  html: `<div class="pg cream"><div class="pg-head"><span class="badge">النشاط 14</span><h2>غيّر الطريق 🐰</h2>
 <span class="habit">المرونة والتكيّف</span></div>
<div class="body">
 <div class="col side">
   ${say('الأرنب يريد الوصول إلى الصاروخ… <b>أوه! سقطت صخرة وأغلقت الطريق.</b> ارسم بإصبعك طريقًا جديدًا يلتفّ حول الصخرة.')}
   <div class="row"><button class="btn ghost" id="clr14">امسح وارسم جديد</button><button class="btn" id="go14">انطلق يا أرنب!</button></div>
   <div class="fb" id="f14"></div>
 </div>
 <div class="col main"><div class="stage" id="s14">
   <div style="position:absolute;left:6%;top:68%;font-size:clamp(28px,4vw,38px);z-index:2;pointer-events:none">🐰</div>
   <div style="position:absolute;left:82%;top:12%;font-size:clamp(28px,4vw,38px);z-index:2;pointer-events:none">🚀</div>
   <div style="position:absolute;left:45%;top:42%;font-size:clamp(32px,5vw,46px);z-index:2;pointer-events:none">🪨</div>
   <div style="position:absolute;left:8%;top:75%;width:80%;height:3px;background:repeating-linear-gradient(90deg,#94a3b8 0 10px,transparent 10px 20px);transform:rotate(-30deg);transform-origin:left;pointer-events:none"></div>
   <canvas id="cv14" style="position:absolute;inset:0;width:100%;height:100%;z-index:3"></canvas>
 </div></div>
</div></div>`,
  init(r) {
    const cv = $('#cv14', r), fb = $('#f14', r); initDraw(cv, () => '#8b5cf6', 6);
    $('#clr14', r).onclick = () => { cv.clearAll(); cv._pts = null; };
    $('#go14', r).onclick = () => {
      const p = cv._pts; if (!p || p.length < 8) return flash(fb, 'ارسم الطريق أولًا بإصبعك من الأرنب إلى الصاروخ ✏️', true);
      const W = cv.width, H = cv.height, d = (a, bx, by) => Math.hypot(a[0] - bx, a[1] - by);
      const okStart = d(p[0], 0.10 * W, 0.80 * H) < 0.28 * W, okEnd = d(p[p.length - 1], 0.88 * W, 0.24 * H) < 0.28 * W;
      const hitRock = p.some(pt => d(pt, 0.50 * W, 0.52 * H) < 0.07 * W);
      if (!okStart || !okEnd) return flash(fb, 'ابدأ الرسم من عند الأرنب 🐰 وانتهِ عند الصاروخ 🚀', true);
      if (hitRock) return flash(fb, 'الطريق يمرّ فوق الصخرة! التفّ حولها من فوق أو من تحت 🪨', true);
      chime([520, 660, 820]);
      awardStar(14, fb, 'وصل الأرنب! عندما يُغلق طريق… نبحث عن طريق آخر. هذه هي المرونة ⭐');
    };
  }
});

/* النشاط 15: أكمل الصورة */
PAGES.push({
  html: `<div class="pg"><div class="pg-head"><span class="badge">النشاط 15</span><h2>أكمل الصورة ✏️</h2>
 <span class="habit">الإبداع والابتكار</span></div>
<div class="body">
 <div class="col side">
   ${say('هذه الصورة نصفها فقط… <b>أكملها برسمك الرائع.</b> اختر ما تحب: نجمة، أو مركبة، أو قمرًا.')}
   <div class="row" id="pick15"></div>
   <div class="tools" id="col15"><div class="lbl">لون القلم</div></div>
   <div class="row"><button class="btn ghost" id="clr15">امسح الرسم</button><button class="btn" id="done15">انتهيت</button></div>
   <div class="fb" id="f15"></div>
 </div>
 <div class="col main"><div class="stage" id="s15">
   <svg id="guide15" viewBox="0 0 400 300" style="position:absolute;inset:0;width:100%;height:100%"></svg>
   <canvas id="cv15" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
 </div></div>
</div></div>`,
  init(r) {
    const cv = $('#cv15', r), gd = $('#guide15', r), fb = $('#f15', r); let color = '#8b5cf6';
    initDraw(cv, () => color, 5);
    const shapes = {
      'نجمة': '<path d="M200 60 L200 240 M200 60 L170 130 L95 138 L152 186 L134 258 L200 220" fill="none" stroke="#1e295b" stroke-width="6" stroke-linejoin="round"/><path d="M200 60 L230 130 L305 138 L248 186 L266 258 L200 220" fill="none" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="9 9"/>',
      'مركبة': '<path d="M200 40 V270 M200 40 c-40 40-52 100-52 150 h52" fill="none" stroke="#1e295b" stroke-width="6"/><path d="M200 40 c40 40 52 100 52 150 h-52" fill="none" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="9 9"/>',
      'قمر': '<path d="M200 40 a110 110 0 0 0 0 220" fill="none" stroke="#1e295b" stroke-width="6"/><path d="M200 40 a110 110 0 0 1 0 220" fill="none" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="9 9"/>'
    };
    const setShape = k => { gd.innerHTML = shapes[k]; cv.clearAll(); };
    const row = $('#pick15', r);
    Object.keys(shapes).forEach((k) => {
      const b = document.createElement('button'); b.className = 'btn ghost'; b.textContent = k;
      b.onclick = () => { $$('button', row).forEach(x => x.className = 'btn ghost'); b.className = 'btn mint'; setShape(k); }; row.appendChild(b);
    });
    setShape('نجمة');
    const cw = $('#col15', r);
    ['#8b5cf6', '#ff6b81', '#ffc83b', '#42e3b4', '#1e295b'].forEach(c => {
      const s = document.createElement('div'); s.className = 'sw'; s.style.background = c;
      s.onclick = () => { $$('.sw', cw).forEach(x => x.classList.remove('on')); s.classList.add('on'); color = c; }; cw.appendChild(s);
    });
    $('#clr15', r).onclick = () => cv.clearAll();
    $('#done15', r).onclick = () => awardStar(15, fb, 'رسمك أكمل الصورة بطريقتك الخاصة… فنّان رائع! ⭐');
  }
});

/* النشاط 16: حفلة الفضاء */
PAGES.push({
  html: `<div class="pg cream"><div class="pg-head"><span class="badge">النشاط 16</span><h2>حفلة الفضاء 🎉</h2>
 <span class="habit">الإبداع والابتكار</span></div>
<div class="body">
 <div class="col side">
   ${say('انتهت الرحلة بنجاح! صمّم <b>بطاقة دعوة</b> لحفلة الفضاء: اختر اللون والزينة والكعكة والشخصيات.')}
   <div id="t16"></div>
   <input type="text" id="party" placeholder="نص الدعوة: أدعوكم إلى…">
   <div class="row"><button class="btn" id="done16">بطاقتي جاهزة</button><button class="btn ghost" id="print16">🖨️ اطبع البطاقة</button></div>
   <div class="fb" id="f16"></div>
 </div>
 <div class="col main"><div class="stage" id="s16" style="padding:6px;display:flex">
   <div id="card16" style="flex:1;position:relative;border-radius:14px;background:#38cbfd;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.1);padding:6px">
     <div style="font-family:'Baloo Bhaijaan 2';font-size:clamp(16px,2.8vw,24px);color:#fff;text-shadow:0 2px 5px rgba(0,0,0,.2)">🎊 حفلة في الفضاء 🎊</div>
     <div id="cake16" style="font-size:clamp(32px,5vw,50px)">🎂</div>
     <div id="chars16" style="font-size:clamp(22px,3.2vw,30px)">🧑‍🚀👽🤖</div>
     <div id="txt16" style="background:#fff;border-radius:8px;padding:4px 10px;font-weight:800;font-size:clamp(11px,1.2vw,14px);max-width:92%;text-align:center;color:var(--ink)">أدعوكم إلى حفلتي على القمر!</div>
   </div>
 </div></div></div>
</div></div>`,
  init(r) {
    const card = $('#card16', r), fb = $('#f16', r), t = $('#t16', r);
    const cw = document.createElement('div'); cw.className = 'tools'; cw.innerHTML = '<div class="lbl">لون بطاقة الدعوة</div>';
    ['#38cbfd', '#ff6b81', '#8b5cf6', '#ffc83b', '#42e3b4'].forEach(c => {
      const s = document.createElement('div'); s.className = 'sw'; s.style.background = c;
      s.onclick = () => { card.style.background = c; chime([560]); }; cw.appendChild(s);
    });
    t.append(cw);
    t.append(chipRow(['🎂', '🧁', '🍰', '🍪'], v => $('#cake16', r).textContent = v, 'الكعكة'));
    t.append(chipRow(['🧑‍🚀👽🤖', '👩‍🚀🐰🌟', '👽👾🛸', '🤖🐱🚀'], v => $('#chars16', r).textContent = v, 'الشخصيات'));
    let tool = null;
    t.append(chipRow(['🎈', '🎊', '✨', '🎁', '⭐', '🌙'], v => tool = v, 'الزينة — اضغط ثم ضعها على البطاقة'));
    placer(card, () => tool, 30);
    $('#party', r).oninput = e => $('#txt16', r).textContent = e.target.value || 'أدعوكم إلى حفلتي المميزة على القمر!';
    $('#print16', r).onclick = () => window.print();
    $('#done16', r).onclick = () => awardStar(16, fb, 'دعوة رائعة! أنت الآن جاهز لاستقبال أصدقائك في الفضاء ⭐');
  }
});

/* ============ 17. التتويج والختام ============ */
PAGES.push({
  html: `<div class="pg dark"><div class="cover">
  <div class="float" style="font-size:clamp(50px, 7.5vw, 75px)">🏅</div>
  <h1 id="endTitle">قائد الرحلة الفضائية</h1>
  <div class="sub" id="endName" style="font-size:clamp(15px, 1.8vw, 21px)"></div>
  <div class="mini" style="max-width:650px;text-align:center;font-size:clamp(12px, 1.3vw, 15px);background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3)">
    أنقذنا الكوكب الأزرق معًا! تدرّبت بنجاح على <u>الإبداع والابتكار</u>، و<u>المثابرة</u>، و<u>المرونة والتكيّف</u>.
  </div>
  <div id="stars17" style="font-size:clamp(24px, 3.5vw, 36px);letter-spacing:4px"></div>
  <div class="row" style="justify-content:center;gap:8px">
    <button class="btn mint" id="cheer">🎉 احتفال النصر</button>
    <button class="btn ghost" id="printC">🖨️ طباعة الشهادة</button>
  </div>
</div></div>`,
  init(r) {
    const refresh = () => {
      $('#endName', r).textContent = State.childName ? `وسام شرف للبطل: ${State.childName}` : 'وسام شرف بطل الفضاء';
      $('#stars17', r).textContent = '⭐'.repeat(State.stars.size) + '☆'.repeat(16 - State.stars.size);
    };
    r._onShow = refresh; refresh();
    $('#cheer', r).onclick = () => {
      chime([523, 659, 784, 1046, 1318]);
      speak('مبروك! أصبحت الآن قائد الرحلة الفضائية رسمياً');
      for (let i = 0; i < 14; i++) {
        setTimeout(() => {
          const b = document.createElement('div'); b.className = 'burst';
          b.innerHTML = `<div class="s" style="font-size:${30 + Math.random() * 50}px;transform:translate(${(Math.random() - .5) * 600}px,0)">${rnd(['⭐', '🎉', '🚀', '🌟', '🎊'])}</div>`;
          document.body.appendChild(b);
          setTimeout(() => b.remove(), 1200);
        }, i * 85);
      }
    };
    $('#printC', r).onclick = () => window.print();
  }
});



/* ============ تشغيل المجلة والتنقل التفاعلي المتجاوب للموبايل ============ */
const book = $('#book'), track = $('#track');
for (let i = 0; i < 16; i++) {
  if (i) track.insertAdjacentHTML('beforeend', '<div class="link"></div>');
  track.insertAdjacentHTML('beforeend', '<div class="dot"><svg viewBox="0 0 24 24"><path d="M12 2l3 6.7 7.3.8-5.4 5 1.5 7.2L12 18.2 5.6 21.7 7.1 14.5 1.7 9.5 9 8.7z" fill="#ffc83b" stroke="#1e295b" stroke-width="1.2"/></svg></div>');
}

const sheets = [];
PAGES.forEach((p, i) => {
  const s = document.createElement('div');
  s.className = 'sheet';
  s.style.zIndex = String(PAGES.length - i);
  s.innerHTML = p.html;
  book.appendChild(s);
  sheets.push(s);
  try { p.init && p.init(s); } catch (e) { console.warn('init page error', i, e); }
});

let cur = 0;
function show() {
  sheets.forEach((s, i) => {
    s.classList.toggle('turned', i < cur);
    s.classList.toggle('live', i === cur);
  });
  const sh = sheets[cur];
  if (sh._onShow) sh._onShow();
  $('#pgno').textContent = `${cur + 1} / ${sheets.length}`;
  $('#prev').disabled = cur === 0;
  $('#next').disabled = cur === sheets.length - 1;
}

function turn(dir) {
  const n = cur + dir;
  if (n < 0 || n >= sheets.length) return;
  const moving = dir > 0 ? sheets[cur] : sheets[n];
  moving.classList.add('turning');
  chime([400, 500]);
  setTimeout(() => moving.classList.remove('turning'), 850);
  cur = n;
  show();
}

$('#next').onclick = () => turn(1);
$('#prev').onclick = () => turn(-1);

addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft') turn(1);
  if (e.key === 'ArrowRight') turn(-1);
});

paintTrack();
show();
