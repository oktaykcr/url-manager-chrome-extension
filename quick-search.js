// URL Manager – Quick Search Overlay
// Cmd+Shift+U (Mac) / Ctrl+Shift+U (Win/Linux) ile tetiklenir
(function () {
  'use strict';

  if (document.getElementById('um-qs-host')) return;

  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modKey = (e) => isMac ? e.metaKey : e.ctrlKey;

  // ─── Shadow DOM ──────────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'um-qs-host';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; }

    .um-qs {
      position: fixed;
      width: 500px;
      background: #1a1d23;
      border: 1px solid #2e3346;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(102,126,234,0.15);
      z-index: 2147483647;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      animation: um-qs-in 0.13s ease;
    }
    @keyframes um-qs-in {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .um-qs-search-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-bottom: 1px solid #2e3346;
      background: #1e2230;
    }
    .um-qs-search-icon {
      font-size: 16px;
      flex-shrink: 0;
      opacity: 0.6;
    }
    .um-qs-search {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #e2e8f0;
      font-size: 14px;
      font-family: inherit;
    }
    .um-qs-search::placeholder { color: #4a5568; }
    .um-qs-hint {
      font-size: 10px;
      color: #4a5568;
      background: #252836;
      padding: 2px 7px;
      border-radius: 4px;
      font-family: monospace;
      white-space: nowrap;
    }

    .um-qs-list {
      max-height: 320px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #2e3346 transparent;
    }
    .um-qs-list::-webkit-scrollbar { width: 4px; }
    .um-qs-list::-webkit-scrollbar-thumb { background: #2e3346; border-radius: 4px; }

    .um-qs-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      cursor: pointer;
      transition: background 0.1s;
      border-left: 2px solid transparent;
    }
    .um-qs-item:hover { background: #222636; }
    .um-qs-item.active {
      background: #222636;
      border-left-color: #667eea;
    }
    .um-qs-item-info {
      flex: 1;
      min-width: 0;
    }
    .um-qs-item-name {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .um-qs-item-url {
      font-size: 11px;
      color: #4a5568;
      font-family: 'SFMono-Regular', 'Consolas', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .um-qs-item-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
    }
    .um-qs-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 5px;
      font-family: monospace;
      letter-spacing: 0.3px;
    }
    .um-qs-badge-get {
      background: rgba(56,161,105,0.2);
      color: #68d391;
      border: 1px solid rgba(56,161,105,0.3);
    }
    .um-qs-badge-post {
      background: rgba(237,137,54,0.2);
      color: #f6ad55;
      border: 1px solid rgba(237,137,54,0.3);
    }
    .um-qs-cat {
      font-size: 10px;
      background: linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25));
      color: #a78bfa;
      border: 1px solid rgba(102,126,234,0.3);
      padding: 2px 7px;
      border-radius: 5px;
      max-width: 90px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .um-qs-empty {
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: #4a5568;
    }

    .um-qs-footer {
      padding: 7px 14px;
      border-top: 1px solid #2e3346;
      display: flex;
      gap: 14px;
      font-size: 10px;
      color: #4a5568;
      background: #1e2230;
    }
    .um-qs-footer kbd {
      background: #252836;
      border: 1px solid #2e3346;
      border-radius: 3px;
      padding: 1px 5px;
      font-family: monospace;
      color: #718096;
    }

    /* Toast */
    .um-qs-toast {
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      background: #222636;
      border: 1px solid #2e3346;
      color: #e2e8f0;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 8px;
      z-index: 2147483647;
      opacity: 0;
      transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      pointer-events: none;
      white-space: nowrap;
    }
    .um-qs-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;
  shadow.appendChild(style);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg, isError = false) {
    const existing = shadow.querySelector('.um-qs-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.className = 'um-qs-toast';
    t.textContent = msg;
    if (isError) t.style.borderColor = 'rgba(245,101,101,0.4)';
    shadow.appendChild(t);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => t.classList.add('show'));
    });
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 250);
    }, 2500);
  }

  // ─── Quick Search Popup ───────────────────────────────────────────────────────
  function showQuickSearch() {
    // Toggle off if already open
    const existing = shadow.querySelector('.um-qs');
    if (existing) { existing.remove(); return; }

    chrome.storage.local.get(['urls'], (result) => {
      const allUrls = result.urls || [];

      const qs = document.createElement('div');
      qs.className = 'um-qs';

      let activeIdx = 0;
      let term = '';

      function getItems() {
        const s = term.toLowerCase();
        if (!s) return [...allUrls];
        return allUrls.filter((u) =>
          u.name.toLowerCase().includes(s) ||
          u.address.toLowerCase().includes(s) ||
          (u.category || '').toLowerCase().includes(s)
        );
      }

      function render() {
        const items = getItems();
        activeIdx = Math.min(activeIdx, Math.max(items.length - 1, 0));

        qs.innerHTML = `
          <div class="um-qs-search-wrap">
            <span class="um-qs-search-icon">🔗</span>
            <input class="um-qs-search" placeholder="URL ara… (isim, adres veya kategori)" autocomplete="off" spellcheck="false" value="${escHtml(term)}">
            <span class="um-qs-hint">ESC</span>
          </div>
          <div class="um-qs-list">
            ${items.length === 0
              ? `<div class="um-qs-empty">URL bulunamadı</div>`
              : items.map((u, i) => `
                <div class="um-qs-item${i === activeIdx ? ' active' : ''}" data-idx="${i}">
                  <div class="um-qs-item-info">
                    <div class="um-qs-item-name">${escHtml(u.name)}</div>
                    <div class="um-qs-item-url">${escHtml(u.address)}</div>
                  </div>
                  <div class="um-qs-item-meta">
                    <span class="um-qs-badge um-qs-badge-${(u.type || 'GET').toLowerCase()}">${escHtml(u.type || 'GET')}</span>
                    ${u.category && u.category !== 'Other' ? `<span class="um-qs-cat">${escHtml(u.category)}</span>` : ''}
                  </div>
                </div>`).join('')}
          </div>
          <div class="um-qs-footer">
            <span><kbd>↑↓</kbd> gezin</span>
            <span><kbd>↵</kbd> aç</span>
            <span><kbd>ESC</kbd> kapat</span>
          </div>
        `;

        // Ekran ortasına, biraz üst tarafa konumlandır
        const W = 500;
        qs.style.left = Math.max(12, Math.min(window.innerWidth / 2 - W / 2, window.innerWidth - W - 12)) + 'px';
        qs.style.top = Math.max(12, Math.floor(window.innerHeight * 0.2)) + 'px';

        const activeEl = qs.querySelector('.um-qs-item.active');
        activeEl?.scrollIntoView({ block: 'nearest' });

        const input = qs.querySelector('.um-qs-search');
        input.focus();
        input.setSelectionRange(term.length, term.length);
        input.addEventListener('input', (e) => { term = e.target.value; activeIdx = 0; render(); });
        input.addEventListener('keydown', handleKey);

        qs.querySelectorAll('.um-qs-item').forEach((el) => {
          el.addEventListener('mouseenter', () => {
            activeIdx = +el.dataset.idx;
            qs.querySelectorAll('.um-qs-item').forEach((e, i) => e.classList.toggle('active', i === activeIdx));
          });
          el.addEventListener('click', () => doOpen(getItems()[+el.dataset.idx]));
        });
      }

      function handleKey(e) {
        const items = getItems();
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeIdx = (activeIdx + 1) % Math.max(items.length, 1);
          render();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeIdx = (activeIdx - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
          render();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (items[activeIdx]) doOpen(items[activeIdx]);
        } else if (e.key === 'Escape') {
          e.stopPropagation();
          qs.remove();
        }
      }

      function doOpen(u) {
        if (!u) return;
        qs.remove();
        if ((u.type || 'GET') === 'POST') {
          chrome.runtime.sendMessage(
            { action: 'quickSearch_post', url: u.address, body: u.body || {} },
            (response) => {
              if (chrome.runtime.lastError) {
                showToast('Hata: ' + chrome.runtime.lastError.message, true);
                return;
              }
              if (response?.success) {
                showToast(`POST ${u.name} → ${response.status}`);
              } else {
                showToast('POST hatası: ' + (response?.error || 'bilinmiyor'), true);
              }
            }
          );
        } else {
          chrome.runtime.sendMessage({ action: 'quickSearch_openTab', url: u.address });
        }
      }

      // Dışarı tıklandığında kapat
      const outsideHandler = (e) => {
        if (!qs.contains(e.target)) {
          qs.remove();
          document.removeEventListener('click', outsideHandler, true);
        }
      };
      setTimeout(() => document.addEventListener('click', outsideHandler, true), 50);

      shadow.appendChild(qs);
      render();
    });
  }

  // ─── Klavye kısayolu: Cmd+Shift+U / Ctrl+Shift+U ────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (modKey(e) && e.shiftKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      showQuickSearch();
    }
  }, true);
})();
