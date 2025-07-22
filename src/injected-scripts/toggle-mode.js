// src/injected-scripts/toggle-mode.js
(() => {
  if (window.bestLocatorToggleInitialized) return;

  const OVERLAY_ID = 'bl-toggle-overlay';
  window.bestLocatorState = {
    captureMode: false,
    selectedElements: [],
    sessionActive: true,
  };

  const gatherInfo = (element) => {
    // ... (la función gatherInfo se mantiene igual)
    if (!element) return null;
    const attrs = {};
    for (const attr of Array.from(element.attributes)) {
      attrs[attr.name] = attr.value;
    }
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      textContent: (element.textContent || '').trim(),
      attributes: attrs,
      order: (window.bestLocatorState.selectedElements?.length || 0) + 1,
    };
  };

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  // ... (el HTML del overlay se mantiene igual)
  overlay.innerHTML = `
    <div id="bl-drag-handle" style="cursor: move; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px 4px 0 0; text-align: center; font-size: 9px; color: #ccc;">
      ⚌ DRAG ME
    </div>
    <div id="bl-status-text" style="font-weight: bold; color: #ff6b6b;">🌐 NAVIGATION</div>
    <div style="font-size: 10px; margin-top: 4px;">
      CTRL+S: Capture ON<br>
      CTRL+D: Capture OFF<br>
      ESC: Finish
    </div>
    <div style="margin-top: 6px; font-size: 10px;">
      Captured: <span id="bl-count">0</span>
    </div>
  `;
  overlay.setAttribute('style', 'position: fixed; top: 20px; right: 20px; background: rgba(30, 60, 114, 0.95); color: white; padding: 12px 16px; font-family: monospace; font-size: 11px; border-radius: 6px; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid #ff6b6b; user-select: none; min-width: 140px;');
  document.body.appendChild(overlay);

  // ... (la lógica de drag and drop se mantiene igual)
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  const dragHandle = document.getElementById('bl-drag-handle');
  if (dragHandle) {
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = overlay.getBoundingClientRect();
      dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      e.stopPropagation();
    });
  }
  document.addEventListener('mousemove', (e) => { if (isDragging) { overlay.style.left = (e.clientX - dragOffset.x) + 'px'; overlay.style.top = (e.clientY - dragOffset.y) + 'px'; overlay.style.right = 'auto'; } });
  document.addEventListener('mouseup', () => { isDragging = false; });


  document.addEventListener('keydown', (e) => {
    // ... (la lógica de keydown se mantiene igual)
     const statusText = document.getElementById('bl-status-text');
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); window.bestLocatorState.captureMode = true; overlay.style.borderColor = '#00ff88'; if(statusText) statusText.innerHTML = '🎯 CAPTURING';
    } else if (e.ctrlKey && e.key.toLowerCase() === 'd') { e.preventDefault(); window.bestLocatorState.captureMode = false; overlay.style.borderColor = '#ff6b6b'; if(statusText) statusText.innerHTML = '🌐 NAVIGATION';
    } else if (e.key === 'Escape') { e.preventDefault(); window.bestLocatorState.sessionActive = false; overlay.remove(); }
  }, true);

  document.addEventListener('click', (e) => {
    // ================== INICIO DE LA CORRECCIÓN ==================
    // Si el clic ocurre dentro de nuestro overlay, no hagas nada.
    if (e.target.closest(`#${OVERLAY_ID}`)) {
      return;
    }
    // =================== FIN DE LA CORRECCIÓN ====================

    if (!window.bestLocatorState.captureMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const info = gatherInfo(e.target);
    if (info) {
        window.bestLocatorState.selectedElements.push(info);
        const countEl = document.getElementById('bl-count');
        if (countEl) countEl.textContent = String(info.order);
        
        e.target.style.outline = '3px solid #00ff88';
        setTimeout(() => { e.target.style.outline = ''; }, 1500);
    }
  }, true);

  window.bestLocatorToggleInitialized = true;
})();
