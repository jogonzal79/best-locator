// src/injected-scripts/toggle-mode.js - VERSIÓN CON BOTONES EN EL PANEL

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
          sessionActive: true,
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

  // 🚀 INICIALIZAR ESTADO
  window.bestLocatorState = restoreState();
  
  console.log(`🎯 Toggle mode con soporte para iframes iniciado en ${window.location.href}`);
  console.log(`📦 Elementos restaurados: ${window.bestLocatorState.selectedElements.length}`);

  let highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'bestlocator-overlay-toggle';
  Object.assign(highlightOverlay.style, {
    position: 'absolute',
    zIndex: '2147483645',
    pointerEvents: 'none',
    border: '2px solid red',
    boxSizing: 'border-box',
    display: 'none',
    transition: 'border-color 0.2s ease'
  });
  document.body.appendChild(highlightOverlay);

  // 🖼️ BUSCAR ELEMENTOS EN IFRAMES ACCESIBLES
  const findElementInIframes = (x, y) => {
    const iframes = document.querySelectorAll('iframe');
    
    for (let iframe of iframes) {
      try {
        if (iframe.contentDocument || iframe.contentWindow) {
          const iframeRect = iframe.getBoundingClientRect();
          const relativeX = x - iframeRect.left;
          const relativeY = y - iframeRect.top;
          
          if (relativeX >= 0 && relativeX <= iframeRect.width &&
              relativeY >= 0 && relativeY <= iframeRect.height) {
            
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const elementInIframe = iframeDoc.elementFromPoint(relativeX, relativeY);
            
            if (elementInIframe && elementInIframe !== iframeDoc.body) {
              console.log('🖼️ Elemento encontrado en iframe:', elementInIframe);
              return {
                element: elementInIframe,
                iframe: iframe,
                isInIframe: true
              };
            }
          }
        }
      } catch (e) {
        console.log('🔒 Iframe inaccesible (cross-origin):', iframe.src);
        const iframeRect = iframe.getBoundingClientRect();
        if (x >= iframeRect.left && x <= iframeRect.right &&
            y >= iframeRect.top && y <= iframeRect.bottom) {
          return {
            element: iframe,
            iframe: iframe,
            isInIframe: true,
            isCrossOrigin: true
          };
        }
      }
    }
    return null;
  };

  // 🔍 FUNCIÓN MEJORADA PARA BUSCAR ELEMENTOS (INCLUYENDO IFRAMES)
  const findElementUnderPoint = (x, y) => {
    const iframeResult = findElementInIframes(x, y);
    if (iframeResult) {
      return iframeResult;
    }
    
    let element = document.elementFromPoint(x, y);
    
    if (element && element.id === 'bestlocator-overlay-toggle') {
      const originalDisplay = highlightOverlay.style.display;
      highlightOverlay.style.display = 'none';
      element = document.elementFromPoint(x, y);
      highlightOverlay.style.display = originalDisplay;
    }
    
    if (!element || element === document.body || element === document.documentElement) {
      const allElements = document.querySelectorAll('*');
      let bestElement = null;
      let bestZIndex = -1;
      
      for (let el of allElements) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            if (zIndex > bestZIndex || !bestElement) {
              bestElement = el;
              bestZIndex = zIndex;
            }
          }
        }
      }
      
      if (bestElement) {
        element = bestElement;
        console.log(`🎯 Encontrado elemento con z-index ${bestZIndex}:`, bestElement.className);
      }
    }
    
    return { element, iframe: null, isInIframe: false };
  };

  const gatherInfo = (elementData) => {
    const { element, iframe, isInIframe, isCrossOrigin } = elementData;
    
    if (!element) return null;
    
    const attrs = {};
    try {
      for (const attr of Array.from(element.attributes || [])) {
        attrs[attr.name] = attr.value;
      }
    } catch (e) {
      // Elemento puede no tener attributes
    }
    
    const elementInfo = {
      tagName: element.tagName ? element.tagName.toLowerCase() : 'unknown',
      id: element.id || '',
      className: element.className || '',
      textContent: (element.textContent || element.innerText || '').trim(),
      attributes: attrs,
      order: (window.bestLocatorState.selectedElements?.length || 0) + 1,
      url: window.location.href,
      
      isInIframe: isInIframe,
      isCrossOrigin: isCrossOrigin || false,
      iframeInfo: iframe ? {
        src: iframe.src,
        id: iframe.id,
        className: iframe.className,
        title: iframe.title,
        width: iframe.width || iframe.style.width,
        height: iframe.height || iframe.style.height
      } : null,
      
      isTawkWidget: element.className && element.className.includes('tawk'),
      zIndex: window.getComputedStyle ? window.getComputedStyle(element).zIndex : 'auto',
      boundingRect: element.getBoundingClientRect ? {
        x: Math.round(element.getBoundingClientRect().x),
        y: Math.round(element.getBoundingClientRect().y),
        width: Math.round(element.getBoundingClientRect().width),
        height: Math.round(element.getBoundingClientRect().height)
      } : null,
      
      xPath: getXPath(element, iframe),
      cssPath: getCSSPath(element, iframe)
    };
    
    return elementInfo;
  };

  const getXPath = (element, iframe) => {
    let prefix = '';
    if (iframe) {
      prefix = `//iframe[@src="${iframe.src}" or @title="${iframe.title}"]`;
      if (iframe.contentDocument) {
        prefix += '//';
      } else {
        return prefix;
      }
    }
    
    if (!element || element === document) return prefix;
    if (element.id) return `${prefix}//*[@id="${element.id}"]`;
    
    const parts = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let hasSiblings = false;
      
      for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
        if (sibling.nodeName === element.nodeName) {
          hasSiblings = true;
          index++;
        }
      }
      
      for (let sibling = element.nextSibling; sibling; sibling = sibling.nextSibling) {
        if (sibling.nodeName === element.nodeName) {
          hasSiblings = true;
          break;
        }
      }
      
      const tagName = element.nodeName.toLowerCase();
      const part = hasSiblings ? `${tagName}[${index + 1}]` : tagName;
      parts.unshift(part);
      
      element = element.parentNode;
    }
    
    return prefix + (parts.length ? '/' + parts.join('/') : '');
  };

  const getCSSPath = (element, iframe) => {
    if (iframe && iframe.src !== 'about:blank') {
      return `iframe[src="${iframe.src}"]`;
    }
    
    if (!element || element === document || element === document.body) return '';
    
    const names = [];
    while (element.parentElement) {
      if (element.id) {
        names.unshift('#' + element.id);
        break;
      } else {
        let tagName = element.nodeName.toLowerCase();
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c).join('.');
          tagName += '.' + classes;
        }
        names.unshift(tagName);
        element = element.parentElement;
      }
    }
    return names.join(' > ');
  };

  // 🎮 FUNCIONES PARA CONTROLAR EL MODO CAPTURA
  const activateCaptureMode = () => {
    window.bestLocatorState.captureMode = true;
    updatePanelUI();
    saveState();
    console.log('🎯 Modo captura ACTIVADO');
  };

  const deactivateCaptureMode = () => {
    window.bestLocatorState.captureMode = false;
    updatePanelUI();
    saveState();
    console.log('🌐 Modo navegación ACTIVADO');
  };

  const finishSession = () => {
    window.bestLocatorState.sessionActive = false;
    cleanup();
    console.log('🏁 Sesión finalizada');
  };

  // 🔄 ACTUALIZAR UI DEL PANEL
  const updatePanelUI = () => {
    const statusText = document.getElementById('bl-status-text');
    const captureBtn = document.getElementById('bl-capture-btn');
    const navBtn = document.getElementById('bl-nav-btn');
    const controlPanel = document.getElementById(OVERLAY_ID);
    
    if (window.bestLocatorState.captureMode) {
      if (statusText) statusText.innerHTML = '🎯 CAPTURING';
      if (controlPanel) controlPanel.style.borderColor = '#00ff88';
      if (captureBtn) {
        captureBtn.style.background = '#00ff88';
        captureBtn.style.color = '#000';
      }
      if (navBtn) {
        navBtn.style.background = 'rgba(255,255,255,0.2)';
        navBtn.style.color = '#fff';
      }
    } else {
      if (statusText) statusText.innerHTML = '🌐 NAVIGATION';
      if (controlPanel) controlPanel.style.borderColor = '#ff6b6b';
      if (navBtn) {
        navBtn.style.background = '#ff6b6b';
        navBtn.style.color = '#000';
      }
      if (captureBtn) {
        captureBtn.style.background = 'rgba(255,255,255,0.2)';
        captureBtn.style.color = '#fff';
      }
    }
  };

  // 🎨 CREAR PANEL DE CONTROL CON BOTONES
  const controlPanel = document.createElement('div');
  controlPanel.id = OVERLAY_ID;
  controlPanel.innerHTML = `
    <div id="bl-drag-handle" style="cursor: move; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px 4px 0 0; text-align: center; font-size: 9px; color: #ccc;">
      ⚌ DRAG ME
    </div>
    <div id="bl-status-text" style="font-weight: bold; color: #ff6b6b; margin-bottom: 8px;">
      ${window.bestLocatorState.captureMode ? '🎯 CAPTURING' : '🌐 NAVIGATION'}
    </div>
    
    <div style="display: flex; gap: 4px; margin-bottom: 8px;">
      <button id="bl-capture-btn" style="
        flex: 1; 
        padding: 6px 8px; 
        border: none; 
        border-radius: 4px; 
        font-size: 10px; 
        font-weight: bold; 
        cursor: pointer;
        background: ${window.bestLocatorState.captureMode ? '#00ff88' : 'rgba(255,255,255,0.2)'};
        color: ${window.bestLocatorState.captureMode ? '#000' : '#fff'};
        transition: all 0.2s ease;
      ">🎯 CAPTURE</button>
      
      <button id="bl-nav-btn" style="
        flex: 1; 
        padding: 6px 8px; 
        border: none; 
        border-radius: 4px; 
        font-size: 10px; 
        font-weight: bold; 
        cursor: pointer;
        background: ${!window.bestLocatorState.captureMode ? '#ff6b6b' : 'rgba(255,255,255,0.2)'};
        color: ${!window.bestLocatorState.captureMode ? '#000' : '#fff'};
        transition: all 0.2s ease;
      ">🌐 NAV</button>
    </div>
    
    <div style="font-size: 9px; margin-bottom: 8px; color: #ccc;">
      <div>CTRL+S: Capture ON</div>
      <div>CTRL+D: Capture OFF</div>
    </div>
    
    <div style="margin-bottom: 8px; font-size: 10px;">
      Captured: <span id="bl-count">${window.bestLocatorState.selectedElements.length}</span>
    </div>
    
    <button id="bl-finish-btn" style="
      width: 100%; 
      padding: 8px; 
      border: none; 
      border-radius: 4px; 
      font-size: 10px; 
      font-weight: bold; 
      cursor: pointer;
      background: #dc3545;
      color: white;
      margin-bottom: 8px;
      transition: all 0.2s ease;
    ">🏁 FINISH (ESC)</button>
    
    <div style="font-size: 8px; color: #aaa; text-align: center;">
      📍 ${window.location.pathname}<br>
      🖼️ Iframe Support
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
    minWidth: '180px'
  });
  document.body.appendChild(controlPanel);

  // 🎮 EVENT LISTENERS PARA LOS BOTONES
  const captureBtn = document.getElementById('bl-capture-btn');
  const navBtn = document.getElementById('bl-nav-btn');
  const finishBtn = document.getElementById('bl-finish-btn');

  if (captureBtn) {
    captureBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activateCaptureMode();
    });
    
    captureBtn.addEventListener('mouseenter', () => {
      if (!window.bestLocatorState.captureMode) {
        captureBtn.style.background = 'rgba(0,255,136,0.3)';
      }
    });
    
    captureBtn.addEventListener('mouseleave', () => {
      if (!window.bestLocatorState.captureMode) {
        captureBtn.style.background = 'rgba(255,255,255,0.2)';
      }
    });
  }

  if (navBtn) {
    navBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deactivateCaptureMode();
    });
    
    navBtn.addEventListener('mouseenter', () => {
      if (window.bestLocatorState.captureMode) {
        navBtn.style.background = 'rgba(255,107,107,0.3)';
      }
    });
    
    navBtn.addEventListener('mouseleave', () => {
      if (window.bestLocatorState.captureMode) {
        navBtn.style.background = 'rgba(255,255,255,0.2)';
      }
    });
  }

  if (finishBtn) {
    finishBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finishSession();
    });
    
    finishBtn.addEventListener('mouseenter', () => {
      finishBtn.style.background = '#bb2d3b';
    });
    
    finishBtn.addEventListener('mouseleave', () => {
      finishBtn.style.background = '#dc3545';
    });
  }

  // 🖱️ DRAG & DROP del panel (manteniendo funcionalidad original)
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
      const targetData = findElementUnderPoint(e.clientX, e.clientY);
      const target = targetData.element || e.target;
      
      highlightOverlay.style.borderColor = targetData.isInIframe ? 'orange' : 'red';
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

  // ⌨️ KEYBOARD HANDLERS (manteniendo funcionalidad original)
  const keydownHandler = (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') { 
      e.preventDefault(); 
      activateCaptureMode();
    }
    else if (e.ctrlKey && e.key.toLowerCase() === 'd') { 
      e.preventDefault(); 
      deactivateCaptureMode();
    }
    else if (e.key === 'Escape') { 
      e.preventDefault(); 
      finishSession();
    }
  };

  const clickHandler = (e) => {
    if (e.target.closest(`#${OVERLAY_ID}`)) return;
    if (!window.bestLocatorState.captureMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const targetData = findElementUnderPoint(e.clientX, e.clientY);
    const info = gatherInfo(targetData);
    
    if (info) {
        window.bestLocatorState.selectedElements.push(info);
        const countEl = document.getElementById('bl-count');
        if (countEl) countEl.textContent = String(info.order);
        
        highlightOverlay.style.borderColor = '#00ff88';
        setTimeout(() => {
            highlightOverlay.style.borderColor = info.isInIframe ? 'orange' : 'red';
        }, 800);
        
        saveState();
        
        console.log(`✅ Elemento ${info.order} capturado:`, {
          tagName: info.tagName,
          text: info.textContent.substring(0, 50),
          className: info.className,
          isInIframe: info.isInIframe,
          isCrossOrigin: info.isCrossOrigin,
          isTawkWidget: info.isTawkWidget,
          cssPath: info.cssPath,
          xpath: info.xPath
        });
    }
  };

  document.addEventListener('keydown', keydownHandler, true);
  document.addEventListener('click', clickHandler, true);
  document.addEventListener('mouseover', highlightElement, true);
  window.bestLocatorToggleInitialized = true;
  
  // 🔄 GUARDAR ESTADO PERIÓDICAMENTE
  const backupInterval = setInterval(saveState, 3000);
  
  window.addEventListener('beforeunload', () => {
    clearInterval(backupInterval);
    saveState();
  });
  
  window.addEventListener('pagehide', () => {
    console.log('📄 Página ocultándose - guardando estado final');
    saveState();
  });
  
  console.log('🎛️ Toggle mode con botones interactivos activado');
})();