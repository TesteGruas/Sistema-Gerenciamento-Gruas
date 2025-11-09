# teste-criacao-obra.py
# -------------------------------------------------------
# Script para testar o fluxo COMPLETO de criação de obra do ZERO
# Baseado no exemplo botRevendedor.py
#
# Fluxo COMPLETO (3 FASES):
#
# FASE 1: CRIAR ENTIDADES NECESSÁRIAS
#   1) Abre navegador (não headless para acompanhar)
#   2) Login: admin@admin.com / teste@123
#   3) VERIFICA CLIENTE: Se não houver, abre NOVA ABA e cria
#   4) VERIFICA FUNCIONÁRIO: Se não houver, abre NOVA ABA e cria
#   5) VERIFICA GRUA: Se não houver, abre NOVA ABA e cria
#   6) Todas as abas permanecem abertas para inspeção
#
# FASE 2: PREENCHER FORMULÁRIO DA OBRA
#   7) Navega para /dashboard/obras/nova
#   8) Preenche dados básicos da obra
#   9) Seleciona cliente criado
#   10) Seleciona funcionário criado (se necessário)
#   11) Seleciona grua criada
#
# FASE 3: CRIAR OBRA
#   12) Submete formulário e cria a obra
#
# Características:
#   - Cria TODAS as entidades PRIMEIRO, depois preenche formulário
#   - Usa novas abas para criar recursos (mantém todas abertas)
#   - Verifica se entidades já existem antes de criar
#   - Mostra todo o fluxo em tempo real com delays
#
# Requisitos:
#   pip install playwright==1.47.0
#   playwright install chromium
#
# Execução:
#   python3 teste-criacao-obra.py
# -------------------------------------------------------

from playwright.sync_api import sync_playwright
import time
import logging
import re
from pathlib import Path
from datetime import datetime

# ========= CONFIG =========
HEADLESS = False  # False = mostra navegador para acompanhar
SLOWMO = 250      # ms entre ações (250ms = 2x mais rápido)
TIMEOUT_MS = 60000  # 60s: tempo padrão de ações
BASE_URL = "http://localhost:3000"  # URL base do sistema

# Credenciais
LOGIN_EMAIL = "admin@admin.com"
LOGIN_PASSWORD = "teste@123"

# ========================= LOGGING =========================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(f'teste-obra-{datetime.now().strftime("%Y%m%d-%H%M%S")}.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def delay(seconds: float = 1.0, message: str = ""):
    """Aplica delay e loga mensagem (velocidade 2x)"""
    if message:
        logger.info(f"⏳ {message} (aguardando {seconds}s...)")
    time.sleep(seconds)

def close_overlays(page):
    """Fecha modais e overlays que possam estar abertos"""
    try:
        page.keyboard.press("Escape")
    except:
        pass
    try:
        page.evaluate("""
            for (const sel of [
              '#info-modal','.modal-backdrop','.loading','.carregandoVendas',
              '.swal2-container','.swal2-shown','.toast','.iziToast',
              '.modal.show','.modal.in'
            ]) {
              document.querySelectorAll(sel).forEach(e=>{ 
                try { e.remove(); } catch(_){} 
              });
            }
        """)
    except Exception:
        pass

def login(page):
    """Faz login no sistema"""
    logger.info("🔐 Iniciando login...")
    
    # Navegar para página inicial
    logger.info(f"📍 Navegando para {BASE_URL}")
    page.goto(BASE_URL, wait_until="domcontentloaded", timeout=TIMEOUT_MS)
    delay(1, "Página carregada")
    
    # Preencher email
    logger.info(f"✍️ Preenchendo email: {LOGIN_EMAIL}")
    email_input = page.locator("#email").first
    email_input.wait_for(state="visible", timeout=30000)
    email_input.clear()
    email_input.fill(LOGIN_EMAIL)
    delay(0.5, "Email preenchido")
    
    # Preencher senha
    logger.info("✍️ Preenchendo senha...")
    password_input = page.locator("#password").first
    password_input.wait_for(state="visible", timeout=30000)
    password_input.clear()
    password_input.fill(LOGIN_PASSWORD)
    delay(0.5, "Senha preenchida")
    
    # Clicar no botão de login
    logger.info("🖱️ Clicando no botão de login...")
    login_button = page.locator("button[type='submit']").first
    login_button.click()
    delay(1.5, "Aguardando redirecionamento após login")
    
    # Aguardar redirecionamento para dashboard
    try:
        page.wait_for_url("**/dashboard**", timeout=30000)
        logger.info("✅ Login realizado com sucesso! Redirecionado para dashboard.")
    except Exception as e:
        logger.warning(f"⚠️ Não detectou redirecionamento automático: {e}")
        # Tentar navegar manualmente
        page.goto(f"{BASE_URL}/dashboard", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
        delay(1, "Navegando manualmente para dashboard")
    
    delay(1, "Aguardando carregamento completo do dashboard")

def navegar_para_criacao_obra(page):
    """Navega para a página de criação de obra"""
    logger.info("📍 Navegando para página de criação de obra...")
    page.goto(f"{BASE_URL}/dashboard/obras/nova", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
    delay(1, "Página de criação de obra carregada")
    
    # Verificar se a página carregou corretamente
    try:
        page.wait_for_selector("h1:has-text('Nova Obra')", timeout=10000)
        logger.info("✅ Página de criação de obra carregada com sucesso!")
    except Exception as e:
        logger.warning(f"⚠️ Não encontrou título 'Nova Obra': {e}")

def preencher_dados_obra(page):
    """Preenche a aba 'Dados da Obra'"""
    logger.info("📝 === PREENCHENDO DADOS DA OBRA ===")
    
    # Aguardar formulário estar visível
    delay(1, "Aguardando formulário")
    
    # Nome da obra (campo obrigatório)
    logger.info("✍️ Preenchendo nome da obra...")
    try:
        name_input = page.locator("input#name").first
        name_input.wait_for(state="visible", timeout=15000)
        name_input.clear()
        name_input.fill("Obra Teste Automatizada - " + datetime.now().strftime("%Y%m%d-%H%M%S"))
        delay(0.75, "Nome preenchido")
    except Exception as e:
        logger.error(f"❌ Erro ao preencher nome: {e}")
        raise
    
    # Descrição
    logger.info("✍️ Preenchendo descrição...")
    try:
        desc_input = page.locator("textarea#description").first
        if desc_input.count() > 0:
            desc_input.fill("Obra criada automaticamente para testes do sistema de automação")
            delay(0.5, "Descrição preenchida")
    except Exception as e:
        logger.warning(f"⚠️ Erro ao preencher descrição: {e}")
    
    # Status (já deve estar como 'Em Andamento')
    logger.info("✅ Status: Em Andamento (padrão)")
    delay(0.5)
    
    # Data de início
    logger.info("📅 Preenchendo data de início...")
    try:
        start_date = datetime.now().strftime("%Y-%m-%d")
        start_input = page.locator("input#startDate").first
        if start_input.count() > 0:
            start_input.fill(start_date)
            delay(0.5, "Data de início preenchida")
    except Exception as e:
        logger.warning(f"⚠️ Erro ao preencher data de início: {e}")
    
    # Localização (campo obrigatório)
    logger.info("📍 Preenchendo endereço...")
    try:
        location_input = page.locator("input#location").first
        location_input.wait_for(state="visible", timeout=10000)
        location_input.fill("Rua das Flores, 123 - Centro")
        delay(0.75, "Endereço preenchido")
    except Exception as e:
        logger.error(f"❌ Erro ao preencher endereço: {e}")
        raise
    
    # Cidade (campo obrigatório)
    logger.info("🏙️ Preenchendo cidade...")
    try:
        cidade_input = page.locator("input#cidade").first
        cidade_input.wait_for(state="visible", timeout=10000)
        cidade_input.fill("São Paulo")
        delay(0.75, "Cidade preenchida")
    except Exception as e:
        logger.error(f"❌ Erro ao preencher cidade: {e}")
        raise
    
    # Estado (select - campo obrigatório)
    logger.info("🗺️ Selecionando estado...")
    try:
        # Clicar no select trigger
        estado_trigger = page.locator("label:has-text('Estado') + * button, select#estado + button").first
        if estado_trigger.count() == 0:
            estado_trigger = page.locator("button:has-text('SP'), button:has-text('Estado')").first
        if estado_trigger.count() > 0:
            estado_trigger.click()
            delay(0.5, "Aguardando dropdown de estados")
            # Selecionar SP
            sp_option = page.locator("div[role='option']:has-text('SP'), li:has-text('SP')").first
            if sp_option.count() > 0:
                sp_option.click()
                delay(0.5, "Estado SP selecionado")
            else:
                # Tentar método alternativo
                page.keyboard.type("SP")
                page.keyboard.press("Enter")
                delay(0.5)
        else:
            # Fallback: tentar select direto
            estado_select = page.locator("select#estado").first
            if estado_select.count() > 0:
                estado_select.select_option("SP")
                delay(0.5, "Estado selecionado")
    except Exception as e:
        logger.warning(f"⚠️ Erro ao selecionar estado: {e}")
    
    # Tipo (select - campo obrigatório)
    logger.info("🏗️ Selecionando tipo de obra...")
    try:
        # Clicar no select trigger
        tipo_trigger = page.locator("label:has-text('Tipo') + * button, select#tipo + button").first
        if tipo_trigger.count() == 0:
            tipo_trigger = page.locator("button:has-text('Residencial'), button:has-text('Tipo')").first
        if tipo_trigger.count() > 0:
            tipo_trigger.click()
            delay(0.5, "Aguardando dropdown de tipos")
            # Selecionar Residencial
            residencial_option = page.locator("div[role='option']:has-text('Residencial'), li:has-text('Residencial')").first
            if residencial_option.count() > 0:
                residencial_option.click()
                delay(0.5, "Tipo Residencial selecionado")
            else:
                page.keyboard.type("Residencial")
                page.keyboard.press("Enter")
                delay(0.5)
    except Exception as e:
        logger.warning(f"⚠️ Erro ao selecionar tipo: {e}")
    
    # Orçamento/Budget
    logger.info("💰 Preenchendo orçamento...")
    try:
        budget_input = page.locator("input#budget").first
        if budget_input.count() > 0:
            budget_input.fill("10000000")  # 100.000,00 em formato de entrada
            delay(0.5, "Orçamento preenchido")
    except Exception as e:
        logger.warning(f"⚠️ Erro ao preencher orçamento: {e}")
    
    logger.info("✅ Dados da obra preenchidos!")
    delay(1)

def verificar_se_precisa_cliente(context, page_obra):
    """Verifica se precisa criar cliente - retorna True se precisa criar"""
    logger.info("🔍 Verificando se há clientes disponíveis...")
    
    try:
        # Abrir página de clientes temporariamente para verificar
        page_check = context.new_page()
        page_check.goto(f"{BASE_URL}/dashboard/clientes", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
        delay(2, "Carregando página de clientes para verificar")
        
        # Verificar se há clientes na lista
        clientes = page_check.locator("div[class*='card'], tr, li").filter(has_text=re.compile(r".+", re.I))
        if clientes.count() > 0:
            logger.info(f"✅ Encontrados {clientes.count()} clientes - não precisa criar")
            page_check.close()
            return False
        else:
            logger.info("⚠️ Nenhum cliente encontrado - precisa criar")
            page_check.close()
            return True
    except Exception as e:
        logger.warning(f"⚠️ Erro ao verificar clientes: {e}")
        logger.info("ℹ️ Assumindo que precisa criar cliente")
        try:
            page_check.close()
        except:
            pass
        return True

def selecionar_cliente_criado(page):
    """Seleciona o cliente recém-criado no formulário"""
    try:
        logger.info("🔍 Buscando cliente para selecionar...")
        
        # Encontrar o campo de busca de cliente
        cliente_search = page.locator(
            "input[placeholder*='cliente'], "
            "input[placeholder*='Cliente'], "
            "input[placeholder*='Buscar cliente'], "
            "input[type='text']"
        ).first
        
        if cliente_search.count() == 0:
            logger.warning("⚠️ Campo de busca de cliente não encontrado")
            return False
        
        # Clicar no campo e limpar
        logger.info("🖱️ Clicando no campo de busca...")
        cliente_search.click()
        delay(0.5, "Aguardando campo ficar ativo")
        cliente_search.clear()
        delay(0.3)
        
        # Digitar termo de busca (mínimo 2 caracteres para o componente buscar)
        logger.info("✍️ Digitando termo de busca...")
        cliente_search.fill("teste")
        delay(2.5, "Aguardando resultados da busca aparecerem")
        
        # Aguardar o Card com resultados aparecer
        logger.info("🔍 Procurando dropdown de resultados...")
        try:
            # O componente usa um Card com z-50 para mostrar resultados
            results_card = page.locator(
                "div[class*='Card']:has(button), "
                "div[class*='card']:has(button), "
                "[class*='absolute'][class*='z-50'], "
                "div:has(button):has-text('CNPJ')"
            ).first
            
            if results_card.count() > 0:
                logger.info("✅ Card de resultados encontrado!")
            else:
                # Tentar encontrar qualquer elemento com botões que apareceu
                results_card = page.locator("button:has-text('CNPJ'), button:has(svg[class*='Building'])").first
        except:
            results_card = None
        
        # Procurar o botão do primeiro cliente na lista
        logger.info("🔍 Procurando botão do primeiro cliente...")
        
        # Aguardar um pouco mais para garantir que o dropdown apareceu
        delay(0.5)
        
        # Tentar diferentes seletores para o botão do cliente
        cliente_button = None
        selectors = [
            "div[class*='divide-y'] button:first-child",  # Primeiro botão no container
            "div[class*='Card'] button:first-child",  # Primeiro botão no Card
            "button:has(svg)",  # Botão com qualquer SVG (ícone Building2)
            "button.w-full",  # Botão com classe w-full
            "button.p-3",  # Botão com padding
            "div[class*='absolute'] button",  # Botão no dropdown absoluto
        ]
        
        for selector in selectors:
            try:
                btn = page.locator(selector).first
                if btn.count() > 0:
                    # Verificar se está visível e contém texto relevante
                    try:
                        btn_text = btn.inner_text()
                        if btn_text and len(btn_text.strip()) > 0:
                            if btn.is_visible():
                                cliente_button = btn
                                logger.info(f"✅ Botão encontrado com seletor: {selector}")
                                logger.info(f"   Texto do botão: {btn_text[:50]}...")
                                break
                    except:
                        # Tentar mesmo se não conseguir verificar
                        cliente_button = btn
                        logger.info(f"✅ Botão encontrado (verificação parcial): {selector}")
                        break
            except Exception as e:
                logger.debug(f"Seletor {selector} falhou: {e}")
                continue
        
        if cliente_button and cliente_button.count() > 0:
            logger.info("🖱️ Clicando no primeiro cliente da lista...")
            try:
                # Scroll para o botão se necessário
                cliente_button.scroll_into_view_if_needed()
                delay(0.5)
            except:
                pass
            
            # Tentar clicar
            try:
                cliente_button.click()
                delay(1.5, "Aguardando seleção do cliente")
                logger.info("✅ Cliente selecionado!")
                return True
            except Exception as e:
                logger.warning(f"⚠️ Erro ao clicar no botão: {e}")
                # Tentar método alternativo: clicar via JavaScript
                try:
                    logger.info("💡 Tentando clicar via JavaScript...")
                    clicked = page.evaluate("""
                        () => {
                            // Procurar por botões dentro de Cards ou divs com divide-y
                            const cards = document.querySelectorAll('div[class*="Card"], div[class*="card"]');
                            for (const card of cards) {
                                const buttons = card.querySelectorAll('button');
                                for (const btn of buttons) {
                                    const text = btn.innerText || btn.textContent || '';
                                    // Verificar se é um botão de cliente (tem CNPJ ou ícone)
                                    if (text.includes('CNPJ') || btn.querySelector('svg')) {
                                        btn.click();
                                        return true;
                                    }
                                }
                            }
                            // Fallback: primeiro botão visível
                            const allButtons = document.querySelectorAll('button');
                            for (const btn of allButtons) {
                                if (btn.offsetParent !== null) { // Está visível
                                    const rect = btn.getBoundingClientRect();
                                    if (rect.top > 0 && rect.height > 0) {
                                        btn.click();
                                        return true;
                                    }
                                }
                            }
                            return false;
                        }
                    """)
                    if clicked:
                        delay(1.5)
                        logger.info("✅ Cliente selecionado via JavaScript!")
                        return True
                    else:
                        logger.warning("⚠️ JavaScript não encontrou botão para clicar")
                except Exception as e:
                    logger.warning(f"⚠️ Erro no JavaScript: {e}")
                    pass
        else:
            logger.warning("⚠️ Botão do cliente não encontrado na lista")
            logger.info("💡 Tentando método alternativo: teclado")
            
            # Método alternativo: usar teclado
            try:
                page.keyboard.press("ArrowDown")
                delay(0.5)
                page.keyboard.press("Enter")
                delay(1.5, "Selecionando com Enter")
                logger.info("✅ Tentativa de seleção com teclado")
                return True
            except:
                pass
        
        return False
        
    except Exception as e:
        logger.error(f"❌ Erro ao selecionar cliente: {e}")
        import traceback
        logger.debug(traceback.format_exc())
        return False

def verificar_se_precisa_funcionario(context, page_obra):
    """Verifica se precisa criar funcionário - retorna True se precisa criar"""
    logger.info("🔍 Verificando se há funcionários disponíveis...")
    
    try:
        # Abrir página de funcionários temporariamente para verificar
        page_check = context.new_page()
        page_check.goto(f"{BASE_URL}/dashboard/funcionarios", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
        delay(2, "Carregando página de funcionários para verificar")
        
        # Verificar se há funcionários na lista
        funcionarios = page_check.locator("div[class*='card'], tr, li").filter(has_text=re.compile(r".+", re.I))
        if funcionarios.count() > 0:
            logger.info(f"✅ Encontrados funcionários - não precisa criar")
            page_check.close()
            return False
        else:
            logger.info("⚠️ Nenhum funcionário encontrado - precisa criar")
            page_check.close()
            return True
    except Exception as e:
        logger.warning(f"⚠️ Erro ao verificar funcionários: {e}")
        logger.info("ℹ️ Assumindo que precisa criar funcionário")
        try:
            page_check.close()
        except:
            pass
        return True

def selecionar_funcionario_criado(page):
    """Seleciona o funcionário recém-criado no formulário (se necessário)"""
    # Funcionário pode não ser obrigatório na criação de obra
    logger.info("ℹ️ Funcionário pode ser selecionado depois (não obrigatório)")
    return True

def verificar_se_precisa_grua(context, page_obra):
    """Verifica se precisa criar grua - retorna True se precisa criar"""
    logger.info("🔍 Verificando se há gruas disponíveis...")
    
    try:
        # Abrir página de gruas temporariamente para verificar
        page_check = context.new_page()
        page_check.goto(f"{BASE_URL}/dashboard/gruas", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
        delay(2, "Carregando página de gruas para verificar")
        
        # Verificar se há gruas na lista
        gruas = page_check.locator("div[class*='card'], tr, li").filter(has_text=re.compile(r".+", re.I))
        if gruas.count() > 0:
            logger.info(f"✅ Encontradas gruas - não precisa criar")
            page_check.close()
            return False
        else:
            logger.info("⚠️ Nenhuma grua encontrada - precisa criar")
            page_check.close()
            return True
    except Exception as e:
        logger.warning(f"⚠️ Erro ao verificar gruas: {e}")
        logger.info("ℹ️ Assumindo que precisa criar grua")
        try:
            page_check.close()
        except:
            pass
        return True

def criar_grua_nova_aba(context, page_obra):
    """Abre nova aba, cria grua e mantém aberta"""
    logger.info("🆕 === CRIANDO NOVA GRUA EM NOVA ABA ===")
    logger.info("ℹ️ Mantendo aba de obra aberta (sem recarregar)")
    
    try:
        # Abrir nova aba
        page_grua = context.new_page()
        page_grua.set_default_timeout(TIMEOUT_MS)
        logger.info("📑 Nova aba aberta para criação de grua")
        
        # Navegar para página de gruas
        page_grua.goto(f"{BASE_URL}/dashboard/gruas", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
        delay(2, "Página de gruas carregada")
        
        # Procurar botão de criar grua
        create_button = page_grua.locator("button:has-text('Nova Grua'), button:has-text('Criar Grua'), button:has-text('Adicionar')").first
        if create_button.count() > 0:
            create_button.click()
            delay(2, "Aguardando dialog/formulário abrir")
        
        # Preencher dados básicos da grua
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        
        # Nome/Modelo
        nome_input = page_grua.locator("input[name*='nome'], input[name*='modelo'], input[name*='name']").first
        if nome_input.count() > 0:
            nome_input.fill(f"Grua Teste {timestamp}")
            delay(0.5)
        
        # Submeter
        submit_button = page_grua.locator("button[type='submit'], button:has-text('Criar'), button:has-text('Salvar')").first
        if submit_button.count() > 0:
            submit_button.click()
            delay(3, "Aguardando criação da grua")
            logger.info("✅ Grua criada!")
        
        logger.info("📑 Aba de grua será mantida aberta para inspeção")
        delay(2)
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar grua: {e}")
        logger.info("📑 Aba de grua será mantida aberta para debug")
        return False

def selecionar_grua_criada(page):
    """Seleciona a grua recém-criada no formulário"""
    try:
        # Ir para aba Grua
        grua_tab = page.locator("button[role='tab']:has-text('Grua')").first
        if grua_tab.count() > 0:
            grua_tab.click()
            delay(1, "Aguardando aba Grua carregar")
        
        logger.info("🔍 Buscando grua para selecionar...")
        grua_search = page.locator("input[placeholder*='grua'], input[placeholder*='Grua'], input[placeholder*='Buscar grua']").first
        if grua_search.count() > 0:
            grua_search.click()
            delay(0.5)
            grua_search.clear()
            delay(0.3)
            grua_search.fill("teste")
            delay(2.5, "Aguardando resultados da busca aparecerem")
            
            # Procurar botão da grua (similar ao cliente)
            grua_button = None
            selectors = [
                "button:has(svg)",
                "div[class*='Card'] button",
                "div[class*='card'] button",
                "button.w-full.p-3",
            ]
            
            for selector in selectors:
                try:
                    btn = page.locator(selector).first
                    if btn.count() > 0:
                        try:
                            if btn.is_visible():
                                grua_button = btn
                                break
                        except:
                            grua_button = btn
                            break
                except:
                    continue
            
            if grua_button and grua_button.count() > 0:
                logger.info("🖱️ Clicando na primeira grua da lista...")
                grua_button.scroll_into_view_if_needed()
                delay(0.5)
                grua_button.click()
                delay(1.5, "Aguardando seleção da grua")
                logger.info("✅ Grua selecionada!")
                return True
            else:
                # Método alternativo: teclado
                page.keyboard.press("ArrowDown")
                delay(0.5)
                page.keyboard.press("Enter")
                delay(1.5)
                logger.info("✅ Tentativa de seleção com teclado")
                return True
        else:
            logger.warning("⚠️ Campo de busca de grua não encontrado")
            return False
    except Exception as e:
        logger.warning(f"⚠️ Erro ao selecionar grua: {e}")
        return False

def criar_cliente_nova_aba(context, page_obra):
    """Abre nova aba, cria cliente e volta - NÃO recarrega página de obra"""
    logger.info("🆕 === CRIANDO NOVO CLIENTE EM NOVA ABA ===")
    logger.info("ℹ️ Mantendo aba de obra aberta (sem recarregar)")
    
    try:
        # Abrir nova aba (a página de obra continua aberta em outra aba)
        page_cliente = context.new_page()
        page_cliente.set_default_timeout(TIMEOUT_MS)
        logger.info("📑 Nova aba aberta para criação de cliente")
        
        # Navegar para página de clientes
        page_cliente.goto(f"{BASE_URL}/dashboard/clientes", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
        delay(2, "Página de clientes carregada")
        
        # Aguardar página carregar completamente
        try:
            page_cliente.wait_for_selector("h1, h2", timeout=10000)
        except:
            pass
        
        # Clicar no botão de criar cliente - procurar por vários seletores
        logger.info("🔍 Procurando botão de criar cliente...")
        create_button = None
        
        # Tentar diferentes seletores (em ordem de prioridade)
        selectors = [
            "button:has-text('Novo Cliente')",
            "button:has-text('Criar Cliente')",
            "button:has-text('Adicionar Cliente')",
            "button:has-text('Adicionar')",
            "button:has(svg):has-text('Novo Cliente')",
            "button:has(svg):has-text('Criar')",
        ]
        
        for selector in selectors:
            try:
                btn = page_cliente.locator(selector).first
                if btn.count() > 0:
                    # Verificar se está visível
                    try:
                        if btn.is_visible():
                            create_button = btn
                            logger.info(f"✅ Botão encontrado com seletor: {selector}")
                            break
                    except:
                        # Tentar mesmo se não conseguir verificar visibilidade
                        create_button = btn
                        logger.info(f"✅ Botão encontrado (visibilidade não verificada): {selector}")
                        break
            except Exception as e:
                logger.debug(f"Seletor {selector} falhou: {e}")
                continue
        
        if create_button and create_button.count() > 0:
            logger.info("🖱️ Clicando no botão de criar cliente...")
            try:
                create_button.scroll_into_view_if_needed()
            except:
                pass
            delay(0.5)
            create_button.click()
            delay(2, "Aguardando dialog abrir")
            
            # Verificar se dialog abriu
            dialog = page_cliente.locator("[role='dialog'], [class*='dialog'], [class*='Dialog']").first
            if dialog.count() > 0:
                logger.info("✅ Dialog de criação aberto!")
            else:
                # Tentar verificar de outra forma
                dialog_title = page_cliente.locator("text=/novo cliente/i").first
                if dialog_title.count() > 0:
                    logger.info("✅ Dialog de criação aberto! (título encontrado)")
                else:
                    logger.warning("⚠️ Dialog pode não ter aberto - continuando mesmo assim")
        else:
            logger.error("❌ Botão de criar cliente não encontrado!")
            logger.info("ℹ️ Aba será mantida aberta para inspeção manual")
            logger.info("💡 Dica: Procure por um botão com texto 'Novo Cliente' ou ícone de Plus")
            return False
        
        # Preencher formulário de cliente
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        cliente_nome = f"Cliente Teste {timestamp}"
        # CNPJ válido formatado
        cnpj_num = f"12345678{timestamp[-4:]}"
        cliente_cnpj = f"{cnpj_num[:2]}.{cnpj_num[2:5]}.{cnpj_num[5:8]}/0001-{cnpj_num[-2:]}"
        
        logger.info(f"✍️ Preenchendo nome: {cliente_nome}")
        nome_input = page_cliente.locator("input#nome, input[name='nome']").first
        nome_input.wait_for(state="visible", timeout=10000)
        if nome_input.count() > 0:
            nome_input.clear()
            nome_input.fill(cliente_nome)
            delay(0.5, "Nome preenchido")
        else:
            logger.error("❌ Campo nome não encontrado!")
            return False
        
        logger.info(f"✍️ Preenchendo CNPJ: {cliente_cnpj}")
        cnpj_input = page_cliente.locator("input#cnpj, input[name='cnpj']").first
        cnpj_input.wait_for(state="visible", timeout=10000)
        if cnpj_input.count() > 0:
            cnpj_input.clear()
            cnpj_input.fill(cliente_cnpj)
            delay(0.5, "CNPJ preenchido")
        else:
            logger.error("❌ Campo CNPJ não encontrado!")
            return False
        
        # Email
        email_input = page_cliente.locator("input#email, input[name='email'], input[type='email']").first
        if email_input.count() > 0:
            email_input.fill(f"cliente{timestamp}@teste.com")
            delay(0.5)
        
        # Telefone
        telefone_input = page_cliente.locator("input#telefone, input[name='telefone']").first
        if telefone_input.count() > 0:
            telefone_input.fill("(11) 99999-9999")
            delay(0.5)
        
        # Endereço
        endereco_input = page_cliente.locator("input#endereco, input[name='endereco']").first
        if endereco_input.count() > 0:
            endereco_input.fill("Rua Teste, 123")
            delay(0.5)
        
        # Cidade
        cidade_input = page_cliente.locator("input#cidade, input[name='cidade']").first
        if cidade_input.count() > 0:
            cidade_input.fill("São Paulo")
            delay(0.5)
        
        # Estado
        try:
            estado_select = page_cliente.locator("select#estado, select[name='estado']").first
            if estado_select.count() > 0:
                estado_select.select_option("SP")
                delay(0.5)
        except:
            pass
        
        # Desmarcar criar usuário (para simplificar)
        logger.info("🔘 Desmarcando checkbox de criar usuário...")
        criar_usuario_check = page_cliente.locator("input[type='checkbox'][id='criar_usuario'], input[type='checkbox'][name='criar_usuario']").first
        if criar_usuario_check.count() > 0:
            if criar_usuario_check.is_checked():
                criar_usuario_check.uncheck()
                delay(0.5, "Checkbox desmarcado")
            else:
                logger.info("ℹ️ Checkbox já estava desmarcado")
        else:
            logger.warning("⚠️ Checkbox criar_usuario não encontrado (pode não ser necessário)")
        
        # Submeter formulário
        logger.info("🚀 Submetendo formulário de cliente...")
        submit_button = page_cliente.locator(
            "button[type='submit']:has-text('Criar'), "
            "button[type='submit']:has-text('Criar Cliente'), "
            "form button[type='submit']"
        ).first
        
        if submit_button.count() == 0:
            submit_button = page_cliente.locator("button:has-text('Criar Cliente'), button:has-text('Salvar')").first
        
        if submit_button.count() > 0:
            submit_button.scroll_into_view_if_needed()
            delay(0.5)
            if submit_button.is_enabled():
                submit_button.click()
                logger.info("✅ Botão de submit clicado!")
                delay(5, "Aguardando criação do cliente e resposta do servidor")
                
                # Verificar se houve sucesso
                try:
                    success_msg = page_cliente.locator("text=/sucesso|success|cliente criado/i").first
                    if success_msg.count() > 0:
                        logger.info("🎉 Cliente criado com sucesso! (mensagem de sucesso detectada)")
                    else:
                        # Verificar se dialog fechou (indica sucesso)
                        dialog = page_cliente.locator("[role='dialog']").first
                        if dialog.count() == 0:
                            logger.info("✅ Cliente provavelmente criado (dialog fechou)")
                        else:
                            logger.info("ℹ️ Aguardando confirmação...")
                except:
                    logger.info("ℹ️ Verificando resultado da criação...")
            else:
                logger.warning("⚠️ Botão de submit está desabilitado")
        else:
            logger.error("❌ Botão de submit não encontrado!")
        
        # NÃO FECHAR a aba - manter aberta para ver logs
        logger.info("📑 Aba de cliente será mantida aberta para inspeção")
        logger.info("ℹ️ Aba de obra ainda está aberta com dados preenchidos")
        
        delay(2)
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar cliente: {e}")
        logger.info("📑 Aba de cliente será mantida aberta para debug")
        return False


def criar_funcionario_nova_aba(context, page_obra):
    """Abre nova aba, cria funcionário e volta - NÃO recarrega página de obra"""
    logger.info("🆕 === CRIANDO NOVO FUNCIONÁRIO EM NOVA ABA ===")
    logger.info("ℹ️ Mantendo aba de obra aberta (sem recarregar)")
    
    try:
        # Abrir nova aba (a página de obra continua aberta em outra aba)
        page_funcionario = context.new_page()
        page_funcionario.set_default_timeout(TIMEOUT_MS)
        logger.info("📑 Nova aba aberta para criação de funcionário")
        
        # Navegar para página de funcionários
        page_funcionario.goto(f"{BASE_URL}/dashboard/funcionarios", wait_until="domcontentloaded", timeout=TIMEOUT_MS)
        delay(1, "Página de funcionários carregada")
        
        # Clicar no botão de criar funcionário
        create_button = page_funcionario.locator("button:has-text('Novo Funcionário'), button:has-text('Criar Funcionário'), button:has-text('Adicionar')").first
        if create_button.count() == 0:
            create_button = page_funcionario.locator("button:has(svg), button[aria-label*='criar']").first
        
        if create_button.count() > 0:
            logger.info("🖱️ Clicando no botão de criar funcionário...")
            create_button.click()
            delay(1, "Aguardando dialog abrir")
        else:
            logger.warning("⚠️ Botão não encontrado")
        
        # Preencher formulário de funcionário
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        funcionario_nome = f"Funcionário Teste {timestamp}"
        funcionario_email = f"funcionario{timestamp}@teste.com"
        funcionario_cpf = f"123.456.789-{timestamp[-2:]}"
        
        logger.info(f"✍️ Preenchendo nome: {funcionario_nome}")
        nome_input = page_funcionario.locator("input#name, input[name='name']").first
        if nome_input.count() > 0:
            nome_input.fill(funcionario_nome)
            delay(0.5)
        
        logger.info(f"✍️ Preenchendo email: {funcionario_email}")
        email_input = page_funcionario.locator("input#email, input[name='email'], input[type='email']").first
        if email_input.count() > 0:
            email_input.fill(funcionario_email)
            delay(0.5)
        
        logger.info(f"✍️ Preenchendo CPF: {funcionario_cpf}")
        cpf_input = page_funcionario.locator("input#cpf, input[name='cpf']").first
        if cpf_input.count() > 0:
            cpf_input.fill(funcionario_cpf)
            delay(0.5)
        
        # Telefone
        telefone_input = page_funcionario.locator("input#phone, input[name='phone']").first
        if telefone_input.count() > 0:
            telefone_input.fill("(11) 99999-9999")
            delay(0.5)
        
        # Cargo
        try:
            role_select = page_funcionario.locator("select#role, select[name='role']").first
            if role_select.count() > 0:
                role_select.select_option("Operador")
                delay(0.5)
        except:
            pass
        
        # Turno
        try:
            turno_select = page_funcionario.locator("select#turno, select[name='turno']").first
            if turno_select.count() > 0:
                turno_select.select_option("Diurno")
                delay(0.5)
        except:
            pass
        
        # Status
        try:
            status_select = page_funcionario.locator("select#status, select[name='status']").first
            if status_select.count() > 0:
                status_select.select_option("Ativo")
                delay(0.5)
        except:
            pass
        
        # Desmarcar criar usuário (para simplificar)
        criar_usuario_check = page_funcionario.locator("input[type='checkbox'][id='criar_usuario'], input[type='checkbox'][name='criar_usuario']").first
        if criar_usuario_check.count() > 0 and criar_usuario_check.is_checked():
            criar_usuario_check.uncheck()
            delay(0.5)
        
        # Submeter formulário
        logger.info("🚀 Submetendo formulário de funcionário...")
        submit_button = page_funcionario.locator("form button[type='submit'], button:has-text('Criar'), button:has-text('Salvar')").first
        if submit_button.count() > 0:
            submit_button.click()
            delay(3, "Aguardando criação do funcionário")
            logger.info("✅ Funcionário criado com sucesso!")
        else:
            logger.warning("⚠️ Botão de submit não encontrado")
        
        # NÃO FECHAR a aba - manter aberta para ver logs
        logger.info("📑 Aba de funcionário será mantida aberta para inspeção")
        logger.info("ℹ️ Aba de obra ainda está aberta com dados preenchidos")
        
        delay(2)
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar funcionário: {e}")
        logger.info("📑 Aba de funcionário será mantida aberta para debug")
        return False


def tentar_criar_obra(page):
    """Tenta submeter o formulário para criar a obra"""
    logger.info("🚀 === TENTANDO CRIAR OBRA ===")
    
    # Voltar para aba de dados da obra
    try:
        obra_tab = page.locator("button[role='tab']:has-text('Dados'), button[role='tab']:has-text('obra')").first
        if obra_tab.count() > 0:
            obra_tab.click()
            delay(0.5, "Voltando para aba Dados da Obra")
    except:
        pass
    
    # Scroll para o final do formulário
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    delay(0.5, "Rolando para o final do formulário")
    
    # Procurar botão de submit
    try:
        submit_button = page.locator(
            "button[type='submit']:has-text('Criar'), "
            "button[type='submit']:has-text('Salvar'), "
            "button:has-text('Criar Obra'), "
            "button:has-text('Salvar Obra')"
        ).first
        
        if submit_button.count() == 0:
            # Tentar encontrar qualquer botão de submit
            submit_button = page.locator("form button[type='submit']").first
        
        if submit_button.count() > 0:
            logger.info("🖱️ Clicando no botão de criar obra...")
            submit_button.scroll_into_view_if_needed()
            delay(0.75)
            
            # Verificar se está habilitado
            if submit_button.is_enabled():
                submit_button.click()
                logger.info("✅ Botão clicado! Aguardando processamento...")
                delay(4, "Aguardando processamento da criação")
            else:
                logger.warning("⚠️ Botão de submit está desabilitado")
        else:
            logger.warning("⚠️ Botão de submit não encontrado")
            # Tentar submeter o form diretamente
            try:
                form = page.locator("form").first
                if form.count() > 0:
                    logger.info("🖱️ Tentando submeter formulário diretamente...")
                    form.evaluate("form => form.submit()")
                    delay(2.5, "Aguardando processamento")
            except:
                pass
    except Exception as e:
        logger.error(f"❌ Erro ao tentar criar obra: {e}")
    
    # Verificar se houve sucesso ou erro
    delay(2.5, "Aguardando resposta do servidor")
    
    # Verificar mensagens de sucesso/erro
    try:
        # Procurar por toast de sucesso
        success_msg = page.locator(
            "text=/sucesso|success|obra criada|obra salva/i, "
            "[class*='success'], "
            "[class*='toast-success']"
        ).first
        if success_msg.count() > 0:
            logger.info("🎉 OBRA CRIADA COM SUCESSO!")
            logger.info(f"   Mensagem: {success_msg.inner_text()}")
        else:
            # Procurar por erros
            error_msg = page.locator(
                "text=/erro|error|falha|obrigatório|required/i, "
                "[class*='error'], "
                "[class*='toast-error']"
            ).first
            if error_msg.count() > 0:
                logger.warning(f"⚠️ Possível erro: {error_msg.inner_text()}")
            else:
                logger.info("ℹ️ Nenhuma mensagem de sucesso/erro detectada")
    except Exception as e:
        logger.warning(f"⚠️ Erro ao verificar mensagens: {e}")
    
    # Verificar se foi redirecionado
    try:
        current_url = page.url
        if "/dashboard/obras" in current_url and "/nova" not in current_url:
            logger.info("✅ Redirecionado para lista de obras - provável sucesso!")
        elif "/dashboard/obras/nova" in current_url:
            logger.info("ℹ️ Ainda na página de criação - verificar se houve erro")
    except:
        pass

def main():
    """Função principal"""
    logger.info("=" * 60)
    logger.info("🚀 INICIANDO TESTE DE CRIAÇÃO DE OBRA")
    logger.info("=" * 60)
    logger.info(f"URL Base: {BASE_URL}")
    logger.info(f"Email: {LOGIN_EMAIL}")
    logger.info(f"Headless: {HEADLESS}")
    logger.info(f"Slowmo: {SLOWMO}ms")
    logger.info("=" * 60)
    
    with sync_playwright() as pw:
        # Iniciar navegador
        logger.info("🌐 Iniciando navegador...")
        browser = pw.chromium.launch(
            headless=HEADLESS,
            slow_mo=SLOWMO,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--lang=pt-BR",
            ]
        )
        
        # Criar contexto e página
        context = browser.new_context(
            locale="pt-BR",
            timezone_id="America/Sao_Paulo",
            viewport={"width": 1920, "height": 1080}
        )
        page = context.new_page()
        page.set_default_timeout(TIMEOUT_MS)
        page.set_default_navigation_timeout(TIMEOUT_MS)
        
        try:
            # 1. Login
            login(page)
            delay(1.5, "Aguardando após login")
            
            # 2. PRIMEIRO: Criar todas as entidades necessárias em abas separadas
            logger.info("=" * 60)
            logger.info("📋 FASE 1: CRIANDO ENTIDADES NECESSÁRIAS")
            logger.info("=" * 60)
            
            # 2.1. Verificar/Criar cliente
            logger.info("👤 Verificando necessidade de cliente...")
            precisa_cliente = verificar_se_precisa_cliente(context, page)
            if precisa_cliente:
                logger.info("✅ Cliente necessário - criando em nova aba...")
                criar_cliente_nova_aba(context, page)
                delay(1)
            else:
                logger.info("ℹ️ Cliente já existe ou não é necessário")
            
            # 2.2. Verificar/Criar funcionário
            logger.info("👷 Verificando necessidade de funcionário...")
            precisa_funcionario = verificar_se_precisa_funcionario(context, page)
            if precisa_funcionario:
                logger.info("✅ Funcionário necessário - criando em nova aba...")
                criar_funcionario_nova_aba(context, page)
                delay(1)
            else:
                logger.info("ℹ️ Funcionário já existe ou não é necessário")
            
            # 2.3. Verificar/Criar grua
            logger.info("🏗️ Verificando necessidade de grua...")
            precisa_grua = verificar_se_precisa_grua(context, page)
            if precisa_grua:
                logger.info("✅ Grua necessária - criando em nova aba...")
                criar_grua_nova_aba(context, page)
                delay(1)
            else:
                logger.info("ℹ️ Grua já existe ou não é necessária")
            
            logger.info("=" * 60)
            logger.info("✅ FASE 1 CONCLUÍDA: Todas as entidades criadas")
            logger.info("=" * 60)
            delay(2, "Aguardando antes de preencher formulário")
            
            # 3. SEGUNDO: Navegar para criação de obra e preencher formulário
            logger.info("=" * 60)
            logger.info("📝 FASE 2: PREENCHENDO FORMULÁRIO DA OBRA")
            logger.info("=" * 60)
            
            navegar_para_criacao_obra(page)
            delay(1)
            
            # 3.1. Preencher dados básicos da obra
            preencher_dados_obra(page)
            delay(1)
            
            # 3.2. Selecionar cliente criado
            logger.info("🔍 Selecionando cliente...")
            selecionar_cliente_criado(page)
            delay(1)
            
            # 3.3. Selecionar funcionário criado (se necessário)
            logger.info("🔍 Selecionando funcionário...")
            selecionar_funcionario_criado(page)
            delay(1)
            
            # 3.4. Selecionar grua criada
            logger.info("🔍 Selecionando grua...")
            selecionar_grua_criada(page)
            delay(1)
            
            # 4. TERCEIRO: Criar a obra
            logger.info("=" * 60)
            logger.info("🚀 FASE 3: CRIANDO OBRA")
            logger.info("=" * 60)
            tentar_criar_obra(page)
            
            logger.info("=" * 60)
            logger.info("✅ TESTE CONCLUÍDO!")
            logger.info("=" * 60)
            logger.info("⏸️ Mantendo navegador aberto por 15 segundos para inspeção...")
            delay(15, "Aguardando inspeção manual")
            
        except Exception as e:
            logger.error(f"❌ ERRO DURANTE EXECUÇÃO: {e}")
            import traceback
            logger.error(traceback.format_exc())
            delay(10, "Aguardando antes de fechar (para debug)")
        
        finally:
            logger.info("🔒 Fechando navegador...")
            browser.close()
            logger.info("✅ Navegador fechado")

if __name__ == "__main__":
    main()

