// ==========================================
// BUSCA DE DADOS (Supabase)
// ==========================================

function enrichProductForUI(produto) {
  const power = Number(produto.power) || 0;
  const categoria = produto.categoria || 'kitsInversor';
  return {
    ...produto,
    power,
    price: Number(produto.price) || 0,
    list_price: Number(produto.list_price) || 0,
    _searchBlob: `${produto.name || ''} ${produto.brand || ''} ${power}`.toLowerCase(),
    _estGeneration: calcularGeracaoEstimada(power, categoria),
  };
}

function resolveBestPositiveValue(values, fallback) {
  const validValues = (Array.isArray(values) ? values : [])
    .map(v => Number(v))
    .filter(v => Number.isFinite(v) && v > 0);

  if (validValues.length > 0) {
    return Math.max(...validValues);
  }

  const fallbackNumber = Number(fallback);
  return Number.isFinite(fallbackNumber) && fallbackNumber > 0 ? fallbackNumber : 0;
}

function resolveProductPrices(produto) {
  const franchiseRows = Array.isArray(produto.precos_franquia) ? produto.precos_franquia : [];
  const price = resolveBestPositiveValue(franchiseRows.map(r => r?.price), produto.price);
  const listPriceRaw = resolveBestPositiveValue(franchiseRows.map(r => r?.list_price), produto.list_price);
  const listPrice = Math.max(listPriceRaw, price);

  return { price, list_price: listPrice };
}

async function fetchProducts() {
  if (!state.currentUser) return;

  // Admin: carrega produtos com preços da Matriz (referência)
  // Vendedor: carrega produtos com preço da própria franquia via JOIN
  if (state.isAdmin) {
    // Para admin, sempre prioriza preços por franquia:
    // 1) franquia selecionada no painel admin; 2) própria franquia do usuário.
    const targetFranquiaId = state.adminKitsFranquia || state.franquiaId || null;

    if (targetFranquiaId) {
      // Admin com franquia alvo: carrega preços daquela franquia
      const { data, error } = await supabaseClient
        .from('produtos')
        .select(`
          id, categoria, name, brand, power, type, description, tag, created_at, price, list_price,
          precos_franquia(price, list_price)
        `)
        .eq('precos_franquia.franquia_id', targetFranquiaId)
        .order('power', { ascending: true });
      if (!error) {
        state.data = (data || []).map(p => enrichProductForUI({
          ...p,
          ...resolveProductPrices(p),
        }));
      }
    } else {
      // Fallback de segurança quando não houver franquia vinculada no JWT.
      const { data, error } = await supabaseClient
        .from('produtos')
        .select('*')
        .order('power', { ascending: true });
      if (!error) state.data = (data || []).map(enrichProductForUI);
    }
  } else {
    // JOIN com precos_franquia para retornar o preço correto da franquia do vendedor
    const { data, error } = await supabaseClient
      .from('produtos')
      .select(`
        id, categoria, name, brand, power, type, description, tag, created_at, price, list_price,
        precos_franquia!inner(price, list_price)
      `)
      .eq('precos_franquia.franquia_id', state.franquiaId)
      .order('power', { ascending: true });

    if (!error) {
      // Achata o resultado: substitui price/list_price pelo valor da franquia
      state.data = (data || []).map(p => enrichProductForUI({
        ...p,
        ...resolveProductPrices(p),
      }));
    }
  }
}

async function fetchClientes() {
  if (!state.currentUser) return;
  const query = supabaseClient
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  // Gestor com gestorViewAll: vê todos da franquia (RLS restringe). Admin com adminViewAll: idem.
  // Gestor sem gestorViewAll ou vendedor: filtra pelo próprio email.
  const fetchAll = (state.isGestor && Boolean(state.gestorViewAll)) || (state.isAdmin && Boolean(state.adminViewAll));
  if (!fetchAll) query.eq('vendedor_email', state.currentUser.email);

  const { data, error } = await query;
  if (!error) state.clientes = data || [];
}

async function fetchPropostas() {
  if (!state.currentUser) return;
  const query = supabaseClient
    .from('propostas')
    .select('*')
    .order('created_at', { ascending: false });

  const fetchAll = (state.isGestor && Boolean(state.gestorViewAll)) || (state.isAdmin && Boolean(state.adminViewAll));
  if (!fetchAll) query.eq('vendedor_email', state.currentUser.email);

  const { data, error } = await query;
  if (!error) state.propostas = data || [];
}

async function fetchVendas() {
  if (!state.currentUser) return;
  const query = supabaseClient
    .from('vendas')
    .select('*')
    .order('created_at', { ascending: false });

  const fetchAll = (state.isGestor && Boolean(state.gestorViewAll)) || (state.isAdmin && Boolean(state.adminViewAll));
  if (!fetchAll) query.eq('vendedor_email', state.currentUser.email);

  const { data, error } = await query;
  if (!error) state.vendas = data || [];
}

async function fetchFranquia() {
  if (!state.franquiaId) return;
  const { data, error } = await supabaseClient
    .from('franquias')
    .select('nome, hsp_medio')
    .eq('id', state.franquiaId)
    .single();
  if (!error && data) {
    state.franquiaNome = data.nome;
    state.franquiaHsp  = data.hsp_medio ?? 5.4;
  }
}

async function fetchComponentes() {
  const { data, error } = await supabaseClient
    .from('v_componentes_public')
    .select('id, tipo, nome, potencia_wp')
    .order('tipo')
    .order('nome');
  if (!error) state.componentes = data || [];
  // Tabela pode não existir ainda — falha silenciosa
}
