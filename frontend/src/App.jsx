
import { useState } from "react";
import { sendMessage } from "./api";
import "./App.css";

const welcomeMessage = {
  role: "assistant",
  content:
    "Hi! I'm your AI math assistant. Choose Base for complete solutions or Tutor to work through problems step by step.",
};

export default function App() {
  const [mode, setMode] = useState("tutor");
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const question = input.trim();

    if (!question || loading) return;

    setInput("");
    setError("");
    setMessages((previous) => [
      ...previous,
      { role: "user", content: question },
    ]);
    setLoading(true);

    try {
      const data = await sendMessage(mode, question);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.response,
          status: data.guardrail_status,
          mode: data.mode,
        },
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Check that FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessages([welcomeMessage]);
    setError("");
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">∑</div>
          <div>
            <h1>MathMentor</h1>
            <p>AI-powered learning laboratory</p>
          </div>
        </div>
        <span className="connection">
          <span className="status-dot" />
          Groq API
        </span>
      </header>

      <section className="workspace">
        <div className="intro">
          <p className="eyebrow">YOUR LEARNING SPACE</p>
          <h2>Understand the process, not just the answer.</h2>
          <p className="subtitle">
            Explore two approaches to AI-assisted mathematics learning.
          </p>
        </div>

        <div className="mode-selector">
          <button
            className={mode === "tutor" ? "mode active" : "mode"}
            onClick={() => changeMode("tutor")}
            disabled={loading}
          >
            <span className="mode-icon">✦</span>
            <span>
              <strong>Tutor mode</strong>
              <small>Hints and guided learning</small>
            </span>
          </button>

          <button
            className={mode === "base" ? "mode active" : "mode"}
            onClick={() => changeMode("base")}
            disabled={loading}
          >
            <span className="mode-icon">∑</span>
            <span>
              <strong>Base mode</strong>
              <small>Direct answers and solutions</small>
            </span>
          </button>
        </div>

        <section className="chat-panel">
          <div className="chat-heading">
            <div>
              <h3>
                {mode === "tutor"
                  ? "Guided learning"
                  : "Direct assistance"}
              </h3>
              <p>
                {mode === "tutor"
                  ? "Work through one step at a time."
                  : "Get a complete explanation of your problem."}
              </p>
            </div>
            <span className="mode-tag">
              {mode.toUpperCase()}
            </span>
          </div>

          <div className="messages" aria-live="polite">
            {messages.map((message, index) => (
              <article
                className={`message ${message.role}`}
                key={`${index}-${message.role}`}
              >
                <div className="avatar">
                  {message.role === "user" ? "Y" : "∑"}
                </div>

                <div className="message-body">
                  <span className="sender">
                    {message.role === "user"
                      ? "You"
                      : "MathMentor"}
                  </span>

                  <div className="message-text">
                    {message.content}
                  </div>

                  {message.status && (
                    <div className="guardrail">
                      <span>Guardrail status</span>
                      <strong
                        className={
                          message.status === "passed_basic_checks"
                            ? "passed"
                            : message.status.startsWith("fallback:")
                              ? "fallback"
                              : "neutral"
                        }
                      >
                        {message.status.replaceAll("_", " ")}
                      </strong>
                    </div>
                  )}
                </div>
              </article>
            ))}

            {loading && (
              <div className="loading">
                <span className="spinner" />
                Preparing your response...
              </div>
            )}
          </div>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a math question..."
              rows={2}
              maxLength={4000}
              disabled={loading}
            />
            <div className="composer-footer">
              <span>
                {mode === "tutor"
                  ? "Hints first. Learn at your own pace."
                  : "Complete solutions on request."}
              </span>
              <button
                className="send-button"
                type="submit"
                disabled={loading || !input.trim()}
              >
                {loading ? "Thinking..." : "Send ↑"}
              </button>
            </div>
          </form>
        </section>

        <p className="disclaimer">
          Research prototype. Tutor behavior and basic guardrail
          checks are experimental, not guaranteed protections.
        </p>
      </section>
    </main>
  );
}
