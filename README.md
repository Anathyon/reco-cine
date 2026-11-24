# 🎬 Reco Cine

Descubra filmes, séries e animes, assista aos trailers, veja **onde assistir no Brasil** e monte a sua lista — tudo numa interface rápida, responsiva e instalável (PWA).

---

## 📌 Funcionalidades

- **Início com destaques**: banner rotativo da semana e fileiras de tendências, populares, nos cinemas, aclamados e animes da temporada (carregadas sob demanda ao rolar).
- **Catálogos de Filmes, Séries e Animes** com filtros por gênero, ano e **serviço de streaming no Brasil** (Netflix, Prime Video...), ordenação, rolagem infinita e botão **“Surpreenda-me”**. Os filtros ficam na URL.
- **Detalhes completos** em um único modal: trailer embutido, sinopse, elenco, ficha técnica, plataformas de streaming no Brasil (JustWatch via TMDB) e recomendações relacionadas.
- **Página própria para cada título** (`/title/movie/550`), gerada no servidor, com prévia (Open Graph) ao compartilhar no WhatsApp, Telegram e redes sociais.
- **Modal na URL** (`?view=movie-550`): o botão “voltar” do celular fecha o modal. Ctrl/Cmd+clique num card abre a página do título em outra aba.
- **Animes com personagens e dubladores** (MyAnimeList).
- **Busca ao vivo** em filmes, séries e animes ao mesmo tempo, com sugestões quando o campo está vazio.
- **Minha lista**: favoritos salvos no dispositivo, com filtros, ordenação e opção de desfazer. Para levar a outro aparelho: **link de compartilhamento** (`/favorites?lista=m550.t1396`) ou **backup em arquivo** (exportar/importar).
- **Mobile first**: navegação inferior no celular, áreas de toque generosas, skeletons de carregamento.
- **Acessibilidade**: navegação por teclado, foco visível, `Esc` fecha o modal, suporte a `prefers-reduced-motion`.
- **PWA**: instalável, com cache de imagens e respostas para uso offline.
- **Página inicial pré-renderizada (ISR)**: o destaque e a primeira fileira já chegam no HTML e são atualizados a cada hora.

---

## 🧪 Tecnologias

| Tecnologia | Uso |
|------------|-----|
| [Next.js 15](https://nextjs.org/) (Pages Router) | Roteamento, rota de API (proxy do TMDB) e build |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [Tailwind CSS 3](https://tailwindcss.com/) | Estilização e design system (tema em `tailwind.config.js`) |
| [Zustand](https://zustand-demo.pmnd.rs/) | Estado global (favoritos persistidos, toasts) |
| [Framer Motion](https://www.framer.com/motion/) | Animações do modal, banner e toasts |

### Estrutura

```
src/
  components/     layout (Header, BottomNav, Footer), media (cards, fileiras, grade, modal) e ui
  hooks/          useQuery (cache), useInfiniteList, useDetailsRoute, useDebounce, useInView
  lib/            clientes TMDB e MyAnimeList normalizados para um formato único (MediaItem);
                  *Server.ts só rodam no servidor (leem a chave)
  pages/          páginas, title/[type]/[id] (página do título) e api/tmdb/[...path].ts (proxy)
e2e/              testes de ponta a ponta (Playwright) e mocks das APIs
  store/          favoritos e toasts
```

---

## 📊 APIs

- **[TMDB](https://developer.themoviedb.org/)** — filmes e séries (em pt-BR). As chamadas passam pela rota `/api/tmdb/*`, então **a chave fica só no servidor** e as respostas são cacheadas na CDN.
- **[MyAnimeList](https://myanimelist.net/apiconfig/references/api/v2)** (API oficial v2) — animes. As chamadas passam pela rota `/api/anime/*`, então **o Client ID fica só no servidor**. A API oficial não filtra por gênero (o filtro é feito no servidor) e não tem personagens nem trailers.
- **[Jikan](https://jikan.moe/)** — complemento opcional: personagens, dubladores, trailers e onde assistir. Se estiver fora do ar, essas seções só ficam vazias.

---

## 🚀 Deploy na Vercel

Variáveis de ambiente (veja `.env.example`):

| Variável | Obrigatória | Valor |
|----------|-------------|-------|
| `NEXT_PUBLIC_TMDB_API_KEY` (ou `TMDB_API_KEY`) | ✅ | Chave v3 do TMDB |
| `NEXT_PUBLIC_TMDB_BASE_URL` | | `https://api.themoviedb.org/3` |
| `NEXT_PUBLIC_TMDB_IMAGE_BASE` | | `https://image.tmdb.org/t/p` |
| `MAL_CLIENT_ID` | ✅ | Client ID do app em [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig) |
| `NEXT_PUBLIC_JIKAN_BASE_URL` | | `https://api.jikan.moe/v4` |
| `NEXT_PUBLIC_SITE_URL` | | URL pública do site, para os links das prévias. Na Vercel é detectada automaticamente. |

> Apesar do prefixo `NEXT_PUBLIC_`, a chave do TMDB só é lida pela rota de API e não vai para o navegador. Para deixar isso explícito, você pode renomeá-la para `TMDB_API_KEY`.

---

## 🛠️ Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # preencha a chave do TMDB
npm run dev                  # http://localhost:3000
npm run build && npm start   # versão de produção
```

### Testes e qualidade

```bash
npm test                 # testes unitários (Jest + Testing Library)
npm run test:coverage    # com relatório de cobertura
npm run check            # tipos + lint + testes (rode antes de cada push)

npx playwright install chromium   # uma vez
npm run test:e2e         # testes de ponta a ponta (desktop e celular)
npm run test:e2e:ui      # modo visual, para depurar
```

- **Unitários** (Jest): pastas `__tests__` ao lado do código.
- **Ponta a ponta** (Playwright): pasta `e2e/`. Todas as APIs são simuladas em `e2e/mocks.ts`, então não precisam de chave nem de internet.
- **CI** (GitHub Actions, `.github/workflows/ci.yml`): a cada push e pull request roda tipos, lint, testes unitários, build e testes de ponta a ponta.

---

## 🤝 Contribuições

Contribuições, sugestões e relatórios de bugs são sempre bem-vindos! Sinta-se à vontade para abrir uma issue ou um pull request no repositório.

---

## 👨‍💻 Autor

Desenvolvido com dedicação por: **Anathyon Erysson**

- 📫 Email: anathyon@protonmail.com
- 🔗 LinkedIn: Anathyon Erysson