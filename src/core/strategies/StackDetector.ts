// src/core/strategies/StackDetector.ts

export function detectStack(document: Document): string | null {
  // Angular: ng-version o ng-reflect-* están presentes
  if (document.querySelector('[ng-version]') || document.querySelector('[ng-reflect-*]')) {
    return 'angular';
  }

  // React: uso común de data-testid y clases dinámicas
  const reactDataTestId = document.querySelectorAll('[data-testid]');
  if (reactDataTestId.length > 5) {
    return 'react';
  }

  // ASP.NET WebForms: ids con "_" y sin "$", tags como "asp:"
  const aspNetIds = Array.from(document.querySelectorAll('[id]'))
    .filter(el => el.id.includes('_') && !el.id.includes('$'));
  if (aspNetIds.length > 10) {
    return 'aspnet';
  }

  // Vue: atributos como v-bind, v-if, v-model, etc.
  const vueAttrs = ['v-bind', 'v-model', 'v-if'];
  const hasVue = vueAttrs.some(attr => document.querySelector(`[${attr}]`));
  if (hasVue) {
    return 'vue';
  }

  // Otros: podrías agregar más aquí (Webflow, Svelte, etc.)

  return null; // No detectado
}
