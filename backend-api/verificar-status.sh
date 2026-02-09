#!/bin/bash

# Script simples para verificar status do servidor e jobs
# Compatível com servidor Linux

PORT=${PORT:-3001}
API_URL="http://localhost:${PORT}"

echo "🔍 Verificando status do servidor e jobs..."
echo ""

# 1. Verificar se o servidor está respondendo
echo "1️⃣ Verificando se o servidor está rodando na porta ${PORT}..."

if command -v curl &> /dev/null; then
    if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
        echo "✅ Servidor está RODANDO"
        echo ""
        echo "   Resposta do health check:"
        curl -s "${API_URL}/health" | head -5
        echo ""
    else
        echo "❌ Servidor NÃO está respondendo"
        echo "   💡 Execute: npm start ou pm2 start"
    fi
else
    echo "⚠️  curl não encontrado, tentando verificar processo..."
fi

# 2. Verificar processo na porta
echo ""
echo "2️⃣ Verificando processos na porta ${PORT}..."

if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:${PORT} 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "✅ Processo encontrado na porta ${PORT}"
        echo "   PID: ${PID}"
        echo ""
        echo "   Informações do processo:"
        ps -p ${PID} -o pid,cmd --no-headers 2>/dev/null | head -1
    else
        echo "❌ Nenhum processo encontrado na porta ${PORT}"
    fi
elif command -v netstat &> /dev/null; then
    PID=$(netstat -tlnp 2>/dev/null | grep ":${PORT}" | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ -n "$PID" ]; then
        echo "✅ Processo encontrado na porta ${PORT}"
        echo "   PID: ${PID}"
    else
        echo "❌ Nenhum processo encontrado na porta ${PORT}"
    fi
else
    echo "⚠️  Não foi possível verificar processos (lsof/netstat não encontrados)"
fi

# 3. Verificar logs recentes
echo ""
echo "3️⃣ Verificando logs recentes do PM2 (se estiver usando)..."
if command -v pm2 &> /dev/null; then
    PM2_LIST=$(pm2 list 2>/dev/null)
    if [ -n "$PM2_LIST" ]; then
        echo "   Processos PM2:"
        pm2 list | grep -E "backend|api|server" || echo "   Nenhum processo backend encontrado no PM2"
    else
        echo "   PM2 não está rodando ou não há processos"
    fi
else
    echo "   PM2 não está instalado"
fi

# 4. Verificar horário e timezone
echo ""
echo "4️⃣ Informações sobre agendamento:"
HORA_ATUAL=$(date '+%H:%M')
TIMEZONE=$(date +%Z)
echo "   Hora atual: ${HORA_ATUAL}"
echo "   Timezone: ${TIMEZONE}"
echo "   Próxima execução de notificações: 11:50 (horário de Brasília)"
echo "   Próxima execução de almoço automático: 12:00 (horário de Brasília)"

# 5. Instruções
echo ""
echo "5️⃣ Como verificar se os jobs estão ativos:"
echo "   📋 Verifique os logs do servidor procurando por:"
echo "      - '[scheduler] Inicializando jobs automáticos...'"
echo "      - '[scheduler] 🚀 Job de notificações de almoço iniciado'"
echo "      - '[scheduler] ⏰ Agendado para executar diariamente às 11h50'"
echo ""
echo "   💡 Para ver logs do PM2:"
echo "      pm2 logs"
echo ""
echo "   💡 Para ver logs do npm:"
echo "      Verifique o terminal onde o servidor foi iniciado"

echo ""
echo "=" | head -c 60
echo ""
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    echo "✅ RESUMO: Servidor está rodando"
    echo "⚠️  Verifique os logs para confirmar que os jobs foram iniciados"
else
    echo "❌ RESUMO: Servidor NÃO está rodando"
    echo "💡 Execute: npm start ou pm2 start ecosystem.config.js"
fi
echo "=" | head -c 60
echo ""
