module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/frontend/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'frontend/tsconfig.json',
    }],
  },
  testMatch: [
    '**/frontend/src/**/__tests__/**/*.test.(ts|tsx)',
    '**/frontend/src/**/?(*.)+(spec|test).(ts|tsx)',
  ],
  collectCoverageFrom: [
    'frontend/src/**/*.{ts,tsx}',
    '!frontend/src/**/*.d.ts',
    '!frontend/src/**/*.stories.{ts,tsx}',
    '!frontend/src/pages/_*.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: 'frontend/tsconfig.json',
    },
  },
}; 