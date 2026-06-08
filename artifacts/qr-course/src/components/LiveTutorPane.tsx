import { useEffect, useRef, useState } from "react";
import { useAskTutor } from "@workspace/api-client-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MathKeyboard } from "@/components/MathKeyboard";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";

type ChatMsg = { role: "user" | "tutor"; text: string };

interface LiveTutorPaneProps {
  lectureId?: number | null;
  topicTitle?: string | null;
  contextLabel?: string;
  starters?: string[];
}

/**
 * Always-on tutor pane for PRACTICE contexts (topic practice, practice exams).
 * Never used inside graded assignments — graded work stays tutor-free by design.
 */
export function LiveTutorPane({
  lectureId,
  topicTitle,
  contextLabel,
  starters,
}: LiveTutorPaneProps) {
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const ask = useAskTutor();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function insertAtCursor(sym: string) {
    const ta = taRef.current;
    setInput((prev) => {
      if (!ta) return prev + sym;
      const start = ta.selectionStart ?? prev.length;
      const end = ta.selectionEnd ?? prev.length;
      const next = prev.slice(0, start) + sym + prev.slice(end);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + sym.length;
        ta.setSelectionRange(pos, pos);
      });
      return next;
    });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [history.length, ask.isPending]);

  function sendMessage(msg: string) {
    const text = msg.trim();
    if (!text) return;
    setHistory((h) => [...h, { role: "user", text }]);
    ask.mutate(
      {
        data: {
          message: text,
          lectureId: lectureId ?? undefined,
        },
      },
      {
        onSuccess: (res) =>
          setHistory((h) => [...h, { role: "tutor", text: res.text }]),
        onError: (e) =>
          setHistory((h) => [
            ...h,
            { role: "tutor", text: `Tutor error: ${(e as Error).message}` },
          ]),
      },
    );
  }

  function send() {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    sendMessage(msg);
  }

  const defaultStarters =
    starters && starters.length
      ? starters
      : [
          topicTitle
            ? `Give me a hint for working through ${topicTitle} problems.`
            : "Give me a hint for working through this problem.",
          "Walk me through a worked example step by step.",
          "What's the most common mistake people make here?",
        ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-background border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-border bg-card flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Live tutor</span>
        {contextLabel && (
          <span className="text-xs text-muted-foreground truncate">· {contextLabel}</span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {history.length === 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground italic">
              The tutor is here for the whole practice session. Ask for hints, worked examples, or explanations — it can't see the answer key, so it coaches your reasoning.
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {defaultStarters.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={ask.isPending}
                  className="text-left text-xs px-2.5 py-2 rounded-md border border-border bg-card hover:bg-secondary transition-colors disabled:opacity-50"
                  data-testid={`button-tutor-starter-${i}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] ${m.role === "user" ? "self-end" : "self-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}
            >
              <MarkdownRenderer content={m.text} inverted={m.role === "user"} />
            </div>
          </div>
        ))}
        {ask.isPending && (
          <div className="self-start px-3 py-2 rounded-lg bg-card border border-border text-sm animate-pulse text-muted-foreground">
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background p-2">
        <MathKeyboard onInsert={insertAtCursor} collapsible className="mb-2" />
        <div className="flex gap-2 items-end">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask the tutor for a hint… (Shift+Enter for newline)"
            rows={2}
            className="flex-1 bg-secondary border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[52px] max-h-[160px]"
            data-testid="input-live-tutor"
          />
          <Button onClick={send} disabled={!input.trim() || ask.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
