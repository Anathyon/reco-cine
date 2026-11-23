import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const isCI = Boolean(process.env.CI);

/**
 * Testes de ponta a ponta. Todas as APIs externas são simuladas (e2e/mocks.ts),
 * então os testes são determinísticos e não precisam da chave do TMDB.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // O service worker interceptaria as requisições antes dos mocks.
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // No CI o build já foi feito num passo anterior.
    command: isCI ? `npx next start -p ${PORT}` : `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    // Sem chave: o servidor não busca dados reais e tudo passa pelos mocks no navegador.
    env: { TMDB_API_KEY: '', NEXT_PUBLIC_TMDB_API_KEY: '', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
