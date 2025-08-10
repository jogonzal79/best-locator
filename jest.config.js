// jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
  ],
  // +++ INICIO DE CAMBIOS +++
  // Directorio donde se guardarán los informes de cobertura
  coverageDirectory: 'coverage',
  // Especifica qué archivos deben ser incluidos en el informe de cobertura
  collectCoverageFrom: [
    'src/**/*.ts',
    // Excluye los archivos de tipos, el index principal y los archivos de pruebas
    '!src/types/**/*.ts',
    '!src/index.ts',
    '!src/**/*.test.ts',
    // Excluye la GUI por ahora
    '!src/gui/**/*.ts',
  ],
  // --- FIN DE CAMBIOS ---
};