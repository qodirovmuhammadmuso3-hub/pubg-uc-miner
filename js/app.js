// ─── STATE ───────────────────────────────────────────────
const state = {
  balance: 0,
  todayEarned: 0,
  totalWithdrawn: 0,
  refs: 0,
  tasksCompleted: 0,
  selectedRate: null,
  username: 'PLAYER',
  userId: null,
  doneTasks: [],
};

// ─── API HELPER ──────────────────────────────────────────
async function callApi(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${CONFIG.apiUrl}${endpoint}`, options);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (e) {
    console.error('API Error:', e);
    showToast('Server bilan bog\'lanishda xato');
    return null;
  }
}

// ─── TASKS CONFIG ────────────────────────────────────────
const TASKS = [
  { id:'daily_start',  icon:'🎯', name:'Kunlik bonus',         desc:'Har kuni kirish uchun',          reward:50,   type:'daily'   },
  { id:'watch_ad_1',   icon:'📺', name:'Reklama ko\'rish #1',  desc:'30 soniya video',                reward:30,   type:'ad'      },
  { id:'watch_ad_2',   icon:'📺', name:'Reklama ko\'rish #2',  desc:'30 soniya video',                reward:30,   type:'ad'      },
  { id:'sub_channel',  icon:'📢', name:'Kanalga obuna',        desc:'@pubguc_uz kanaliga obuna',       reward:100,  type:'channel' },
  { id:'watch_ad_3',   icon:'🎬', name:'Reklama ko\'rish #3',  desc:'60 soniya video',                reward:50,   type:'ad'      },
  { id:'share_bot',    icon:'📤', name:'Botni ulashish',       desc:'Do\'stingizga yuboring',         reward:75,   type:'share'   },
];

// ─── UC RATES ────────────────────────────────────────────
const RATES = [
  { uc:60,  cost:1000  },
  { uc:180, cost:2500  },
  { uc:400, cost:5000  },
  { uc:900, cost:10000 },
  { uc:1800,cost:19000 },
  { uc:3850,cost:38000 },
];

// ─── TASK STORAGE (NOW API) ──────────────────────────────
async function loadState() {
  const params = new URLSearchParams(window.location.search);
  const refId = params.get('start')?.replace('ref_', '');

  const data = await callApi('/api/init', 'POST', {
    userId: state.userId || 0,
    username: state.username,
    referrerId: refId ? parseInt(refId) : null
  });

  if (data) {
    Object.assign(state, data);
    updateUI();
  }
  
  // Yuklangan done_tasks ni olish
  if (state.userId) {
    const done = await callApi(`/api/user/${state.userId}/done_tasks`);
    if (done) state.doneTasks = done;
  }
}

async function markDone(task) {
  const data = await callApi('/api/tasks/complete', 'POST', {
    userId: state.userId,
    taskId: task.id,
    reward: task.reward
  });
  if (data) {
    state.balance = data.new_balance;
    state.doneTasks.push(task.id);
    updateUI();
    renderTasks();
  }
}

// ─── TELEGRAM INIT ───────────────────────────────────────
function initTelegram() {
  if(window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#131316');
    tg.setBackgroundColor('#0A0A0B');
    const u = tg.initDataUnsafe?.user;
    if(u) {
      state.username = u.first_name || u.username || 'PLAYER';
      state.userId   = u.id;
    }
  }
  document.getElementById('user-tag').textContent = state.username.toUpperCase().slice(0,12);
  document.getElementById('profile-tag').textContent = state.username.toUpperCase().slice(0,12);
  document.getElementById('profile-name').textContent = state.username;
  document.getElementById('profile-id').textContent = 'ID: ' + (state.userId || '—');

  const refLink = `https://t.me/${CONFIG.botUsername}?start=ref_${state.userId || 'DEMO'}`;
  document.getElementById('ref-link-display').textContent = refLink;
}

// ─── RENDER TASKS ────────────────────────────────────────
function renderTasks() {
  const container = document.getElementById('task-list');
  container.innerHTML = '';
  TASKS.forEach(task => {
    const isDone = state.doneTasks.includes(task.id);
    const div = document.createElement('div');
    div.className = 'task-card' + (isDone ? ' done' : '');
    div.innerHTML = `
      <div class="task-left">
        <div class="task-icon">${task.icon}</div>
        <div class="task-info">
          <div class="task-name">${task.name}</div>
          <div class="task-desc">${task.desc}</div>
        </div>
      </div>
      <div class="task-right">
        ${isDone
          ? '<span class="task-done-icon">✓</span>'
          : `<span class="task-reward">+${task.reward}</span><span class="task-arrow">›</span>`
        }
      </div>`;
    if(!isDone) div.onclick = () => doTask(task);
    container.appendChild(div);
  });
}

// ─── DO TASK ─────────────────────────────────────────────
function doTask(task) {
  if(task.type === 'channel') {
    window.open(CONFIG.channelLink, '_blank');
    setTimeout(() => { earnCoins(task); }, CONFIG.earnDelay);
    return;
  }
  if(task.type === 'share') {
    shareBot();
    earnCoins(task);
    return;
  }
  showToast('Reklama yuklanmoqda...');
  setTimeout(() => { earnCoins(task); }, 2000);
}

function earnCoins(task) {
  markDone(task);
  state.todayEarned += task.reward;
  state.tasksCompleted++;
  showToast(`+${task.reward} COIN ishladingiz!`);
}

// ─── RENDER RATES ────────────────────────────────────────
function renderRates() {
  const container = document.getElementById('rate-cards');
  container.innerHTML = '';
  RATES.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'rate-card';
    div.innerHTML = `
      <div class="rate-uc">${r.uc}<span>UC</span></div>
      <div class="rate-cost">${r.cost.toLocaleString()} coin</div>`;
    div.onclick = () => selectRate(r, i);
    container.appendChild(div);
  });
}

function selectRate(r, i) {
  state.selectedRate = r;
  document.querySelectorAll('.rate-card').forEach((c,j) => c.classList.toggle('selected', j===i));
  validateExchange();
}

function validateExchange() {
  const pid = document.getElementById('player-id').value.trim();
  const r   = state.selectedRate;
  const btn = document.getElementById('btn-exchange');
  const status = document.getElementById('exc-status');
  if(!r) { btn.disabled=true; status.textContent='UC miqdorini tanlang'; return; }
  if(state.balance < r.cost) {
    btn.disabled=true;
    status.textContent = `Yetarli coin yo'q. Kerak: ${r.cost.toLocaleString()} | Sizda: ${state.balance.toLocaleString()}`;
    return;
  }
  if(!pid || pid.length < 6) { btn.disabled=true; status.textContent='Player ID kiriting'; return; }
  btn.disabled=false;
  status.textContent = `${r.uc} UC → ${pid} — tayyor`;
}

document.getElementById('player-id').addEventListener('input', validateExchange);

async function doExchange() {
  const r = state.selectedRate;
  if(!r || state.balance < r.cost) return;
  const pid = document.getElementById('player-id').value.trim();
  
  const data = await callApi('/api/withdraw', 'POST', {
    userId: state.userId,
    playerId: pid,
    ucAmount: r.uc,
    cost: r.cost
  });

  if (data) {
    state.balance = data.new_balance;
    state.totalWithdrawn += r.uc;
    state.selectedRate = null;
    updateUI();
    document.querySelectorAll('.rate-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('player-id').value = '';
    document.getElementById('btn-exchange').disabled = true;
    document.getElementById('exc-status').textContent = '';
    showToast(`${r.uc} UC so'rovi yuborildi!`);
  }
}

// ─── REFERRAL (BOT SIDE LOGIC IN API) ────────────────────
function copyRef() {
  const link = document.getElementById('ref-link-display').textContent;
  navigator.clipboard?.writeText(link).then(()=> showToast('Havola nusxalandi!')).catch(()=>{});
}
function shareRef() {
  const link = document.getElementById('ref-link-display').textContent;
  const text = `PUBG UC BEPUL ISHLANG 🎮\n\n${link}`;
  if(window.Telegram?.WebApp) {
    window.Telegram.WebApp.switchInlineQuery(text);
  } else {
    window.open('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent('PUBG UC bepul ishlang 🎮'));
  }
}
function shareBot() {
  shareRef();
}

// ─── UPDATE UI ───────────────────────────────────────────
function updateUI() {
  document.getElementById('balance-display').innerHTML = `${state.balance.toLocaleString()} <span>COIN</span>`;
  document.getElementById('today-earned').textContent  = `+${state.todayEarned}`;
  document.getElementById('total-withdrawn').textContent = `${state.totalWithdrawn} UC`;
  document.getElementById('ref-count-header').textContent = state.refs;
  document.getElementById('exc-balance').innerHTML = `${state.balance.toLocaleString()} <span>COIN</span>`;
  document.getElementById('ref-earn-display').innerHTML = `${(state.refs * 100).toLocaleString()} <span>COIN</span>`;
  document.getElementById('ref-friends').textContent = state.refs;
  document.getElementById('ref-level2').textContent = state.refs > 0 ? Math.floor(state.refs * 0.3) : 0;
  
  document.getElementById('stat-total').textContent = state.balance.toLocaleString();
  document.getElementById('stat-uc').textContent = state.totalWithdrawn;
  document.getElementById('stat-tasks').textContent = state.tasksCompleted;
  document.getElementById('stat-refs').textContent = state.refs;
  
  const goal = 1000;
  const pct = Math.min(100, Math.round((state.balance / goal) * 100));
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-need').textContent =
    state.balance >= goal
      ? '✓ 60 UC olishga tayyor!'
      : `${(goal - state.balance).toLocaleString()} coin qoldi`;
}

// ─── PAGE SWITCHER ───────────────────────────────────────
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  window.scrollTo(0,0);
}

// ─── TOAST ───────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ─── BOOT ────────────────────────────────────────────────
async function startApp() {
  initTelegram(); // user ID ni olish uchun
  await loadState(); // bazadan qolganini olish
  renderTasks();
  renderRates();
}

startApp();
