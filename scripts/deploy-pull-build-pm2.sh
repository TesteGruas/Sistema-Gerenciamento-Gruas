#!/usr/bin/env bash
#
# Uso no servidor (na pasta do projeto ou de qualquer lugar):
#   bash scripts/deploy-pull-build-pm2.sh
# ou, após chmod +x:
#   ./scripts/deploy-pull-build-pm2.sh
#
# Executa: git pull → npm install → npm run build → pm2 restart all --update-env
#

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f package.json ]]; then
  echo "Erro: package.json não encontrado em $ROOT"
  exit 1
fi

echo "==> Diretório: $ROOT"
echo "==> git pull"
git pull

echo "==> npm install (atualiza node_modules após mudanças no package.json)"
npm install

echo "==> npm run build"
npm run build

echo "==> pm2 restart all --update-env"
pm2 restart all --update-env

echo "==> Concluído."
