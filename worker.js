/* ========================
   File: worker.js
   Place: project root
   Purpose: minimal, robust API for login, barang, upload (imgbb)
   Notes: keep binding name BMT_DB and var IMG_BB_KEY
   ======================== */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, ''); // normalize, remove trailing slash
    const method = request.method.toUpperCase();

    // helper responders
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj, null, 2), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });

    // safe parse json body
    const safeJson = async (req) => {
      try { return await req.json(); } catch { return null; }
    };

    // env checks
    const db = env && env.BMT_DB ? env.BMT_DB : null;
    const IMGBB = env && env.IMG_BB_KEY ? env.IMG_BB_KEY : null;

    // if db missing, still allow upload route to report clear error instead of crash
    // ROUTE: POST /login
    if (path === '/login' && method === 'POST') {
      if (!db) return json({ ok: false, error: 'BMT_DB not bound. Check wrangler.toml and CF bindings' }, 500);
      const body = await safeJson(request);
      if (!body || !body.username || !body.password) return json({ ok: false, error: 'username & password required' }, 400);
      try {
        const row = await db.prepare('SELECT username,name,role,photo_url FROM users WHERE username = ? AND password = ?')
          .bind(body.username, body.password).first();
        if (!row) return json({ ok: false, error: 'invalid credentials' }, 401);
        return json({ ok: true, user: row });
      } catch (err) {
        return json({ ok: false, error: 'DB error', detail: String(err) }, 500);
      }
    }

    // ROUTE: GET /barang
    if (path === '/barang' && method === 'GET') {
      if (!db) return json({ ok: false, error: 'BMT_DB not bound. Check wrangler.toml and CF bindings' }, 500);
      try {
        const res = await db.prepare('SELECT id,nama,harga,harga_modal,stock,kategori,foto,deskripsi FROM barang ORDER BY id DESC').all();
        return json({ ok: true, total: (res && res.results) ? res.results.length : 0, results: res.results || [] });
      } catch (err) {
        return json({ ok: false, error: 'DB error', detail: String(err) }, 500);
      }
    }

    // ROUTE: POST /upload  (multipart/form-data expected; field name: file)
    if (path === '/upload' && method === 'POST') {
      if (!IMGBB) return json({ ok: false, error: 'IMG_BB_KEY not configured in worker env' }, 500);

      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('multipart/form-data')) {
        return json({ ok: false, error: 'Expected multipart/form-data with field "file"' }, 400);
      }

      try {
        const fd = await request.formData();
        const file = fd.get('file');
        if (!file) return json({ ok: false, error: 'No file field named "file" in form-data' }, 400);

        // convert ArrayBuffer -> base64 in chunks to avoid apply() limits
        const ab = await file.arrayBuffer();
        const bytes = new Uint8Array(ab);

        const CHUNK = 0x8000;
        let binary = '';
        for (let i = 0; i < bytes.length; i += CHUNK) {
          const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
          binary += String.fromCharCode.apply(null, slice);
        }
        const base64 = btoa(binary);

        const body = new URLSearchParams();
        body.append('key', IMGBB);
        body.append('image', base64);

        const resp = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });

        const j = await resp.json().catch(e => ({ ok: false, error: 'invalid imgbb response', detail: String(e) }));

        // check common imgbb response pattern
        if (!j || j.status !== 200 || !j.data || !j.data.url) {
          return json({ ok: false, error: 'imgbb upload failed', detail: j }, resp.status || 502);
        }

        return json({ ok: true, url: j.data.url, detail: j });
      } catch (err) {
        return json({ ok: false, error: 'upload error', detail: String(err) }, 500);
      }
    }

    // health root
    if ((path === '' || path === '/') && method === 'GET') {
      return json({ ok: true, message: 'BMT API (minimal) OK' });
    }

    return json({ ok: false, error: 'Route not found', path }, 404);
  }
};
