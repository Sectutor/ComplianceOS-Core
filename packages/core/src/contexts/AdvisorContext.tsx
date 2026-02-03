
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAskQuestion } from '@/hooks/useAdvisor';
import { toast } from 'sonner';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AdvisorContextType {
    isOpen: boolean;
    openChat: (initialMessage?: string, context?: any) => void;
    closeChat: () => void;
    toggleChat: () => void;
    messages: Message[];
    sendMessage: (content: string) => Promise<void>;
    isLoading: boolean;
    clientId: number | null;
    setClientId: (id: number) => void;
    activeContext: any;
    setContext: (context: any) => void;
}

const AdvisorContext = createContext<AdvisorContextType | undefined>(undefined);

export function AdvisorProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [clientId, setClientId] = useState<number | null>(null);
    const [activeContext, setActiveContext] = useState<any>(null);

    const { askAsync, isLoading } = useAskQuestion();

    const openChat = (initialMessage?: string, context?: any) => {
        setIsOpen(true);
        if (context) setActiveContext(context);
        if (initialMessage) {
            sendMessage(initialMessage, context);
        }
    };

    const closeChat = () => setIsOpen(false);
    const toggleChat = () => setIsOpen(prev => !prev);

    const sendMessage = async (content: string, overrideContext?: any) => {
        if (!content.trim()) return;

        // Default to 0 (Global/System) if no client selected
        const targetClientId = clientId || 0;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);

        try {
            const contextToSend = overrideContext || activeContext || undefined;

            // Build conversation history for context-aware follow-ups
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await askAsync({
                clientId: targetClientId,
                question: content.trim(),
                context: contextToSend,
                conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined
            });

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.answer,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Advisor Error:', error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            toast.error("Failed to get response from Advisor");
        }
    };

    return (
        <AdvisorContext.Provider value={{
            isOpen,
            openChat,
            closeChat,
            toggleChat,
            messages,
            sendMessage,
            isLoading,
            clientId,
            setClientId,
            // Expose context management
            activeContext,
            setContext: setActiveContext
        }}>
            {children}
        </AdvisorContext.Provider>
    );
}

export function useAdvisor() {
    const context = useContext(AdvisorContext);
    if (context === undefined) {
        throw new Error('useAdvisor must be used within an AdvisorProvider');
    }
    return context;
}
