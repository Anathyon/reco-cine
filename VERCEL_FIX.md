# 🔧 Fix para Erros de Service Worker na Vercel

## Problema Identificado
O Service Worker estava interceptando requisições do Next.js (`_next/static/*`) causando erros 503.

## ✅ Soluções Implementadas

### 1. Service Worker Simplificado
- Removida interceptação de assets do Next.js
- Mantido cache apenas para APIs externas (TMDB, Jikan)
- Versão minimalista que não interfere com o Next.js

### 2. Registro Seguro
- Service Worker registrado apenas em produção
- Tratamento de erros silencioso

### 3. Cache Strategy
- Network-first para APIs externas
- Fallback para cache offline
- Não intercepta `_next/static/*`

## 🚀 Deploy na Vercel

1. **Faça push das alterações**
2. **Redeploy na Vercel** (automático)
3. **Limpe o cache do navegador** (Ctrl+Shift+R)

## 🧪 Teste Local

```bash
npm run build
npm start
```

## 📝 Alterações Feitas

- `public/sw.js` - Service Worker simplificado
- `src/pages/_app.tsx` - Registro seguro do SW
- `vercel.json` - Configuração otimizada

O projeto agora deve funcionar perfeitamente na Vercel sem erros de Service Worker! 🎉