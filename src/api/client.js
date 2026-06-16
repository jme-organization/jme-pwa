// src/api/client.js — cliente HTTP centralizado com auth e timeout

const API = import.meta.env.VITE_API_URL || '';
const TIMEOUT_MS = 10000;

function headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const key = import.meta.env.VITE_ADMIN_API_KEY;
    if (key) h['x-api-key'] = key;
    return h;
}

function withTimeout(promise, ms = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timer));
}

async function check(resp) {
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
