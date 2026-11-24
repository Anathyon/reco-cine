import { expect, test } from '@playwright/test';
import { mockApis } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApis(page);
});

test('início mostra o destaque e as fileiras', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Destaques da semana' });
  await expect(hero.getByRole('heading', { level: 1 })).toHaveText('Filme Alfa');
  await expect(page.getByRole('heading', { name: 'Em alta hoje' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Filmes populares' })).toBeVisible();
});

test('card abre o modal; Esc e "voltar" fecham', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('link', { name: /Filme Beta \(2023\) — ver detalhes/ }).first();
  const dialog = page.getByRole('dialog');

  await card.click();
  await expect(dialog.getByRole('heading', { level: 2, name: 'Filme Beta' })).toBeVisible();
  await expect(page).toHaveURL(/view=movie-102/);
  await expect(dialog.getByText('Diretora Exemplo')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/view=/);

  await card.click();
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test('trailer abre dentro do modal', async ({ page }) => {
  await page.goto('/?view=movie-101');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Assistir trailer' }).click();
  await expect(dialog.locator('iframe[title="Trailer de Filme Alfa"]')).toBeVisible();
});

test('link compartilhado com ?view abre o modal direto e fecha sem sair do site', async ({ page }) => {
  await page.goto('/movies?view=tv-201');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { level: 2, name: 'Série Ômega' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Fechar detalhes' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/movies$/);
});

test('página própria do título', async ({ page }) => {
  await page.goto('/title/movie/101');
  await expect(page.getByRole('heading', { level: 1, name: 'Filme Alfa' })).toBeVisible();
  await expect(page.getByText('Toda história tem um começo.')).toBeVisible();
  await expect(page).toHaveTitle(/Reco Cine/);
  await page.getByRole('main').getByRole('link', { name: 'Filmes', exact: true }).click();
  await expect(page).toHaveURL(/\/movies$/);
});

test('anime mostra personagens e dubladores', async ({ page }) => {
  await page.goto('/title/anime/301');
  await expect(page.getByRole('heading', { level: 1, name: 'Kappa Chronicles' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Personagens' })).toBeVisible();
  await expect(page.getByText('Voz: Dubladora Exemplo')).toBeVisible();
});

test('sinopse de anime é traduzida, com opção de ver o original', async ({ page }) => {
  await page.goto('/title/anime/301');
  await expect(page.getByText('Texto traduzido anime 301.')).toBeVisible();
  await page.getByRole('button', { name: 'Ver original' }).click();
  await expect(page.getByText('Sinopse de Anime Kappa.')).toBeVisible();
});

test('rotas inválidas dão 404 amigável', async ({ page }) => {
  const response = await page.goto('/title/person/1');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Essa cena foi cortada' })).toBeVisible();
});

test('no celular, a navegação fica na barra inferior', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'só no celular');
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Navegação' }).getByRole('link', { name: 'Séries' }).click();
  await expect(page).toHaveURL(/\/series$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Séries' })).toBeVisible();
});
