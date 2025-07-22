// src/injected-scripts/multi-picker.js
(() => {
  window.multipleSelectionDone = false;
  window.selectedElementsInfo = [];

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
      depth: (() => {
        let d = 0; let e = element;
        while (e && e.parentElement) { d++; e = e.parentElement; }
        return d;
      })(),
      position: (() => {
        if (!element.parentElement) return 0;
        return Array.from(element.parentElement.children).indexOf(element);
      })(),
      order: (window.selectedElementsInfo?.length || 0) + 1
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
    const target = event.target;
    const info = gatherInfo(target);
    if (info) {
      window.selectedElementsInfo.push(info);

      target.style.outline = '3px solid #4CAF50';
      target.classList.add('bestlocator-highlight');
      const notification = document.createElement('div');
      notification.textContent = `Element ${info.order} captured!`;
      notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 10px 15px; border-radius: 5px; z-index: 999999; font-size: 14px;`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
        target.style.outline = '';
        target.classList.remove('bestlocator-highlight');
      }, 1500);
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
    document.querySelectorAll('.bestlocator-highlight').forEach(el => {
      el.style.outline = '';
      el.classList.remove('bestlocator-highlight');
    });
  };

  document.addEventListener('click', clickHandler, true);
  document.addEventListener('keydown', keyHandler, true);
  document.addEventListener('mouseover', highlightElement, true);
})();