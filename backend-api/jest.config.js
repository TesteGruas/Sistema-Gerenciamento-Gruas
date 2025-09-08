export default {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.cjs',
    '**/src/**/tests/**/*.test.js',
    '**/src/**/tests/**/*.test.cjs'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/tests/**',
    '!src/server.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
}
