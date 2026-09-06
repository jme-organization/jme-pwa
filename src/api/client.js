// src/api/client.js — cliente HTTP centralizado com auth e timeout

const API = import.meta.env.VITE_API_URL || '';
const TIMEOUT_MS = 10000;
const CHAVE_TOKEN = 'jme_token';

// O token fica no localStorage e vai no Authorization. Antes daqui saia um
// header x-api-key com a VITE_ADMIN_API_KEY, e como Vite injeta a variavel no
// bundle, qualquer pessoa que abrisse o painel lia a chave de admin no
// JavaScript — sem login nenhum, direto no devtools. O token do login vale 7
// dias, e por sessao de navegador, e o backend pode invalidar trocando o
// JWT_SECRET.
export function getToken() {
    try { return localStorage.getItem(CHAVE_TOKEN); } catch (_) { return null; }
}

export function setToken(token) {
    try {
        if (token) localStorage.setItem(CHAVE_TOKEN, token);
        else localStorage.removeItem(CHAVE_TOKEN);
    } catch (_) {}
}

// Quem escuta isto e o AuthContext: token expirado ou revogado derruba pra tela
// de login em vez de deixar a pagina cheia de erro sem explicacao.
function avisarSessaoExpirada() {
    try { window.dispatchEvent(new CustomEvent('jme:sessao-expirada')); } catch (_) {}
}

function headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
}

// O timeout precisa do signal DENTRO do fetch. Antes daqui o AbortController
// era criado e jogado fora: `withTimeout` recebia a promise ja disparada, o
// abort nao chegava em ninguem e uma rota lenta ficava girando pra sempre.
// Por isso `fazer` e uma funcao que recebe o signal, e nao uma promise pronta.
function comTimeout(fazer, ms = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fazer(controller.signal)
        .catch((e) => {
            if (e?.name === 'AbortError') throw new Error('O servidor demorou demais para responder.');
            throw e;
        })
        .finally(() => clearTimeout(timer));
}

async function check(resp) {
    if (resp.status === 401) {
        setToken(null);
        avisarSessaoExpirada();
        throw new Error('Sessão expirada. Entre de novo.');
    }
    if (!resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
            const body = await resp.json();
            throw new Error(body.erro || body.error || 'Erro na requisição');
        }
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return resp.json();
}

const comCorpo = (metodo) => (url, body, ms) => comTimeout(
    (signal) => fetch(API + url, { method: metodo, headers: headers(), body: JSON.stringify(body ?? {}), signal }).then(check),
    ms,
);

export const api = {
    get:    (url, ms)       => comTimeout((signal) => fetch(API + url, { headers: headers(), signal }).then(check), ms),
    post:   comCorpo('POST'),
    put:    comCorpo('PUT'),
    delete: (url, ms)       => comTimeout((signal) => fetch(API + url, { method: 'DELETE', headers: headers(), signal }).then(check), ms),
    API,
};

// Login nao passa pelo check() porque 401 aqui e senha errada, nao sessao
// expirada — mandar o usuario pra tela de login que ele ja esta olhando seria
// engolir o erro.
export async function login(senha) {
    const resp = await fetch(API + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
    });
    let corpo = {};
    try { corpo = await resp.json(); } catch (_) {}
    if (!resp.ok) throw new Error(corpo.erro || 'Não foi possível entrar');
    setToken(corpo.token);
    return corpo.token;
}

export async function verificarSessao() {
    if (!getToken()) return false;
    try {
        const resp = await fetch(API + '/api/auth/verificar', { headers: headers() });
        if (resp.ok) return true;
        if (resp.status === 401) setToken(null);
        return false;
    } catch (_) {
        // Backend fora do ar nao e sessao invalida: mantem o token e deixa o
        // app abrir, que as telas ja sabem mostrar erro de rede.
        return true;
    }
}
