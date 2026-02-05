#!/bin/bash

# Script para buscar todos os funcionários usando curl
# 
# Uso:
#   chmod +x scripts/curl-todos-funcionarios.sh
#   ./scripts/curl-todos-funcionarios.sh

API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-seu_token_aqui}"  # Substitua pelo seu token

echo "🔍 Buscando todos os funcionários..."
echo "API: $API_URL"
echo ""

# Buscar primeira página para ver quantas páginas existem
PAGE=1
LIMIT=100  # Limite máximo
TOTAL_FUNCIONARIOS=0

while true; do
  echo "📄 Buscando página $PAGE..."
  
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "${API_URL}/api/funcionarios?page=${PAGE}&limit=${LIMIT}")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Erro HTTP $HTTP_CODE"
    echo "$BODY"
    exit 1
  fi
  
  # Extrair dados usando jq (se disponível) ou mostrar JSON bruto
  if command -v jq &> /dev/null; then
    COUNT=$(echo "$BODY" | jq '.data | length')
    TOTAL_PAGES=$(echo "$BODY" | jq '.pagination.pages')
    CURRENT_PAGE=$(echo "$BODY" | jq '.pagination.page')
    
    echo "✅ Página $CURRENT_PAGE: $COUNT funcionários"
    TOTAL_FUNCIONARIOS=$((TOTAL_FUNCIONARIOS + COUNT))
    
    # Salvar em arquivo
    echo "$BODY" | jq '.data' > "funcionarios-pagina-${PAGE}.json"
    
    if [ "$CURRENT_PAGE" -ge "$TOTAL_PAGES" ]; then
      break
    fi
    
    PAGE=$((PAGE + 1))
  else
    echo "$BODY" | python3 -m json.tool
    echo ""
    echo "💡 Instale 'jq' para melhor formatação: brew install jq"
    break
  fi
done

echo ""
echo "✅ Total de funcionários encontrados: $TOTAL_FUNCIONARIOS"
echo "💾 Arquivos salvos: funcionarios-pagina-*.json"
