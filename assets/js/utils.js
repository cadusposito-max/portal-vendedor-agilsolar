// ==========================================
// UTILITÁRIOS GERAIS
// ==========================================

// --- Tema + logo por tema (dark/light) sem ocupar espaço no header ---
function getThemePreference() {
  const pref = localStorage.getItem('themePreference');
  return (pref === 'light' || pref === 'dark' || pref === 'system') ? pref : 'system';
}

function getActiveThemeMode() {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'light' || explicit === 'dark') return explicit;

  const pref = getThemePreference();
  if (pref === 'light' || pref === 'dark') return pref;

  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
    ? 'light'
    : 'dark';
}

function applyThemeMode() {
  const mode = getActiveThemeMode();
  document.documentElement.setAttribute('data-theme', mode);
  document.body.classList.toggle('theme-light', mode === 'light');
  document.body.classList.toggle('theme-dark', mode !== 'light');
  const lightCssEl = document.getElementById('theme-light-css');
  if (lightCssEl) lightCssEl.disabled = mode !== 'light';
  updateThemeMetaColor(mode);
  applyThemeLogos();
}

function setThemePreference(preference) {
  const pref = (preference === 'light' || preference === 'dark' || preference === 'system')
    ? preference
    : 'system';
  localStorage.setItem('themePreference', pref);
  applyThemeMode();
  if (typeof showToast === 'function') {
    const label = pref === 'system' ? 'SISTEMA' : (pref === 'light' ? 'CLARO' : 'ESCURO');
    showToast(`TEMA: ${label}`);
  }
}

function updateThemeMetaColor(mode) {
  const color = mode === 'light' ? '#f3f4f6' : '#050505';
  const selectors = [
    'meta[name="theme-color"]',
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  ];

  // theme-color
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', color);

  // iOS status bar behavior remains stable but we keep it explicit
  const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleMeta) {
    appleMeta.setAttribute('content', mode === 'light' ? 'default' : 'black-translucent');
  }
}

function applyThemeLogos() {
  const mode = getActiveThemeMode();
  document.querySelectorAll('img[data-theme-logo="true"]').forEach(img => {
    const darkSrc = img.getAttribute('data-logo-dark');
    const lightSrc = img.getAttribute('data-logo-light');
    const targetSrc = mode === 'light' ? lightSrc : darkSrc;
    if (targetSrc && img.getAttribute('src') !== targetSrc) {
      img.setAttribute('src', targetSrc);
    }
  });
}

document.addEventListener('DOMContentLoaded', applyThemeMode);

if (window.matchMedia) {
  const _themeMq = window.matchMedia('(prefers-color-scheme: light)');
  if (_themeMq.addEventListener) {
    _themeMq.addEventListener('change', () => {
      if (getThemePreference() === 'system') applyThemeMode();
    });
  } else if (_themeMq.addListener) {
    _themeMq.addListener(() => {
      if (getThemePreference() === 'system') applyThemeMode();
    });
  }
}

// --- Segurança: sanitizar strings antes de inserir no DOM ---
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('pt-BR');
}

// Retorna label legível para um período 'YYYY-MM' ou 'all'
function formatMonthLabel(yyyymm) {
  if (!yyyymm || yyyymm === 'all') return 'GERAL';
  const [y, m] = yyyymm.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

function debounce(fn, wait = 180) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// --- Toast com fila (evita sobreposição) ---
let _toastQueue   = [];
let _toastShowing = false;

function showToast(msg) {
  _toastQueue.push(msg);
  if (!_toastShowing) _processToastQueue();
}

function _processToastQueue() {
  if (_toastQueue.length === 0) { _toastShowing = false; return; }
  _toastShowing = true;
  const msg   = _toastQueue.shift();
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').innerText = msg;
  toast.classList.remove('translate-y-full', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-full', 'opacity-0');
    setTimeout(_processToastQueue, 350);
  }, 3000);
}

// --- Modal de confirmação genérico ---
function showConfirmModal(message, onConfirm, confirmLabel = 'CONFIRMAR', danger = true) {
  document.getElementById('confirm-modal-msg').innerText = message;
  const btnYes = document.getElementById('btn-confirm-yes');
  btnYes.innerText = confirmLabel;
  btnYes.className = danger
    ? 'flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest transition-colors text-sm'
    : 'flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase tracking-widest transition-colors text-sm';
  btnYes.onclick = () => { hideConfirmModal(); onConfirm(); };
  document.getElementById('confirm-modal-overlay').classList.remove('hidden');
}

function hideConfirmModal() {
  document.getElementById('confirm-modal-overlay').classList.add('hidden');
}

// ==========================================
// ANIMAÇÃO DE CONTADORES
// ==========================================
function animateCounters() {
  const reduceMotion =
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    window.innerWidth <= 768;

  document.querySelectorAll('[data-count]').forEach(el => {
    const target     = parseFloat(el.dataset.count) || 0;
    const isCurrency = el.dataset.countCurrency === 'true';

    if (reduceMotion) {
      el.textContent = isCurrency
        ? formatCurrency(target)
        : target.toLocaleString('pt-BR');
      return;
    }

    const duration   = 1200;
    const start      = performance.now();

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const current  = target * easeOutCubic(progress);

      if (isCurrency) {
        el.textContent = formatCurrency(Math.floor(current));
      } else {
        el.textContent = Math.floor(current).toLocaleString('pt-BR');
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = isCurrency
          ? formatCurrency(target)
          : target.toLocaleString('pt-BR');
      }
    };

    requestAnimationFrame(tick);
  });
}

// ==========================================
// SAUDAÇÃO E INFO DO USUÁRIO
// ==========================================
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName() {
  // Prioridade: nome do perfil → user_metadata → email
  if (state.profile?.nome) return state.profile.nome.split(' ')[0];
  if (!state.currentUser) return '';
  const meta = state.currentUser.user_metadata || {};
  const full  = meta.full_name || meta.name || '';
  if (full) return full.split(' ')[0];
  const email = state.currentUser.email || '';
  const prefix = email.split('@')[0];
  const name   = prefix.split('.')[0].split('_')[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function getBadgeStyles(tag) {
  const styles = {
    'MAIS VENDIDO':    'bg-gradient-to-r from-orange-600 to-yellow-500 text-black border-orange-500',
    'PREMIUM':         'bg-neutral-800 text-orange-400 border-orange-500',
    'CUSTO-BENEFÍCIO': 'bg-green-600 text-white border-green-500',
    'LANÇAMENTO':      'bg-blue-600 text-white border-blue-500',
    'ALTA POTÊNCIA':   'bg-red-600 text-white border-red-500',
    'PROJETO ESPECIAL':'bg-neutral-700 text-neutral-300 border-neutral-600',
  };
  return styles[tag] || styles['PROJETO ESPECIAL'];
}

function getStatusColor(status) {
  switch (status) {
    case 'NOVO':              return 'text-blue-400 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20';
    case 'PROPOSTA ENVIADA':  return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20';
    case 'EM NEGOCIAÇÃO':     return 'text-orange-500 border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20';
    case 'FECHADO':           return 'text-green-400 border-green-500/50 bg-green-500/10 hover:bg-green-500/20';
    default:                  return 'text-blue-400 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20';
  }
}

// Estima geração mensal em kWh
// Usa hsp_medio da franquia do usuário logado (carregado via fetchFranquia).
// Fallback: 5.4 HSP (Araçatuba) quando não logado (ex: proposta.html pública).
function calcularGeracaoEstimada(potencia_kWp, categoria) {
  const hsp        = (typeof state !== 'undefined' && state.franquiaHsp) ? state.franquiaHsp : 5.4;
  const eficiencia = categoria === 'kitsMicro' ? 0.81 : 0.76;
  return potencia_kWp * hsp * 30 * eficiencia;
}

function copiarTextoBlindado(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).catch(() => fallbackCopiar(texto));
  } else {
    fallbackCopiar(texto);
  }
}

function fallbackCopiar(texto) {
  const textArea = document.createElement('textarea');
  textArea.value = texto;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try { document.execCommand('copy'); } catch (err) {}
  document.body.removeChild(textArea);
}

// ==========================================
// EXPORTAR XLSX (requer SheetJS)
// ==========================================
function exportToXLSX(rows, columns, filename) {
  if (typeof XLSX === 'undefined') {
    showToast('Biblioteca XLSX não carregada. Recarregue a página.');
    return;
  }
  if (!rows || rows.length === 0) {
    showToast('Nenhum dado para exportar.');
    return;
  }
  const sheetData = rows.map(row => {
    const obj = {};
    columns.forEach(col => {
      // Suporta tanto col.value(row) quanto col.key
      obj[col.header] = typeof col.value === 'function'
        ? col.value(row)
        : (row[col.key] ?? '');
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = columns.map(c => ({ wch: Math.max((c.header || '').length + 4, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  XLSX.writeFile(wb, `${filename}.xlsx`);
  // Nota: o caller é responsável pelo toast (evita toast duplo)
}

// ==========================================
// CELEBRAÇÃO DE VENDA (confetti + som)
// ==========================================
function showSalesCelebration() {
  // — Som: sino de notificação elegante —
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const actx = new AudioCtx();
    [[1046.5, 0, 0.22], [2093, 0, 0.07], [1568, 0.18, 0.12]].forEach(([freq, delay, vol]) => {
      const osc  = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain); gain.connect(actx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = actx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      osc.start(t); osc.stop(t + 1.45);
    });
  } catch (_) {}

  // — Confetti canvas —
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.classList.remove('hidden');
  const cx = canvas.getContext('2d');
  const COLORS = ['#f97316','#facc15','#22c55e','#3b82f6','#ec4899','#a855f7','#ef4444','#fbbf24'];
  const pieces = Array.from({ length: 200 }, () => ({
    x:  Math.random() * canvas.width,
    y:  -20 - Math.random() * 150,
    w:  Math.random() * 12 + 5,
    h:  Math.random() * 7  + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 3.5 + 1.5,
    rot:  Math.random() * 360,
    rotV: (Math.random() - 0.5) * 10,
    op: 1,
  }));
  let frame = 0;
  function draw() {
    cx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      cx.save();
      cx.globalAlpha = Math.max(0, p.op);
      cx.translate(p.x, p.y);
      cx.rotate(p.rot * Math.PI / 180);
      cx.fillStyle = p.color;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cx.restore();
      p.x  += p.vx;
      p.y  += p.vy * (1 + frame * 0.004);
      p.rot += p.rotV;
      if (frame > 80) p.op -= 0.01;
    });
    frame++;
    if (frame < 220) requestAnimationFrame(draw);
    else { cx.clearRect(0, 0, canvas.width, canvas.height); canvas.classList.add('hidden'); }
  }
  draw();
}

// ==========================================
// AVISO DE NOVA VERSAO PUBLICADA
// ==========================================
const VERSION_CHECK_CONFIG = {
  url: '/version.json',
  intervalMs: 60 * 1000,
};

let _versionCheckStarted = false;
let _initialLoadedVersion = '';
let _detectedNewVersion = '';
const _dismissedVersionNotices = new Set();

function _normalizeVersionValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function _fetchPublishedVersion() {
  try {
    const response = await fetch(`${VERSION_CHECK_CONFIG.url}?ts=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!response.ok) return '';
    const payload = await response.json();
    return _normalizeVersionValue(payload?.version);
  } catch (_) {
    // Falha silenciosa para nao gerar ruido para o usuario.
    return '';
  }
}

function _ensureVersionUpdateNotice() {
  let notice = document.getElementById('version-update-notice');
  if (notice) return notice;

  notice = document.createElement('section');
  notice.id = 'version-update-notice';
  notice.className = 'fixed right-4 bottom-4 z-[10000] w-[min(92vw,380px)] bg-neutral-950/95 border border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.25)] backdrop-blur-sm p-4 transition-all duration-300 translate-y-4 opacity-0 pointer-events-none hidden';
  notice.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="mt-0.5 bg-orange-500/15 border border-orange-500/30 p-2 shrink-0">
        <i data-lucide="refresh-cw" class="w-4 h-4 text-orange-400"></i>
      </div>
      <div class="min-w-0">
        <h3 class="text-white font-black uppercase tracking-wide text-xs">Nova atualiza��o dispon�vel</h3>
        <p class="text-neutral-300 text-xs leading-relaxed mt-1">Recarregue a p�gina para usar a vers�o mais recente.</p>
      </div>
    </div>
    <div class="flex items-center gap-2 mt-4">
      <button id="version-update-now-btn" type="button" class="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-black font-black uppercase tracking-widest text-[10px] transition-all">Atualizar agora</button>
      <button id="version-update-later-btn" type="button" class="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-black uppercase tracking-widest text-[10px] transition-all">Depois</button>
    </div>
  `;
  document.body.appendChild(notice);

  const btnUpdateNow = notice.querySelector('#version-update-now-btn');
  const btnLater = notice.querySelector('#version-update-later-btn');

  if (btnUpdateNow) {
    btnUpdateNow.addEventListener('click', () => {
      btnUpdateNow.setAttribute('disabled', 'true');
      btnUpdateNow.textContent = 'Atualizando...';
      window.location.reload();
    });
  }

  if (btnLater) {
    btnLater.addEventListener('click', () => {
      if (_detectedNewVersion) _dismissedVersionNotices.add(_detectedNewVersion);
      _hideVersionUpdateNotice();
    });
  }

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  return notice;
}

function _showVersionUpdateNotice(remoteVersion) {
  const notice = _ensureVersionUpdateNotice();
  _detectedNewVersion = remoteVersion;
  notice.classList.remove('hidden', 'translate-y-4', 'opacity-0', 'pointer-events-none');
  notice.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
}

function _hideVersionUpdateNotice() {
  const notice = document.getElementById('version-update-notice');
  if (!notice) return;

  notice.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
  notice.classList.add('translate-y-4', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    if (
      notice.classList.contains('translate-y-4') &&
      notice.classList.contains('opacity-0')
    ) {
      notice.classList.add('hidden');
    }
  }, 320);
}

async function checkForPublishedVersionUpdate() {
  const remoteVersion = await _fetchPublishedVersion();
  if (!remoteVersion) return;

  if (!_initialLoadedVersion) {
    _initialLoadedVersion = remoteVersion;
    return;
  }

  if (remoteVersion === _initialLoadedVersion) return;
  if (_dismissedVersionNotices.has(remoteVersion)) return;

  _showVersionUpdateNotice(remoteVersion);
}

async function initPublishedVersionWatcher() {
  if (_versionCheckStarted) return;
  _versionCheckStarted = true;

  const initialVersion = await _fetchPublishedVersion();
  if (initialVersion) _initialLoadedVersion = initialVersion;

  setInterval(checkForPublishedVersionUpdate, VERSION_CHECK_CONFIG.intervalMs);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPublishedVersionWatcher, { once: true });
} else {
  initPublishedVersionWatcher();
}
