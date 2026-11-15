// Shared helpers for the Tuukawo public pages. TUUKAWO_CONFIG comes from config.js (public anon key; data is protected by RLS).
const CFG = window.TUUKAWO_CONFIG;

async function api(path, options = {}) {
  const res = await fetch(`${CFG.url}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: CFG.anonKey, Authorization: `Bearer ${CFG.anonKey}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.message) || 'Something went wrong. Please try again.');
  return data;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Simple markdown used by legal documents: "## heading", "- bullet", paragraphs. */
function renderLegal(body) {
  let html = '';
  let inList = false;
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('- ')) {
      if (!inList) html += '<ul>';
      inList = true;
      html += `<li>${escapeHtml(line.slice(2))}</li>`;
      continue;
    }
    if (inList) html += '</ul>';
    inList = false;
    html += line.startsWith('## ') ? `<h2>${escapeHtml(line.slice(3))}</h2>` : `<p>${escapeHtml(line)}</p>`;
  }
  return html + (inList ? '</ul>' : '');
}

async function loadLegal(type) {
  const el = document.getElementById('doc');
  try {
    const rows = await api(`current_legal_documents?doc_type=eq.${type}&select=title,body,version,published_at`);
    const d = rows[0];
    document.title = `${d.title} | Tuukawo`;
    document.getElementById('title').textContent = d.title;
    document.getElementById('meta').textContent = `Version ${d.version}, published ${new Date(d.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    el.innerHTML = renderLegal(d.body);
  } catch (e) {
    el.innerHTML = `<p class="note err">${escapeHtml(e.message)}</p>`;
  }
}
