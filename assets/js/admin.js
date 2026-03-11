// ==========================================
// PAINEL ADMINISTRATIVO
// ==========================================

// --- Modal dinâmico do admin ---
function ensureAdminModal() {
  if (document.getElementById('admin-modal-overlay')) return;
  const div = document.createElement('div');
  div.id = 'admin-modal-overlay';
  div.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 hidden';
  div.innerHTML = `
    <div class="bg-neutral-900 border-2 border-red-600/50 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(239,68,68,0.2)]">
      <div class="flex justify-between items-center p-5 border-b border-neutral-800 bg-black/50 sticky top-0 z-10">
        <h2 id="admin-modal-title" class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 uppercase tracking-tighter pb-0.5">NOVO ITEM</h2>
        <button onclick="closeAdminModal()" class="text-neutral-500 hover:text-red-500 transition-colors"><i data-lucide="x" class="w-7 h-7"></i></button>
      </div>
      <form id="admin-modal-form" class="p-5 space-y-4" onsubmit="submitAdminModal(event)">
        <div id="admin-modal-fields"></div>
        <div class="flex gap-4 pt-2">
          <button type="button" onclick="closeAdminModal()"
            class="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase tracking-widest transition-colors text-sm">
            Cancelar
          </button>
          <button type="submit" id="admin-modal-save"
            class="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black uppercase tracking-widest transition-all text-sm">
            SALVAR
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(div);
}

let _adminModalCallback = null;

function openAdminModal(title, fieldsHTML, onSubmit) {
  ensureAdminModal();
  document.getElementById('admin-modal-title').textContent = title;
  document.getElementById('admin-modal-fields').innerHTML = fieldsHTML;
  _adminModalCallback = onSubmit;
  document.getElementById('admin-modal-overlay').classList.remove('hidden');
  lucide.createIcons();
}

function closeAdminModal() {
  const el = document.getElementById('admin-modal-overlay');
  if (el) el.classList.add('hidden');
  _adminModalCallback = null;
}

async function submitAdminModal(e) {
  e.preventDefault();
  if (!_adminModalCallback) return;
  const btn = document.getElementById('admin-modal-save');
  btn.textContent = 'SALVANDO...';
  btn.disabled = true;
  await _adminModalCallback();
  btn.textContent = 'SALVAR';
  btn.disabled = false;
}

// ─── Painel Principal ────────────────────────────────────────
function renderAdminPanel(container) {
  container.className = 'flex flex-col gap-5';

  if (!state.adminSection) state.adminSection = 'produtos';

  // Gestor só acessa KITS (da própria franquia) e VENDEDORES (para ver a equipe)
  const allSections = [
    { id: 'produtos',      label: 'KITS',            icon: 'zap' },
    { id: 'financiadoras', label: 'FINANCIADORAS',   icon: 'landmark',   adminOnly: true },
    { id: 'componentes',   label: 'COMPONENTES',     icon: 'cpu',        adminOnly: true },
    { id: 'custos',        label: 'CUSTOS EXTRAS',   icon: 'circle-plus', adminOnly: true },
    { id: 'vendedores',    label: 'VENDEDORES',       icon: 'users' },
  ];
  const sections = allSections.filter(s => !s.adminOnly || state.isAdmin);

  const tabsHTML = sections.map(s => {
    const active = state.adminSection === s.id;
    return `<button onclick="setAdminSection('${s.id}')"
      class="${active
        ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
        : 'bg-transparent border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
      } border px-4 py-2.5 font-black uppercase text-[9px] tracking-widest flex items-center gap-2 transition-all">
      <i data-lucide="${s.icon}" class="w-3.5 h-3.5"></i>${s.label}
    </button>`;
  }).join('');

  container.innerHTML = `
    <div class="bg-red-950/10 border border-red-600/20 p-4 flex items-center gap-3">
      <div class="bg-red-600/20 border border-red-600/30 p-2 text-red-400 shrink-0">
        <i data-lucide="shield-check" class="w-4 h-4"></i>
      </div>
      <div>
        <span class="text-red-400 font-black uppercase tracking-widest text-[9px] block">MODO ADMINISTRADOR</span>
        <span class="text-white font-bold text-sm">Gerenciamento do Sistema Agilsolar</span>
      </div>
    </div>
    <div class="flex flex-wrap gap-1.5">${tabsHTML}</div>
    <div id="admin-section-content" class="min-h-[200px]"></div>
  `;

  lucide.createIcons();

  const content = document.getElementById('admin-section-content');
  const adminBar = document.getElementById('admin-bar');

  if (state.adminSection === 'produtos') {
    state.isEditMode = true;
    if (adminBar) adminBar.classList.remove('hidden');
    renderAdminKitsSection(content);
  } else {
    if (adminBar) adminBar.classList.add('hidden');
    if (state.adminSection === 'financiadoras') renderAdminFinanciadoras(content);
    else if (state.adminSection === 'componentes') renderAdminComponentes(content);
    else if (state.adminSection === 'custos')      renderAdminCustos(content);
    else if (state.adminSection === 'vendedores')  renderAdminVendedores(content);
    else if (state.adminSection === 'franquias')   renderAdminFranquias(content);
  }
}

function setAdminSection(section) {
  state.adminSection = section;
  const container = document.getElementById('main-container');
  if (container) renderAdminPanel(container);
}

async function renderAdminKitsSection(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-8 text-neutral-600">
    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i><span class="font-bold uppercase text-[10px] tracking-widest">Carregando...</span>
  </div>`;
  lucide.createIcons();

  const franquiasQuery = supabaseClient
    .from('franquias')
    .select('id, nome')
    .eq('ativo', true)
    .order('created_at', { ascending: true });

  // Gestor só enxerga a própria franquia no seletor de kits
  if (state.isGestor && state.franquiaId) {
    franquiasQuery.eq('id', state.franquiaId);
  }

  const { data: franquias = [] } = await franquiasQuery;

  // Para gestor, travar sempre na própria franquia
  if (state.isGestor) {
    state.adminKitsFranquia = state.franquiaId;
  } else if (!state.adminKitsFranquia || !franquias.find(f => f.id === state.adminKitsFranquia)) {
    state.adminKitsFranquia = franquias[0]?.id || null;
  }

  const tabsHTML = franquias.map(f => {
    const active = state.adminKitsFranquia === f.id;
    return `<button onclick="setAdminKitsFranquia('${f.id}')"
      class="${active
        ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.3)]'
        : 'bg-transparent border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
      } border px-3 py-2 font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 transition-all whitespace-nowrap">
      <i data-lucide="building-2" class="w-3 h-3"></i>${escapeHTML(f.nome)}
    </button>`;
  }).join('');

  // Gestor: esconder o seletor de franquia (só existe a dele)
  const showFranquiaTabs = state.isAdmin && franquias.length > 0;

  container.innerHTML = `
    <div class="flex flex-col gap-4">
      ${showFranquiaTabs ? `
      <div class="bg-purple-950/20 border border-purple-600/20 p-3 flex flex-wrap items-center gap-2">
        <span class="text-purple-400 font-black uppercase tracking-widest text-[9px] shrink-0">PREÇOS DA UNIDADE:</span>
        ${tabsHTML}
      </div>` : ''}
      <div id="admin-kits-grid"></div>
    </div>`;
  lucide.createIcons();

  await fetchProducts();
  const grid = document.getElementById('admin-kits-grid');
  if (grid) renderProductsList(grid);
}

async function setAdminKitsFranquia(franquiaId) {
  state.adminKitsFranquia = franquiaId;
  const content = document.getElementById('admin-section-content');
  if (content) renderAdminKitsSection(content);
}

// ─── Helpers compartilhados ───────────────────────────────────
const _inputCls  = 'w-full bg-black border border-neutral-700 focus:border-red-500 px-4 py-3 text-white font-bold transition-all';
const _labelCls  = 'text-[10px] text-red-400 font-black uppercase tracking-widest block mb-1';
const _selectCls = 'w-full bg-black border border-neutral-700 focus:border-red-500 px-4 py-3 text-white font-bold uppercase';

function _statusBadge(ativo) {
  return `<span class="px-2 py-0.5 text-[8px] font-black uppercase border shrink-0 ${ativo
    ? 'text-green-400 border-green-800 bg-green-900/20'
    : 'text-red-400 border-red-800 bg-red-900/10'}">${ativo ? 'ATIVO' : 'INATIVO'}</span>`;
}

function _editBtn(onclick) {
  return `<button onclick="${onclick}" class="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors shrink-0"><i data-lucide="edit-2" class="w-4 h-4"></i></button>`;
}

function _deleteBtn(onclick) {
  return `<button onclick="${onclick}" class="p-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;
}

function _addBtn(label, onclick) {
  return `<button onclick="${onclick}"
    class="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white px-4 py-2 font-black uppercase tracking-wider text-[10px] transition-all">
    <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[3px]"></i>${label}
  </button>`;
}

async function deleteAdminItem(table, id) {
  showConfirmModal('Tem certeza? Esta ação não pode ser desfeita.', async () => {
    const { error } = await supabaseClient.from(table).delete().eq('id', id);
    if (error) { showToast('ERRO: ' + error.message); return; }
    showToast('ITEM REMOVIDO');
    const c = document.getElementById('admin-section-content');
    if (!c) return;
    if (table === 'financiadoras') renderAdminFinanciadoras(c);
    else if (table === 'componentes') renderAdminComponentes(c);
    else if (table === 'custos_extras') renderAdminCustos(c);
  });
}

// ─── Financiadoras ────────────────────────────────────────────
async function renderAdminFinanciadoras(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-12 text-neutral-600">
    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i><span class="font-bold uppercase text-[10px] tracking-widest">Carregando...</span>
  </div>`;
  lucide.createIcons();

  const { data: items = [], error } = await supabaseClient
    .from('financiadoras')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) {
    container.innerHTML = `<p class="text-red-500 text-sm font-bold p-4 border border-red-800 bg-red-900/10">Erro ao carregar: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const rows = items.length === 0
    ? `<p class="text-neutral-600 text-sm font-bold text-center py-10">Nenhuma financiadora cadastrada.</p>`
    : items.map(item => `
      <div class="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800 p-4 hover:border-neutral-700 transition-all">
        <div class="shrink-0 w-9 h-9 flex items-center justify-center text-xl border border-neutral-700 bg-neutral-950">${escapeHTML(item.icone_texto || '🏦')}</div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-black text-sm uppercase truncate">${escapeHTML(item.nome)}</p>
          <p class="text-neutral-500 text-[10px] font-bold">${escapeHTML(item.taxa_texto || '—')} · ${escapeHTML(item.prazo_texto || '—')} · Ordem: ${item.ordem}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${_statusBadge(item.ativo)}
          ${_editBtn(`openAdminFinanciadoraForm('${item.id}')`)}
          ${_deleteBtn(`deleteAdminItem('financiadoras','${item.id}')`)}
        </div>
      </div>`).join('');

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">${items.length} financiadora(s)</span>
      ${_addBtn('NOVA FINANCIADORA', "openAdminFinanciadoraForm()")}
    </div>
    <div class="flex flex-col gap-2">${rows}</div>`;
  lucide.createIcons();
}

function openAdminFinanciadoraForm(id) {
  const fieldsHTML = `
    <input type="hidden" id="af-id" value="${id || ''}">
    <div class="grid grid-cols-2 gap-4">
      <div class="col-span-2"><label class="${_labelCls}">Nome *</label>
        <input required id="af-nome" class="${_inputCls} uppercase" placeholder="NOME DA FINANCIADORA"></div>
      <div class="col-span-2"><label class="${_labelCls}">URL *</label>
        <input required id="af-url" type="url" class="${_inputCls} font-mono text-sm" placeholder="https://..."></div>
      <div><label class="${_labelCls}">Taxa (texto)</label>
        <input id="af-taxa" class="${_inputCls}" placeholder="A partir de 1,5% a.m."></div>
      <div><label class="${_labelCls}">Prazo (texto)</label>
        <input id="af-prazo" class="${_inputCls}" placeholder="Até 60 meses"></div>
      <div><label class="${_labelCls}">Ícone (emoji)</label>
        <input id="af-icone" class="${_inputCls} text-2xl" placeholder="🏦" maxlength="4"></div>
      <div><label class="${_labelCls}">Ordem</label>
        <input type="number" id="af-ordem" class="${_inputCls} font-mono" value="0"></div>
      <div class="col-span-2"><label class="${_labelCls}">Cor CSS (Tailwind gradient)</label>
        <input id="af-cor" class="${_inputCls} font-mono text-sm" placeholder="from-blue-600 to-blue-400"></div>
      <label class="col-span-2 flex items-center gap-3 cursor-pointer">
        <input type="checkbox" id="af-ativo" checked class="w-4 h-4 accent-red-500">
        <span class="text-white font-bold text-sm uppercase">Ativo</span>
      </label>
    </div>`;

  openAdminModal(id ? 'EDITAR FINANCIADORA' : 'NOVA FINANCIADORA', fieldsHTML, async () => {
    const existingId = document.getElementById('af-id').value;
    const payload = {
      nome:        document.getElementById('af-nome').value.trim().toUpperCase(),
      url:         document.getElementById('af-url').value.trim(),
      taxa_texto:  document.getElementById('af-taxa').value.trim() || null,
      prazo_texto: document.getElementById('af-prazo').value.trim() || null,
      icone_texto: document.getElementById('af-icone').value.trim() || null,
      cor_css:     document.getElementById('af-cor').value.trim() || null,
      ordem:       parseInt(document.getElementById('af-ordem').value) || 0,
      ativo:       document.getElementById('af-ativo').checked,
      updated_at:  new Date().toISOString(),
    };
    const { error } = existingId
      ? await supabaseClient.from('financiadoras').update(payload).eq('id', existingId)
      : await supabaseClient.from('financiadoras').insert([payload]);
    if (error) { showToast('ERRO: ' + error.message); return; }
    closeAdminModal();
    showToast('FINANCIADORA SALVA COM SUCESSO');
    const c = document.getElementById('admin-section-content');
    if (c) renderAdminFinanciadoras(c);
  });

  if (id) {
    supabaseClient.from('financiadoras').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return;
      document.getElementById('af-nome').value   = data.nome || '';
      document.getElementById('af-url').value    = data.url || '';
      document.getElementById('af-taxa').value   = data.taxa_texto || '';
      document.getElementById('af-prazo').value  = data.prazo_texto || '';
      document.getElementById('af-icone').value  = data.icone_texto || '';
      document.getElementById('af-cor').value    = data.cor_css || '';
      document.getElementById('af-ordem').value  = data.ordem ?? 0;
      document.getElementById('af-ativo').checked = data.ativo !== false;
    });
  }
}

// ─── Componentes ──────────────────────────────────────────────
async function renderAdminComponentes(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-12 text-neutral-600">
    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i><span class="font-bold uppercase text-[10px] tracking-widest">Carregando...</span>
  </div>`;
  lucide.createIcons();

  const { data: items = [], error } = await supabaseClient
    .from('componentes')
    .select('*')
    .order('tipo')
    .order('nome');

  if (error) {
    container.innerHTML = `<p class="text-red-500 text-sm font-bold p-4 border border-red-800 bg-red-900/10">Erro ao carregar: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const grupos = [
    { tipo: 'modulo',   label: 'MÓDULOS' },
    { tipo: 'inversor', label: 'INVERSORES' },
  ];

  const gruposHTML = grupos.map(g => {
    const gItems = items.filter(c => c.tipo === g.tipo);
    if (gItems.length === 0) return '';
    const rowsHTML = gItems.map(item => `
      <div class="flex items-center gap-3 border-b border-neutral-800/60 p-3 hover:bg-neutral-900 transition-all">
        <div class="flex-1 min-w-0">
          <p class="text-white font-bold text-sm truncate">${escapeHTML(item.nome)}</p>
          <p class="text-neutral-500 text-[10px] font-bold">
            ${item.potencia_wp ? item.potencia_wp + ' Wp' : '—'}
            · R$ ${Number(item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${_statusBadge(item.ativo)}
          ${_editBtn(`openAdminComponenteForm('${item.id}')`)}
          ${_deleteBtn(`deleteAdminItem('componentes','${item.id}')`)}
        </div>
      </div>`).join('');
    return `
      <div class="mb-4">
        <p class="text-neutral-600 text-[9px] font-black uppercase tracking-widest mb-2 border-b border-neutral-800 pb-2">${g.label} (${gItems.length})</p>
        <div class="bg-neutral-900/40 border border-neutral-800">${rowsHTML}</div>
      </div>`;
  }).join('');

  const emptyMsg = items.length === 0
    ? `<p class="text-neutral-600 text-sm font-bold text-center py-10">Nenhum componente cadastrado.</p>`
    : '';

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">${items.length} componente(s)</span>
      ${_addBtn('NOVO COMPONENTE', "openAdminComponenteForm()")}
    </div>
    ${emptyMsg}${gruposHTML}`;
  lucide.createIcons();
}

function openAdminComponenteForm(id) {
  const fieldsHTML = `
    <input type="hidden" id="ac-id" value="${id || ''}">
    <div class="grid grid-cols-2 gap-4">
      <div><label class="${_labelCls}">Tipo *</label>
        <select required id="ac-tipo" class="${_selectCls}">
          <option value="modulo">MÓDULO</option>
          <option value="inversor">INVERSOR</option>
        </select></div>
      <div><label class="${_labelCls}">Potência (Wp)</label>
        <input type="number" step="0.1" id="ac-potencia" class="${_inputCls} font-mono" placeholder="550"></div>
      <div class="col-span-2"><label class="${_labelCls}">Nome *</label>
        <input required id="ac-nome" class="${_inputCls}" placeholder="Modelo / Descrição completa"></div>
      <div class="col-span-2"><label class="${_labelCls}">Preço Unitário (R$) *</label>
        <input required type="number" step="0.01" id="ac-preco"
          class="w-full bg-black border border-green-900 focus:border-green-500 text-green-400 px-4 py-3 font-mono font-bold transition-all"
          placeholder="0.00"></div>
      <label class="col-span-2 flex items-center gap-3 cursor-pointer">
        <input type="checkbox" id="ac-ativo" checked class="w-4 h-4 accent-red-500">
        <span class="text-white font-bold text-sm uppercase">Ativo</span>
      </label>
    </div>`;

  openAdminModal(id ? 'EDITAR COMPONENTE' : 'NOVO COMPONENTE', fieldsHTML, async () => {
    const existingId = document.getElementById('ac-id').value;
    const payload = {
      tipo:          document.getElementById('ac-tipo').value,
      nome:          document.getElementById('ac-nome').value.trim(),
      potencia_wp:   parseFloat(document.getElementById('ac-potencia').value) || null,
      preco_unitario: parseFloat(document.getElementById('ac-preco').value) || 0,
      ativo:         document.getElementById('ac-ativo').checked,
    };
    const { error } = existingId
      ? await supabaseClient.from('componentes').update(payload).eq('id', existingId)
      : await supabaseClient.from('componentes').insert([payload]);
    if (error) { showToast('ERRO: ' + error.message); return; }
    closeAdminModal();
    showToast('COMPONENTE SALVO COM SUCESSO');
    const c = document.getElementById('admin-section-content');
    if (c) renderAdminComponentes(c);
  });

  if (id) {
    supabaseClient.from('componentes').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return;
      document.getElementById('ac-tipo').value     = data.tipo || 'modulo';
      document.getElementById('ac-nome').value     = data.nome || '';
      document.getElementById('ac-potencia').value = data.potencia_wp || '';
      document.getElementById('ac-preco').value    = data.preco_unitario || '';
      document.getElementById('ac-ativo').checked  = data.ativo !== false;
    });
  }
}

// ─── Custos Extras ────────────────────────────────────────────
async function renderAdminCustos(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-12 text-neutral-600">
    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i><span class="font-bold uppercase text-[10px] tracking-widest">Carregando...</span>
  </div>`;
  lucide.createIcons();

  const { data: items = [], error } = await supabaseClient
    .from('custos_extras')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) {
    container.innerHTML = `<p class="text-red-500 text-sm font-bold p-4 border border-red-800 bg-red-900/10">Erro ao carregar: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const rows = items.length === 0
    ? `<p class="text-neutral-600 text-sm font-bold text-center py-10">Nenhum custo extra cadastrado.</p>`
    : items.map(item => `
      <div class="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800 p-4 hover:border-neutral-700 transition-all">
        <div class="flex-1 min-w-0">
          <p class="text-white font-bold text-sm truncate">${escapeHTML(item.nome)}</p>
          <p class="text-neutral-500 text-[10px] font-bold">
            ${item.tipo_calculo === 'percentual'
              ? item.valor + '%'
              : 'R$ ' + Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            · Ordem: ${item.ordem}
            ${item.descricao ? ' · ' + escapeHTML(item.descricao) : ''}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${_statusBadge(item.ativo)}
          ${_editBtn(`openAdminCustoForm('${item.id}')`)}
          ${_deleteBtn(`deleteAdminItem('custos_extras','${item.id}')`)}
        </div>
      </div>`).join('');

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">${items.length} custo(s)</span>
      ${_addBtn('NOVO CUSTO', "openAdminCustoForm()")}
    </div>
    <div class="flex flex-col gap-2">${rows}</div>`;
  lucide.createIcons();
}

// ─── Vendedores ───────────────────────────────────────────────
async function renderAdminVendedores(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-12 text-neutral-600">
    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i><span class="font-bold uppercase text-[10px] tracking-widest">Carregando...</span>
  </div>`;
  lucide.createIcons();

  const { data: items = [], error } = await supabaseClient
    .from('vendedores_stats')
    .select('*')
    .order('email', { ascending: true });

  if (error) {
    container.innerHTML = `<p class="text-red-500 text-sm font-bold p-4 border border-red-800 bg-red-900/10">Erro ao carregar: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const rows = items.length === 0
    ? `<p class="text-neutral-600 text-sm font-bold text-center py-10">Nenhum vendedor encontrado.</p>`
    : items.map(item => `
      <div class="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800 p-4 hover:border-neutral-700 transition-all">
        <div class="shrink-0 w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 font-black text-sm">
          ${escapeHTML((item.email || '?').charAt(0).toUpperCase())}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-bold text-sm truncate">${escapeHTML(item.email || '—')}</p>
          <p class="text-neutral-500 text-[10px] font-bold">
            ${item.total_logins || 0} login(s)
            ${item.ultimo_acesso ? ' · Último acesso: ' + formatDate(item.ultimo_acesso) : ''}
          </p>
        </div>
        <div class="shrink-0 flex items-center gap-2">
          <span class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Comissão:</span>
          <input type="number" min="0" max="100" step="0.5"
            value="${item.comissao_pct ?? 5}"
            onchange="saveVendedorComissao('${escapeHTML(item.email)}', this.value)"
            class="w-20 bg-neutral-800 border border-neutral-700 hover:border-orange-500 focus:border-orange-500 text-white text-center font-black text-sm px-2 py-1.5 outline-none transition-all" />
          <span class="text-neutral-500 text-sm font-black">%</span>
        </div>
      </div>`).join('');

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">${items.length} vendedor(es)</span>
    </div>
    <div class="flex flex-col gap-2">${rows}</div>`;
  lucide.createIcons();
}

async function saveVendedorComissao(email, valor) {
  const pct = parseFloat(valor);
  if (isNaN(pct) || pct < 0 || pct > 100) {
    showToast('Valor inválido. Use entre 0 e 100.');
    return;
  }
  const { error } = await supabaseClient
    .from('vendedores_stats')
    .update({ comissao_pct: pct })
    .eq('email', email);
  if (error) {
    showToast('ERRO: ' + error.message);
  } else {
    showToast(`Comissão de ${escapeHTML(email.split('@')[0])} atualizada para ${pct}%`);
    // Atualiza state em tempo real se for a própria comissão
    if (state.currentUser && email === state.currentUser.email) {
      state.comissaoPct = pct;
    }
  }
}

// ─── Franquias ────────────────────────────────────────────────
async function renderAdminFranquias(container) {
  container.innerHTML = `<div class="flex items-center justify-center py-12 text-neutral-600">
    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i><span class="font-bold uppercase text-[10px] tracking-widest">Carregando...</span>
  </div>`;
  lucide.createIcons();

  const { data: items = [], error } = await supabaseClient
    .from('franquias')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    container.innerHTML = `<p class="text-red-500 text-sm font-bold p-4 border border-red-800 bg-red-900/10">Erro ao carregar: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const rows = items.length === 0
    ? `<p class="text-neutral-600 text-sm font-bold text-center py-10">Nenhuma franquia cadastrada.</p>`
    : items.map(item => `
      <div class="flex items-center gap-3 bg-neutral-900/60 border border-neutral-800 p-4 hover:border-neutral-700 transition-all">
        <div class="flex-1 min-w-0">
          <p class="text-white font-black text-sm uppercase truncate">${escapeHTML(item.nome)}</p>
          <p class="text-neutral-500 text-[10px] font-bold">${escapeHTML(item.cidade || '—')}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          ${_statusBadge(item.ativo)}
          <button onclick="renderAdminPrecosFranquia('${item.id}', '${escapeHTML(item.nome).replace(/'/g, "\\'")}')"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 font-black uppercase text-[8px] tracking-widest transition-all">
            <i data-lucide="tag" class="w-3 h-3"></i> PREÇOS
          </button>
          ${_editBtn(`openAdminFranquiaForm('${item.id}')`)}          
        </div>
      </div>`).join('');

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-neutral-500 text-[10px] font-black uppercase tracking-widest">${items.length} franquia(s)</span>
      ${_addBtn('NOVA FRANQUIA', 'openAdminFranquiaForm()')}
    </div>
    <div class="flex flex-col gap-2">${rows}</div>`;
  lucide.createIcons();
}

function openAdminFranquiaForm(id) {
  const fieldsHTML = `
    <input type="hidden" id="afr-id" value="${id || ''}">
    <div class="grid grid-cols-2 gap-4">
      <div class="col-span-2"><label class="${_labelCls}">Nome *</label>
        <input required id="afr-nome" class="${_inputCls} uppercase" placeholder="EX: ÁGIL SOLAR SJC"></div>
      <div class="col-span-2"><label class="${_labelCls}">Cidade</label>
        <input id="afr-cidade" class="${_inputCls}" placeholder="São José dos Campos"></div>
      <label class="col-span-2 flex items-center gap-3 cursor-pointer">
        <input type="checkbox" id="afr-ativo" checked class="w-4 h-4 accent-red-500">
        <span class="text-white font-bold text-sm uppercase">Ativa</span>
      </label>
    </div>`;

  openAdminModal(id ? 'EDITAR FRANQUIA' : 'NOVA FRANQUIA', fieldsHTML, async () => {
    const existingId = document.getElementById('afr-id').value;
    const payload = {
      nome:   document.getElementById('afr-nome').value.trim().toUpperCase(),
      cidade: document.getElementById('afr-cidade').value.trim() || null,
      ativo:  document.getElementById('afr-ativo').checked,
    };
    const { data: savedFranquia, error } = existingId
      ? await supabaseClient.from('franquias').update(payload).eq('id', existingId).select().single()
      : await supabaseClient.from('franquias').insert([payload]).select().single();

    if (error) { showToast('ERRO: ' + error.message); return; }

    // Nova franquia: copia os preços da Matriz automaticamente como ponto de partida
    if (!existingId && savedFranquia) {
      const { data: matrizFranquia } = await supabaseClient
        .from('franquias').select('id').ilike('nome', '%Matriz%').single();
      if (matrizFranquia) {
        const { data: precosMatriz } = await supabaseClient
          .from('precos_franquia').select('produto_id, price, list_price').eq('franquia_id', matrizFranquia.id);
        if (precosMatriz && precosMatriz.length > 0) {
          const novosPrecos = precosMatriz.map(p => ({
            produto_id:  p.produto_id,
            franquia_id: savedFranquia.id,
            price:       p.price,
            list_price:  p.list_price,
          }));
          await supabaseClient.from('precos_franquia').upsert(novosPrecos, { onConflict: 'produto_id,franquia_id' });
        }
      }
    }

    closeAdminModal();
    showToast(existingId ? 'FRANQUIA ATUALIZADA' : 'FRANQUIA CRIADA — preços copiados da Matriz');
    const c = document.getElementById('admin-section-content');
    if (c) renderAdminFranquias(c);
  });

  if (id) {
    supabaseClient.from('franquias').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return;
      document.getElementById('afr-nome').value    = data.nome || '';
      document.getElementById('afr-cidade').value  = data.cidade || '';
      document.getElementById('afr-ativo').checked = data.ativo !== false;
    });
  }
}

async function renderAdminPrecosFranquia(franquiaId, franquiaNome) {
  const container = document.getElementById('admin-section-content');
  if (!container) return;

  container.innerHTML = `<div class="flex items-center justify-center py-12 text-neutral-600">
    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mr-2"></i><span class="font-bold uppercase text-[10px] tracking-widest">Carregando preços...</span>
  </div>`;
  lucide.createIcons();

  const [{ data: produtos = [] }, { data: precos = [] }] = await Promise.all([
    supabaseClient.from('produtos').select('id, name, brand, power').order('power', { ascending: true }),
    supabaseClient.from('precos_franquia').select('produto_id, price, list_price').eq('franquia_id', franquiaId),
  ]);

  const precosMap = {};
  precos.forEach(p => { precosMap[p.produto_id] = p; });

  const rows = produtos.map((p, i) => {
    const preco   = precosMap[p.id] || { price: 0, list_price: 0 };
    const stagger = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6'][Math.min(i, 5)];
    return `
      <div class="metric-card ${stagger} flex flex-col sm:flex-row items-start sm:items-center gap-3 border border-neutral-800 p-4 hover:border-purple-500/25 transition-all">
        <div class="flex-1 min-w-0">
          <p class="text-white font-black text-sm uppercase truncate">${escapeHTML(p.name)}</p>
          <p class="text-neutral-500 text-[10px] font-bold">${escapeHTML(p.brand || '—')} · ${p.power} kWp</p>
        </div>
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <div class="flex flex-col items-start">
            <span class="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">PREÇO PROMO</span>
            <input type="number" step="0.01" id="price-${p.id}" value="${preco.price}"
              class="w-32 bg-black border border-neutral-700 focus:border-orange-500 px-3 py-2 text-orange-400 font-mono font-bold text-sm transition-all">
          </div>
          <div class="flex flex-col items-start">
            <span class="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">PREÇO LISTA</span>
            <input type="number" step="0.01" id="listprice-${p.id}" value="${preco.list_price}"
              class="w-32 bg-black border border-neutral-700 focus:border-neutral-500 px-3 py-2 text-neutral-400 font-mono font-bold text-sm transition-all">
          </div>
          <button onclick="savePrecoFranquia('${p.id}', '${franquiaId}', '${p.id}')"
            id="save-btn-${p.id}"
            class="mt-5 sm:mt-0 flex items-center gap-1.5 px-3 py-2 bg-green-900/20 border border-green-800/40 text-green-500 hover:bg-green-600 hover:text-white hover:border-green-600 font-black uppercase text-[8px] tracking-widest transition-all">
            <i data-lucide="check" class="w-3.5 h-3.5"></i> SALVAR
          </button>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="flex items-center gap-3 mb-5">
      <button onclick="renderAdminFranquias(document.getElementById('admin-section-content'))"
        class="flex items-center gap-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white px-3 py-2 font-black uppercase text-[9px] tracking-widest transition-all">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> VOLTAR
      </button>
      <div>
        <p class="text-purple-400 text-[9px] font-black uppercase tracking-widest">EDITANDO PREÇOS</p>
        <p class="text-white font-black text-base uppercase leading-tight">${escapeHTML(franquiaNome)}</p>
      </div>
    </div>
    <div class="bg-amber-950/20 border border-amber-700/30 p-3 flex items-start gap-2 mb-4">
      <i data-lucide="info" class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5"></i>
      <p class="text-amber-300/80 text-[10px] font-bold">Altere os valores e clique SALVAR em cada linha. O vendedor dessa franquia verá os novos preços imediatamente.</p>
    </div>
    <div class="flex flex-col gap-2">${rows}</div>`;
  lucide.createIcons();
}

async function savePrecoFranquia(produtoId, franquiaId, btnKey) {
  const price     = parseFloat(document.getElementById(`price-${produtoId}`).value) || 0;
  const listPrice = parseFloat(document.getElementById(`listprice-${produtoId}`).value) || 0;
  const btn       = document.getElementById(`save-btn-${btnKey}`);

  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>';
    btn.disabled  = true;
    lucide.createIcons();
  }

  const { error } = await supabaseClient
    .from('precos_franquia')
    .upsert(
      { produto_id: produtoId, franquia_id: franquiaId, price, list_price: listPrice },
      { onConflict: 'produto_id,franquia_id' }
    );

  if (btn) btn.disabled = false;

  if (error) {
    showToast('ERRO: ' + error.message);
    if (btn) { btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> SALVAR'; lucide.createIcons(); }
    return;
  }

  if (btn) {
    btn.innerHTML = '<i data-lucide="check-check" class="w-3.5 h-3.5"></i> SALVO';
    btn.className = 'mt-5 sm:mt-0 flex items-center gap-1.5 px-3 py-2 bg-green-600 border border-green-500 text-white font-black uppercase text-[8px] tracking-widest transition-all';
    lucide.createIcons();
    setTimeout(() => {
      if (btn) {
        btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i> SALVAR';
        btn.className = 'mt-5 sm:mt-0 flex items-center gap-1.5 px-3 py-2 bg-green-900/20 border border-green-800/40 text-green-500 hover:bg-green-600 hover:text-white hover:border-green-600 font-black uppercase text-[8px] tracking-widest transition-all';
        lucide.createIcons();
      }
    }, 2000);
  }
}

// ─── Custos Extras ────────────────────────────────────────────
function openAdminCustoForm(id) {
  const fieldsHTML = `
    <input type="hidden" id="ace-id" value="${id || ''}">
    <div class="grid grid-cols-2 gap-4">
      <div class="col-span-2"><label class="${_labelCls}">Nome *</label>
        <input required id="ace-nome" class="${_inputCls} uppercase" placeholder="EX: TAXA DE INSTALAÇÃO"></div>
      <div><label class="${_labelCls}">Tipo de Cálculo *</label>
        <select required id="ace-tipo" class="${_selectCls}">
          <option value="fixo">FIXO (R$)</option>
          <option value="percentual">PERCENTUAL (%)</option>
        </select></div>
      <div><label class="${_labelCls}">Valor *</label>
        <input required type="number" step="0.01" id="ace-valor" class="${_inputCls} font-mono" placeholder="0.00"></div>
      <div><label class="${_labelCls}">Ordem</label>
        <input type="number" id="ace-ordem" class="${_inputCls} font-mono" value="0"></div>
      <div><label class="${_labelCls}">Descrição</label>
        <input id="ace-descricao" class="${_inputCls}" placeholder="Opcional"></div>
      <label class="col-span-2 flex items-center gap-3 cursor-pointer">
        <input type="checkbox" id="ace-ativo" checked class="w-4 h-4 accent-red-500">
        <span class="text-white font-bold text-sm uppercase">Ativo</span>
      </label>
    </div>`;

  openAdminModal(id ? 'EDITAR CUSTO EXTRA' : 'NOVO CUSTO EXTRA', fieldsHTML, async () => {
    const existingId = document.getElementById('ace-id').value;
    const payload = {
      nome:         document.getElementById('ace-nome').value.trim().toUpperCase(),
      tipo_calculo: document.getElementById('ace-tipo').value,
      valor:        parseFloat(document.getElementById('ace-valor').value) || 0,
      ordem:        parseInt(document.getElementById('ace-ordem').value) || 0,
      descricao:    document.getElementById('ace-descricao').value.trim() || null,
      ativo:        document.getElementById('ace-ativo').checked,
    };
    const { error } = existingId
      ? await supabaseClient.from('custos_extras').update(payload).eq('id', existingId)
      : await supabaseClient.from('custos_extras').insert([payload]);
    if (error) { showToast('ERRO: ' + error.message); return; }
    closeAdminModal();
    showToast('CUSTO SALVO COM SUCESSO');
    const c = document.getElementById('admin-section-content');
    if (c) renderAdminCustos(c);
  });

  if (id) {
    supabaseClient.from('custos_extras').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return;
      document.getElementById('ace-nome').value     = data.nome || '';
      document.getElementById('ace-tipo').value     = data.tipo_calculo || 'fixo';
      document.getElementById('ace-valor').value    = data.valor || '';
      document.getElementById('ace-ordem').value    = data.ordem ?? 0;
      document.getElementById('ace-descricao').value = data.descricao || '';
      document.getElementById('ace-ativo').checked  = data.ativo !== false;
    });
  }
}
