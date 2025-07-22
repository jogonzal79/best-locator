// src/injected-scripts/single-picker.js
(() => {
  window.elementSelected = false;
  window.selectedElementInfo = null;

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
      depth: (() => {
        let d = 0; let e = element;
        while (e && e.parentElement) { d++; e = e.parentElement; }
        return d;
      })(),
      position: (() => {
        if (!element.parentElement) return 0;
        return Array.from(element.parentElement.children).indexOf(element);
      })(),
    };
  };

  const highlightElement = (event) => {
    document.querySelectorAll('.bestlocator-highlight').forEach(el => {
      el.style.outline = '';
      el.classList.remove('bestlocator-highlight');
    });
    const target = event.target;
    if (target) {
      target.style.outline = '2px solid red';
      target.classList.add('bestlocator-highlight');
    }
  };

  const clickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
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
    document.querySelectorAll('.bestlocator-highlight').forEach(el => {
      el.style.outline = '';
      el.classList.remove('bestlocator-highlight');
    });
  };

  document.addEventListener('click', clickHandler, true);
  document.addEventListener('keydown', escapeHandler, true);
  document.addEventListener('mouseover', highlightElement, true);
})();