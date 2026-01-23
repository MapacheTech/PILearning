import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Message } from '../types';
import { n8nService } from '../services/n8nService';
import { useAuth } from '../contexts/AuthContext';

const getChatStorageKey = (userId: string) => `pilearning_chat_${userId}`;

const DEFAULT_WELCOME_MESSAGE: Message = {
    id: '1',
    role: 'ai',
    content: "¡Hola! Soy tu asistente de PI Learning. Sube documentos usando el panel izquierdo y podré ayudarte a estudiar, generar flashcards y responder preguntas sobre el contenido.<br/><br/>¿En qué puedo ayudarte hoy?"
};

interface ChatScreenProps {
    onNavigate: (view: 'chat' | 'flashcards') => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onNavigate }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME_MESSAGE]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const storageKey = user ? getChatStorageKey(user.id) : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load chat history from localStorage on mount (per user)
    useEffect(() => {
        if (!storageKey) return;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            } catch (e) {
                console.error('Error parsing saved chat:', e);
            }
        }
        setIsInitialized(true);
    }, [storageKey]);

    // Save chat history to localStorage whenever messages change (per user)
    useEffect(() => {
        if (!storageKey || !isInitialized) return;
        localStorage.setItem(storageKey, JSON.stringify(messages));
    }, [messages, storageKey, isInitialized]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleClearHistory = () => {
        if (confirm('¿Estás seguro de que deseas limpiar el historial de chat?')) {
            setMessages([DEFAULT_WELCOME_MESSAGE]);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isTyping) return;

        const currentText = inputValue;
        setInputValue("");

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: currentText
        };

        setMessages(prev => [...prev, newUserMsg]);
        setIsTyping(true);

        try {
            const aiResponse = await n8nService.sendMessage(currentText, messages, user?.id);
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                content: "I encountered an error connecting to the webhook. Please try again.",
                verified: false
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    return (
        <div className="flex h-screen bg-background-dark overflow-hidden">
            <Sidebar onNavigate={onNavigate} />
            <main className="flex-1 flex flex-col relative bg-background-dark min-w-0">
                <TopNav activeTab="chat" onNavigate={onNavigate} />

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
                    <div className="max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8 pb-48">
                        {/* Date Separator with Clear History */}
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1 rounded-full">Hoy</span>
                            {messages.length > 1 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="text-xs font-medium text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                                    title="Limpiar historial"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                {msg.role === 'ai' ? (
                                    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-indigo-500/20">
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>auto_awesome</span>
                                    </div>
                                ) : (
                                    <img
                                        src="https://picsum.photos/100"
                                        className="size-8 rounded-full border border-white/10 shrink-0 mt-1"
                                        alt="User"
                                    />
                                )}

                                <div className={`flex flex-col gap-2 max-w-2xl ${msg.role === 'user' ? 'items-end' : ''}`}>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold text-white">{msg.role === 'ai' ? 'PI Learning' : 'You'}</span>
                                        {msg.verified && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                Verified sources
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className={`px-5 py-4 rounded-2xl text-base leading-relaxed shadow-sm ${msg.role === 'ai'
                                                ? 'bg-surface-dark rounded-tl-sm text-gray-200 border border-white/5'
                                                : 'bg-primary rounded-tr-sm text-white shadow-lg shadow-primary/10'
                                            }`}
                                    >
                                        <div dangerouslySetInnerHTML={{ __html: msg.content }} />

                                        {msg.actions && (
                                            <div className="flex gap-2 mt-4">
                                                <button className="text-xs font-medium text-primary hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px]">content_copy</span> Copy
                                                </button>
                                                <button className="text-xs font-medium text-primary hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span> View Source
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-4">
                                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shrink-0 mt-1">
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>auto_awesome</span>
                                </div>
                                <div className="bg-surface-dark rounded-2xl rounded-tl-sm px-5 py-4 border border-white/5">
                                    <div className="flex gap-1 h-6 items-center">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 w-full px-6 pb-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-20">
                    <div className="max-w-3xl mx-auto flex flex-col gap-3">
                        {/* Quick Action Chips */}
                        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                            <button onClick={() => setInputValue("Summarize the documents")} className="flex items-center gap-1.5 bg-surface-dark border border-primary/20 hover:border-primary/50 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg shadow-black/20 hover:bg-[#2a2b45] transition-all transform hover:-translate-y-0.5">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>auto_awesome</span>
                                Summarize Documents
                            </button>
                            <button onClick={() => setInputValue("Create a timeline from Project Alpha")} className="flex items-center gap-1.5 bg-surface-dark border border-white/5 hover:border-white/20 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg shadow-black/20 hover:bg-[#2a2b45] transition-all transform hover:-translate-y-0.5">
                                <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '16px' }}>timeline</span>
                                Create Timeline
                            </button>
                        </div>
                        {/* Input Bar */}
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-primary/20 blur-xl rounded-full transition-opacity duration-500 ${isTyping ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'}`}></div>
                            <div className="relative flex items-center gap-2 bg-[#1e1e2e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
                                <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add_circle</span>
                                </button>
                                <input
                                    className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-base py-2"
                                    placeholder={isTyping ? "Thinking..." : "Ask a question about your sources..."}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isTyping}
                                />
                                <div className="flex items-center gap-1">
                                    <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Voice Input">
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>mic</span>
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isTyping || !inputValue.trim()}
                                        className={`p-2 rounded-xl text-white transition-colors shadow-lg ${isTyping || !inputValue.trim() ? 'bg-gray-700 cursor-not-allowed' : 'bg-primary hover:bg-indigo-500 shadow-primary/25'}`}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_upward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-600 mt-1">PI Learning puede cometer errores. Por favor verifica la información importante.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};