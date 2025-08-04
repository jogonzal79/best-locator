// src/injected-scripts/toggle-mode.js - VERSIÓN CON PERSISTENCIA

(() => {
  if (window.bestLocatorToggleInitialized) return;

  const OVERLAY_ID = 'bl-toggle-overlay';
  const STORAGE_KEY = 'bestLocatorToggleState';
  
  // 🔄 RESTAURAR ESTADO PREVIO desde sessionStorage
  const restoreState = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          captureMode: parsed.captureMode || false,
          selectedElements: parsed.selectedElements || [],
          sessionActive: true, // Siempre reactivar
        };
      }
    } catch (e) {
      console.warn('Error restaurando estado toggle:', e);
    }
    return {
      captureMode: false,
      selectedElements: [],
      sessionActive: true,
    };
  };

  // 💾 GUARDAR ESTADO en sessionStorage
  const saveState = () => {
    try {
      if (window.bestLocatorState) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          captureMode: window.bestLocatorState.captureMode,
          selectedElements: window.bestLocatorState.selectedElements,
          sessionActive: window.bestLocatorState.sessionActive
        }));
      }
    } catch (e) {
      console.warn('Error guardando estado toggle:', e);
    }
  };

  // 🚀 INICIALIZAR ESTADO (restaurado o nuevo)
  window.bestLocatorState = restoreState();
  
  console.log(`🎯 Toggle mode iniciado en ${window.location.href}`);
  console.log(`📦 Elementos restaurados: ${window.bestLocatorState.selectedElements.length}`);

  let highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'bestlocator-overlay-toggle';
  Object.assign(highlightOverlay.style, {
    position: 'absolute',
    zIndex: '2147483646',
    pointerEvents: 'none',
    border: '2px solid red',
    boxSizing: 'border-box',
    display: 'none',
    transition: 'border-color 0.2s ease'
  });
  document.body.appendChild(highlightOverlay);

  const gatherInfo = (element) => {
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
      url: window.location.href, // 📍 Guardar URL donde se capturó
    };
  };

  const controlPanel = document.createElement('div');
  controlPanel.id = OVERLAY_ID;
  controlPanel.innerHTML = `
    <div id="bl-drag-handle" style="cursor: move; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px 4px 0 0; text-align: center; font-size: 9px; color: #ccc;">
      ⚌ DRAG ME
    </div>
    <div id="bl-status-text" style="font-weight: bold; color: #ff6b6b;">
      ${window.bestLocatorState.captureMode ? '🎯 CAPTURING' : '🌐 NAVIGATION'}
    </div>
    <div style="font-size: 10px; margin-top: 4px;">
      CTRL+S: Capture ON<br>
      CTRL+D: Capture OFF<br>
      ESC: Finish
    </div>
    <div style="margin-top: 6px; font-size: 10px;">
      Captured: <span id="bl-count">${window.bestLocatorState.selectedElements.length}</span>
    </div>
    <div style="margin-top: 4px; font-size: 9px; color: #ccc;">
      📍 ${window.location.pathname}
    </div>
  `;
  
  Object.assign(controlPanel.style, {
    position: 'fixed', 
    top: '20px', 
    right: '20px', 
    background: 'rgba(30, 60, 114, 0.95)',
    color: 'white', 
    padding: '12px 16px', 
    fontFamily: 'monospace', 
    fontSize: '11px',
    borderRadius: '6px', 
    zIndex: '2147483647', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    border: `2px solid ${window.bestLocatorState.captureMode ? '#00ff88' : '#ff6b6b'}`, 
    userSelect: 'none', 
    minWidth: '140px'
  });
  document.body.appendChild(controlPanel);

  // 🖱️ DRAG & DROP del panel
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  const dragHandle = document.getElementById('bl-drag-handle');
  if (dragHandle) {
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = controlPanel.getBoundingClientRect();
      dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      e.stopPropagation();
    });
  }
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      controlPanel.style.left = (e.clientX - dragOffset.x) + 'px';
      controlPanel.style.top = (e.clientY - dragOffset.y) + 'px';
      controlPanel.style.right = 'auto';
    }
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  const cleanup = () => {
    // 🗑️ LIMPIAR sessionStorage al terminar la sesión
    sessionStorage.removeItem(STORAGE_KEY);
    
    document.removeEventListener('keydown', keydownHandler, true);
    document.removeEventListener('click', clickHandler, true);
    document.removeEventListener('mouseover', highlightElement, true);
    controlPanel.remove();
    highlightOverlay.remove();
    window.bestLocatorToggleInitialized = false;
    
    console.log('🏁 Toggle mode finalizado y limpiado');
  };

  const highlightElement = (e) => {
    if (e.target.closest(`#${OVERLAY_ID}`)) {
      highlightOverlay.style.display = 'none';
      return;
    }
    
    if (window.bestLocatorState.captureMode) {
      const target = e.target;
      highlightOverlay.style.borderColor = 'red';
      const rect = target.getBoundingClientRect();
      Object.assign(highlightOverlay.style, {
        top: `${window.scrollY + rect.top}px`,
        left: `${window.scrollX + rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        display: 'block'
      });
    } else {
      highlightOverlay.style.display = 'none';
    }
  };

  const keydownHandler = (e) => {
    const statusText = document.getElementById('bl-status-text');
    
    if (e.ctrlKey && e.key.toLowerCase() === 's') { 
      e.preventDefault(); 
      window.bestLocatorState.captureMode = true; 
      controlPanel.style.borderColor = '#00ff88'; 
      if(statusText) statusText.innerHTML = '🎯 CAPTURING';
      saveState(); // 💾 Guardar estado
    }
    else if (e.ctrlKey && e.key.toLowerCase() === 'd') { 
      e.preventDefault(); 
      window.bestLocatorState.captureMode = false; 
      controlPanel.style.borderColor = '#ff6b6b'; 
      if(statusText) statusText.innerHTML = '🌐 NAVIGATION';
      saveState(); // 💾 Guardar estado
    }
    else if (e.key === 'Escape') { 
      e.preventDefault(); 
      window.bestLocatorState.sessionActive = false; 
      cleanup(); 
    }
  };

  const clickHandler = (e) => {
    if (e.target.closest(`#${OVERLAY_ID}`)) return;
    if (!window.bestLocatorState.captureMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const info = gatherInfo(e.target);
    if (info) {
        window.bestLocatorState.selectedElements.push(info);
        const countEl = document.getElementById('bl-count');
        if (countEl) countEl.textContent = String(info.order);
        
        highlightOverlay.style.borderColor = '#00ff88';
        setTimeout(() => {
            highlightOverlay.style.borderColor = 'red';
        }, 800);
        
        saveState(); // 💾 Guardar estado después de capturar
        
        console.log(`✅ Elemento ${info.order} capturado en ${info.url}`);
    }
  };

  document.addEventListener('keydown', keydownHandler, true);
  document.addEventListener('click', clickHandler, true);
  document.addEventListener('mouseover', highlightElement, true);
  window.bestLocatorToggleInitialized = true;
  
  // 🔄 GUARDAR ESTADO PERIÓDICAMENTE (backup)
  const backupInterval = setInterval(saveState, 3000);
  
  // 🧹 LIMPIAR INTERVAL cuando se destruya la página
  window.addEventListener('beforeunload', () => {
    clearInterval(backupInterval);
    saveState(); // Guardar una última vez
  });
  
  console.log('🎛️ Toggle mode persistente activado');
  
  // 🚨 DETECTAR SI LA PÁGINA SE ESTÁ CERRANDO/NAVEGANDO
  window.addEventListener('pagehide', () => {
    console.log('📄 Página ocultándose - guardando estado final');
    saveState();
  });
})();