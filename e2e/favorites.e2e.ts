import { expect, test } from '@playwright/test';
import { mockApis } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApis(page);
});

test('favoritar um título, ver na lista e continuar lá após recarregar', async ({ page }) => {
  await page.goto('/movies');
  const card = page.getByRole('article').filter({ hasText: 'Filme Alfa' });
  await card.getByRole('button', { name: 'Adicionar Filme Alfa à sua lista' }).click();
  await expect(page.getByText('Adicionado à sua lista')).toBeVisible();

  await page.goto('/favorites');
  await expect(page.getByRole('article').filter({ hasText: 'Filme Alfa' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('article').filter({ hasText: 'Filme Alfa' })).toBeVisible();
});

test('"Desfazer" no aviso reverte a ação', async ({ page }) => {
  await page.goto('/movies');
  const card = page.getByRole('article').filter({ hasText: 'Filme Beta' });
  await card.getByRole('button', { name: 'Adicionar Filme Beta à sua lista' }).click();
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(card.getByRole('button', { name: 'Adicionar Filme Beta à sua lista' })).toBeVisible();
});

test('lista vazia convida a explorar', async ({ page }) => {
  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Sua lista está vazia' })).toBeVisible();
  await page.getByRole('link', { name: 'Explorar títulos' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('importa uma lista compartilhada por link', async ({ page }) => {
  await page.goto('/favorites?lista=m101.t201.a301');
  const banner = page.getByRole('region', { name: 'Lista compartilhada' });
  await expect(banner.getByRole('heading', { name: 'Lista compartilhada com 3 títulos' })).toBeVisible();
  await expect(banner.getByText('Kappa Chronicles').first()).toBeVisible();

  await banner.getByRole('button', { name: 'Adicionar à minha lista' }).click();
  await expect(page).not.toHaveURL(/lista=/);
  await expect(page.getByRole('tab', { name: /Tudo/ })).toContainText('3');
  await expect(page.getByRole('tab', { name: /Animes/ })).toContainText('1');
});

test('exporta e importa a lista em arquivo', async ({ page }) => {
  await page.goto('/favorites?lista=m101.m102');
  await page.getByRole('button', { name: 'Adicionar à minha lista' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^reco-cine-lista-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await download.path();

  // Simula outro aparelho: lista vazia, importando o arquivo.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sua lista está vazia' })).toBeVisible();
  await page.getByLabel('Arquivo da lista para importar').setInputFiles(file);
  await expect(page.getByText('2 títulos importados')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(2);
});
