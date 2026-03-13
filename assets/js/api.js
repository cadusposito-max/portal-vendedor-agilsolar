// ==========================================
// BUSCA DE DADOS (Supabase)
// ==========================================

async function fetchProducts() {
  if (!state.currentUser) return;

  // Admin: carrega produtos com preços da Matriz (referência)
  // Vendedor: carrega produtos com preço da própria franquia via JOIN
  if (state.isAdmin) {
    if (state.adminKitsFranquia) {
      // Admin com franquia selecionada: carrega preços daquela franquia
      const { data, error } = await supabaseClient
        .from('produtos')
        .select(`
          id, categoria, name, brand, power, type, description, tag, created_at,
          precos_franquia(price, list_price)
        `)
        .eq('precos_franquia.franquia_id', state.adminKitsFranquia)
        .order('power', { ascending: true });
      if (!error) {
        state.data = (data || []).map(p => ({
          ...p,
          price:      p.precos_franquia?.[0]?.price      ?? 0,
          list_price: p.precos_franquia?.[0]?.list_price ?? 0,
        }));
      }
    } else {
      const { data, error } = await supabaseClient
        .from('produtos')
        .select('*')
        .order('power', { ascending: true });
      if (!error) state.data = data || [];
    }
  } else {
    // JOIN com precos_franquia para retornar o preço correto da franquia do vendedor
    const { data, error } = await supabaseClient
      .from('produtos')
      .select(`
        id, categoria, name, brand, power, type, description, tag, created_at,
        precos_franquia!inner(price, list_price)
      `)
      .eq('precos_franquia.franquia_id', state.franquiaId)
      .order('power', { ascending: true });

    if (!error) {
      // Achata o resultado: substitui price/list_price pelo valor da franquia
      state.data = (data || []).map(p => ({
        ...p,
        price:      p.precos_franquia[0]?.price      ?? p.price,
        list_price: p.precos_franquia[0]?.list_price ?? p.list_price,
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
