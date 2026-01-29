import React, { useState, useRef, useEffect } from 'react';
import { generateChatMessage } from '../services/geminiService';
import { Send, Bot, X, Loader2 } from 'lucide-react';

interface AIChatProps {
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Teaching Assistant. How can I help you manage your class today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Filter out the initial static greeting from history to avoid confusion
      // or "model message first" errors from the API if strict alternation is required.
      // We start history from the first real user interaction.
      const history = messages
        .filter((_, index) => index > 0) 
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const responseText = await generateChatMessage(userMsg, history);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText || "I couldn't generate a response." }]);
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Sorry, I encountered an error. Please try again.";
      if (error.message && error.message.includes("API Key")) {
        errorMsg = "API Key missing. Please configure the API_KEY environment variable.";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-paper shadow-2xl rounded-lg border border-stone-300 flex flex-col font-sans z-[100]">
      <div className="bg-stone-800 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-semibold">Teaching Assistant</span>
        </div>
        <button onClick={onClose} className="hover:bg-stone-700 p-1 rounded">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-stone-200 text-stone-800 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-stone-200 p-3 rounded-lg rounded-bl-none flex items-center">
               <Loader2 className="animate-spin h-4 w-4 text-stone-600" />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-stone-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;