import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { HeroBand } from "@/components/HeroBand";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-counselor`;

const SUGGESTED_QUESTIONS = [
  "ما التخصص المناسب لي بناءً على نتائجي؟",
  "ما الفرق بين هندسة البرمجيات والأمن السيبراني؟",
  "كيف أختار تخصصي الجامعي؟",
  "ما هي أفضل الجامعات السعودية لتخصصي؟",
];

export default function AICounselorPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ai_chat_messages")
        .select("role, content")
        .order("created_at", { ascending: true });
      if (data?.length) {
        setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
      }
      setLoadingHistory(false);
    })();
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("ai_chat_messages").insert({
      user_id: session.user.id,
      role,
      content,
    } as any);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Save user message
    saveMessage("user", userMsg.content);

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        const current = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: current } : m));
          }
          return [...prev, { role: "assistant", content: current }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Save assistant message
      if (assistantSoFar) {
        saveMessage("assistant", assistantSoFar);
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("ai_chat_messages").delete().eq("user_id", session.user.id);
    setMessages([]);
    toast({ title: "تم مسح المحادثة" });
  };

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="athar-page">
      <HeroBand
        eyebrow="مستشار أثر الذكي"
        title="اسأل، ونساعدك تفهم أكثر"
        description="مستشارك المهني الشخصي؛ يجيب أسئلتك عن التخصصات الجامعية والمسارات المهنية."
      >
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="gap-1.5 rounded-[10px] px-0 font-bold text-hero-muted hover:bg-transparent hover:text-hero-foreground"
          >
            <Trash2 className="h-4 w-4" /> مسح المحادثة
          </Button>
        )}
      </HeroBand>

      <section className="athar-card flex h-[max(420px,calc(100vh-24rem))] flex-col p-0 md:p-0">
        {/* Messages */}
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-8 text-center"
            >
              <div className="btn-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl shadow-premium">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-extrabold">مرحبًا! أنا مستشار أثر 🎓</h3>
                <p className="text-sm text-muted-foreground">اسألني أي سؤال عن التخصصات الجامعية والمسارات المهنية</p>
              </div>
              <div className="mx-auto grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="rounded-[13px] border-[1.5px] border-border bg-card p-3 text-start text-sm font-semibold transition-colors hover:border-accent hover:bg-accent/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                    msg.role === "user" ? "bg-hero-to text-hero-foreground dark:bg-accent dark:text-accent-foreground" : "bg-accent/15 text-[hsl(var(--gradient-end))]"
                  }`}
                >
                  {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`max-w-[82%] rounded-[15px] px-4 py-[13px] text-[0.96rem] leading-[1.65] ${
                    msg.role === "user"
                      ? "rounded-bl-[5px] bg-hero-to text-hero-foreground dark:bg-accent/15 dark:text-foreground"
                      : "rounded-br-[5px] bg-muted text-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>ol]:mb-2 [&>p]:mb-2 [&>ul]:mb-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-end gap-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-[hsl(var(--gradient-end))]">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-[15px] rounded-br-[5px] bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/60 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2.5"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              disabled={isLoading}
              className="athar-field flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-gradient h-auto shrink-0 gap-2 rounded-xl px-5 font-bold"
              aria-label="إرسال"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">إرسال</span>
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
