/* eslint-disable */
const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: '.',
  globalTimeout: 7200000,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  retries: 2,
  workers: 1,
  reporter: [['./lctReporter.js'], ['junit', { outputFile: 'results.xml' }]],
  use: {
    actionTimeout: 0,
    navigationTimeout: 0,
    viewport: { width: 1920, height: 1080 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: false,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
};

module.exports = config;
