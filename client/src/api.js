import { useCallback, useEffect, useRef, useState } from 'react';
import { getLang, translate, useI18n } from './i18n.jsx';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Every request carries the interface language so the server answers with matching content and errors.
export async function api(path, { method = 'GET', body } = {}) {
  const lang = getLang();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        'X-Gapper': '1',
        'X-Lang': lang,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, translate(lang, 'api.offline'));
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(res.status, data?.error || translate(lang, 'api.failed'));
  return data;
}

// Loads `path` and reloads whenever it or the language changes. Pass null to skip loading.
export function useApi(path) {
  const { lang } = useI18n();
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const latest = useRef(null);
  const key = path ? `${lang}:${path}` : null;

  const load = useCallback(async (quiet = false) => {
    if (!key) return;
    latest.current = key;
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api(path);
      if (latest.current === key) setState({ data, error: null, loading: false });
    } catch (error) {
      if (latest.current === key) setState((s) => ({ ...s, error, loading: false }));
    }
  }, [key, path]);

  useEffect(() => { load(); }, [load]);

  const setData = useCallback((update) => {
    setState((s) => ({ ...s, data: typeof update === 'function' ? update(s.data) : update }));
  }, []);

  return { ...state, reload: load, setData };
}
