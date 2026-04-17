module.exports = {
    displayName: 'multi-drag',
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    rootDir: '.',
    testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.json' }]
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@system-ui-js/multi-drag-core$': '<rootDir>/../multi-drag-core/src/index.ts'
    }
}
