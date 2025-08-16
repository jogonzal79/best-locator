// src/core/utils/stack-detector.ts
export function detectStack(document: Document): string | undefined {
  const html = document.documentElement.innerHTML;

  if (html.includes('ng-version') || !!document.querySelector('[ng-version]')) {
    return 'angular';
  }

  if (!!document.querySelector('[data-reactroot]') || html.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
    return 'react';
  }

  if (html.includes('data-v-')) {
    return 'vue';
  }

  if (Array.from(document.querySelectorAll('[id]')).some(el => el.id.includes('_') && !el.id.includes('$'))) {
    return 'aspnet';
  }

  return undefined;
}
