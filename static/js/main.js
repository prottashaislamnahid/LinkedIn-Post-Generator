/* ─── State ─────────────────────────────────────────────────────── */
let currentSource   = 'news';
let currentPreset   = 'conversational';
let fetchedContent  = '';
let lastPostContent = '';

/* ─── Helpers ───────────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3200);
}

function setLoading(btnId, spinnerId, loading) {
  const btn = document.getElementById(btnId);
  const sp  = document.getElementById(spinnerId);
  if (!btn || !sp) return;
  if (loading) {
    btn.disabled = true;
    sp.classList.remove('hidden');
  } else {
    btn.disabled = false;
    sp.classList.add('hidden');
  }
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function updateSliderBackground(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background =
    `linear-gradient(to right, var(--accent) ${pct}%, var(--bg-hover) ${pct}%)`;
}

/* Initialise slider backgrounds */
document.querySelectorAll('.range-slider').forEach(s => {
  updateSliderBackground(s);
  s.addEventListener('input', () => updateSliderBackground(s));
});

/* ─── Source toggle ─────────────────────────────────────────────── */
function setSource(source, btn) {
  currentSource = source;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const topicInput = document.getElementById('topic');
  if (source === 'github') {
    topicInput.placeholder = 'e.g. LLM agent framework, RAG, transformer...';
    topicInput.value       = topicInput.value.includes('revolution')
      ? 'LLM agent framework AI'
      : topicInput.value;
  } else {
    topicInput.placeholder = 'e.g. AI agents, GPT-5, machine learning...';
    topicInput.value       = topicInput.value.includes('agent framework')
      ? 'AI revolution artificial intelligence 2025'
      : topicInput.value;
  }
}

/* ─── Preset selector ───────────────────────────────────────────── */
function selectPreset(preset, btn) {
  currentPreset = preset;
  document.querySelectorAll('.preset-card').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/* ─── Fetch News ────────────────────────────────────────────────── */
async function fetchNews() {
  const topic      = document.getElementById('topic').value.trim();
  const numResults = document.getElementById('num-results').value;

  if (!topic) { showToast('Please enter a search topic.', 'error'); return; }

  setLoading('fetch-btn', 'fetch-spinner', true);
  document.getElementById('fetch-btn').querySelector('.btn-text').textContent = 'Searching…';

  const contentArea    = document.getElementById('content-area');
  const contentActions = document.getElementById('content-actions');
  contentArea.innerHTML = buildShimmer();

  try {
    const res  = await fetch('/api/fetch-news', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ topic, num_results: parseInt(numResults), source: currentSource }),
    });
    const data = await res.json();

    if (data.success) {
      fetchedContent = data.content;
      renderContent(contentArea, fetchedContent);
      contentActions.classList.remove('hidden');
      document.getElementById('word-count').textContent =
        `${countWords(fetchedContent)} words`;
      document.getElementById('generate-btn').disabled = false;
      showToast(`✓ Fetched ${currentSource === 'github' ? 'GitHub repos' : 'news'} successfully!`, 'success');
    } else {
      contentArea.innerHTML = `<div class="empty-state" style="color:#ef4444">⚠ Error: ${data.error}</div>`;
      showToast(data.error, 'error');
    }
  } catch (err) {
    contentArea.innerHTML = `<div class="empty-state" style="color:#ef4444">⚠ Network error. Is the server running?</div>`;
    showToast('Network error. Check the server.', 'error');
  } finally {
    setLoading('fetch-btn', 'fetch-spinner', false);
    document.getElementById('fetch-btn').querySelector('.btn-text').textContent = 'Fetch News';
  }
}

/* ─── Generate Post ─────────────────────────────────────────────── */
async function generatePost() {
  if (!fetchedContent.trim()) {
    showToast('Please fetch content first.', 'error');
    return;
  }

  const useCustom = document.getElementById('use-custom').checked;
  const payload   = {
    content:            fetchedContent,
    preset:             currentPreset,
    author_context:     document.getElementById('author-ctx').value,
    post_goal:          document.getElementById('post-goal').value,
    include_hashtags:   document.getElementById('include-hashtags').checked,
    include_cta:        document.getElementById('include-cta').checked,
    max_tokens:         parseInt(document.getElementById('custom-tokens').value),
  };

  if (useCustom) {
    payload.custom_temperature = parseFloat(document.getElementById('custom-temp').value);
    payload.custom_top_p       = parseFloat(document.getElementById('custom-topp').value);
  }

  setLoading('generate-btn', 'gen-spinner', true);
  document.getElementById('generate-btn').querySelector('.btn-text').textContent = 'Generating…';

  const postArea    = document.getElementById('post-area');
  const postActions = document.getElementById('post-actions');
  const configBadge = document.getElementById('config-badge');
  postArea.innerHTML = buildShimmer(5);
  postActions.classList.add('hidden');
  configBadge.classList.add('hidden');

  try {
    const res  = await fetch('/api/generate-post', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.success) {
      lastPostContent = data.post;
      renderPost(postArea, data.post);
      postArea.classList.add('has-content');
      postActions.classList.remove('hidden');

      /* Config badge */
      const cfg = data.config;
      configBadge.innerHTML =
        `<span>Preset: <strong>${cfg.preset}</strong></span>` +
        `<span>Temp: <strong>${cfg.temperature}</strong></span>` +
        `<span>Top-p: <strong>${cfg.top_p}</strong></span>` +
        `<span>Max tokens: <strong>${cfg.max_tokens}</strong></span>`;
      configBadge.classList.remove('hidden');

      showToast('✓ Post generated!', 'success');
    } else {
      postArea.innerHTML = `<div class="empty-state" style="color:#ef4444">⚠ Error: ${data.error}</div>`;
      showToast(data.error, 'error');
    }
  } catch (err) {
    postArea.innerHTML = `<div class="empty-state" style="color:#ef4444">⚠ Network error.</div>`;
    showToast('Network error.', 'error');
  } finally {
    setLoading('generate-btn', 'gen-spinner', false);
    document.getElementById('generate-btn').querySelector('.btn-text').textContent = 'Generate LinkedIn Post';
  }
}

/* ─── Utilities ─────────────────────────────────────────────────── */
function clearContent() {
  fetchedContent = '';
  document.getElementById('content-area').innerHTML =
    `<div class="empty-state"><div class="empty-icon">◈</div><p>Fetch news or GitHub repos<br/>to see the raw AI content here.</p></div>`;
  document.getElementById('content-actions').classList.add('hidden');
  document.getElementById('generate-btn').disabled = true;
}

function copyPost() {
  if (!lastPostContent) return;
  navigator.clipboard.writeText(lastPostContent).then(() => {
    const lbl = document.getElementById('copy-label');
    lbl.textContent = '✓ Copied!';
    setTimeout(() => { lbl.textContent = 'Copy Post'; }, 2000);
    showToast('Post copied to clipboard!', 'success');
  });
}

function regenerate() {
  generatePost();
}

function renderContent(el, text) {
  el.innerHTML = `<div style="white-space:pre-wrap;line-height:1.75">${escapeHtml(text)}</div>`;
}

function renderPost(el, text) {
  /* Very light markdown: bold **text** and line breaks */
  let html = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
  el.innerHTML = `<div style="line-height:1.85">${html}</div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildShimmer(lines = 8) {
  let html = '';
  for (let i = 0; i < lines; i++) {
    const w = 60 + Math.random() * 40;
    html += `<div class="loading-shimmer" style="width:${w}%"></div>`;
  }
  return html;
}

/* ─── Keyboard shortcut ─────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (!document.getElementById('generate-btn').disabled) generatePost();
  }
});
