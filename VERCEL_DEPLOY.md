# Instruções para Deploy na Vercel

## Problemas Identificados e Soluções

### 1. Configuração de Variáveis de Ambiente na Vercel

**Problema**: As variáveis de ambiente não estão sendo carregadas corretamente na produção.

**Solução**: Configure as seguintes variáveis no painel da Vercel:

1. Acesse o dashboard da Vercel
2. Vá em Settings > Environment Variables
3. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_TMDB_API_KEY=e0bb469e738be8ca5283b1e040d5dce2
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
NEXT_PUBLIC_JIKAN_BASE_URL=https://api.jikan.moe/v4
```

### 2. Configuração de Build

**Problema**: Scripts JavaScript não estão sendo carregados corretamente.

**Soluções aplicadas**:
- Atualizado `next.config.ts` com configurações otimizadas para produção
- Atualizado `vercel.json` com configurações específicas da Vercel
- Adicionado cache adequado para assets estáticos
- Configurado headers de segurança

### 3. Comandos para Deploy

```bash
# 1. Limpar cache local
rm -rf .next
npm run build

# 2. Testar localmente
npm run start

# 3. Deploy na Vercel
vercel --prod
```

### 4. Verificações Pós-Deploy

1. **Verificar variáveis de ambiente**: Acesse a URL e verifique se as APIs estão funcionando
2. **Verificar console**: Não devem aparecer erros de carregamento de scripts
3. **Verificar performance**: Os assets devem carregar rapidamente
4. **Verificar cache**: Headers de cache devem estar configurados corretamente

### 5. Troubleshooting

Se ainda houver problemas:

1. **Limpar cache da Vercel**:
   ```bash
   vercel --prod --force
   ```

2. **Verificar logs da Vercel**:
   - Acesse o dashboard da Vercel
   - Vá em Functions > View Function Logs

3. **Verificar build logs**:
   - Verifique se o build está sendo executado sem erros
   - Confirme se todas as dependências estão sendo instaladas

### 6. Configurações Adicionais

- **Domínios de imagem**: Configurados para TMDB e MyAnimeList
- **Headers de segurança**: Configurados para proteção XSS e clickjacking
- **Cache**: Configurado para otimizar performance
- **Compressão**: Habilitada para reduzir tamanho dos assets