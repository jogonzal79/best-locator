export class StabilityValidator {
  isStableId(id: string): boolean {
    const unstablePatterns = [/^\d+$/, /^[a-f0-9-]{36}$/, /temp-|auto-|gen-/];
    return !unstablePatterns.some(p => p.test(id)) && id.length >= 3;
  }

  isStableClass(cls: string): boolean {
    const tailwindPatterns = [
      /^bg-/, /^text-/, /^p-/, /^m-/, /^w-/, /^h-/, /^hover:/, /^focus:/, /^flex$/, /^grid$/
    ];
    return !tailwindPatterns.some(p => p.test(cls)) && cls.length > 2;
  }

  filterStableClasses(className: string): string[] {
    return className.split(' ').filter(cls => this.isStableClass(cls));
  }
}
