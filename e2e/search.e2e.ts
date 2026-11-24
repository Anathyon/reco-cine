import { expect, test } from '@playwright/test';
import { mockApis } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApis(page);
});

test('busca ao vivo guarda o termo na URL', async ({ page }) => {
  await page.goto('/search');
  const input = page.getByRole('searchbox', { name: 'Buscar títulos' });
  await expect(input).toBeFocused();

  await input.fill('alfa');
  await expect(page).toHaveURL(/q=alfa/);
  await expect(page.getByRole('article').filter({ hasText: 'Filme Alfa' })).toBeVisible();

  await page.getByRole('tab', { name: 'Animes' }).click();
  await expect(page).toHaveURL(/type=anime/);
  await expect(page.getByText('Nada encontrado para “alfa”')).toBeVisible();
});

test('abrir a busca com ?q já mostra os resultados', async ({ page }) => {
  await page.goto('/search?q=kappa&type=anime');
  await expect(page.getByRole('searchbox', { name: 'Buscar títulos' })).toHaveValue('kappa');
  await expect(page.getByRole('article').filter({ hasText: 'Kappa Chronicles' })).toBeVisible();
});

test('sem termo, sugere buscas populares', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('button', { name: 'Série Sigma', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Buscar títulos' })).toHaveValue('Série Sigma');
  await expect(page).toHaveURL(/q=S%C3%A9rie(\+|%20)Sigma/);
});
