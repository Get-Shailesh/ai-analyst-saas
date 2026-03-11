"use client";
import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { chatApi } from "@/lib/api";

interface Msg {
  role: "user" | "ai";
  content: string;
}

const SUGGESTIONS = [
  "Summarise my dataset",
  "What are the key trends?",
  "Which values are anomalies?",
  "Give me recommendations",
];

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      content:
        "Hi! I am your AI Data Analyst. Ask me anything about your uploaded dataset.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const { activeDataset } = useAppStore();

  const send = async () => {
    if (!input.trim()) return;
    if (!activeDataset) {
      setMsgs((m) => [
        ...m,
        { role: "user", content: input },
        {
          role: "ai",
          content: "Please upload a dataset first before asking questions.",
        },
      ]);
      setInput("");
      return;
    }

    const userMsg = input;
    setMsgs((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const history = msgs.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const response = await chatApi.send(activeDataset.id, userMsg, history);
      const reply = response.data.data.content;
      setMsgs((m) => [...m, { role: "ai", content: reply }]);
    } catch (error) {
      setMsgs((m) => [
        ...m,
        {
          role: "ai",
          content:
            "Sorry, I encountered an error. Please make sure the backend is running and your Anthropic API key is set.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Chat with Your Data"
          subtitle={
            activeDataset
              ? `Analysing: ${activeDataset.name}`
              : "Upload a dataset first"
          }
        />
        <main className="flex-1 overflow-hidden p-7">
          <Card className="h-full flex flex-col p-0 overflow-hidden">
            {!activeDataset && (
              <div className="mx-5 mt-5 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-400 text-xs font-semibold">
                  ⚠️ No dataset loaded — please upload a file first from the
                  Upload page.
                </p>
              </div>
            )}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-3 ${m.role === "user" ? "bg-purple-500/20 border border-purple-500/40 rounded-br-sm" : "bg-dark-500 border border-dark-300 rounded-bl-sm"}`}
                  >
                    {m.role === "ai" && (
                      <p className="text-brand text-[10px] font-bold mb-1.5 tracking-wider">
                        AI ANALYST
                      </p>
                    )}
                    <p className="text-dark-50 text-xs leading-relaxed whitespace-pre-line">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dark-300 border-t-brand rounded-full animate-spin" />
                  <span className="text-dark-200 text-xs">
                    Analysing your data...
                  </span>
                </div>
              )}
              <div ref={bottom} />
            </div>
            {/* Input */}
            <div className="border-t border-dark-300 p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="bg-dark-500 border border-dark-300 text-dark-200 hover:text-dark-50 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask anything about your data..."
                  className="flex-1 bg-dark-500 border border-dark-300 rounded-lg px-3 py-2.5 text-dark-50 text-xs outline-none focus:border-brand/40 transition-colors"
                />
                <Button onClick={send} size="sm" className="px-4">
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
