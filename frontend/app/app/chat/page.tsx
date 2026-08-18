// frontend/app/app/chat/page.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useChat, useChatSessions } from "@/hooks/useApi";
import type { SearchResult, ChatSession } from "@/lib/api";
import {
  Send,
  Sparkles,
  Brain,
  User,
  Paperclip,
  Mic,
  Lightbulb,
  CheckSquare,
  MessageSquare,
  FileText,
  AlertCircle,
  Clock,
  Hash,
  Database,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                      */
/* ─────────────────────────────────────────────────────────── */

interface Message {
  id:          string;
  role:        "user" | "assistant";
  content:     string;
  memories?:   SearchResult[];
  mcpTools?:   string[];          // ← MCP tools used by this response
  timestamp:   string;
}

const suggestedPrompts = [
  { icon: Lightbulb,     text: "Why did we choose CockroachDB?"    },
  { icon: CheckSquare,   text: "What are the current blockers?"     },
  { icon: MessageSquare, text: "Summarize architecture decisions"   },
  { icon: FileText,      text: "What's the current sprint status?"  },
];

/* ─────────────────────────────────────────────────────────── */
/*  MCP tool label map                                         */
/* ─────────────────────────────────────────────────────────── */

const MCP_TOOL_LABELS: Record<string, string> = {
  query_project_memory:  "Memory Search",
  get_project_decisions: "Decisions",
  get_project_tasks:     "Tasks",
  get_memory_stats:      "Memory Stats",
  run_sql_query:         "SQL Query",
};

/* ─────────────────────────────────────────────────────────── */
/*  Shimmer helpers                                            */
/* ─────────────────────────────────────────────────────────── */

function SkeletonLine({
  width  = "100%",
  height = "13px",
}: {
  width?:  string;
  height?: string;
}) {
  return (
    <div
      className="rounded-md"
      style={{ width, height, background: "var(--bg-subtle)", opacity: 0.7 }}
    />
  );
}

function SessionCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="p-3 rounded-xl relative overflow-hidden"
      style={{
        background: "var(--bg-subtle)",
        opacity:    1 - index * 0.2,
      }}
    >
      <div className="absolute inset-0 skel-shimmer pointer-events-none" />
      <div className="flex items-start justify-between mb-2">
        <SkeletonLine width="120px" height="12px" />
        <SkeletonLine width="40px"  height="12px" />
      </div>
      <SkeletonLine width="85%" height="12px" />
      <div className="mt-2">
        <SkeletonLine width="60px" height="10px" />
      </div>
    </div>
  );
}

function MemoryCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="p-3 rounded-lg relative overflow-hidden"
      style={{
        background: "var(--bg-subtle)",
        opacity:    1 - index * 0.2,
      }}
    >
      <div className="absolute inset-0 skel-shimmer pointer-events-none" />
      <div className="flex items-center justify-between mb-2">
        <SkeletonLine width="80px" height="11px" />
        <SkeletonLine width="36px" height="11px" />
      </div>
      <SkeletonLine width="90%"  height="13px" />
      <div className="mt-1.5">
        <SkeletonLine width="70%" height="11px" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Chat Page                                                  */
/* ─────────────────────────────────────────────────────────── */

export default function ChatPage() {
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState("");
  const [sessionId,       setSessionId]       = useState<string | undefined>();
  const [activeMemories,  setActiveMemories]  = useState<SearchResult[]>([]);
  const [activeMcpTools,  setActiveMcpTools]  = useState<string[]>([]);
  const [error,           setError]           = useState<string | null>(null);
  const [activeTab,       setActiveTab]       = useState("chat");
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);

  const chatMutation = useChat();
  const { data: sessions = [], isLoading: sessionsLoading } = useChatSessions();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top:      scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, chatMutation.isPending]);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg: Message = {
      id:        `user-${Date.now()}`,
      role:      "user",
      content:   input,
      timestamp: new Date().toLocaleTimeString([], {
        hour:   "2-digit",
        minute: "2-digit",
      }),
    };

    const messageText = input;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setIsMemoryLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        sessionId,
        message: messageText,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      setSessionId(result.sessionId);
      setActiveMemories(result.retrievedMemories);

      // Capture MCP tools used — falls back to empty array if backend
      // doesn't yet return mcpToolsUsed (safe for incremental rollout)
      const mcpTools: string[] =
        (result as any).mcpToolsUsed ?? [];
      setActiveMcpTools(mcpTools);

      const assistantMsg: Message = {
        id:        `assistant-${Date.now()}`,
        role:      "assistant",
        content:   result.response,
        memories:  result.retrievedMemories,
        mcpTools,
        timestamp: new Date().toLocaleTimeString([], {
          hour:   "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setIsMemoryLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell
      tabs={[
        { label: "Chat",     key: "chat"     },
        { label: "History",  key: "history"  },
        { label: "Sessions", key: "sessions" },
      ]}
      defaultTab="chat"
      onTabChange={setActiveTab}
    >

      {/* ── Chat Tab ─────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div className="flex gap-4 h-[calc(100vh-8rem)]">

          {/* Chat area */}
          <div className="flex-1 flex flex-col nx-card overflow-hidden">

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                  }}
                >
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2
                    className="text-sm font-semibold leading-none"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Optava Agent
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: "var(--color-success)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Connected · Claude Haiku 4.5 · CockroachDB MCP
                    </span>
                  </div>
                </div>
              </div>

              {sessionId && (
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Session · {sessionId.substring(0, 8)}
                </span>
              )}
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-6 space-y-6"
            >
              {messages.length === 0 && <EmptyState />}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {chatMutation.isPending && <TypingIndicator />}

              {error && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border:     "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <AlertCircle
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "var(--color-error)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-error)" }}
                  >
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Suggested prompts — only when no messages */}
            {messages.length === 0 && (
              <div
                className="px-5 py-3 border-t flex-shrink-0"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <p
                  className="text-xs mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, i) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => setInput(prompt.text)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
                        style={{
                          background: "var(--bg-subtle)",
                          color:      "var(--text-secondary)",
                          border:     "1px solid var(--border-primary)",
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {prompt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input area */}
            <div
              className="p-4 border-t flex-shrink-0"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your project memory anything..."
                  rows={2}
                  disabled={chatMutation.isPending}
                  className="nx-chat-input w-full px-4 py-3 pr-24 text-sm disabled:opacity-60"
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button
                    className="nx-btn nx-btn-ghost p-2 rounded-lg"
                    title="Attach"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    className="nx-btn nx-btn-ghost p-2 rounded-lg"
                    title="Voice"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="p-2 rounded-lg transition-all duration-150"
                    style={{
                      background:
                        input.trim() && !chatMutation.isPending
                          ? "var(--accent-purple)"
                          : "var(--bg-subtle)",
                      color:
                        input.trim() && !chatMutation.isPending
                          ? "#0b1020"
                          : "var(--text-tertiary)",
                      cursor:
                        input.trim() && !chatMutation.isPending
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p
                className="text-xs mt-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Grounded in CockroachDB vector memory + MCP direct queries ·
                Powered by Amazon Bedrock
              </p>
            </div>
          </div>

          {/* Memory + MCP panel */}
          <MemoryPanel
            memories={activeMemories}
            mcpTools={activeMcpTools}
            isLoading={isMemoryLoading}
          />
        </div>
      )}

      {/* ── History Tab ──────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Conversation History
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              All messages from this project's memory chat, ordered by time
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="nx-card p-12 text-center">
              <MessageSquare
                className="w-10 h-10 mx-auto mb-4 opacity-20"
                style={{ color: "var(--text-tertiary)" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No messages yet
              </h3>
              <p
                className="text-sm mb-4"
                style={{ color: "var(--text-tertiary)" }}
              >
                Start a conversation in the Chat tab — your messages will
                appear here
              </p>
              <button
                onClick={() => setActiveTab("chat")}
                className="nx-btn nx-btn-primary"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Go to Chat
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={msg.id} className="nx-card p-4 flex gap-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        msg.role === "user"
                          ? "var(--bg-subtle)"
                          : "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                    }}
                  >
                    {msg.role === "user" ? (
                      <User
                        className="w-4 h-4"
                        style={{ color: "var(--text-secondary)" }}
                      />
                    ) : (
                      <Brain className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{
                          color:
                            msg.role === "user"
                              ? "var(--text-secondary)"
                              : "var(--accent-purple)",
                        }}
                      >
                        {msg.role === "user" ? "You" : "Optava Agent"}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        · {msg.timestamp}
                      </span>
                      <span
                        className="text-xs font-mono ml-auto"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        #{i + 1}
                      </span>
                    </div>

                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {msg.content}
                    </p>

                    {/* Vector memory citations */}
                    {msg.memories && msg.memories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className="text-xs flex items-center gap-1"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Sparkles className="w-3 h-3" />
                          {msg.memories.length} memories retrieved
                        </span>
                      </div>
                    )}

                    {/* MCP tools used */}
                    {msg.mcpTools && msg.mcpTools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span
                          className="text-xs flex items-center gap-1"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Database className="w-3 h-3" />
                          MCP:
                        </span>
                        {msg.mcpTools.map((tool, ti) => (
                          <span
                            key={ti}
                            className="text-xs px-1.5 py-0.5 rounded-md font-mono"
                            style={{
                              background: "rgba(59, 130, 246, 0.1)",
                              color:      "var(--color-info)",
                              border:     "1px solid rgba(59, 130, 246, 0.2)",
                            }}
                          >
                            {MCP_TOOL_LABELS[tool] ?? tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sessions Tab ─────────────────────────────────── */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Chat Sessions
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              All chat sessions stored in project memory
            </p>
          </div>

          {sessionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SessionCardSkeleton key={i} index={i} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="nx-card p-12 text-center">
              <Hash
                className="w-10 h-10 mx-auto mb-4 opacity-20"
                style={{ color: "var(--text-tertiary)" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                No sessions yet
              </h3>
              <p
                className="text-sm mb-4"
                style={{ color: "var(--text-tertiary)" }}
              >
                Each time you start a conversation it creates a new session.
                Your sessions will appear here.
              </p>
              <button
                onClick={() => setActiveTab("chat")}
                className="nx-btn nx-btn-primary"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Start a Chat
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(sessions as ChatSession[]).map((session) => (
                <div
                  key={session.session_id}
                  className="nx-card p-4 cursor-pointer"
                  onClick={() => {
                    setSessionId(session.session_id);
                    setActiveTab("chat");
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--accent-purple)" }}
                    >
                      {session.session_id.substring(0, 12)}...
                    </span>
                    <span className="nx-badge nx-badge-purple">
                      {session.message_count} msgs
                    </span>
                  </div>
                  <p
                    className="text-sm font-medium mb-2 line-clamp-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {session.first_message || "No preview available"}
                  </p>
                  <div
                    className="flex items-center gap-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {formatRelativeTime(session.last_message_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Message Bubble                                             */
/* ─────────────────────────────────────────────────────────── */

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser
            ? "var(--bg-subtle)"
            : "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
        }}
      >
        {isUser ? (
          <User
            className="w-4 h-4"
            style={{ color: "var(--text-secondary)" }}
          />
        ) : (
          <Brain className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Bubble + annotations */}
      <div
        className={`flex flex-col gap-2 ${
          isUser ? "items-end" : "items-start"
        } max-w-[80%]`}
      >
        {/* Message content */}
        <div className={isUser ? "nx-msg-user" : "nx-msg-assistant"}>
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-primary)" }}
          >
            {message.content}
          </p>
        </div>

        {/* Vector memory citations */}
        {!isUser && message.memories && message.memories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Sparkles className="w-3 h-3" />
              Retrieved:
            </span>
            {message.memories.map((mem, i) => (
              <span key={mem.id} className="nx-citation">
                [{i + 1}] {Math.round(mem.similarity * 100)}%
              </span>
            ))}
          </div>
        )}

        {/* MCP tools used — shown only on assistant messages */}
        {!isUser && message.mcpTools && message.mcpTools.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Database className="w-3 h-3" />
              CockroachDB MCP:
            </span>
            {message.mcpTools.map((tool, ti) => (
              <span
                key={ti}
                className="text-xs px-2 py-0.5 rounded-md font-mono"
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  color:      "var(--color-info)",
                  border:     "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                {MCP_TOOL_LABELS[tool] ?? tool}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span
          className="text-xs px-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Typing Indicator                                           */
/* ─────────────────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
        }}
      >
        <Brain className="w-4 h-4 text-white" />
      </div>
      <div className="nx-msg-assistant flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="nx-typing-dot" />
          <span className="nx-typing-dot" />
          <span className="nx-typing-dot" />
        </div>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Querying CockroachDB MCP + generating...
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Empty State                                                */
/* ─────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
        }}
      >
        <Brain className="w-6 h-6 text-white" />
      </div>
      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Ask your project memory
      </h3>
      <p
        className="text-sm max-w-md mb-4"
        style={{ color: "var(--text-tertiary)" }}
      >
        Every conversation, decision, and task is remembered. Ask anything
        about your project history.
      </p>
      {/* MCP indicator */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
        style={{
          background: "rgba(59, 130, 246, 0.08)",
          border:     "1px solid rgba(59, 130, 246, 0.15)",
          color:      "var(--color-info)",
        }}
      >
        <Database className="w-3 h-3" />
        CockroachDB MCP active — Claude queries your DB directly
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Memory Panel                                               */
/* ─────────────────────────────────────────────────────────── */

function MemoryPanel({
  memories,
  mcpTools,
  isLoading,
}: {
  memories:  SearchResult[];
  mcpTools:  string[];
  isLoading: boolean;
}) {
  const typeConfig: Record<string, { label: string; color: string }> = {
    decision:     { label: "Decision",     color: "var(--color-warning)" },
    task:         { label: "Task",         color: "var(--color-info)"    },
    conversation: { label: "Conversation", color: "var(--accent-purple)" },
    note:         { label: "Note",         color: "var(--color-success)" },
    standup:      { label: "Briefing",     color: "#22d3ee"              },
  };

  const hasMcp = mcpTools.length > 0;

  return (
    <div className="w-[340px] nx-card flex flex-col overflow-hidden flex-shrink-0">

      {/* Header */}
      <div
        className="px-5 py-3.5 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles
            className="w-4 h-4"
            style={{ color: "var(--accent-purple)" }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Memory Context
          </h3>
        </div>
        <span className="nx-badge nx-badge-purple">{memories.length}</span>
      </div>

      {/* MCP tools section — shown when tools were used */}
      {(hasMcp || isLoading) && (
        <div
          className="px-5 py-3 border-b flex-shrink-0"
          style={{
            borderColor: "var(--border-primary)",
            background:  "rgba(59, 130, 246, 0.04)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Database
              className="w-3.5 h-3.5"
              style={{ color: "var(--color-info)" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-info)" }}
            >
              CockroachDB MCP Tools
            </span>
          </div>

          {isLoading ? (
            <div className="flex gap-1.5">
              <div
                className="h-5 w-20 rounded-md animate-pulse"
                style={{ background: "var(--bg-subtle)" }}
              />
              <div
                className="h-5 w-16 rounded-md animate-pulse"
                style={{ background: "var(--bg-subtle)" }}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {mcpTools.map((tool, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-md font-mono"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color:      "var(--color-info)",
                    border:     "1px solid rgba(59, 130, 246, 0.2)",
                  }}
                >
                  {MCP_TOOL_LABELS[tool] ?? tool}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vector search subtitle */}
      <div
        className="px-5 py-3 border-b flex-shrink-0"
        style={{
          borderColor: "var(--border-primary)",
          background:  "var(--bg-subtle)",
        }}
      >
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Vector search results from CockroachDB, ranked by cosine similarity.
        </p>
      </div>

      {/* Memory cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <MemoryCardSkeleton key={i} index={i} />
          ))
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "var(--bg-subtle)" }}
            >
              <Brain
                className="w-5 h-5"
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
            <p
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Memories will appear here as you chat
            </p>
          </div>
        ) : (
          memories.map((mem, i) => {
            const cfg   = typeConfig[mem.source_type] ?? typeConfig.note;
            const title = mem.metadata?.title ?? mem.content.substring(0, 60);

            return (
              <div
                key={mem.id}
                className="p-3 rounded-lg cursor-pointer transition-all duration-150"
                style={{
                  background: "var(--bg-subtle)",
                  border:     "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: cfg.color }}
                    >
                      [{i + 1}]
                    </span>
                    <span
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-8 h-1 rounded-full overflow-hidden"
                      style={{ background: "var(--border-primary)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:      `${mem.similarity * 100}%`,
                          background: "var(--accent-purple)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium tabular-nums"
                      style={{ color: "var(--accent-purple)" }}
                    >
                      {Math.round(mem.similarity * 100)}%
                    </span>
                  </div>
                </div>

                <h4
                  className="text-sm font-semibold mb-1 leading-snug line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </h4>
                <p
                  className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {mem.content.substring(0, 120)}...
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-3">
          {/* Vector index status */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--color-success)" }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Vector
            </span>
          </div>
          {/* MCP status */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--color-info)" }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              MCP
            </span>
          </div>
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: "var(--text-tertiary)" }}
        >
          1024d
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const date     = new Date(dateStr);
  const now      = new Date();
  const diffMs   = now.getTime() - date.getTime();
  const diffMin  = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffMin  < 1)  return "just now";
  if (diffMin  < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}