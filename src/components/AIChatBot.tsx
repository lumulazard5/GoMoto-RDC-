import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, ShieldAlert, ArrowRight } from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  time: string;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Bonjour ! Je suis l'Assistant Arbitral IA de GoMoto RDC. Je peux vous expliquer les règles routières aux 26 provinces, le fonctionnement du portefeuille bloqué en **REPARO** (escrow d'État), ou les conditions de remboursement en cas d'absence d'un motard. Comment puis-je vous aider ?",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!response.ok) {
        throw new Error("Erreur de communication avec le serveur.");
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        sender: "ai",
        text: data.reply,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI chat error:", error);
      const errorMsg: Message = {
        sender: "ai",
        text: "Désolé, j'ai rencontré un problème pour contacter le tribunal de GoMoto. Veuillez vérifier votre connexion. (Note: Ma simulation de secours est toujours active si vous réessayez).",
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "C'est quoi le REPARO ?", text: "C'est quoi le compte REPARO et comment marche le paiement upfront ?" },
    { label: "Remboursement course", text: "Comment marche le remboursement en cas d'absence de motard ?" },
    { label: "Exclusivité Gombe", text: "Quelles sont les limites des motards au centre de la Gombe ?" },
    { label: "Amendes & Casques", text: "Quelles sont les obligations légales de sécurité (double casque et infractions) ?" }
  ];

  return (
    <div id="gomoto-ai-chatbot-widget" className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* FLOATING ACTION TRIGGER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center relative group cursor-pointer border border-blue-500"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out font-bold text-xs white-space-nowrap pl-0 group-hover:pl-2">
            Arbitrage IA
          </span>
        </button>
      )}

      {/* CHAT MESSENGER PANEL BODY */}
      {isOpen && (
        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl w-[360px] md:w-[400px] h-[500px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600/10 p-1.5 rounded-xl border border-blue-500/30 text-blue-400">
                <Sparkles className="w-4 h-4 animate-spin-slow text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-50">Support Arbitral & Sécurité IA</h4>
                <p className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Cabinet Actif en Direct (26 Provinces)</span>
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Warnings & legal checks */}
          <div className="bg-blue-950/40 border-b border-blue-900/40 px-4 py-2 text-[9.5px] text-blue-300 flex gap-2 items-start leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Les conseils de l'IA reflètent rigoureusement la loi congolaise (Code de la Route) et la politique légale GoMoto RDC.
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60 custom-scrollbar text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`p-3 rounded-2xl leading-relaxed text-left ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-750"
                  }`}
                >
                  {/* Process markdown formatting roughly if any ** present */}
                  {m.text.includes("**") ? (
                    <div className="space-y-1.5">
                      {m.text.split("\n").map((line, lIdx) => {
                        // Check for bold notation
                        let formattedLine = line;
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const parts = [];
                        let lastIndex = 0;
                        let match;
                        while ((match = boldRegex.exec(line)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(line.substring(lastIndex, match.index));
                          }
                          parts.push(<strong key={match.index} className="text-yellow-405 font-extrabold">{match[1]}</strong>);
                          lastIndex = boldRegex.lastIndex;
                        }
                        if (lastIndex < line.length) {
                          parts.push(line.substring(lastIndex));
                        }
                        return <p key={lIdx}>{parts.length > 0 ? parts : line}</p>;
                      })}
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{m.text}</p>
                  )}
                </div>
                <span className="text-[8px] text-slate-500 font-mono mt-1">{m.time}</span>
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 p-2 text-[10px]">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce duration-300"></span>
                  <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.15s] duration-300"></span>
                  <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.3s] duration-300"></span>
                </div>
                <span className="font-mono text-[9px] italic">Tribunal d'arbitrage routier en cours d'analyse...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/40 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            {quickPrompts.map((qp, id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSendMessage(qp.text)}
                className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer font-bold border border-slate-750 shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input block */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Écrivez votre question de sécurité/arbitrage..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
