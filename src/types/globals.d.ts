import { ElementInfo } from './index.js';

declare global {
  interface Window {
    // Para single-picker.js
    elementSelected?: boolean;
    selectedElementInfo?: ElementInfo | null;
    bestLocatorSinglePicker?: { cleanup: () => void; };

    // Para multi-picker.js
    multipleSelectionDone?: boolean;
    selectedElementsInfo?: ElementInfo[];
    bestLocatorMultiPicker?: { cleanup: () => void; };

    // Para toggle-mode.js
    bestLocatorToggleInitialized?: boolean;
    bestLocatorState?: {
      captureMode: boolean;
      selectedElements: ElementInfo[];
      sessionActive: boolean;
    };
  }
}