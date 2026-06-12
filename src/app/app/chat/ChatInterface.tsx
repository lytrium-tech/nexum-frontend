'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'error' | 'sent';
  isPendingAction?: boolean;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePendingActionId, setActivePendingActionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessageId = crypto.randomUUID();
    const externalMessageId = crypto.randomUUID();
    const messageText = inputValue.trim();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', content: messageText, status: 'sending' }
    ]);
    setInputValue('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/conversations/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ 
          message: messageText,
          channel: 'pwa',
          external_message_id: externalMessageId,
          pending_action_id: activePendingActionId || undefined
        })
      });

      let response;
      if (!res.ok) {
        throw { status: res.status };
      } else {
        response = await res.json();
      }
      
      // Update state machine
      if (response.status === 'awaiting_confirmation' || response.status === 'awaiting_clarification') {
        if (response.pending_action_id) {
          setActivePendingActionId(response.pending_action_id);
        }
      } else if (response.status === 'completed' || response.status === 'cancelled' || response.status === 'error') {
        setActivePendingActionId(null);
      }

      setMessages((prev) => 
        prev.map((m) => m.id === userMessageId ? { ...m, status: 'sent' } : m)
      );

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.response_text,
          isPendingAction: response.status === 'awaiting_clarification' || response.status === 'awaiting_confirmation'
        }
      ]);
    } catch (error: unknown) {
      console.error('Chat error:', error);
      const err = error as { status?: number, data?: { detail?: string } };
      
      let humanError = 'Ocurrió un error inesperado al intentar comunicarnos con el servidor.';
      if (err.status === 401) humanError = 'Tu sesión ha expirado. Por favor recarga la página.';
      else if (err.status === 403) humanError = 'No tienes permiso para realizar esta acción.';
      else if (err.status === 422) humanError = err.data?.detail || 'Hubo un error validando tu mensaje.';
      else if (err.status === 429) humanError = 'Has enviado demasiados mensajes. Intenta nuevamente en unos minutos.';
      else if (err.status === 500) humanError = 'El servidor está experimentando problemas. Intenta más tarde.';
      else if (!err.status) humanError = 'No pudimos conectar con el servidor. Verifica tu conexión a internet.';

      setMessages((prev) => 
        prev.map((m) => m.id === userMessageId ? { ...m, status: 'error' } : m)
      );

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ ${humanError}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-warm-white">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto opacity-80">
            <div className="w-16 h-16 bg-graphite-blue rounded-2xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-3xl leading-none">N</span>
            </div>
            <h2 className="text-2xl font-semibold text-graphite-blue mb-3">¿En qué puedo ayudarte?</h2>
            <p className="text-gray-500 mb-8">
              Cuéntame tus movimientos financieros o hazme una pregunta sobre tus finanzas.
            </p>
            <div className="flex flex-col gap-3 w-full text-sm">
              <button onClick={() => setInputValue('Registré un gasto de 20.000 en almuerzo desde Nequi')} className="bg-white border border-soft-gray rounded-xl p-3 text-left text-gray-700 hover:border-graphite-blue hover:text-graphite-blue transition-colors">
                &quot;Registré un gasto de 20.000 en almuerzo desde Nequi&quot;
              </button>
              <button onClick={() => setInputValue('Me ingresaron 500.000 a Bancolombia')} className="bg-white border border-soft-gray rounded-xl p-3 text-left text-gray-700 hover:border-graphite-blue hover:text-graphite-blue transition-colors">
                &quot;Me ingresaron 500.000 a Bancolombia&quot;
              </button>
              <button onClick={() => setInputValue('¿Cuánto dinero libre puedo gastar?')} className="bg-white border border-soft-gray rounded-xl p-3 text-left text-gray-700 hover:border-graphite-blue hover:text-graphite-blue transition-colors">
                &quot;¿Cuánto dinero libre puedo gastar?&quot;
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-graphite-blue text-white rounded-br-sm' 
                    : `bg-white border border-soft-gray text-gray-800 rounded-bl-sm ${msg.isPendingAction ? 'border-champagne-gold border-2' : ''}`
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.status === 'error' && (
                  <span className="text-xs text-red-300 mt-2 block">No se pudo enviar.</span>
                )}
                {msg.status === 'sending' && (
                  <span className="text-xs text-gray-300 mt-2 block">Enviando...</span>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-soft-gray rounded-2xl p-4 rounded-bl-sm">
              <div className="flex space-x-1.5 items-center h-6">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-soft-gray">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-warm-white border border-soft-gray rounded-2xl py-3 px-4 resize-none h-[56px] min-h-[56px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-graphite-blue/20"
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="h-[56px] px-6 bg-graphite-blue text-white rounded-2xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-graphite-blue/90 flex items-center justify-center shrink-0"
          >
            Enviar
          </button>
        </form>
        <p className="text-center text-[11px] text-gray-400 mt-3">
          Nexum puede cometer errores. Considera verificar tu información financiera importante.
        </p>
      </div>
    </div>
  );
}
