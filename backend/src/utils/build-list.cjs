/* eslint-disable */
/**
 * Gera disposable-domains-data.ts a partir do arquivo de texto baixado da
 * comunidade. Rodar quando quiser atualizar a lista:
 *
 *   curl -sL https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf -o backend/src/utils/disposable-domains.txt
 *   node backend/src/utils/build-list.cjs
 */
const fs = require('fs')
const path = require('path')

const txtPath = path.join(__dirname, 'disposable-domains.txt')
const tsPath = path.join(__dirname, 'disposable-domains-data.ts')

const lines = fs
  .readFileSync(txtPath, 'utf-8')
  .split('\n')
  .map((l) => l.trim().toLowerCase())
  .filter((l) => l.length > 0 && !l.startsWith('#'))

const header = [
  '// Auto-gerado a partir de disposable-domains.txt — NÃO EDITAR MANUALMENTE.',
  '// Fonte: https://github.com/disposable-email-domains/disposable-email-domains',
  `// Total: ${lines.length} domínios`,
  '// Atualizar com: node backend/src/utils/build-list.cjs',
  '',
  'export const DISPOSABLE_DOMAINS_LIST: readonly string[] = [',
].join('\n')

const body = lines.map((d) => `  '${d.replace(/'/g, "\\'")}',`).join('\n')

fs.writeFileSync(tsPath, `${header}\n${body}\n]\n`)
console.log(`✓ Gerado ${path.basename(tsPath)} com ${lines.length} domínios`)
