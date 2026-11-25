import { expect, test } from '@playwright/test';
import { mockApis } from './mocks';

test('filtros de gênero, ano e streaming ficam na URL e mudam a busca', async ({ page }) => {
  await mockApis(page);
  await page.goto('/movies');
  await expect(page.getByRole('article')).toHaveCount(4);

  const dramaRequest = page.waitForRequest((r) => r.url().includes('/api/tmdb/discover/movie') && r.url().includes('with_genres=18'));
  await page.getByRole('button', { name: 'Drama', exact: true }).click();
  await dramaRequest;
  await expect(page).toHaveURL(/genre=18/);
  await expect(page.getByRole('article')).toHaveCount(1);

  await page.getByLabel('Ano de lançamento').selectOption('2020');
  await expect(page).toHaveURL(/year=2020/);

  const providerRequest = page.waitForRequest((r) => r.url().includes('with_watch_providers=8'));
  await page.getByLabel('Onde assistir').selectOption({ label: 'Netflix' });
  await providerRequest;
  await expect(page).toHaveURL(/provider=8/);

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page).toHaveURL(/\/movies$/);
  await expect(page.getByRole('article')).toHaveCount(4);
});

test('"Surpreenda-me" abre um título aleatório', async ({ page }) => {
  await mockApis(page);
  await page.goto('/series');
  await page.getByRole('button', { name: 'Surpreenda-me' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/view=tv-20\d/);
});

test('animes não têm filtro de streaming (o MyAnimeList não informa)', async ({ page }) => {
  await mockApis(page);
  await page.goto('/animes');
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.getByLabel('Onde assistir')).toHaveCount(0);
});

test('erro na API mostra aviso e "Tentar novamente" recupera', async ({ page }) => {
  await mockApis(page, { failTmdb: /^discover/ });
  await page.goto('/movies');
  await expect(page.getByRole('alert').filter({ hasText: 'Falha simulada do TMDB' })).toBeVisible();

  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await mockApis(page);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('article')).toHaveCount(4);
});

test('mangás: catálogo sem filtro de ano e detalhes com "Onde ler"', async ({ page }) => {
  await mockApis(page);
  await page.goto('/mangas');
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.getByLabel('Ano de lançamento')).toHaveCount(0);
  await expect(page.getByLabel('Ordenar por').locator('option')).toHaveCount(2);

  await page.getByRole('link', { name: /Mangá Ômicron/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Volumes')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Onde assistir' })).toHaveCount(0);
  await expect(dialog.getByRole('heading', { name: 'Onde ler' })).toBeVisible();
  const link = dialog.getByRole('link', { name: /MANGA Plus · Português/ });
  await expect(link).toHaveAttribute('href', 'https://mangaplus.shueisha.co.jp/titles/1');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(page).toHaveURL(/view=manga-401/);
});
