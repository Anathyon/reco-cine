# 🎬 Recomendações Cinematográficas

Uma aplicação web moderna e elegante para descobrir filmes, séries e animes com recomendações personalizadas e interface responsiva.

> 🚀 Um projeto que une **design responsivo**, performance e usabilidade com as melhores práticas de desenvolvimento frontend.

---

## 📌 Funcionalidades Principais

- ✅ **Catálogo Completo** de filmes, séries e animes populares
- ✅ **Sistema de Busca Avançada** com filtros por gênero
- ✅ **Modais Interativos** com detalhes completos de cada título
- ✅ **Sistema de Favoritos** com armazenamento local
- ✅ **PWA (Progressive Web App)** - instalável como app nativo
- ✅ **Interface Responsiva** adaptada para **mobile, tablet e desktop**
- ✅ **Animações Fluidas** com Framer Motion
- ✅ **Performance Otimizada** com lazy loading e cache inteligente

---

## ✨ Experiência Visual Moderna

Interface elegante com design dark theme, cards interativos e navegação intuitiva. Cada seção (filmes, séries, animes) mantém consistência visual com hover effects e transições suaves.

**Principais Seções:**
- **Home:** Catálogo unificado com destaques de cada categoria
- **Filmes:** Exploração completa do cinema com filtros por gênero
- **Séries:** Descoberta de séries populares e bem avaliadas
- **Animes:** Integração com MyAnimeList para conteúdo anime
- **Favoritos:** Gerenciamento pessoal de títulos salvos
- **Busca:** Sistema de pesquisa global com resultados em tempo real

---

## 🧪 Tecnologias e Arquitetura

| Tecnologia | Descrição |
|------------|----------|
| [Next.js 15](https://nextjs.org/) | Framework React com SSR, otimização automática e roteamento |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática para código mais robusto e manutenível |
| [Tailwind CSS 4](https://tailwindcss.com/) | Framework CSS utilitário para estilização rápida e consistente |
| [Zustand](https://zustand-demo.pmnd.rs/) | Gerenciamento de estado leve e performático |
| [Framer Motion](https://www.framer.com/motion/) | Biblioteca de animações declarativas para React |
| [Jest](https://jestjs.io/) | Framework de testes unitários e de integração |
| [PWA](https://web.dev/progressive-web-apps/) | Service Worker para funcionalidade offline e instalação |

---

## 📊 Integração com APIs Externas

**APIs Utilizadas:**
- **[TMDB API](https://www.themoviedb.org/documentation/api)** - Base de dados completa de filmes e séries
- **[Jikan API](https://jikan.moe/)** - Interface não-oficial do MyAnimeList para dados de anime

**Recursos das APIs:**
- Catálogos populares e bem avaliados
- Detalhes completos (sinopse, elenco, avaliações)
- Imagens em alta qualidade (posters e backdrops)
- Sistema de busca com filtros avançados

---

## 🚀 Deploy e Hospedagem

### Pré-requisitos
- Conta no [TMDB](https://www.themoviedb.org/settings/api) para obter API key
- Conta na [Vercel](https://vercel.com) para deploy

### Variáveis de Ambiente
```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_JIKAN_BASE_URL=https://api.jikan.moe/v4
```

### Deploy Automático na Vercel
1. **Fork/Clone** o repositório
2. **Conecte** à Vercel via GitHub
3. **Configure** as variáveis de ambiente
4. **Deploy** automático detectado como projeto Next.js

---

## 🛠️ Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/recomendacoes-cine.git
cd recomendacoes-cine

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas API keys

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Execute a versão de produção
npm start

# Execute os testes
npm test

# Execute os testes em modo watch
npm run test:watch

# Execute os testes com coverage
npm run test:coverage
```

---

## 🎯 Performance e Otimizações

- ✅ **Build Otimizado** (< 150kB First Load JS)
- ✅ **Imagens Responsivas** com Next.js Image
- ✅ **Lazy Loading** para componentes e imagens
- ✅ **Cache Inteligente** para requisições de API
- ✅ **Code Splitting** automático
- ✅ **PWA** com cache offline
- ✅ **SEO Otimizado** com meta tags dinâmicas
- ✅ **Testes Automatizados** com Jest e Testing Library

---

## 🤝 Contribuições

Contribuições, sugestões e relatórios de bugs são sempre bem-vindos! Sinta-se à vontade para abrir uma issue ou um pull request no repositório.

---

## 👨‍💻 Autor

Desenvolvido com dedicação por: **Anathyon Erysson**

- 📫 Email: anathyon@protonmail.com
- 🔗 LinkedIn: Anathyon Erysson