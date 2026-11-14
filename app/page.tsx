"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, ArrowUp, Check, ChevronDown, Code2, Command, Copy, FileCode2, Github, Menu, MessageSquarePlus, MoreHorizontal, Paperclip, PanelLeftClose, Plus, Search, Sparkles, Terminal, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const starterPrompts = [
  { icon: Code2, title: "Build something", text: "Build a responsive pricing card in React with Tailwind CSS" },
  { icon: Terminal, title: "Debug an issue", text: "Help me debug this JavaScript error: Cannot read properties of undefined" },
  { icon: FileCode2, title: "Explain code", text: "Explain async/await in JavaScript with a practical example" },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  function newChat() {
    setMessages([]);
    setInput("");
    setError("");
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }

  async function sendMessage(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const text = (prompt ?? input).trim();
    if (!text || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The request failed. Please try again.");
      setMessages((current) => [...current, { role: "assistant", content: data.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the assistant. Please try again.");
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function copyMessage(content: string, index: number) {
    await navigator.clipboard.writeText(content);
    setCopied(index);
    window.setTimeout(() => setCopied(null), 1400);
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand" href="#" aria-label="NovaMindUltra home">
            <span className="brand-mark"><Sparkles size={18} strokeWidth={2.2} /></span>
            <span className="brand-name">NovaMind<span>Ultra</span></span>
          </a>
          <button className="icon-button sidebar-collapse" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <button className="new-chat-button" onClick={newChat}><MessageSquarePlus size={17} /> <span>New chat</span><span className="shortcut">⌘ K</span></button>
        <button className="search-button"><Search size={16} /><span>Search chats</span></button>
        <div className="sidebar-section"><span className="section-label">Workspace</span>
          <button className="nav-item active"><Code2 size={17} /><span>Code assistant</span></button>
          <button className="nav-item"><FileCode2 size={17} /><span>Code review</span><span className="soon">Soon</span></button>
        </div>
        <div className="history-section"><div className="history-heading"><span className="section-label">Recent</span><button aria-label="More options"><MoreHorizontal size={17} /></button></div>
          {messages.length > 0 ? <button className="history-item current"><span className="history-dot" />{messages.find((m) => m.role === "user")?.content.slice(0, 27) || "New conversation"}</button> : <p className="empty-history">Your conversations will appear here.</p>}
        </div>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={16} /></div><div><strong>Built for your next big idea</strong><p>Your AI coding partner, ready when you are.</p></div></div>
          <a className="profile-row" href="mailto:hello@novamindultra.top"><div className="avatar">N</div><div className="profile-info"><strong>NovaMindUltra</strong><span>AI coding assistant</span></div><MoreHorizontal size={18} className="profile-more" /></a>
        </div>
      </aside>

      {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <section className="main-panel">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
          <div className="model-selector"><span className="status-dot" /> NovaMindUltra <ChevronDown size={15} /></div>
          <div className="topbar-right"><span className="model-label">Coding assistant</span><a className="github-link" href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17} /></a></div>
        </header>

        <div className={`conversation ${messages.length ? "has-messages" : ""}`}>
          {messages.length === 0 ? <div className="welcome">
            <div className="welcome-orb"><div className="orb-inner"><Sparkles size={26} /></div><span className="orb-ring ring-one" /><span className="orb-ring ring-two" /></div>
            <div className="eyebrow"><span /> YOUR AI CODING PARTNER</div>
            <h1>What are we<br className="mobile-break" /> <span>building</span> today?</h1>
            <p className="welcome-subtitle">From a tricky bug to a brand-new idea — let&apos;s figure it out together.</p>
            <div className="prompt-grid">{starterPrompts.map(({ icon: Icon, title, text }) => <button className="prompt-card" key={title} onClick={() => void sendMessage(undefined, text)}><span className="prompt-icon"><Icon size={17} /></span><span className="prompt-title">{title}</span><span className="prompt-text">{text}</span><ArrowUp className="prompt-arrow" size={15} /></button>)}</div>
            <form className="composer welcome-composer" onSubmit={(event) => void sendMessage(event)}>
              <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything about code..." rows={1} aria-label="Ask NovaMindUltra" />
              <div className="composer-tools"><button type="button" className="attach-button" title="Attachments coming soon"><Paperclip size={17} /><span>Attach</span></button><span className="composer-hint"><Command size={12} /> + Enter to send</span><button className={`send-button ${input.trim() ? "send-active" : ""}`} disabled={!input.trim() || loading} aria-label="Send message"><ArrowUp size={18} /></button></div>
            </form>
            <p className="disclaimer">NovaMindUltra can make mistakes. Double-check anything important.</p>
          </div> : <div className="message-list">
            {messages.map((message, index) => <article className={`message-row ${message.role}`} key={`${index}-${message.role}`}>
              {message.role === "assistant" && <div className="message-avatar"><Sparkles size={15} /></div>}
              <div className="message-content-wrap"><div className="message-meta">{message.role === "user" ? "You" : "NovaMindUltra"}</div><div className={`message-content ${message.role}`}><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>{message.role === "assistant" && <button className="copy-button" onClick={() => void copyMessage(message.content, index)}>{copied === index ? <Check size={14} /> : <Copy size={14} />}{copied === index ? "Copied" : "Copy response"}</button>}</div>
              {message.role === "user" && <div className="user-avatar">Y</div>}
            </article>)}
            {loading && <article className="message-row assistant"><div className="message-avatar"><Sparkles size={15} /></div><div className="message-content-wrap"><div className="message-meta">NovaMindUltra</div><div className="thinking"><span /><span /><span /></div></div></article>}
            {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
            <div ref={bottomRef} />
          </div>}
        </div>
        {messages.length > 0 && <div className="bottom-composer-area"><form className="composer" onSubmit={(event) => void sendMessage(event)}>
          <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Message NovaMindUltra..." rows={1} aria-label="Message NovaMindUltra" />
          <div className="composer-tools"><button type="button" className="attach-button" title="Attachments coming soon"><Paperclip size={17} /><span>Attach</span></button><span className="composer-hint"><Command size={12} /> + Enter to send</span><button className={`send-button ${input.trim() ? "send-active" : ""}`} disabled={!input.trim() || loading} aria-label="Send message"><ArrowUp size={18} /></button></div>
        </form><p className="disclaimer">NovaMindUltra can make mistakes. Double-check anything important.</p></div>}
      </section>
    </main>
  );
}
