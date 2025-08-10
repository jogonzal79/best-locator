// src/injected-scripts/toggle-mode.js - Versión Ultimate Production-Ready (final)
// AJUSTE: finalSave() ya no borra el storage inmediatamente; se pospone 60s.

(() => {
  if (window.bestLocatorToggleInitialized) return;
  window.bestLocatorToggleInitialized = true;

  console.log('🎯 Best-Locator Toggle Mode [v-ultimate+] Activated');

  // ============================================================================
  // POLYFILLS & UTILITIES
  // ============================================================================
  // CSS.escape polyfill (W3C)
  if (!window.CSS || !CSS.escape) {
    const cssEscape = (value) => {
      const string = String(value);
      const length = string.length;
      let index = -1;
      let codeUnit;
      let result = '';
      const firstCodeUnit = string.charCodeAt(0);

      while (++index < length) {
        codeUnit = string.charCodeAt(index);

        // Null character
        if (codeUnit === 0x0000) {
          result += '\uFFFD';
          continue;
        }

        // Control chars / leading digits
        if (
          (codeUnit >= 0x0001 && codeUnit <= 0x001F) ||
          codeUnit === 0x007F ||
          (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
          (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002D)
        ) {
          result += '\\' + codeUnit.toString(16) + ' ';
          continue;
        }

        // Single '-'
        if (index === 0 && codeUnit === 0x002D && length === 1) {
          result += '\\' + string.charAt(index);
          continue;
        }

        // Safe range
        if (
          codeUnit >= 0x0080 ||
          (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
          (codeUnit >= 0x0041 && codeUnit <= 0x005A) ||
          (codeUnit >= 0x0061 && codeUnit <= 0x007A) ||
          codeUnit === 0x005F || // _
          codeUnit === 0x002D    // -
        ) {
          result += string.charAt(index);
          continue;
        }

        // Everything else needs escaping
        result += '\\' + string.charAt(index);
      }
      return result;
    };
    window.CSS = window.CSS || {};
    CSS.escape = cssEscape;
  }

  // IndexedDB helpers (promisify)
  const idbRequest = (req) => new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
  const idbTxDone = (tx) => new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
    tx.onabort    = () => rej(tx.error);
  });

  // ============================================================================
  // PERFORMANCE MONITOR
  // ============================================================================
  class PerformanceMonitor {
    constructor() {
      this.metrics = {
        captures: [],
        navigations: [],
        reinjections: [],
        domSearches: [],
        stateLoads: [],
        stateSaves: []
      };
      this.enabled = !!(window.performance && performance.now);
    }
    measure(category, operation) {
      if (!this.enabled) return operation();
      const start = performance.now();
      const result = operation();
      const duration = performance.now() - start;
      if (this.metrics[category]) this.metrics[category].push(duration);
      if (duration > 16 && category === 'captures') {
        console.warn(`⚠️ Slow operation [${category}]: ${duration.toFixed(2)}ms`);
      }
      if (duration > 100 && category === 'navigations') {
        console.warn(`⚠️ Slow navigation: ${duration.toFixed(2)}ms`);
      }
      return result;
    }
    async measureAsync(category, operation) {
      if (!this.enabled) return operation();
      const start = performance.now();
      const result = await operation();
      const duration = performance.now() - start;
      if (this.metrics[category]) this.metrics[category].push(duration);
      return result;
    }
    getStats() {
      const stats = {};
      Object.keys(this.metrics).forEach(category => {
        const times = this.metrics[category];
        if (times.length === 0) {
          stats[category] = { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, slow: 0 };
          return;
        }
        const sorted = [...times].sort((a, b) => a - b);
        const sum = times.reduce((a, b) => a + b, 0);
        stats[category] = {
          count: times.length,
          avg: sum / times.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          slow: times.filter(t => t > 16).length
        };
      });
      return stats;
    }
    reset() { Object.keys(this.metrics).forEach(k => { this.metrics[k] = []; }); }
  }

  // ============================================================================
  // STATE MANAGER (robust)
  // ============================================================================
  class StateManager {
    constructor(onStateUpdate) {
      this.onStateUpdate = onStateUpdate;
      this.storageKey = 'bestLocatorToggleState';
      this.backupKey = this.storageKey + '_backup';
      this.saveTimeout = null;
      this.performanceMonitor = new PerformanceMonitor();

      this.state = new Proxy(
        {
          captureMode: false,
          selectedElements: [],
          sessionActive: true,
          sessionId: this.generateSessionId(),
          timestamp: Date.now(),
          url: window.location.href,
          metadata: {
            startTime: Date.now(),
            lastActivity: Date.now(),
            navigationCount: 0
          }
        },
        {
          set: (target, prop, value) => {
            target[prop] = value;
            target.metadata.lastActivity = Date.now();
            this.performanceMonitor.measure('stateSaves', () => { this.debouncedSave(); });
            this.onStateUpdate(target);
            if (prop === 'sessionActive' && !value) {
              this.finalSave();
              try { notifyHostFinish('session-inactive'); } catch {}
              cleanup();
            }
            return true;
          }
        }
      );

      this.loadFromStorage();
    }
    generateSessionId() {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 9);
      const fingerprint = this.getBrowserFingerprint();
      return `bl_${timestamp}_${random}_${fingerprint}`;
    }
    getBrowserFingerprint() {
      const nav = window.navigator;
      const screen = window.screen;
      const data = [
        nav.userAgent,
        nav.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
      ].join('|');
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return Math.abs(hash).toString(36).substr(0, 6);
    }
    validateState(state) {
      try {
        if (!state || typeof state !== 'object') return false;
        if (typeof state.captureMode !== 'boolean') return false;
        if (!Array.isArray(state.selectedElements)) return false;
        if (typeof state.sessionActive !== 'boolean') return false;
        const validElements = state.selectedElements.every(el =>
          el && typeof el.tagName === 'string' && typeof el.order === 'number' && el.order > 0 &&
          (typeof el.cssPath === 'string' || typeof el.xPath === 'string')
        );
        if (!validElements) return false;
        if (state.timestamp && Date.now() - state.timestamp > 7200000) return false; // 2h
        return true;
      } catch {
        return false;
      }
    }
    loadFromStorage() {
      window.bestLocatorPerfMonitor?.measure('stateLoads', () => {
        try {
          let saved = sessionStorage.getItem(this.storageKey);
          let source = 'sessionStorage';

          if (!saved) {
            const backup = localStorage.getItem(this.backupKey);
            if (backup) {
              try {
                const parsed = JSON.parse(backup);
                const age = Date.now() - (parsed.timestamp || 0);
                if (age < 3600000) {
                  saved = backup;
                  source = 'localStorage backup';
                  sessionStorage.setItem(this.storageKey, backup);
                }
              } catch {}
            }
          }
          if (!saved) { this.loadFromIndexedDB(); return; }

          const parsed = JSON.parse(saved);
          if (this.validateState(parsed)) {
            this.state.captureMode = !!parsed.captureMode;
            this.state.selectedElements = parsed.selectedElements || [];
            this.state.metadata = parsed.metadata || this.state.metadata;
            console.log(`📦 State restored from ${source} (${this.state.selectedElements.length} elements)`);
          } else {
            console.log('⚠️ Invalid state, starting fresh session');
          }
        } catch (error) {
          console.warn('State load error:', error);
          this.handleCorruptedState(error);
        }
      });
    }
    async openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('BestLocatorDB', 2);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('sessions')) {
            const store = db.createObjectStore('sessions', { keyPath: 'sessionId' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    }
    async loadFromIndexedDB() {
      try {
        const db = await this.openDB();
        const tx = db.transaction(['sessions'], 'readonly');
        const st = tx.objectStore('sessions');
        const all = await idbRequest(st.getAll());
        await idbTxDone(tx);

        const recent = all
          .filter(s => Date.now() - s.timestamp < 3600000)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (recent && this.validateState(recent.state)) {
          this.state.selectedElements = recent.state.selectedElements;
          console.log('📦 Session recovered from IndexedDB');
        }
      } catch (error) {
        console.debug('IndexedDB not available:', error);
      }
    }
    saveToStorage() {
      try {
        const stateToSave = {
          captureMode: this.state.captureMode,
          selectedElements: this.state.selectedElements,
          sessionActive: this.state.sessionActive,
          sessionId: this.state.sessionId,
          timestamp: Date.now(),
          url: window.location.href,
          metadata: this.state.metadata
        };
        const serialized = JSON.stringify(stateToSave);
        sessionStorage.setItem(this.storageKey, serialized);
        localStorage.setItem(this.backupKey, serialized);
        this.saveToIndexedDB(stateToSave).catch(e => console.debug('IDB save error:', e));
      } catch (error) {
        console.warn('State save error:', error);
        this.handleStorageQuotaExceeded(error);
      }
    }
    async saveToIndexedDB(state) {
      try {
        const db = await this.openDB();
        const tx = db.transaction(['sessions'], 'readwrite');
        const st = tx.objectStore('sessions');

        await idbRequest(st.put({
          sessionId: state.sessionId,
          state,
          timestamp: Date.now(),
          url: window.location.href
        }));

        const all = await idbRequest(st.getAll());
        const now = Date.now();
        for (const s of all) {
          if (now - s.timestamp > 86400000) st.delete(s.sessionId); // >24h
        }
        await idbTxDone(tx);
      } catch (error) {
        console.debug('IndexedDB error:', error);
      }
    }
    debouncedSave() {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => this.saveToStorage(), 250);
    }
    // 🔧 AJUSTE AQUÍ
    finalSave() {
      clearTimeout(this.saveTimeout);
      this.saveToStorage();

      // Antes se borraba el storage a los 100ms, lo que impedía
      // que el host/CLI leyera los elementos al finalizar.
      // Ahora lo dejamos disponible y (opcional) lo limpiamos luego.
      setTimeout(() => {
        try {
          sessionStorage.removeItem(this.storageKey);
          localStorage.removeItem(this.backupKey);
        } catch {}
      }, 60_000); // 60s; puedes aumentar o quitar si prefieres no limpiar aquí
    }
    handleCorruptedState() {
      sessionStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.backupKey);
    }
    handleStorageQuotaExceeded(error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded, trimming...');
        if (this.state.selectedElements.length > 50) {
          this.state.selectedElements = this.state.selectedElements.slice(-50);
          this.saveToStorage();
        }
      }
    }
    addElement(elementInfo) {
      const MAX_ELEMENTS = 500;
      if (this.state.selectedElements.length >= MAX_ELEMENTS) {
        console.warn(`⚠️ Limit of ${MAX_ELEMENTS} elements reached`);
        return false;
      }
      this.state.selectedElements = [...this.state.selectedElements, elementInfo];
      return true;
    }
    getStats() {
      return {
        sessionId: this.state.sessionId,
        elementsCaptured: this.state.selectedElements.length,
        sessionDuration: Date.now() - this.state.metadata.startTime,
        navigationCount: this.state.metadata.navigationCount,
        performance: this.performanceMonitor.getStats()
      };
    }
  }

  // ============================================================================
  // NAVIGATION DETECTOR
  // ============================================================================
  class NavigationDetector {
    constructor(callback) {
      this.callback = callback;
      this.lastUrl = window.location.href;
      this.lastPathname = window.location.pathname;
      this.lastHash = window.location.hash;
      this.timeoutId = null;
      this.mutationObserver = null;
      this.originalPushState = history.pushState;
      this.originalReplaceState = history.replaceState;
      this.boundCheckNavigation = () => this.checkNavigation('event');
      this.setupDetection();
    }
    setupDetection() {
      history.pushState = (...args) => {
        this.originalPushState.apply(history, args);
        this.checkNavigation('pushState');
      };
      history.replaceState = (...args) => {
        this.originalReplaceState.apply(history, args);
        this.checkNavigation('replaceState');
      };
      window.addEventListener('popstate', this.boundCheckNavigation);
      window.addEventListener('hashchange', this.boundCheckNavigation);

      this.mutationObserver = new MutationObserver((mutations) => {
        const significantChange = mutations.some(mutation => {
          if (mutation.type === 'childList') {
            if (mutation.target === document.body && mutation.addedNodes.length > 10) return true;
            const t = mutation.target;
            if (t.id === 'root' || t.id === 'app' || t.classList?.contains('app') || t.classList?.contains('main')) {
              return mutation.addedNodes.length > 5;
            }
          }
          return false;
        });
        if (significantChange) this.checkNavigation('dom-mutation');
      });
      if (document.body) {
        this.mutationObserver.observe(document.body, { childList: true, subtree: true });
      }
      this.pollInterval = setInterval(() => {
        const currentUrl = window.location.href;
        const currentPathname = window.location.pathname;
        const currentHash = window.location.hash;
        if (currentUrl !== this.lastUrl || currentPathname !== this.lastPathname || currentHash !== this.lastHash) {
          this.checkNavigation('polling');
        }
      }, 1000);
    }
    checkNavigation(source) {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        const currentUrl = window.location.href;
        const currentPathname = window.location.pathname;
        const currentHash = window.location.hash;
        if (currentUrl !== this.lastUrl || currentPathname !== this.lastPathname || currentHash !== this.lastHash) {
          console.log(`🔄 Navigation detected [${source}]: ${currentUrl}`);
          this.lastUrl = currentUrl;
          this.lastPathname = currentPathname;
          this.lastHash = currentHash;
          if (window.bestLocatorState?.metadata) {
            window.bestLocatorState.metadata.navigationCount++;
          }
          this.callback();
        }
      }, 300);
    }
    disconnect() {
      clearTimeout(this.timeoutId);
      clearInterval(this.pollInterval);
      history.pushState = this.originalPushState;
      history.replaceState = this.originalReplaceState;
      window.removeEventListener('popstate', this.boundCheckNavigation);
      window.removeEventListener('hashchange', this.boundCheckNavigation);
      if (this.mutationObserver) this.mutationObserver.disconnect();
    }
  }

  // ============================================================================
  // OVERLAY MANAGER
  // ============================================================================
  class OverlayManager {
    constructor() {
      this.highestZIndex = 2147483640;
      this.portalRoot = null;
      this.highlightOverlay = null;
      this.controlPanel = null;
      this.observer = null;
      this.updateInterval = null;
    }
    scanHighestZIndex() {
      let highest = 2147483640;
      const elements = document.querySelectorAll('*');
      const len = elements.length;
      for (let i = 0; i < len; i++) {
        const el = elements[i];
        const style = window.getComputedStyle(el, null);
        const zIndex = style.getPropertyValue('z-index');
        if (zIndex !== 'auto') {
          const z = parseInt(zIndex, 10);
          if (!isNaN(z) && z > highest) highest = z;
        }
      }
      return Math.min(highest, 2147483640);
    }
    createPortalRoot() {
      const portal = document.createElement('div');
      portal.id = 'best-locator-portal';
      portal.setAttribute('data-best-locator', 'portal');
      portal.style.cssText = [
        'position: fixed','top: 0','left: 0','width: 0','height: 0',
        `z-index: ${this.highestZIndex + 100}`,'pointer-events: none'
      ].join('; ');
      document.body.appendChild(portal);
      return portal;
    }
    createOverlay(type, pointerEvents) {
      const overlay = document.createElement('div');
      overlay.id = `bl-overlay-${type}`;
      overlay.setAttribute('data-best-locator', type);
      const baseStyles = [
        'position: fixed',
        `z-index: ${this.highestZIndex + (type === 'highlight' ? 101 : 102)}`,
        `pointer-events: ${pointerEvents}`,
        'transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'will-change: transform, width, height',
        'transform: translateZ(0)',
        'backface-visibility: hidden',
        'box-sizing: border-box'
      ];
      overlay.style.cssText = baseStyles.join('; ');
      this.portalRoot.appendChild(overlay);
      return overlay;
    }
    updateOverlayZIndexes() {
      const base = this.highestZIndex;
      if (this.portalRoot) this.portalRoot.style.zIndex = `${base + 100}`;
      if (this.highlightOverlay) this.highlightOverlay.style.zIndex = `${base + 101}`;
      if (this.controlPanel) this.controlPanel.style.zIndex = `${base + 102}`;
    }
    monitorZIndexChanges() {
      this.observer = new MutationObserver(() => { this.throttledUpdate(); });
      this.observer.observe(document.body, { attributes: true, attributeFilter: ['style','class'], subtree: true });
      this.updateInterval = setInterval(() => { this.throttledUpdate(); }, 5000);
    }
    throttledUpdate = (() => {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const candidate = this.scanHighestZIndex();
          if (candidate > this.highestZIndex) {
            console.log(`📊 Z-index updated: ${this.highestZIndex} → ${candidate}`);
            this.highestZIndex = candidate;
            this.updateOverlayZIndexes();
          }
        }, 100);
      };
    })();
    initialize() {
      this.highestZIndex = this.scanHighestZIndex();
      this.portalRoot = this.createPortalRoot();
      this.highlightOverlay = this.createOverlay('highlight', 'none');
      this.controlPanel = this.createOverlay('control', 'all');
      this.monitorZIndexChanges();
      Object.assign(this.highlightOverlay.style, {
        display: 'none',
        border: '2px solid red',
        borderRadius: '2px',
        backgroundColor: 'rgba(255, 0, 0, 0.05)'
      });
      Object.assign(this.controlPanel.style, {
        right: '20px',
        top: '20px',
        background: 'linear-gradient(135deg, rgba(30, 60, 114, 0.95) 0%, rgba(20, 40, 80, 0.95) 100%)',
        color: '#fff',
        padding: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '12px',
        borderRadius: '8px',
        userSelect: 'none',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.1) inset',
        border: '2px solid #ff6b6b',
        minWidth: '200px',
        backdropFilter: 'blur(10px)'
      });
      return { highlightOverlay: this.highlightOverlay, controlPanel: this.controlPanel };
    }
    destroy() {
      if (this.observer) this.observer.disconnect();
      if (this.updateInterval) clearInterval(this.updateInterval);
      if (this.portalRoot) this.portalRoot.remove();
    }
  }

  // ============================================================================
  // ELEMENT FINDER (Shadow DOM + iFrames)
  // ============================================================================
  const findElementUnderPoint = (x, y) => {
    const perfMon = window.bestLocatorPerfMonitor;
    return perfMon ? perfMon.measure('domSearches', () => _findElement(x, y)) : _findElement(x, y);
  };
  const _findElement = (x, y) => {
    const findInShadowDOM = (root, px, py) => {
      try {
        const elements = root.elementsFromPoint ? root.elementsFromPoint(px, py) : [root.elementFromPoint(px, py)];
        for (const el of elements) {
          if (!el) continue;
          if (el.hasAttribute && el.hasAttribute('data-best-locator')) continue;
          if (el.shadowRoot) {
            const shadowResult = findInShadowDOM(el.shadowRoot, px, py);
            if (shadowResult) return shadowResult;
          }
        }
        return elements.find(el => el && (!el.hasAttribute || !el.hasAttribute('data-best-locator'))) || null;
      } catch { return null; }
    };
    const findInIframes = (doc, px, py, depth = 0) => {
      if (depth > 5) return null;
      try {
        const iframes = doc.querySelectorAll('iframe, frame');
        for (const frame of iframes) {
          const rect = frame.getBoundingClientRect();
          if (px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom) {
            try {
              const frameDoc = frame.contentDocument || frame.contentWindow?.document;
              if (frameDoc) {
                const relX = px - rect.left;
                const relY = py - rect.top;
                const shadowEl = findInShadowDOM(frameDoc, relX, relY);
                if (shadowEl) return { element: shadowEl, context: 'iframe-shadow', iframe: frame, depth };
                const nested = findInIframes(frameDoc, relX, relY, depth + 1);
                if (nested) return nested;
                const el = frameDoc.elementFromPoint(relX, relY);
                if (el && el !== frameDoc.body && el !== frameDoc.documentElement) {
                  return { element: el, context: 'iframe', iframe: frame, depth };
                }
              }
            } catch (error) {
              return { element: frame, context: 'cross-origin-iframe', iframe: frame, depth, error: 'cross-origin', errorDetails: error?.name };
            }
          }
        }
      } catch {}
      return null;
    };

    const iframeResult = findInIframes(document, x, y);
    if (iframeResult) return iframeResult;

    const shadowResult = findInShadowDOM(document, x, y);
    if (shadowResult) return { element: shadowResult, context: 'shadow-dom' };

    const normalElement = document.elementFromPoint(x, y);
    if (normalElement && (!normalElement.hasAttribute || !normalElement.hasAttribute('data-best-locator'))) {
      return { element: normalElement, context: 'main-document' };
    }
    return { element: null, context: 'none' };
  };

  // ============================================================================
  // PATH GENERATION (XPath & CSS)
  // ============================================================================
  const getFramePath = (iframe) => {
    const attrs = [];
    if (iframe.id) attrs.push(`@id="${iframe.id}"`);
    if (iframe.name) attrs.push(`@name="${iframe.name}"`);
    if (iframe.src) attrs.push(`@src="${iframe.src}"`);
    if (attrs.length === 0) {
      const parent = iframe.parentNode;
      const iframes = parent ? parent.querySelectorAll('iframe') : [];
      const index = Array.from(iframes).indexOf(iframe) + 1;
      return `//iframe[${index}]`;
    }
    return `//iframe[${attrs.join(' and ')}]`;
  };

  const getXPath = (element, iframe) => {
    if (!element) return '';
    if (iframe && iframe.contentDocument) {
      const framePath = getFramePath(iframe);
      const elementPath = getXPath(element, null);
      return framePath + (elementPath.startsWith('/') ? '' : '/') + elementPath;
    }
    if (element.id && /^[a-zA-Z][\w-]*$/.test(element.id)) return `//*[@id="${element.id}"]`;
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;
      while (sibling) { if (sibling.nodeName === current.nodeName) index++; sibling = sibling.previousSibling; }
      const tagName = current.nodeName.toLowerCase();
      parts.unshift(index > 0 ? `${tagName}[${index + 1}]` : tagName);
      if (current.id && /^[a-zA-Z][\w-]*$/.test(current.id)) { parts.unshift(`//*[@id="${current.id}"]`); break; }
      current = current.parentNode;
    }
    return parts.length ? '/' + parts.join('/') : '';
  };

  const isStableId = (id) => {
    const unstable = [
      /^[0-9]/, /^[a-f0-9]{8,}$/i, /^(react|vue|angular|ember|ng)-/i,
      /-(uid|uuid|guid|random|temp|tmp)-/i, /[0-9]{10,}/
    ];
    return !unstable.some(p => p.test(id));
  };
  const isStableClass = (className) => {
    const utility = [
      /^(xs|sm|md|lg|xl|xxl)-/, /^(col|row|container)-/, /^(bg|text|border|rounded)-/,
      /^(p|m|px|py|mx|my|mt|mb|ml|mr|pt|pb|pl|pr)-[0-9]/,
      /^(w|h|min-w|min-h|max-w|max-h)-/, /^(flex|grid|block|inline|hidden|visible)$/,
      /^(absolute|relative|fixed|static|sticky)$/, /^(z|opacity|cursor|transition|duration|ease)-/,
      /^hover:/, /^focus:/, /^active:/, /^disabled:/, /^group-/, /^peer-/
    ];
    return !utility.some(p => p.test(className));
  };

  // getCSSPath improved (uses stable classes by default)
  const getCSSPath = (element, options = {}) => {
    if (!(element instanceof Element)) return '';
    const {
      optimized = true,
      attributes = ['data-testid','data-test','data-qa','data-cy','name','role','aria-label'],
      skipClasses = false // default: allow stable classes
    } = options;

    const buildSelector = (el) => {
      let selector = el.nodeName.toLowerCase();
      if (el.id && isStableId(el.id)) return `${selector}#${CSS.escape(el.id)}`;
      for (const attr of attributes) {
        const value = el.getAttribute(attr);
        if (value && value.trim()) return `${selector}[${attr}="${CSS.escape(value)}"]`;
      }
      if (!skipClasses && el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).filter(isStableClass).slice(0, 3);
        if (classes.length > 0) selector += classes.map(c => '.' + CSS.escape(c)).join('');
      }
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter(child => child.nodeName === el.nodeName)
        : [];
      if (siblings.length > 1) {
        const index = siblings.indexOf(el) + 1;
        selector += `:nth-of-type(${index})`;
      }
      return selector;
    };

    const path = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const part = buildSelector(current);
      path.unshift(part);
      if (optimized && part.includes('#')) break;
      if (optimized && part.includes('[') && current.parentElement) {
        const matches = current.parentElement.querySelectorAll(path.join(' > '));
        if (matches.length === 1) break;
      }
      current = current.parentElement;
    }
    return path.join(' > ');
  };

  // ============================================================================
  // GATHER ELEMENT INFO
  // ============================================================================
  const gatherInfo = (elementData) => {
    if (!elementData || !elementData.element) return null;
    const { element, context, iframe, depth, error, errorDetails } = elementData;
    try {
      const attrs = {};
      if (element.attributes) Array.from(element.attributes).forEach(attr => { attrs[attr.name] = attr.value; });

      const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : {};
      const computed = element.nodeType === Node.ELEMENT_NODE ? window.getComputedStyle(element) : {};
      const getText = () => {
        try { if (element.innerText) return element.innerText; if (element.textContent) return element.textContent; return ''; }
        catch { return ''; }
      };

      const info = {
        tagName: element.tagName ? element.tagName.toLowerCase() : 'unknown',
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        textContent: getText().trim().slice(0, 200),
        attributes: attrs,
        order: (window.bestLocatorState?.selectedElements?.length || 0) + 1,
        url: window.location.href,
        timestamp: Date.now(),
        context,
        isInIframe: context && context.includes('iframe'),
        isCrossOrigin: error === 'cross-origin',
        depth: depth || 0,
        iframeInfo: iframe ? {
          src: iframe.src || '', id: iframe.id || '', name: iframe.name || '', title: iframe.title || '',
          sandbox: iframe.sandbox ? iframe.sandbox.toString() : ''
        } : null,
        zIndex: computed.zIndex || 'auto',
        display: computed.display || 'block',
        visibility: computed.visibility || 'visible',
        opacity: computed.opacity || '1',
        position: computed.position || 'static',
        boundingRect: {
          x: Math.round(rect.x || rect.left || 0),
          y: Math.round(rect.y || rect.top || 0),
          width: Math.round(rect.width || 0),
          height: Math.round(rect.height || 0),
          top: Math.round(rect.top || 0),
          right: Math.round(rect.right || 0),
          bottom: Math.round(rect.bottom || 0),
          left: Math.round(rect.left || 0)
        },
        xPath: getXPath(element, iframe),
        cssPath: getCSSPath(element),
        isVisible: !!(rect.width && rect.height && computed.visibility !== 'hidden' && computed.display !== 'none' && computed.opacity !== '0'),
        isInteractive: ['a','button','input','select','textarea'].includes(element.tagName?.toLowerCase()) || element.onclick || attrs.role === 'button',
        ariaLabel: attrs['aria-label'] || '',
        ariaRole: attrs.role || '',
        ariaDescribedBy: attrs['aria-describedby'] || '',
        errorDetails: errorDetails || null
      };

      const tagName = element.tagName?.toLowerCase();
      if (tagName === 'input') {
        info.inputType = attrs.type || 'text';
        info.inputValue = element.value || '';
        info.placeholder = attrs.placeholder || '';
      }
      if (tagName === 'a') {
        info.href = attrs.href || '';
        info.target = attrs.target || '';
      }
      if (tagName === 'img') {
        info.src = attrs.src || '';
        info.alt = attrs.alt || '';
      }
      if (tagName === 'form') {
        info.action = attrs.action || '';
        info.method = attrs.method || 'GET';
      }
      return info;
    } catch (error) {
      console.error('Element gather error:', error);
      return { tagName: 'unknown', error: error.message, context, order: (window.bestLocatorState?.selectedElements?.length || 0) + 1 };
    }
  };

  // ============================================================================
  // UI - CONTROL PANEL
  // ============================================================================
  let stateManager, overlayManager, highlightOverlay, controlPanel, navDetector, rafId = null;
  let dragMouseDownHandler, mouseMoveHandler, mouseUpHandler, clickHandler, keydownHandler;

  function createControlPanel() {
    controlPanel.innerHTML = `
      <div class="bl-panel-header">
        <div id="bl-drag-handle" class="bl-drag-handle" data-best-locator="drag">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 5.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z"/>
          </svg>
          DRAG TO MOVE
        </div>
      </div>
      <div class="bl-panel-body">
        <div id="bl-status-text" class="bl-status">🌐 NAVIGATION</div>
        <div class="bl-button-group">
          <button id="bl-capture-btn" class="bl-btn bl-btn-capture" data-best-locator="btn">
            <span class="bl-btn-icon">🎯</span>
            <span class="bl-btn-text">CAPTURE</span>
            <span class="bl-btn-shortcut">CTRL+S</span>
          </button>
          <button id="bl-nav-btn" class="bl-btn bl-btn-nav" data-best-locator="btn">
            <span class="bl-btn-icon">🌐</span>
            <span class="bl-btn-text">NAV</span>
            <span class="bl-btn-shortcut">CTRL+D</span>
          </button>
        </div>
        <div class="bl-stats">
          <div class="bl-stat-item">
            <span class="bl-stat-label">Captured:</span>
            <span id="bl-count" class="bl-stat-value">0</span>
          </div>
          <div class="bl-stat-item">
            <span class="bl-stat-label">Session:</span>
            <span id="bl-session-time" class="bl-stat-value">00:00</span>
          </div>
        </div>
        <button id="bl-finish-btn" class="bl-btn bl-btn-finish" data-best-locator="btn">
          <span class="bl-btn-icon">🏁</span>
          <span class="bl-btn-text">FINISH SESSION</span>
          <span class="bl-btn-shortcut">ESC</span>
        </button>
        <div class="bl-footer">
          <div class="bl-url" title="${window.location.href}">📍 ${window.location.hostname}</div>
          <div id="bl-performance" class="bl-performance" title="Click for stats">⚡ <span id="bl-perf-indicator">Ready</span></div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #bl-overlay-control *{box-sizing:border-box;margin:0;padding:0}
      .bl-panel-header{margin-bottom:8px}
      .bl-drag-handle{cursor:move;padding:6px;background:rgba(255,255,255,0.1);border-radius:4px;text-align:center;font-size:10px;color:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;gap:4px;transition:all .2s}
      .bl-drag-handle:hover{background:rgba(255,255,255,0.2);color:rgba(255,255,255,0.9)}
      .bl-drag-handle svg{width:12px;height:12px}
      .bl-panel-body{display:flex;flex-direction:column;gap:10px}
      .bl-status{font-weight:bold;text-align:center;font-size:14px;padding:8px;background:rgba(0,0,0,0.2);border-radius:6px;letter-spacing:1px}
      .bl-button-group{display:flex;gap:6px}
      .bl-btn{flex:1;padding:10px 8px;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.9);position:relative;overflow:hidden}
      .bl-btn:hover{transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,0.2)}
      .bl-btn:active{transform:translateY(0)}
      .bl-btn-icon{font-size:18px}
      .bl-btn-text{font-size:11px;font-weight:700}
      .bl-btn-shortcut{font-size:9px;opacity:.7}
      .bl-btn-capture.active{background:linear-gradient(135deg,#00ff88 0%,#00cc66 100%);color:#000}
      .bl-btn-nav.active{background:linear-gradient(135deg,#ff6b6b 0%,#ff5252 100%);color:#fff}
      .bl-btn-finish{background:linear-gradient(135deg,#dc3545 0%,#c82333 100%);color:#fff;padding:12px}
      .bl-btn-finish:hover{background:linear-gradient(135deg,#c82333 0%,#a71d2a 100%)}
      .bl-stats{display:flex;justify-content:space-around;padding:8px;background:rgba(0,0,0,0.2);border-radius:6px}
      .bl-stat-item{display:flex;flex-direction:column;align-items:center;gap:2px}
      .bl-stat-label{font-size:9px;opacity:.7;text-transform:uppercase}
      .bl-stat-value{font-size:16px;font-weight:bold}
      .bl-footer{display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;opacity:.8}
      .bl-url{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px}
      .bl-performance{cursor:pointer}
      .bl-performance:hover{opacity:1}
      @keyframes slideDown{from{transform:translateX(-50%) translateY(-100%);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
      @keyframes slideUp{from{transform:translateX(-50%) translateY(0);opacity:1}to{transform:translateX(-50%) translateY(-100%);opacity:0}}
    `;
    controlPanel.appendChild(style);

    updatePanelUI(stateManager.state);
    startSessionTimer();
  }

  function updatePanelUI(state) {
    if (!controlPanel || !document.contains(controlPanel)) return;
    const statusEl = document.getElementById('bl-status-text');
    const countEl = document.getElementById('bl-count');
    const captureBtn = document.getElementById('bl-capture-btn');
    const navBtn = document.getElementById('bl-nav-btn');
    if (statusEl) {
      statusEl.textContent = state.captureMode ? '🎯 CAPTURING' : '🌐 NAVIGATION';
      statusEl.style.color = state.captureMode ? '#00ff88' : '#ff6b6b';
    }
    if (countEl) countEl.textContent = String(state.selectedElements.length);
    if (captureBtn) captureBtn.classList.toggle('active', !!state.captureMode);
    if (navBtn) navBtn.classList.toggle('active', !state.captureMode);
    controlPanel.style.borderColor = state.captureMode ? '#00ff88' : '#ff6b6b';
    updatePerformanceIndicator();
  }

  function startSessionTimer() {
    const timerEl = document.getElementById('bl-session-time');
    if (!timerEl) return;
    const startTime = Date.now();
    const tick = () => {
      if (!window.bestLocatorState?.sessionActive) return;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  function updatePerformanceIndicator() {
    const perfEl = document.getElementById('bl-perf-indicator');
    if (!perfEl || !window.bestLocatorPerfMonitor) return;
    const stats = window.bestLocatorPerfMonitor.getStats();
    const avgCapture = stats.captures?.avg || 0;
    if (avgCapture === 0) {
      perfEl.textContent = 'Ready';
      perfEl.style.color = '#00ff88';
    } else if (avgCapture < 16) {
      perfEl.textContent = 'Fast';
      perfEl.style.color = '#00ff88';
    } else if (avgCapture < 50) {
      perfEl.textContent = 'Normal';
      perfEl.style.color = '#ffeb3b';
    } else {
      perfEl.textContent = 'Slow';
      perfEl.style.color = '#ff6b6b';
    }
  }

  // ============================================================================
  // HIGHLIGHT (performant)
  // ============================================================================
  const performantHighlight = (() => {
    let lastHighlightTime = 0;
    const MIN_HIGHLIGHT_INTERVAL = 16; // 60fps
    return (pos) => {
      const now = performance.now ? performance.now() : Date.now();
      if (now - lastHighlightTime < MIN_HIGHLIGHT_INTERVAL) return;
      lastHighlightTime = now;

      const data = findElementUnderPoint(pos.x, pos.y);
      if (!data || !data.element) { highlightOverlay.style.display = 'none'; return; }
      if (controlPanel && controlPanel.contains(data.element)) { highlightOverlay.style.display = 'none'; return; }
      const rect = data.element.getBoundingClientRect();
      let color, bgColor;
      switch (data.context) {
        case 'iframe': color = '#ff9800'; bgColor = 'rgba(255,152,0,0.1)'; break;
        case 'cross-origin-iframe': color = '#ffeb3b'; bgColor = 'rgba(255,235,59,0.1)'; break;
        case 'shadow-dom': color = '#9c27b0'; bgColor = 'rgba(156,39,176,0.1)'; break;
        default: color = '#f44336'; bgColor = 'rgba(244,67,54,0.05)';
      }
      Object.assign(highlightOverlay.style, {
        display: 'block',
        transform: `translate(${rect.left}px, ${rect.top}px)`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: `2px solid ${color}`,
        backgroundColor: bgColor,
        pointerEvents: 'none'
      });
    };
  })();

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'bl-notification';
    notification.setAttribute('data-best-locator', 'notification');
    const colors = {
      success: { bg: '#00ff88', fg: '#000' },
      error:   { bg: '#ff4444', fg: '#fff' },
      warning: { bg: '#ffaa00', fg: '#000' },
      info:    { bg: '#3498db', fg: '#fff' }
    };
    const color = colors[type] || colors.info;
    notification.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: ${color.bg}; color: ${color.fg}; padding: 12px 20px; border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483647; animation: slideDown 0.3s ease-out;
      pointer-events: none;
    `;
    notification.textContent = message;
    if (!document.getElementById('bl-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'bl-notification-styles';
      style.textContent = `
        @keyframes slideDown{from{transform:translateX(-50%) translateY(-100%);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        @keyframes slideUp{from{transform:translateX(-50%) translateY(0);opacity:1}to{transform:translateX(-50%) translateY(-100%);opacity:0}}
      `;
      document.head.appendChild(style);
    }
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 1800);
  }

  // Host notifier for FINISH (CLI/listeners)
  function notifyHostFinish(reason = 'user') {
    const detail = {
      reason,
      sessionId: stateManager?.state?.sessionId || null,
      count: stateManager?.state?.selectedElements?.length || 0,
      url: location.href,
      timestamp: Date.now(),
    };
    try { sessionStorage.setItem('bestLocator:finished', JSON.stringify(detail)); } catch {}
    try { window.postMessage({ source: 'best-locator', type: 'finished', detail }, '*'); } catch {}
    try { window.dispatchEvent(new CustomEvent('best-locator-finished', { detail })); } catch {}
    try { console.log('BEST_LOCATOR::FINISHED', detail); } catch {}
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================
  function cleanup() {
    console.log('🧹 Cleaning Best-Locator Toggle Mode...');
    if (window.bestLocatorPerfMonitor) {
      const stats = window.bestLocatorPerfMonitor.getStats();
      console.log('📊 Session stats:', stats);
    }
    document.removeEventListener('mousedown', dragMouseDownHandler);
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('click', clickHandler, true);
    document.removeEventListener('keydown', keydownHandler, true);
    if (navDetector) navDetector.disconnect();
    if (overlayManager) overlayManager.destroy();
    if (rafId) cancelAnimationFrame(rafId);
    document.onmousemove = null;
    document.onmouseup = null;
    window.bestLocatorToggleInitialized = false;
    window.bestLocatorState = null;
    window.bestLocatorPerfMonitor = null;
    console.log('✅ Cleanup complete');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  function initialize() {
    console.log('🚀 Initializing Best-Locator Toggle Mode Ultimate...');
    // Clear previous finish flag (avoid false positives on SPA reinjection)
    try { sessionStorage.removeItem('bestLocator:finished'); } catch {}

    window.bestLocatorPerfMonitor = new PerformanceMonitor();

    overlayManager = new OverlayManager();
    const overlays = overlayManager.initialize();
    highlightOverlay = overlays.highlightOverlay;
    controlPanel = overlays.controlPanel;

    stateManager = new StateManager((state) => updatePanelUI(state));
    window.bestLocatorState = stateManager.state;

    createControlPanel();

    // Delegated panel actions
    controlPanel.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest('.bl-btn');
      if (!button) return;
      const id = button.id;
      if (id === 'bl-capture-btn') {
        stateManager.state.captureMode = true;
      } else if (id === 'bl-nav-btn') {
        stateManager.state.captureMode = false;
      } else if (id === 'bl-finish-btn') {
        try { notifyHostFinish('button'); } catch {}
        stateManager.state.sessionActive = false;
      }
    });

    document.getElementById('bl-performance')?.addEventListener('click', () => {
      const stats = window.bestLocatorPerfMonitor.getStats();
      console.table(stats);
      alert(`Performance Stats:\n${JSON.stringify(stats, null, 2)}`);
    });

    // Drag & highlight handlers
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    dragMouseDownHandler = (e) => {
      const handle = document.getElementById('bl-drag-handle');
      if (handle && handle.contains(e.target)) {
        isDragging = true;
        const rect = controlPanel.getBoundingClientRect();
        dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        document.body.style.cursor = 'move';
        e.preventDefault();
      }
    };

    let lastMousePosition = { x: 0, y: 0 };
    mouseMoveHandler = (e) => {
      if (isDragging) {
        const newLeft = e.clientX - dragOffset.x;
        const newTop  = e.clientY - dragOffset.y;
        const maxLeft = window.innerWidth - controlPanel.offsetWidth;
        const maxTop  = window.innerHeight - controlPanel.offsetHeight;
        controlPanel.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
        controlPanel.style.top  = `${Math.max(0, Math.min(newTop, maxTop))}px`;
        controlPanel.style.right = 'auto';
        return;
      }
      if (!stateManager.state.captureMode) {
        if (highlightOverlay) highlightOverlay.style.display = 'none';
        return;
      }
      lastMousePosition = { x: e.clientX, y: e.clientY };
      if (!rafId) {
        rafId = requestAnimationFrame(() => { performantHighlight(lastMousePosition); rafId = null; });
      }
    };
    mouseUpHandler = () => { if (isDragging) { isDragging = false; document.body.style.cursor = ''; } };

    // Click capture
    clickHandler = (e) => {
      if (!stateManager.state.captureMode) return;
      if (controlPanel && controlPanel.contains(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      window.bestLocatorPerfMonitor.measure('captures', () => {
        const data = findElementUnderPoint(e.clientX, e.clientY);
        if (!data || !data.element) { console.warn('No element found'); return; }
        const info = gatherInfo(data);
        if (!info) { console.warn('Could not gather element info'); return; }
        const added = stateManager.addElement(info);
        if (!added) { showNotification('⚠️ Element limit reached (500)', 'warning'); return; }
        flashHighlight(data.context);
        showNotification(`✅ Element #${info.order} captured`, 'success');
        console.log(`📦 Captured #${info.order}:`, {
          tag: info.tagName, text: info.textContent.substring(0, 50), context: info.context, path: info.cssPath
        });
      });
    };

    // Keyboard
    keydownHandler = (e) => {
      const key = (e.key || '').toLowerCase();
      if (e.ctrlKey && key === 's') {
        e.preventDefault();
        stateManager.state.captureMode = true;
        showNotification('🎯 Capture mode ON', 'info');
      } else if (e.ctrlKey && key === 'd') {
        e.preventDefault();
        stateManager.state.captureMode = false;
        showNotification('🌐 Navigation mode ON', 'info');
      } else if (key === 'escape') {
        e.preventDefault();
        if (stateManager.state.selectedElements.length > 0) {
          const ok = window.confirm(`Finish session with ${stateManager.state.selectedElements.length} captured elements?`);
          if (!ok) return;
        }
        try { notifyHostFinish('escape'); } catch {}
        stateManager.state.sessionActive = false;
        showNotification('🏁 Session finished', 'success');
      } else if (e.ctrlKey && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (stateManager.state.selectedElements.length > 0) {
          const removed = stateManager.state.selectedElements.pop();
          stateManager.state.selectedElements = [...stateManager.state.selectedElements];
          showNotification(`↩️ Removed element #${removed.order}`, 'info');
        }
      } else if (e.ctrlKey && key === 'i') {
        e.preventDefault();
        const stats = stateManager.getStats();
        console.log('📊 Session info:', stats);
        alert(`📊 Session Info:\n${JSON.stringify(stats, null, 2)}`);
      }
    };

    // Register listeners
    document.addEventListener('mousedown', dragMouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keydownHandler, true);

    // Navigation detector + smart reinjection
    navDetector = new NavigationDetector(() => {
      console.log('🔄 Navigation detected, preparing reinjection...');
      stateManager.saveToStorage();
      const savedState = { ...stateManager.state };
      cleanup();
      waitForDOMStability(() => {
        console.log('✅ DOM stable, reinjecting...');
        initialize();
        if (window.bestLocatorState) {
          window.bestLocatorState.selectedElements = savedState.selectedElements;
          window.bestLocatorState.captureMode = savedState.captureMode;
        }
        showNotification('🔄 Toggle Mode restored after navigation', 'success');
      });
    });

    console.log('✅ Best-Locator Toggle Mode Ultimate initialized');
  }

  // ============================================================================
  // HELPERS
  // ============================================================================
  function waitForDOMStability(callback, maxWait = 5000) {
    const startTime = Date.now();
    const calmDuration = 200;
    let calmTimer = null;
    let observer = null;

    const finish = () => { if (observer) observer.disconnect(); if (calmTimer) clearTimeout(calmTimer); callback(); };
    const checkStability = () => {
      if (Date.now() - startTime > maxWait) { console.warn('⏰ Max wait reached, continuing'); finish(); return; }
      if (document.body && document.readyState !== 'loading') {
        if (calmTimer) clearTimeout(calmTimer);
        calmTimer = setTimeout(finish, calmDuration);
      } else setTimeout(checkStability, 50);
    };

    try {
      observer = new MutationObserver(() => {
        if (calmTimer) clearTimeout(calmTimer);
        calmTimer = setTimeout(finish, calmDuration);
      });
      if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch {}
    checkStability();
  }

  function flashHighlight(context) {
    if (!highlightOverlay) return;
    const originalBorder = highlightOverlay.style.border;
    const originalBg = highlightOverlay.style.backgroundColor;
    let flashColor = '#00ff88';
    if (context === 'iframe') flashColor = '#ff9800';
    else if (context === 'shadow-dom') flashColor = '#9c27b0';
    highlightOverlay.style.border = `3px solid ${flashColor}`;
    highlightOverlay.style.backgroundColor = `${flashColor}33`;
    highlightOverlay.style.transition = 'none';
    setTimeout(() => {
      highlightOverlay.style.transition = 'all 0.3s ease-out';
      highlightOverlay.style.border = originalBorder;
      highlightOverlay.style.backgroundColor = originalBg;
    }, 200);
  }

  // ============================================================================
  // ERROR BOUNDARIES
  // ============================================================================
  try {
    if (window.bestLocatorState && window.bestLocatorCleanup) {
      console.log('🔧 Cleaning previous session...');
      window.bestLocatorCleanup();
    }
    window.bestLocatorCleanup = cleanup;
    initialize();

    window.addEventListener('error', (e) => {
      if (e.filename && e.filename.includes('best-locator')) {
        console.error('❌ Best-Locator error:', e.error);
        try {
          cleanup();
          setTimeout(() => {
            console.log('🔧 Attempting auto-recovery...');
            initialize();
          }, 1000);
        } catch (recoveryError) {
          console.error('❌ Recovery failed:', recoveryError);
        }
      }
    });
  } catch (error) {
    console.error('❌ Critical init error in Best-Locator:', error);
    try { if (window.bestLocatorCleanup) window.bestLocatorCleanup(); } catch {}
    alert('Best-Locator Toggle Mode encountered an error. Please reload the page.');
  }

  console.log('🎉 Best-Locator Toggle Mode Ultimate v1.0.0 - Loaded');
})();
