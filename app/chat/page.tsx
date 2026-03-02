"use client";

import { useState, useRef, useEffect } from "react";
import { chatAction } from "@/actions";
import { ChatMessage } from "@/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowSlowMessage(true);
      }, 3000);
    } else {
      setShowSlowMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const assistantResponse = await chatAction(messages, input);
      setMessages((prev) => [...prev, assistantResponse]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col h-screen mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Holly Chat Assistant</h1>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Ask me about job descriptions or salaries.
          </p>
        )}
        
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                m.role === "user"
                  ? "bg-blue-300 text-black rounded-br-none"
                  : "bg-gray-200 text-black rounded-bl-none"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start gap-1">
            <div className="bg-gray-200 text-gray-400 rounded-lg p-3 italic">
              Thinking...
            </div>
            {showSlowMessage && (
              <p className="text-s text-gray-400 ml-1">
                Gemini-flash free tier takes longer please wait...
              </p>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-10 mx-10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., What's the salary for Grade 2 Associate Meteorologist?"
          className="flex-1 p-2 border text-black bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-red-300 text-black hover:bg-red-500 disabled:opacity-50 transition-colors"
        >
          Send Message
        </button>
      </form>
    </main>
  );
}
