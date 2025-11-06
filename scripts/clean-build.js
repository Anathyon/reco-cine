const fs = require('fs');
const path = require('path');

// Função para remover diretório recursivamente
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Removido: ${dirPath}`);
  }
}

// Limpar cache e build
console.log('🧹 Limpando cache e build...');

removeDir(path.join(__dirname, '..', '.next'));
removeDir(path.join(__dirname, '..', 'node_modules', '.cache'));

console.log('✨ Limpeza concluída!');
console.log('📦 Execute: npm install && npm run build');