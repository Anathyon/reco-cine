# Reco Cine 🎬

Uma aplicação web moderna para descobrir filmes, séries e animes com recomendações personalizadas.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta no [TMDB](https://www.themoviedb.org/settings/api) para obter API key
- Conta na [Vercel](https://vercel.com)

### Passos para Deploy

1. **Fork/Clone o repositório**
2. **Configure as variáveis de ambiente na Vercel:**
   - `NEXT_PUBLIC_TMDB_API_KEY`: Sua chave da API do TMDB
   - `NEXT_PUBLIC_MAL_CLIENT_ID`: (Opcional) Client ID do MyAnimeList

3. **Deploy automático:**
   - Conecte seu repositório GitHub à Vercel
   - A Vercel detectará automaticamente que é um projeto Next.js
   - O deploy será feito automaticamente

### Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_MAL_CLIENT_ID=your_mal_client_id_here
```

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm start

# Executar testes
npm test
```

## 📱 Funcionalidades

- ✅ Descoberta de filmes e séries populares
- ✅ Busca avançada com filtros
- ✅ Sistema de favoritos
- ✅ Recomendações personalizadas
- ✅ Integração com animes (MyAnimeList)
- ✅ PWA (Progressive Web App)
- ✅ Design responsivo
- ✅ Otimizado para performance

## 🔧 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **Zustand** - Gerenciamento de estado
- **Framer Motion** - Animações
- **Axios** - Requisições HTTP

## 📊 APIs Utilizadas

- [TMDB API](https://www.themoviedb.org/documentation/api) - Filmes e séries
- [Jikan API](https://jikan.moe/) - Animes (MyAnimeList)

## 🎯 Performance

- ✅ Build otimizado (< 150kB First Load JS)
- ✅ Imagens otimizadas
- ✅ Cache inteligente
- ✅ Lazy loading
- ✅ PWA com service worker