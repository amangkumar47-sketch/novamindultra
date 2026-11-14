"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, Check, ChevronDown, Code2, Command, Copy, FileCode2, FolderGit2, Menu, MessageSquarePlus, MoreHorizontal, PanelLeftClose, Plus, Search, Settings2, Sparkles, Terminal, X, Zap } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Message[]; updatedAt: number };
const STORAGE_KEY = "novamindultra.chats.v1";
const starterPrompts = [
  { icon: Code2, title: "Build a feature", text: "Build a responsive pricing card in React with Tailwind CSS" },
  { icon: Terminal, title: "Fix a bug", text: "Help me debug: Cannot read properties of undefined" },
  { icon: FileCode2, title: "Understand code", text: "Explain async/await with a practical TypeScript example" },
];

export default function Home() {
  const { isSignedIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Conversation[];
        if (Array.isArray(parsed)) setConversations(parsed);
      }
      const query = new URLSearchParams(window.location.search).get("billing");
      if (query === "success") setNotice("Thanks! Your checkout completed. Your plan may take a moment to activate.");
      if (query === "cancelled") setNotice("Checkout was cancelled. You can upgrade any time.");
    } catch { /* Ignore corrupt local browser storage. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 40))); } catch { setError("Could not save chat history in this browser."); }
  }, [conversations, hydrated]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); newChat(); }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  });

  function newChat() {
    setMessages([]); setActiveId(null); setInput(""); setError(""); setSidebarOpen(false); textareaRef.current?.focus();
  }

  function openChat(chat: Conversation) {
    setActiveId(chat.id); setMessages(chat.messages); setError(""); setSidebarOpen(false);
  }

  function updateChat(next: Message[], id = activeId) {
    if (!id) return;
    const firstUser = next.find((item) => item.role === "user")?.content ?? "New conversation";
    setConversations((old) => {
      const chat: Conversation = { id, title: firstUser.replace(/\s+/g, " ").slice(0, 48), messages: next, updatedAt: Date.now() };
      return [chat, ...old.filter((item) => item.id !== id)].slice(0, 40);
    });
  }

  async function sendMessage(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const text = (prompt ?? input).trim();
    if (!text || loading) return;
    if (!isSignedIn) { setError("Sign in to start chatting with NovaMindUltra."); return; }
    const id = activeId ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`);
    if (!activeId) setActiveId(id);
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages); updateChat(nextMessages, id); setInput(""); setError(""); setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: nextMessages.slice(-12) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The request failed. Please try again.");
      const complete = [...nextMessages, { role: "assistant" as const, content: data.message }];
      setMessages(complete); updateChat(complete, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the assistant. Please try again.");
    } finally { setLoading(false); textareaRef.current?.focus(); }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }

  async function copyMessage(content: string, index: number) {
    try { await navigator.clipboard.writeText(content); setCopied(index); window.setTimeout(() => setCopied(null), 1400); }
    catch { setError("Clipboard access is unavailable in this browser."); }
  }

  async function goToBilling(endpoint: "checkout" | "portal") {
    if (!isSignedIn) { setError("Sign in first to manage your plan."); return; }
    setError("");
    try {
      const response = await fetch(`/api/billing/${endpoint}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Billing is unavailable.");
      if (data.url) window.location.assign(data.url);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not open billing."); }
  }

  const filteredChats = conversations.filter((chat) => chat.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand" href="/" aria-label="NovaMindUltra home"><span className="brand-mark"><Sparkles size={17} /></span><span className="brand-name">nova<span>mind</span>ultra</span></a>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          <button className="icon-button sidebar-collapse" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={17} /></button>
        </div>
        <button className="new-chat-button" onClick={newChat}><Plus size={17} /><span>New session</span><span className="shortcut">⌘ K</span></button>
        <label className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sessions" aria-label="Search saved chats" /></label>
        <div className="workspace-label"><span className="section-label">WORKSPACE</span><button aria-label="Workspace settings"><Settings2 size={15} /></button></div>
        <button className="nav-item active"><Code2 size={16} /><span>AI workspace</span><span className="online-dot" /></button>
        <div className="history-section"><div className="history-heading"><span className="section-label">RECENT SESSIONS</span><span className="history-count">{filteredChats.length}</span></div>
          <div className="history-list">{filteredChats.length ? filteredChats.map((chat) => <button key={chat.id} className={`history-item ${activeId === chat.id ? "current" : ""}`} onClick={() => openChat(chat)}><MessageSquarePlus size={14} /><span>{chat.title}</span></button>) : <p className="empty-history">{search ? "No matching sessions." : "Your saved sessions will show up here."}</p>}</div>
        </div>
        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-card-top"><span className="plan-spark"><Zap size={14} /></span><span className="plan-badge">PRO</span></div><strong>Build without limits</strong><p>Unlock a smoother workflow and support the project.</p><button onClick={() => void goToBilling("checkout")}>Explore plans <ArrowUp size={13} /></button></div>
          <div className="account-row"><div className="account-mark">N</div><div className="account-copy"><strong>Your account</strong><span>Secure workspace</span></div><SignedIn><UserButton /></SignedIn><SignedOut><SignInButton mode="modal"><button className="signin-small">Sign in</button></SignInButton></SignedOut></div>
        </div>
      </aside>

      {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <section className="main-panel">
        <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button><div className="breadcrumb"><FolderGit2 size={15} /><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeId ? "Session" : "Untitled session"}</strong><ChevronDown size={14} /></div></div>
          <div className="topbar-right"><div className="secure-label"><span className="online-dot" /> Groq · ready</div><button className="topbar-upgrade" onClick={() => void goToBilling("checkout")}><Zap size={13} /> Upgrade</button><SignedOut><SignInButton mode="modal"><button className="signin-button">Sign in</button></SignInButton></SignedOut><SignedIn><button className="manage-button" onClick={() => void goToBilling("portal")}>Billing</button><UserButton /></SignedIn></div>
        </header>
        {notice && <div className="notice-banner">{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}
        <div className={`conversation ${messages.length ? "has-messages" : ""}`}>
          {messages.length === 0 ? <div className="welcome">
            <div className="welcome-kicker"><span className="kicker-line" /> AI-POWERED DEVELOPMENT <span className="kicker-line" /></div>
            <div className="welcome-orb"><div className="orb-inner"><Code2 size={23} /></div><span className="orb-ring ring-one" /><span className="orb-ring ring-two" /></div>
            <h1>Think in code.<br /><span>Build beyond.</span></h1><p className="welcome-subtitle">Your focused space to explore ideas, solve bugs, and ship what matters.</p>
            <SignedOut><SignInButton mode="modal"><button className="welcome-signin">Sign in to start building <ArrowUp size={15} /></button></SignInButton></SignedOut>
            <div className="prompt-grid">{starterPrompts.map(({ icon: Icon, title, text }) => <button className="prompt-card" key={title} onClick={() => void sendMessage(undefined, text)}><span className="prompt-icon"><Icon size={16} /></span><span className="prompt-title">{title}</span><span className="prompt-text">{text}</span><ArrowUp className="prompt-arrow" size={14} /></button>)}</div>
            <form className="composer welcome-composer" onSubmit={(event) => void sendMessage(event)}><div className="editor-gutter"><span className="gutter-dot" /><span>›</span></div><textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question, paste an error, or describe what to build…" rows={1} aria-label="Ask NovaMindUltra" /><div className="composer-tools"><span className="language-chip"><Code2 size={12} /> Code assistant</span><span className="composer-hint"><Command size={11} /> Enter to send</span><button className={`send-button ${input.trim() ? "send-active" : ""}`} disabled={!input.trim() || loading} aria-label="Send message"><ArrowUp size={17} /></button></div></form>
            <p className="disclaimer">AI can make mistakes. Review generated code before using it.</p>
          </div> : <div className="message-list">
            {messages.map((message, index) => <article className={`message-row ${message.role}`} key={`${activeId}-${index}-${message.role}`}>
              {message.role === "assistant" && <div className="message-avatar"><Sparkles size={14} /></div>}
              <div className="message-content-wrap"><div className="message-meta">{message.role === "user" ? <><span className="user-mini">Y</span> You <span className="message-time">· prompt</span></> : <>NovaMindUltra <span className="assistant-tag">AI</span></>}</div><div className={`message-content ${message.role}`}><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>{message.role === "assistant" && <button className="copy-button" onClick={() => void copyMessage(message.content, index)}>{copied === index ? <Check size={13} /> : <Copy size={13} />}{copied === index ? "Copied" : "Copy response"}</button>}</div>
            </article>)}
            {loading && <article className="message-row assistant"><div className="message-avatar"><Sparkles size={14} /></div><div className="message-content-wrap"><div className="message-meta">NovaMindUltra <span className="assistant-tag">AI</span></div><div className="thinking"><span /><span /><span /><small>Thinking through your code</small></div></div></article>}
            {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}<div ref={bottomRef} />
          </div>}
        </div>
        {messages.length > 0 && <div className="bottom-composer-area"><form className="composer" onSubmit={(event) => void sendMessage(event)}><div className="editor-gutter"><span className="gutter-dot" /><span>›</span></div><textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Message NovaMindUltra…" rows={1} aria-label="Message NovaMindUltra" /><div className="composer-tools"><span className="language-chip"><Code2 size={12} /> Code assistant</span><span className="composer-hint"><Command size={11} /> Enter to send</span><button className={`send-button ${input.trim() ? "send-active" : ""}`} disabled={!input.trim() || loading} aria-label="Send message"><ArrowUp size={17} /></button></div></form><p className="disclaimer">AI can make mistakes. Review generated code before using it.</p></div>}
        {error && messages.length === 0 && <div className="welcome-error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
      </section>
    </main>
  );
}
