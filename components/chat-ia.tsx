"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MessageCircle, 
  Send, 
  X, 
  Loader2,
  Bot,
  User,
  AlertCircle
} from "lucide-react"
import { chatIaApi, type ChatMessage } from "@/lib/api-chat-ia"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ChatIaProps {
  /** Se true, mostra como botão flutuante. Se false, mostra como componente inline */
  floating?: boolean
  /** Classe CSS adicional */
  className?: string
}

export function ChatIa({ floating = true, className }: ChatIaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Verificar disponibilidade ao montar (com debounce)
  useEffect(() => {
    let cancelled = false
    
    const checkAvailability = async () => {
      try {
        await verificarDisponibilidade()
      } catch (error: any) {
        // Ignorar erros 429 silenciosamente
        if (!error.message?.includes('429') && !error.message?.includes('Muitas tentativas')) {
          console.error('Erro ao verificar disponibilidade:', error)
        }
      }
    }
    
    // Pequeno delay para evitar múltiplas chamadas simultâneas
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        checkAvailability()
      }
    }, 500)
    
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [])

  // Debug: verificar se componente está sendo renderizado
  useEffect(() => {
    if (floating) {
      console.log('ChatIa: Componente renderizado (floating mode)')
    }
  }, [floating])

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      // Pequeno delay para garantir que o DOM foi atualizado
      const timeoutId = setTimeout(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') ||
                                scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') ||
                                scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
          // Forçar scroll para garantir
          requestAnimationFrame(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight
          })
        }
      }, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [messages, isOpen])

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const verificarDisponibilidade = async () => {
    try {
      const response = await chatIaApi.verificarDisponibilidade()
      setIsAvailable(response.data.configured && response.data.available)
    } catch (error: any) {
      // Tratar erro 429 especificamente
      if (error.message?.includes('429') || error.message?.includes('Muitas tentativas')) {
        console.warn('Rate limit atingido na verificação de disponibilidade')
        // Manter estado atual em vez de definir como false
        return
      }
      console.error('Erro ao verificar disponibilidade:', error)
      setIsAvailable(false)
    }
  }

  const enviarMensagem = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    }

    // Adicionar mensagem do usuário imediatamente
    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await chatIaApi.enviarMensagem({
        message: userMessage.content,
        conversationHistory: messages
      })

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua mensagem. ${error.message || 'Tente novamente mais tarde.'}`,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a mensagem",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  const limparConversa = () => {
    setMessages([])
    toast({
      title: "Conversa limpa",
      description: "O histórico foi limpo com sucesso"
    })
  }

  // Botão flutuante - sempre mostrar, mesmo se verificação falhar
  if (floating) {
    return (
      <>
        {/* Botão flutuante - sempre mostrar quando não estiver aberto */}
        {!isOpen && (
          <Button
            onClick={() => {
              console.log('ChatIa: Botão clicado, abrindo chat')
              setIsOpen(true)
            }}
            className={cn(
              "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-[100]",
              "bg-[#871b0b] hover:bg-[#6b1509] text-white",
              "transition-all duration-200 hover:scale-110",
              className
            )}
            size="icon"
            aria-label="Abrir chat de IA"
            style={{ 
              position: 'fixed',
              bottom: '1.5rem',
              right: '1.5rem',
              zIndex: 100
            }}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}

        {/* Modal do chat */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md h-[600px] flex flex-col overflow-hidden">
              <Card className="flex flex-col h-full shadow-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle>Assistente Virtual</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8"
                      aria-label="Fechar chat"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ScrollArea className="h-full px-4" ref={scrollAreaRef}>
                      <div className="space-y-4 py-4">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                          <Bot className="h-12 w-12 mb-4 opacity-50" />
                          <p className="text-sm">
                            Olá! Sou seu assistente virtual. Como posso ajudá-lo hoje?
                          </p>
                          <p className="text-xs mt-2">
                            Posso responder dúvidas sobre o sistema, funcionalidades e muito mais.
                          </p>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex gap-3",
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                                message.role === 'user'
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="bg-muted rounded-lg px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="border-t p-4 flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={enviarMensagem}
                        disabled={!inputMessage.trim() || isLoading}
                        size="icon"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {!isAvailable && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>Serviço de IA não configurado</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </>
    )
  }

  // Versão inline (para usar dentro de páginas)
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>Assistente Virtual</CardTitle>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limparConversa}
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">
                  Olá! Sou seu assistente virtual. Como posso ajudá-lo hoje?
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={enviarMensagem}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!isAvailable && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>Serviço de IA não configurado</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

