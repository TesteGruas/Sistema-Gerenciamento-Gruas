#!/bin/bash

# Script para testar todas as APIs da visualização da obra 107
# Token fornecido pelo usuário
TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6ImIza0FDV3E2dGdIeTRmQWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21naGRrdGtvZWpvYnNtZGJ2c3NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjNjZDVhOC0yOTkxLTQwYTItODIzNy1jNjRhZmM0MzEzMjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwMTY2MTA3LCJpYXQiOjE3NzAxNjI1MDcsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiQWRtaW5pc3RyYWRvciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicm9sZSI6ImFkbWluIiwic3ViIjoiNmIzY2Q1YTgtMjk5MS00MGEyLTgyMzctYzY0YWZjNDMxMzIwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzAxNjI1MDd9XSwic2Vzc2lvbl9pZCI6IjU5MzQzZTlhLWZhM2UtNGE2My05MzYzLThlYzY1NzNhZDg1MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.3Hupv5gnU9e74DQxjK4F8gZaZEkt-jdHx9GWi8POcH8"
BASE_URL="http://localhost:3001/api"
OBRA_ID=107

echo "═══════════════════════════════════════════════════════════"
echo "🧪 TESTE DE TODAS AS APIs DA OBRA $OBRA_ID"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. GET /api/obras/107 - Dados principais da obra
echo "1️⃣ GET /api/obras/$OBRA_ID"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/obras/$OBRA_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | {id, nome, cliente_id, status, grua_obra: (.grua_obra | length), funcionarios_obras: (.grua_funcionario | length), sinaleiros_obra: (.sinaleiros_obra | length), responsaveis_tecnicos: (.responsaveis_tecnicos | length)}'
echo ""

# 2. GET /api/funcionarios-obras?obra_id=107 - Funcionários vinculados
echo "2️⃣ GET /api/funcionarios-obras?obra_id=$OBRA_ID"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/funcionarios-obras?obra_id=$OBRA_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length, .[] | {id, nome: .funcionarios.nome, cargo: .funcionarios.cargo_info.nome}'
echo ""

# 3. GET /api/obras/107/sinaleiros - Sinaleiros
echo "3️⃣ GET /api/obras/$OBRA_ID/sinaleiros"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/obras/$OBRA_ID/sinaleiros" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length, .[] | {nome, tipo, rg_cpf}'
echo ""

# 4. GET /api/obras/107/responsaveis-tecnicos - Responsáveis técnicos
echo "4️⃣ GET /api/obras/$OBRA_ID/responsaveis-tecnicos"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/obras/$OBRA_ID/responsaveis-tecnicos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length, .[] | {nome, tipo, crea}'
echo ""

# 5. GET /api/arquivos/obra/107 - Arquivos da obra (todas as categorias)
echo "5️⃣ GET /api/arquivos/obra/$OBRA_ID"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/arquivos/obra/$OBRA_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length, .[] | {nome_original, categoria, tipo_arquivo}'
echo ""

# 6. GET /api/arquivos/obra/107?categoria=manual_tecnico
echo "6️⃣ GET /api/arquivos/obra/$OBRA_ID?categoria=manual_tecnico"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/arquivos/obra/$OBRA_ID?categoria=manual_tecnico" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length'
echo ""

# 7. GET /api/arquivos/obra/107?categoria=termo_entrega_tecnica
echo "7️⃣ GET /api/arquivos/obra/$OBRA_ID?categoria=termo_entrega_tecnica"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/arquivos/obra/$OBRA_ID?categoria=termo_entrega_tecnica" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length'
echo ""

# 8. GET /api/arquivos/obra/107?categoria=plano_carga
echo "8️⃣ GET /api/arquivos/obra/$OBRA_ID?categoria=plano_carga"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/arquivos/obra/$OBRA_ID?categoria=plano_carga" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length'
echo ""

# 9. GET /api/arquivos/obra/107?categoria=aterramento
echo "9️⃣ GET /api/arquivos/obra/$OBRA_ID?categoria=aterramento"
echo "───────────────────────────────────────────────────────────"
curl -s -X GET "$BASE_URL/arquivos/obra/$OBRA_ID?categoria=aterramento" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.success, .data | length'
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ TESTE CONCLUÍDO"
echo "═══════════════════════════════════════════════════════════"
