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

function withTimeout(promise, ms = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timer));
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

export const api = {
    get:    (url, ms)       => withTimeout(fetch(API + url, { headers: headers() }).then(check), ms),
    post:   (url, body, ms) => withTimeout(fetch(API + url, { method: 'POST',   headers: headers(), body: JSON.stringify(body ?? {}) }).then(check), ms),
    put:    (url, body, ms) => withTimeout(fetch(API + url, { method: 'PUT',    headers: headers(), body: JSON.stringify(body ?? {}) }).then(check), ms),
    delete: (url, ms)       => withTimeout(fetch(API + url, { method: 'DELETE', headers: headers() }).then(check), ms),
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
