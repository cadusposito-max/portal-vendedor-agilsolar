// ==========================================
// CONFIGURAÃ‡ÃƒO SUPABASE + ESTADO GLOBAL
// ==========================================

const SUPABASE_URL = 'https://tzwjxgprhorqrmpqudgg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6d2p4Z3ByaG9ycXJtcHF1ZGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjczNTksImV4cCI6MjA4NzcwMzM1OX0.hwfzCb9FGVXX7Uf0pY7zFS6SZHrh0pzWk1gKFVq2DX4';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- CONSTANTES DE NEGÃ“CIO ---
const COMISSAO_POR_VENDA    = 2500;   // R$ por venda fechada (alterar conforme acordo)
const SESSION_TIMEOUT_HOURS = 6;      // Logout automÃ¡tico apÃ³s N horas sem atividade
const MAX_LOGIN_ATTEMPTS    = 3;      // Tentativas antes de bloquear login
const LOGIN_LOCKOUT_SECONDS = 30;     // Segundos de bloqueio apÃ³s exceder tentativas

// --- ESTADO GLOBAL DA APLICAÃ‡ÃƒO ---
let state = {
  data: [],
  clientes: [],
  propostas: [],
  activeTab: 'dashboard',
  searchTerm: '',
  viewMode: 'grid',
  isEditMode: false,
  currentUser: null,

  clienteFilter: 'TODOS',   // Filtro de status na aba clientes
  clienteSort:   'recent',  // OrdenaÃ§Ã£o: 'recent' | 'alpha'

  pbActiveClient: null,
  pbProposalMode: 'PROMOCIONAL', // 'PROMOCIONAL' | 'PERSONALIZADA' (EQUIPAMENTOS legado)
  pbCategory: 'kitsInversor',
  pbSearch: '',
  pbViewMode: 'list',
  pbMainTab: 'kits',        // 'kits' | 'financiamento' | 'historico'
  componentes: [],           // mÃ³dulos e inversores (sem preÃ§o)
  pbEquipDraft: {
    descricao:      '',       // Descricao da proposta personalizada
    valorEquip:     '',       // Valor numerico da proposta (R$)
    potencia:       '',       // Potencia do sistema (kWp)
    paymentNote:    '',
    commercialNote: '',
  },

  vendas: [],               // Vendas fechadas
  vendasPeriod: '',         // PerÃ­odo filtro vendas: '' = mÃªs atual, 'all' = geral, 'YYYY-MM' = mÃªs especÃ­fico
  dashPeriod:   '',         // PerÃ­odo filtro dashboard (mesmas regras)

  isAdmin:      false,      // UsuÃ¡rio com role:admin no app_metadata (detectado via JWT)
  adminSection: 'produtos', // Sub-aba ativa no painel admin
  adminKitsFranquia: null,  // Franquia selecionada na aba KITS do admin (null = nÃ£o iniciado)
  adminViewAll: true,       // Admin: true = ver tudo (consolidado), false = ver sÃ³ prÃ³pria franquia
  gestorViewAll: true,      // Gestor: true = ver toda a unidade, false = ver sÃ³ os prÃ³prios clientes

  // Multi-franquia
  franquiaId:   null,       // UUID da franquia do usuÃ¡rio logado (de app_metadata.franquia_id)
  franquiaNome: '',         // Nome da franquia (carregado no boot)

  comissaoPct:  5,          // % de comissÃ£o do vendedor logado (carregado de vendedores_stats)

  // Perfil do usuário (carregado de profiles no login)
  profile: {
    nome:       '',
    telefone:   '',
    avatar_url: '',
  },

  // Chat interno
  chat: {
    initialized: false,
    hasAccess: false,
    isOpen: false,
    isMobile: false,
    mobileView: 'list', // 'list' | 'thread'
    loadingConversations: false,
    loadingMessages: false,
    conversations: [],
    activeConversationId: null,
    activeConversation: null,
    activeConversationTitle: '',
    messages: [],
    unreadTotal: 0,
    directory: [],
    searchTerm: '',
    directorySearch: '',
    profileCardOpen: false,
  },
};

const TABS = [
  { id: 'dashboard', label: 'DASHBOARD',      icon: 'layout-dashboard' },
  { id: 'clientes',  label: 'MEUS CLIENTES',  icon: 'users' },
  { id: 'vendas',    label: 'VENDAS',         icon: 'trophy' }
];









