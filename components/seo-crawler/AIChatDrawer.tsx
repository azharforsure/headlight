import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useSeoCrawler } from '../../contexts/SeoCrawlerContext';
import { useCrawlerUI } from '../../contexts/CrawlerUIContext';
import { ChatContextBuilder } from '../../services/ai/ChatContextBuilder';

export default function AIChatDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { pages, stats, healthScore, config } = useSeoCrawler();
    const { selectedPage, setSelectedPage } = useCrawlerUI();
    const [messages, setMessages] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const configuredCrawlerApiUrl = (import.meta as any).env?.VITE_CRAWLER_API_URL;
    const apiBase = configuredCrawlerApiUrl || (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : 'http://localhost:3001');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const suggestedPrompts = [
        "What are the biggest issues on my site?",
        "Show me all pages without meta descriptions",
        "Why did our health score drop?",
        "Which pages have the best ROI opportunity?"
    ];

    const handleSubmit = async (e: React.FormEvent | string) => {
        if (typeof e !== 'string') e.preventDefault();
        const text = typeof e === 'string' ? e : input;
        if (!text.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInput('');
        setIsTyping(true);

        try {
            const context = ChatContextBuilder.buildContext(
                { name: config.startUrls[0] || 'Current Site' }, 
                pages, 
                { healthScore: healthScore.score, total: pages.length, topIssues: [] }, 
                text
            );

            // Fetch from backend
            const res = await fetch(`${apiBase}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: context, systemPrompt: "You are an SEO AI assistant. Be concise." })
            });

            if (!res.ok) throw new Error('AI response failed');
            
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.text || "Sorry, I couldn't generate a response." }]);
            
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'ai', content: `Error: ${error.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-[#111] border-l border-[#222] shadow-2xl flex flex-col z-[100] transform transition-transform duration-300">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#161616]">
                <h2 className="text-[12px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400" /> AI Assistant
                </h2>
                <button onClick={onClose} className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Sparkles size={24} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[#ccc] text-[13px] font-medium mb-1">How can I help with your SEO?</p>
                            <p className="text-[#666] text-[11px]">Ask questions about your crawl data, request analyses, or find specific issues.</p>
                        </div>
                        <div className="flex flex-col w-full gap-2">
                            {suggestedPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSubmit(prompt)}
                                    className="text-[11px] text-left p-3 rounded-lg border border-[#222] bg-[#161616] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-[#888] hover:text-[#ccc]"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 text-[12px] leading-relaxed ${
                                msg.role === 'user' ? 'bg-[#222] text-white border border-[#333]' : 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-lg p-3 text-[12px] flex gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[#161616] border-t border-[#222]">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about your site..."
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-4 pr-10 py-3 text-[12px] text-white placeholder-[#555] focus:outline-none focus:border-emerald-500/50 transition-colors"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#555] hover:text-emerald-400 disabled:opacity-50 disabled:hover:text-[#555] transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}
