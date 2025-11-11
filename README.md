# 🎬 Reco Cine - Plataforma de Recomendações Cinematográficas

Uma plataforma moderna e intuitiva para descobrir **filmes**, **séries** e **animes**, desenvolvida com **Next.js + TypeScript**, que oferece recomendações personalizadas e um sistema de busca avançado.

> 🚀 Um projeto que combina **design responsivo**, **performance otimizada** e **experiência do usuário** excepcional para os amantes do entretenimento.

---

## 📌 Funcionalidades Principais

- ✅ **Descoberta Inteligente** com tendências e recomendações aleatórias para filmes, séries e animes
- ✅ **Sistema de Busca Avançado** com abas separadas para diferentes tipos de conteúdo
- ✅ **Filtros por Gênero** que afetam tanto tendências quanto recomendações
- ✅ **Botão Aleatório** para descobrir novos títulos a cada clique
- ✅ **Modais Detalhados** com informações completas de cada título
- ✅ **Sistema de Favoritos** para salvar seus conteúdos preferidos
- ✅ **Interface Responsiva** otimizada para **mobile, tablet e desktop**
- ✅ **PWA (Progressive Web App)** com instalação offline

---

## 🎯 Experiência de Descoberta Única

### Sistema de Recomendações Inteligente
- **Tendências**: Sempre atualizadas com os conteúdos mais populares
- **Recomendações**: Algoritmo que evita repetições e promove descobertas
- **Aleatoriedade**: Cada clique no botão "Aleatório" traz conteúdo completamente novo

### Filtros Dinâmicos
Quando você seleciona um gênero:
- **Tendências** se adaptam para mostrar os melhores do gênero
- **Recomendações** se focam no gênero escolhido
- **Variedade** garantida através de múltiplas fontes de dados

---

## 🔍 Sistema de Busca Avançado

Busque por qualquer título com nosso sistema de abas inteligente:

- **Filmes/Séries**: Integração com TMDB para catálogo completo
- **Animes**: Integração com Jikan API (MyAnimeList) para máxima cobertura
- **Resultados Instantâneos** com informações detalhadas
- **Modais Específicos** para cada tipo de conteúdo

---

## 💾 Gerenciamento de Favoritos

- **Armazenamento Local** seguro e privado
- **Sincronização** entre diferentes seções da aplicação
- **Interface Intuitiva** para adicionar/remover favoritos
- **Persistência** dos dados entre sessões

---

## 🛠️ Tecnologias e Arquitetura

| Tecnologia | Descrição |
|------------|-----------|
| [Next.js 15](https://nextjs.org/) | Framework React com SSR, otimização automática e roteamento |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática para código mais robusto e manutenível |
| [Tailwind CSS 4](https://tailwindcss.com/) | Framework CSS utilitário para estilização rápida e consistente |
| [Zustand](https://zustand-demo.pmnd.rs/) | Gerenciamento de estado leve e eficiente |
| [Framer Motion](https://www.framer.com/motion/) | Animações fluidas e interações avançadas |
| [Axios](https://axios-http.com/) | Cliente HTTP para integração com APIs |

### APIs Integradas
- **TMDB API**: Base de dados completa de filmes e séries
- **Jikan API**: API não-oficial do MyAnimeList para animes

---

## 📱 Design Responsivo e PWA

### Layout Adaptativo
- **Mobile-First**: Otimizado para dispositivos móveis
- **Touch-Friendly**: Botões e interações pensadas para touch
- **Performance**: Carregamento otimizado de imagens e dados

### Progressive Web App
- **Instalação**: Pode ser instalado como app nativo
- **Offline**: Funcionalidades básicas disponíveis offline
- **Notificações**: Sistema de notificações (futuro)

---

## 🌐 Deploy e Hospedagem

> ✅ Aplicação otimizada para produção com deploy automatizado!

**Stack de Deploy:**
- **Vercel**: Hospedagem com CDN global
- **Edge Functions**: Performance otimizada
- **Automatic Deployments**: Deploy automático via Git

---

## 📦 Instalação e Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/Anathyon/reco-cine.git
cd reco-cine

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Adicione suas chaves de API:
# NEXT_PUBLIC_TMDB_API_KEY=sua_chave_tmdb
# NEXT_PUBLIC_JIKAN_BASE_URL=https://api.jikan.moe/v4

# Execute em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_TMDB_API_KEY=sua_chave_da_tmdb
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
NEXT_PUBLIC_JIKAN_BASE_URL=https://api.jikan.moe/v4
```

---

## 🎨 Estrutura do Projeto

```
src/
├── api/           # Integrações com APIs externas
├── components/    # Componentes React reutilizáveis
├── hooks/         # Custom hooks
├── pages/         # Páginas da aplicação (Next.js)
├── store/         # Gerenciamento de estado (Zustand)
├── styles/        # Estilos globais
└── types/         # Definições de tipos TypeScript
```

---

## 🚀 Funcionalidades Futuras

- [ ] **Sistema de Avaliações** pessoais
- [ ] **Listas Personalizadas** (assistir depois, já assistido)
- [ ] **Recomendações por IA** baseadas no histórico
- [ ] **Modo Offline** completo
- [ ] **Compartilhamento Social** de listas e favoritos
- [ ] **Notificações** de novos lançamentos
- [ ] **Integração com Streaming** (onde assistir)

---

## 🤝 Contribuições

Contribuições, sugestões e relatórios de bugs são sempre bem-vindos! 

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Desenvolvido com dedicação por:** Anathyon Erysson

- 📫 **Email**: anathyon@protonmail.com
- 🔗 **LinkedIn**: [Anathyon Erysson](https://linkedin.com/in/anathyon-erysson)
- 🐱 **GitHub**: [@anathyon](https://github.com/anathyon)

---

## ⭐ Apoie o Projeto

Se este projeto foi útil para você, considere dar uma ⭐ no repositório!

---

*Feito com ❤️ e muito ☕ por Anathyon Erysson*
