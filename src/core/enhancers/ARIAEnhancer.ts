import { ElementInfo } from '../../types/index.js';
import { AriaCalculator } from '../ai/aria-calculator.js';

export class ARIAEnhancer {
  constructor(private ariaCalculator: AriaCalculator) {}

  enhance(element: ElementInfo): ElementInfo {
    return {
      ...element,
      computedRole: element.computedRole || this.ariaCalculator.computeRole(element),
      accessibleName: element.accessibleName || this.ariaCalculator.computeAccessibleName(element)
    };
  }

  tryARIAStrategy(element: ElementInfo) {
    const role = element.computedRole;
    const name = element.accessibleName;
    if (!role || !name) return null;

    const highValueRoles = ['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio'];
    if (highValueRoles.includes(role) && name.length <= 50) {
      return {
        selector: `${role}|${name.trim()}`,
        confidence: 95,
        type: 'aria-role',
        reasoning: `Uses ARIA role '${role}' with accessible name`
      };
    }

    return null;
  }
}
