(() => {
  if (window.bestLocatorMultiPicker) return;

  window.multipleSelectionDone = false;
  window.selectedElementsInfo = [];

  // ============================================================================
  // CSS.escape polyfill (W3C standard)
  // ============================================================================
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

        if (codeUnit === 0x0000) {
          result += '\uFFFD';
          continue;
        }

        if (
          (codeUnit >= 0x0001 && codeUnit <= 0x001F) ||
          codeUnit === 0x007F ||
          (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
          (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002D)
        ) {
          result += '\\' + codeUnit.toString(16) + ' ';
          continue;
        }

        if (index === 0 && codeUnit === 0x002D && length === 1) {
          result += '\\' + string.charAt(index);
          continue;
        }

        if (
          codeUnit >= 0x0080 ||
          (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
          (codeUnit >= 0x0041 && codeUnit <= 0x005A) ||
          (codeUnit >= 0x0061 && codeUnit <= 0x007A) ||
          codeUnit === 0x005F ||
          codeUnit === 0x002D
        ) {
          result += string.charAt(index);
          continue;
        }

        result += '\\' + string.charAt(index);
      }
      return result;
    };
    window.CSS = window.CSS || {};
    CSS.escape = cssEscape;
  }

  // ============================================================================
  // OVERLAY MANAGER (Dynamic Z-Index)
  // ============================================================================
  class OverlayManager {
    constructor() {
      this.highestZIndex = 2147483640;
      this.overlay = null;
    }

    scanHighestZIndex() {
      let highest = 2147483640;
      const elements = document.querySelectorAll('*');
      for (let i = 0; i < elements.length; i++) {
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

    createOverlay() {
      this.highestZIndex = this.scanHighestZIndex();
      
      this.overlay = document.createElement('div');
      this.overlay.id = 'bestlocator-overlay-multi';
      this.overlay.setAttribute('data-best-locator', 'multi-overlay');
      
      Object.assign(this.overlay.style, {
        position: 'absolute',
        zIndex: `${this.highestZIndex + 101}`,
        pointerEvents: 'none',
        border: '2px solid #f44336',
        borderRadius: '2px',
        backgroundColor: 'rgba(244, 67, 54, 0.05)',
        boxSizing: 'border-box',
        display: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, width, height',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        top: '0',
        left: '0'
      });
      
      document.body.appendChild(this.overlay);
      return this.overlay;
    }

    updateOverlayStyle(context) {
      if (!this.overlay) return;
      
      let color, bgColor;
      switch (context) {
        case 'iframe':
          color = '#ff9800';
          bgColor = 'rgba(255, 152, 0, 0.1)';
          break;
        case 'cross-origin-iframe':
          color = '#ffeb3b';
          bgColor = 'rgba(255, 235, 59, 0.1)';
          break;
        case 'shadow-dom':
          color = '#9c27b0';
          bgColor = 'rgba(156, 39, 176, 0.1)';
          break;
        default:
          color = '#f44336';
          bgColor = 'rgba(244, 67, 54, 0.05)';
      }
      
      this.overlay.style.borderColor = color;
      this.overlay.style.backgroundColor = bgColor;
    }

    flashSuccess() {
      if (!this.overlay) return;
      const originalBorder = this.overlay.style.border;
      const originalBg = this.overlay.style.backgroundColor;
      
      Object.assign(this.overlay.style, {
        border: '3px solid #00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        transition: 'none'
      });
      
      setTimeout(() => {
        this.overlay.style.transition = 'all 0.3s ease-out';
        this.overlay.style.border = originalBorder;
        this.overlay.style.backgroundColor = originalBg;
      }, 200);
    }

    destroy() {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
    }
  }

  // ============================================================================
  // ELEMENT FINDER (Shadow DOM + iFrames)
  // ============================================================================
  const findElementUnderPoint = (x, y) => {
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
  // PATH GENERATION (Enhanced XPath & CSS)
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

  const getCSSPath = (element, options = {}) => {
    if (!(element instanceof Element)) return '';
    const {
      optimized = true,
      attributes = ['data-testid','data-test','data-qa','data-cy','name','role','aria-label'],
      skipClasses = false
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
  // GATHER ELEMENT INFO (Enhanced)
  // ============================================================================
  const gatherInfo = (elementData) => {
    if (!elementData || !elementData.element) return null;
    const { element, context, iframe, depth, error, errorDetails } = elementData;
    
    try {
      const attrs = {};
      if (element.attributes) {
        Array.from(element.attributes).forEach(attr => {
          attrs[attr.name] = attr.value;
        });
      }

      const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : {};
      const computed = element.nodeType === Node.ELEMENT_NODE ? window.getComputedStyle(element) : {};
      
      const getText = () => {
        try {
          if (element.innerText) return element.innerText;
          if (element.textContent) return element.textContent;
          return '';
        } catch {
          return '';
        }
      };

      const info = {
        tagName: element.tagName ? element.tagName.toLowerCase() : 'unknown',
        id: element.id || '',
        className: typeof element.className === 'string' ? element.className : '',
        textContent: getText().trim().substring(0, 80),
        attributes: attrs,
        order: (window.selectedElementsInfo?.length || 0) + 1,
        url: window.location.href,
        timestamp: Date.now(),
        context,
        isInIframe: context && context.includes('iframe'),
        isCrossOrigin: error === 'cross-origin',
        depth: depth || 0,
        iframeInfo: iframe ? {
          src: iframe.src || '',
          id: iframe.id || '',
          name: iframe.name || '',
          title: iframe.title || '',
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

      // Tag-specific properties
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
      return {
        tagName: 'unknown',
        error: error.message,
        context,
        order: (window.selectedElementsInfo?.length || 0) + 1,
        timestamp: Date.now()
      };
    }
  };

  // ============================================================================
  // NOTIFICATION SYSTEM
  // ============================================================================
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.setAttribute('data-best-locator', 'notification');
    
    const colors = {
      success: { bg: '#4CAF50', fg: '#fff' },
      info: { bg: '#2196F3', fg: '#fff' },
      warning: { bg: '#FF9800', fg: '#fff' },
      error: { bg: '#F44336', fg: '#fff' }
    };
    
    const color = colors[type] || colors.success;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: color.bg,
      color: color.fg,
      padding: '10px 15px',
      borderRadius: '5px',
      zIndex: '2147483647',
      fontSize: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease-out',
      pointerEvents: 'none'
    });
    
    notification.textContent = message;
    
    // Add CSS animation if not already present
    if (!document.getElementById('bl-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'bl-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 1500);
  }

  // ============================================================================
  // MAIN IMPLEMENTATION
  // ============================================================================
  const overlayManager = new OverlayManager();
  const overlay = overlayManager.createOverlay();

  const highlightElement = (event) => {
    const target = event.target;
    
    // Skip our own overlay and data-best-locator elements
    if (!target || target.hasAttribute('data-best-locator') || target.id === 'bestlocator-overlay-multi') {
      overlay.style.display = 'none';
      return;
    }

    const rect = target.getBoundingClientRect();
    
    // Apply same styling as toggle mode
    let color, bgColor;
    color = '#f44336';  // Default red
    bgColor = 'rgba(244, 67, 54, 0.05)';
    
    Object.assign(overlay.style, {
      display: 'block',
      top: `${window.scrollY + rect.top}px`,
      left: `${window.scrollX + rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      border: `2px solid ${color}`,
      backgroundColor: bgColor,
      borderRadius: '2px'
    });
  };

  const clickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target;
    
    // Skip our own elements
    if (target.hasAttribute('data-best-locator') || target.id === 'bestlocator-overlay-multi') {
      return;
    }

    // Use the enhanced finder for complex cases, but fallback to simple target for basic cases
    let elementData = findElementUnderPoint(event.clientX, event.clientY);
    if (!elementData || !elementData.element) {
      elementData = { element: target, context: 'main-document' };
    }

    const info = gatherInfo(elementData);
    if (info) {
      window.selectedElementsInfo.push(info);

      // Visual feedback - flash effect
      overlayManager.flashSuccess();
      showNotification(`Element ${info.order} captured!`, 'success');

      console.log(`📦 Multi-captured #${info.order}:`, {
        tag: info.tagName,
        text: info.textContent.substring(0, 50),
        context: info.context,
        cssPath: info.cssPath,
        xPath: info.xPath
      });
    }
  };

  const keyHandler = (event) => {
    if (event.key === 'Escape') {
      window.multipleSelectionDone = true;
      showNotification(`Session finished - ${window.selectedElementsInfo.length} elements captured`, 'info');
      cleanup();
    }
  };

  const cleanup = () => {
    document.removeEventListener('click', clickHandler, true);
    document.removeEventListener('keydown', keyHandler, true);
    document.removeEventListener('mouseover', highlightElement, true);
    overlayManager.destroy();
    window.bestLocatorMultiPicker = null;
  };

  // Register event listeners
  document.addEventListener('click', clickHandler, true);
  document.addEventListener('keydown', keyHandler, true);
  document.addEventListener('mouseover', highlightElement, true);
  
  window.bestLocatorMultiPicker = { cleanup };
})();