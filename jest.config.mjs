import nextJest from 'next/jest.js';

// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],

  // Use jsdom environment for browser-like testing
  testEnvironment: 'jest-environment-jsdom',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/layout.tsx', // Often contains just boilerplate
    '!app/**/route.ts', // API routes might need integration tests instead
    '!**/node_modules/**',
    '!coverage/**',
    '!.next/**',
    '!.vscode/**',
    '*.config.{js,mjs,ts}', // Config files
  ],

  // A preset that is used as a base for Jest's configuration (handled by next/jest)
  // preset: 'ts-jest', // Not needed when using next/jest

  // Module name mapper for handling module aliases and CSS Modules
  moduleNameMapper: {
    // Handle CSS imports (if using CSS Modules)
    // '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    // Handle module aliases (if configured in tsconfig.json)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },

  // Ignore node_modules, .next, etc.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

  // Transform files using next/jest's default transformer
  // transform: {
  //   '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }], // Handled by next/jest
  // },

  // Ignore specific transform patterns if needed
  // transformIgnorePatterns: [
  //   '/node_modules/',
  //   '^.+\\.module\\.(css|sass|scss)$',
  // ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);