// jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Maneja las extensiones .js en los imports de ESM
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // Usa ts-jest para los archivos .ts
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    // Busca archivos de prueba en todo el proyecto
    '**/__tests__/**/*.test.ts',
  ],
};