(() => {
  if (window.bestLocatorSinglePicker) return;

  window.elementSelected = false;
  window.selectedElementInfo = null;

  // --- El Overlay de Resaltado ---
  let overlay = document.createElement('div');
  overlay.id = 'bestlocator-overlay';
  Object.assign(overlay.style, {
    position: 'absolute',
    zIndex: '2147483647',
    pointerEvents: 'none',
    border: '2px solid red',
    boxSizing: 'border-box',
    display: 'none'
  });
  document.body.appendChild(overlay);

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
    };
  };

  const highlightElement = (event) => {
    const target = event.target;
    if (target && target.id !== 'bestlocator-overlay') {
      const rect = target.getBoundingClientRect();
      Object.assign(overlay.style, {
        top: `${window.scrollY + rect.top}px`,
        left: `${window.scrollX + rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        display: 'block'
      });
    }
  };

  const clickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    overlay.style.display = 'none';
    window.selectedElementInfo = gatherInfo(event.target);
    window.elementSelected = true;
    
    cleanup();
  };

  const escapeHandler = (event) => {
    if (event.key === 'Escape') {
      window.selectedElementInfo = null;
      window.elementSelected = true;
      cleanup();
    }
  };

  const cleanup = () => {
    document.removeEventListener('click', clickHandler, true);
    document.removeEventListener('keydown', escapeHandler, true);
    document.removeEventListener('mouseover', highlightElement, true);
    overlay.remove();
    window.bestLocatorSinglePicker = null;
  };

  document.addEventListener('click', clickHandler, true);
  document.addEventListener('keydown', escapeHandler, true);
  document.addEventListener('mouseover', highlightElement, true);
  window.bestLocatorSinglePicker = { cleanup };
})();