#!/bin/bash

# Script para criar uma obra e atrelar sinaleiros (cliente e interno)
# IMPORTANTE: O token expirou. Você precisa fornecer um novo token válido.
# Para obter um novo token, faça login na aplicação e copie o token do localStorage ou das requisições.

# Token fornecido pelo usuário
TOKEN="${TOKEN:-eyJhbGciOiJIUzI1NiIsImtpZCI6ImIza0FDV3E2dGdIeTRmQWQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21naGRrdGtvZWpvYnNtMGJ2c3NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2YjNjZDVhOC0yOTkxLTQwYTItODIzNy1jNjRhZmM0MzEzMjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwMTY2MTA3LCJpYXQiOjE3NzAxNjI1MDcsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiQWRtaW5pc3RyYWRvciIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicm9sZSI6ImFkbWluIiwic3ViIjoiNmIzY2Q1YTgtMjk5MS00MGEyLTgyMzctYzY0YWZjNDMxMzIwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzAxNjI1MDd9XSwic2Vzc2lvbl9pZCI6IjU5MzQzZTlhLWZhM2UtNGE2My05MzYzLThlYzY1NzNhZDg1MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.3Hupv5gnU9e74DQxjK4F8gZaZEkt-jdHx9GWi8POcH8}"
BASE_URL="http://localhost:3001/api"

echo "═══════════════════════════════════════════════════════════"
echo "🧪 TESTE - CRIAR OBRA COM SINALEIROS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Token já está configurado

# 1. Buscar usuário Fernanda
echo "1️⃣ Buscando usuário 'Fernanda'..."
FERNANDA_RESPONSE=$(curl -s -X GET "$BASE_URL/funcionarios" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# Verificar se há erro de autenticação
if echo "$FERNANDA_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Erro de autenticação!"
  echo "$FERNANDA_RESPONSE" | jq .
  exit 1
fi

FERNANDA_ID=$(echo "$FERNANDA_RESPONSE" | jq -r '.data[]? | select(.nome | test("fernanda|FERNANDA"; "i")) | .id' | head -1)
FERNANDA_NOME=$(echo "$FERNANDA_RESPONSE" | jq -r '.data[]? | select(.nome | test("fernanda|FERNANDA"; "i")) | .nome' | head -1)
FERNANDA_CPF=$(echo "$FERNANDA_RESPONSE" | jq -r '.data[]? | select(.nome | test("fernanda|FERNANDA"; "i")) | .cpf' | head -1)
FERNANDA_EMAIL=$(echo "$FERNANDA_RESPONSE" | jq -r '.data[]? | select(.nome | test("fernanda|FERNANDA"; "i")) | .email' | head -1)
FERNANDA_TELEFONE=$(echo "$FERNANDA_RESPONSE" | jq -r '.data[]? | select(.nome | test("fernanda|FERNANDA"; "i")) | .telefone' | head -1)

if [ -z "$FERNANDA_ID" ] || [ "$FERNANDA_ID" = "null" ]; then
  echo "❌ Usuário Fernanda não encontrado!"
  echo "Resposta da API:"
  echo "$FERNANDA_RESPONSE" | jq .
  exit 1
fi

echo "✅ Usuário encontrado:"
echo "   - ID: $FERNANDA_ID"
echo "   - Nome: $FERNANDA_NOME"
echo "   - CPF: $FERNANDA_CPF"
echo "   - Email: $FERNANDA_EMAIL"
echo ""

# 2. Buscar um cliente
echo "2️⃣ Buscando cliente disponível..."
CLIENTE_RESPONSE=$(curl -s -X GET "$BASE_URL/clientes?limit=1" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

# Verificar se há erro de autenticação
if echo "$CLIENTE_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Erro de autenticação!"
  echo "$CLIENTE_RESPONSE" | jq .
  exit 1
fi

CLIENTE_ID=$(echo "$CLIENTE_RESPONSE" | jq -r '.data[0]?.id // empty')
CLIENTE_NOME=$(echo "$CLIENTE_RESPONSE" | jq -r '.data[0]?.nome // empty')

if [ -z "$CLIENTE_ID" ] || [ "$CLIENTE_ID" = "null" ]; then
  echo "❌ Nenhum cliente encontrado!"
  echo "Resposta da API:"
  echo "$CLIENTE_RESPONSE" | jq .
  exit 1
fi

echo "✅ Cliente encontrado:"
echo "   - ID: $CLIENTE_ID"
echo "   - Nome: $CLIENTE_NOME"
echo ""

# 3. Criar obra
echo "3️⃣ Criando obra..."
OBRA_DATA=$(cat <<EOF
{
  "nome": "Obra Teste - Sinaleiros",
  "cliente_id": $CLIENTE_ID,
  "endereco": "Rua Teste, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "tipo": "Residencial",
  "cep": "01310100",
  "status": "Em Andamento",
  "descricao": "Obra de teste para validar atrelamento de sinaleiros",
  "data_inicio": "2026-02-03",
  "data_fim": "2027-02-03",
  "cno": "12345",
  "art_numero": "12345678901234567890",
  "apolice_numero": "AP-TEST-001"
}
EOF
)

OBRA_RESPONSE=$(curl -s -X POST "$BASE_URL/obras" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$OBRA_DATA")

OBRA_ID=$(echo "$OBRA_RESPONSE" | jq -r '.data.id // .id // empty')

if [ -z "$OBRA_ID" ] || [ "$OBRA_ID" = "null" ]; then
  echo "❌ Erro ao criar obra!"
  echo "Resposta da API:"
  echo "$OBRA_RESPONSE" | jq .
  exit 1
fi

echo "✅ Obra criada com sucesso!"
echo "   - ID: $OBRA_ID"
echo ""

# 4. Atrelar sinaleiros
echo "4️⃣ Atrelando sinaleiros..."

# Sinaleiro interno (Fernanda) - tipo principal
# Sinaleiro do cliente - tipo reserva
SINALEIROS_DATA=$(cat <<EOF
{
  "sinaleiros": [
    {
      "nome": "$FERNANDA_NOME",
      "rg_cpf": "${FERNANDA_CPF:-12345678901}",
      "telefone": "${FERNANDA_TELEFONE:-11999999999}",
      "email": "${FERNANDA_EMAIL:-fernanda@empresa.com.br}",
      "tipo": "principal"
    },
    {
      "nome": "Sinaleiro do Cliente",
      "rg_cpf": "98765432100",
      "telefone": "(11) 88888-8888",
      "email": "sinaleiro.cliente@empresa.com.br",
      "tipo": "reserva"
    }
  ]
}
EOF
)

echo "📤 Dados dos sinaleiros:"
echo "$SINALEIROS_DATA" | jq .

SINALEIROS_RESPONSE=$(curl -s -X POST "$BASE_URL/obras/$OBRA_ID/sinaleiros" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SINALEIROS_DATA")

echo ""
echo "📥 Resposta da API de sinaleiros:"
echo "$SINALEIROS_RESPONSE" | jq .

if echo "$SINALEIROS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo ""
  echo "✅ Sinaleiros atrelados com sucesso!"
else
  echo ""
  echo "❌ Erro ao atrelar sinaleiros!"
fi

# 5. Verificar sinaleiros da obra
echo ""
echo "5️⃣ Verificando sinaleiros da obra $OBRA_ID..."
SINALEIROS_VERIFICACAO=$(curl -s -X GET "$BASE_URL/obras/$OBRA_ID/sinaleiros" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "📋 Sinaleiros encontrados:"
echo "$SINALEIROS_VERIFICACAO" | jq .

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ TESTE CONCLUÍDO"
echo "═══════════════════════════════════════════════════════════"
echo "Obra ID: $OBRA_ID"
echo "URL para visualizar: http://localhost:3000/dashboard/obras/$OBRA_ID"
