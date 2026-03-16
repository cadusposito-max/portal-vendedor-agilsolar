// ==========================================
// COMUNICADOS: FONTE DE DADOS + SERVICE
// ==========================================

/**
 * @typedef {'comunicado'|'novidade'|'parceria'|'aviso'} ComunicadoType
 */

/**
 * @typedef {Object} Comunicado
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} summary
 * @property {string} content
 * @property {string} coverImageUrl
 * @property {string} createdAt
 * @property {string} publishedAt
 * @property {boolean} isPublished
 * @property {string} [authorName]
 * @property {ComunicadoType} type
 */

(() => {
  const COMUNICADO_TYPES = Object.freeze(['comunicado', 'novidade', 'parceria', 'aviso']);
  const FALLBACK_COVER_IMAGE = 'assets/img/logo.png';

  /** @type {Comunicado[]} */
  const seedComunicados = [
    {
      id: 'com-2026-03-15-novos-materiais',
      title: 'Novos materiais comerciais disponiveis',
      slug: 'novos-materiais-comerciais',
      summary: 'Atualizamos os arquivos de apoio para pitch, tabela de apoio e roteiro de fechamento.',
      content: 'A equipe comercial publicou novos materiais para acelerar propostas e padronizar argumentos.',
      coverImageUrl: 'assets/img/logo-light.png',
      createdAt: '2026-03-15T09:00:00-03:00',
      publishedAt: '2026-03-15T09:30:00-03:00',
      isPublished: true,
      authorName: 'Equipe Comercial',
      type: 'novidade',
    },
    {
      id: 'com-2026-03-10-prazo-revisao',
      title: 'Prazo de revisao para propostas especiais',
      slug: 'prazo-revisao-propostas-especiais',
      summary: 'Propostas fora do padrao passam a ter revisao comercial em ate 24 horas uteis.',
      content: 'Essa medida organiza a fila de analise e melhora o tempo de retorno para clientes.',
      coverImageUrl: 'assets/img/logo.png',
      createdAt: '2026-03-10T14:00:00-03:00',
      publishedAt: '2026-03-10T14:00:00-03:00',
      isPublished: true,
      authorName: 'Operacoes',
      type: 'comunicado',
    },
    {
      id: 'com-2026-03-04-parceria-capacitacao',
      title: 'Parceria de capacitacao tecnica confirmada',
      slug: 'parceria-capacitacao-tecnica',
      summary: 'Fechamos parceria para trilha de capacitacao de vendas tecnicas em energia solar.',
      content: 'Nos proximos dias publicaremos o cronograma completo das aulas e os criterios de participacao.',
      coverImageUrl: 'assets/img/new-app-icon.png',
      createdAt: '2026-03-04T11:20:00-03:00',
      publishedAt: '2026-03-04T11:30:00-03:00',
      isPublished: true,
      authorName: 'Parcerias',
      type: 'parceria',
    },
    {
      id: 'com-2026-02-27-manutencao-sistema',
      title: 'Aviso de manutencao programada',
      slug: 'aviso-manutencao-programada',
      summary: 'No sabado teremos janela de manutencao de 00h as 03h para melhorias de estabilidade.',
      content: 'Durante a janela, o sistema pode apresentar indisponibilidade parcial em alguns modulos.',
      coverImageUrl: 'assets/img/icon.png',
      createdAt: '2026-02-27T08:00:00-03:00',
      publishedAt: '2026-02-27T08:00:00-03:00',
      isPublished: true,
      authorName: 'Tecnologia',
      type: 'aviso',
    },
  ];

  const parseTimestamp = (value) => {
    const ts = Date.parse(value || '');
    return Number.isFinite(ts) ? ts : 0;
  };

  /**
   * @param {Partial<Comunicado>} input
   * @returns {Comunicado}
   */
  function normalizeComunicado(input = {}) {
    const nowIso = new Date().toISOString();
    const normalizedId = String(input.id || `com-${Date.now()}`);
    const normalizedCreatedAt = String(input.createdAt || nowIso);
    const normalizedPublishedAt = String(input.publishedAt || normalizedCreatedAt);
    const rawType = String(input.type || 'comunicado').toLowerCase();
    const normalizedType = COMUNICADO_TYPES.includes(rawType) ? rawType : 'comunicado';

    return {
      id: normalizedId,
      title: String(input.title || ''),
      slug: String(input.slug || normalizedId),
      summary: String(input.summary || ''),
      content: String(input.content || ''),
      coverImageUrl: String(input.coverImageUrl || FALLBACK_COVER_IMAGE),
      createdAt: normalizedCreatedAt,
      publishedAt: normalizedPublishedAt,
      isPublished: input.isPublished !== false,
      authorName: input.authorName ? String(input.authorName) : '',
      type: normalizedType,
    };
  }

  /**
   * @param {Comunicado[]} items
   * @returns {Comunicado[]}
   */
  function sortByMostRecent(items) {
    return items.slice().sort((a, b) => {
      const bDate = parseTimestamp(b.publishedAt || b.createdAt);
      const aDate = parseTimestamp(a.publishedAt || a.createdAt);
      return bDate - aDate;
    });
  }

  /**
   * @param {Comunicado[]} items
   * @param {number|undefined} limit
   * @returns {Comunicado[]}
   */
  function applyLimit(items, limit) {
    const safeLimit = Number(limit);
    if (!Number.isFinite(safeLimit) || safeLimit <= 0) return items;
    return items.slice(0, Math.floor(safeLimit));
  }

  /** @type {Comunicado[]} */
  let comunicadoStore = seedComunicados.map(normalizeComunicado);

  function listAll(options = {}) {
    const sorted = sortByMostRecent(comunicadoStore);
    return applyLimit(sorted, options.limit).map(item => ({ ...item }));
  }

  function listPublished(options = {}) {
    const published = comunicadoStore.filter(item => item.isPublished);
    const sorted = sortByMostRecent(published);
    return applyLimit(sorted, options.limit).map(item => ({ ...item }));
  }

  function countPublished() {
    return comunicadoStore.reduce((acc, item) => acc + (item.isPublished ? 1 : 0), 0);
  }

  function getBySlug(slug) {
    if (!slug) return null;
    const comunicado = comunicadoStore.find(item => item.slug === slug);
    return comunicado ? { ...comunicado } : null;
  }

  /**
   * Base para futuro CRUD interno sem mudar a API deste service.
   * @param {Partial<Comunicado>} payload
   * @returns {Comunicado}
   */
  function upsert(payload) {
    const normalized = normalizeComunicado(payload);
    const existingIndex = comunicadoStore.findIndex(item => item.id === normalized.id);

    if (existingIndex >= 0) comunicadoStore[existingIndex] = normalized;
    else comunicadoStore.push(normalized);

    return { ...normalized };
  }

  function remove(id) {
    const targetId = String(id || '');
    const originalLength = comunicadoStore.length;
    comunicadoStore = comunicadoStore.filter(item => item.id !== targetId);
    return comunicadoStore.length !== originalLength;
  }

  function createDraft(payload = {}) {
    return normalizeComunicado({
      ...payload,
      id: payload.id || `draft-${Date.now()}`,
      isPublished: false,
    });
  }

  window.comunicadosService = {
    COMUNICADO_TYPES,
    listAll,
    listPublished,
    countPublished,
    getBySlug,
    upsert,
    remove,
    createDraft,
  };
})();
