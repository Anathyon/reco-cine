# 🎬 Reco Cine

Descubra filmes, séries, animes e mangás, assista aos trailers, veja **onde assistir no Brasil** e monte a sua lista — tudo numa interface rápida, responsiva e instalável (PWA).

---

## 📌 Funcionalidades

- **Início com destaques**: banner rotativo da semana e fileiras de tendências, populares, nos cinemas, aclamados, animes da temporada e mangás mais lidos (carregadas sob demanda ao rolar).
- **Catálogos de Filmes, Séries e Animes** com filtros por gênero, ano e **serviço de streaming no Brasil** (Netflix, Prime Video...), ordenação, rolagem infinita e botão **“Surpreenda-me”**. Os filtros ficam na URL.
- **Detalhes completos** em um único modal: trailer embutido, sinopse, elenco, ficha técnica, plataformas de streaming no Brasil (JustWatch via TMDB) e recomendações relacionadas.
- **Página própria para cada título** (`/title/movie/550`), gerada no servidor, com prévia (Open Graph) ao compartilhar no WhatsApp, Telegram e redes sociais.
- **Modal na URL** (`?view=movie-550`): o botão “voltar” do celular fecha o modal. Ctrl/Cmd+clique num card abre a página do título em outra aba.
- **Animes com personagens e dubladores** (MyAnimeList).
- **Mangás** (também manhwas, manhuas e light novels) do MyAnimeList: catálogo por gênero e demografia (shounen, seinen, shoujo), mais populares e mais bem avaliados, detalhes com volumes, capítulos, autoria e revista, **onde ler oficialmente** (MANGA Plus, VIZ, Webtoon… com o idioma de cada um, português primeiro) e recomendações de mangás parecidos.
- **Busca ao vivo e tolerante a erros** em filmes, séries, animes, mangás e pessoas ao mesmo tempo:
  - **“Você quis dizer…”**: erros de digitação são corrigidos (“the wolking ded” → *The Walking Dead*, “leonardo dicapro” → *Leonardo DiCaprio*). Se a busca não acha nada, os resultados da grafia corrigida aparecem sozinhos, como no Google.
  - **Busca por atores e diretores**, com página própria (`/person/6193`) mostrando a filmografia. O elenco de cada título também leva a essa página.
  - Quando nada é encontrado, mostra **títulos parecidos** com o que foi digitado.
  - Resultados +18 na busca só para quem entra na conta e tem 18 anos ou mais (chave “Mostrar resultados +18”). Listas e catálogos nunca mostram esses títulos.
- **Sinopses traduzidas automaticamente** para o idioma do navegador (ex.: as de anime, que vêm em inglês), com a opção “Ver original”. Vale também para filmes/séries sem sinopse em português e biografias.
- **Login com Google** (Firebase): a lista fica salva na conta e sincroniza em tempo real entre aparelhos. O que foi salvo antes de entrar é somado à conta. Sem login, tudo continua funcionando com a lista no aparelho.
- **Minha lista**: favoritos salvos no dispositivo (ou na conta), com filtros, ordenação e opção de desfazer. Para levar a outro aparelho: **link de compartilhamento** (`/favorites?lista=m550.t1396`) ou **backup em arquivo** (exportar/importar).
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
- **[MyAnimeList](https://myanimelist.net/apiconfig/references/api/v2)** (API oficial v2) — animes e mangás. As chamadas passam pelas rotas `/api/anime/*` e `/api/manga/*`, então **o Client ID fica só no servidor**. A API oficial não filtra por gênero (o filtro é feito no servidor) e não tem personagens nem trailers.
- **[Jikan](https://jikan.moe/)** — complemento opcional: personagens, dubladores, trailers e onde assistir. Se estiver fora do ar, essas seções só ficam vazias.

- **[AniList](https://docs.anilist.co/)** (API GraphQL pública, grátis e sem chave) — links oficiais de onde ler cada mangá e de onde assistir cada anime (complementa a Jikan). A consulta usa o ID do MyAnimeList, é feita no servidor e, se a AniList falhar, a página segue sem esses links.
- **Busca tolerante a erros**: a rota `/api/search/catalog` monta (uma vez por dia, em cache na CDN) um índice com ~4 mil títulos e pessoas populares do TMDB e do MyAnimeList. O navegador baixa esse índice e compara o que foi digitado palavra por palavra (distância de Damerau-Levenshtein, sem acentos), em ~10 ms. Para o que não está no índice, `/api/search/spell` usa as sugestões de busca do Google.
- **Tradução**: `/api/translate/{tipo}/{id}` busca o texto original no servidor e traduz com o endpoint público do Google Tradutor (gratuito, sem chave e **não oficial**: pode ficar indisponível; nesse caso o original é mostrado). As traduções ficam 30 dias em cache.
- **[Firebase](https://firebase.google.com/)** — login com Google (Authentication) e lista de cada pessoa no Firestore, em `users/{uid}/favorites/{tipo-id}`. O SDK é carregado sob demanda. As regras em `firestore.rules` garantem que cada pessoa só lê e escreve a própria lista. A data de nascimento (para a busca +18) fica em `users/{uid}` e não pode ser alterada depois de salva; o servidor confere login e idade a cada busca +18, lendo esse documento com o token da própria pessoa.

---

## 🔐 Configurando o login (Firebase)

1. Em [console.firebase.google.com](https://console.firebase.google.com), crie um projeto e adicione um **App da Web**. Copie os valores do `firebaseConfig` para as variáveis `NEXT_PUBLIC_FIREBASE_*`.
2. **Authentication → Método de login → Google**: ative.
3. **Authentication → Configurações → Domínios autorizados**: adicione o domínio do site na Vercel (`localhost` já vem incluído).
4. **Google Cloud → APIs e serviços → [Credenciais](https://console.cloud.google.com/apis/credentials)** → cliente OAuth *Web client (auto created by Google Service)* → **URIs de redirecionamento autorizados**: adicione `https://SEU-DOMINIO/__/auth/handler`. Em produção o login passa pelo próprio domínio do site (o `next.config.ts` repassa `/__/auth/*` ao Firebase), para não depender de cookies de terceiros, que Brave, Firefox, Safari e o Chrome com bloqueio descartam.
5. **Firestore Database**: crie o banco (modo produção) e publique as regras de `firestore.rules`, colando no console (aba *Regras*) ou com `npm run deploy:rules` (precisa do [CLI do Firebase](https://firebase.google.com/docs/cli): `npm i -g firebase-tools` e `firebase login`; funciona no plano gratuito).

As chaves `NEXT_PUBLIC_FIREBASE_*` são públicas por natureza (identificam o projeto); quem protege os dados são as regras do Firestore.

---

## 🚀 Deploy na Vercel

Variáveis de ambiente (veja `.env.example`):

| Variável | Obrigatória | Valor |
|----------|-------------|-------|
| `NEXT_PUBLIC_TMDB_API_KEY` (ou `TMDB_API_KEY`) | ✅ | Chave v3 do TMDB |
| `NEXT_PUBLIC_TMDB_BASE_URL` | | `https://api.themoviedb.org/3` |
| `NEXT_PUBLIC_TMDB_IMAGE_BASE` | | `https://image.tmdb.org/t/p` |
| `MAL_CLIENT_ID` | ✅ | Client ID do app em [myanimelist.net/apiconfig](https://myanimelist.net/apiconfig) |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID` | | Config do app da Web no Firebase. Sem elas, o login fica desativado. |
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