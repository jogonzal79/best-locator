(() => {
  if (window.bestLocatorMultiPicker) return;

  window.multipleSelectionDone = false;
  window.selectedElementsInfo = [];

  // --- El Overlay de Resaltado ---
  let overlay = document.createElement('div');
  overlay.id = 'bestlocator-overlay-multi';
  Object.assign(overlay.style, {
    position: 'absolute',
    zIndex: '2147483647',
    pointerEvents: 'none',
    border: '2px solid red',
    boxSizing: 'border-box',
    display: 'none',
    transition: 'border-color 0.2s ease'
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
      textContent: (element.textContent || '').trim().substring(0, 80),
      attributes: attrs,
      order: (window.selectedElementsInfo?.length || 0) + 1
    };
  };
  
  const highlightElement = (event) => {
    const target = event.target;
    if (target && target.id !== 'bestlocator-overlay-multi') {
      const rect = target.getBoundingClientRect();
      Object.assign(overlay.style, {
        borderColor: 'red',
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
    
    const target = event.target;
    const info = gatherInfo(target);
    if (info) {
      window.selectedElementsInfo.push(info);

      // Feedback visual con el overlay
      overlay.style.borderColor = '#4CAF50';
      setTimeout(() => {
        overlay.style.borderColor = 'red';
      }, 800);

      const notification = document.createElement('div');
      notification.textContent = `Element ${info.order} captured!`;
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#4CAF50',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '5px',
        zIndex: '2147483647',
        fontSize: '14px'
      });
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 1500);
    }
  };

  const keyHandler = (event) => {
    if (event.key === 'Escape') {
      window.multipleSelectionDone = true;
      cleanup();
    }
  };

  const cleanup = () => {
    document.removeEventListener('click', clickHandler, true);
    document.removeEventListener('keydown', keyHandler, true);
    document.removeEventListener('mouseover', highlightElement, true);
    overlay.remove();
    window.bestLocatorMultiPicker = null;
  };

  document.addEventListener('click', clickHandler, true);
  document.addEventListener('keydown', keyHandler, true);
  document.addEventListener('mouseover', highlightElement, true);
  window.bestLocatorMultiPicker = { cleanup };
})();