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

test('erro de digitação: corrige sozinho quando não acha nada', async ({ page }) => {
  await page.goto('/search?q=flime%20alfa');
  await expect(page.getByText(/Nenhum resultado para “flime alfa”. Mostrando resultados para/)).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: 'Filme Alfa' })).toBeVisible();
});

test('busca por ator leva à filmografia', async ({ page }) => {
  await page.goto('/search?q=atriz%20exemplo');
  await page.getByRole('link', { name: 'Atriz Exemplo — ver filmografia' }).click();
  await expect(page).toHaveURL(/\/person\/1$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Atriz Exemplo' })).toBeVisible();
  await expect(page.getByText('Texto traduzido person 1.')).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: 'Filme Alfa' })).toBeVisible();
});
