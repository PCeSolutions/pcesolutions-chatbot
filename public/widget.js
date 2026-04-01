(function () {
  if (window.__PCE_CHAT_LOADED__) return;
  window.__PCE_CHAT_LOADED__ = true;

  // Resolve API base URL from the script tag's src
  const scriptEl = document.currentScript ||
    document.querySelector('script[src*="widget.js"]');
  const API_BASE = scriptEl
    ? new URL(scriptEl.src).origin
    : window.location.origin;

  /* ─────────────────────────────── STYLES ─────────────────────────────── */
  const css = `
    #pce-launcher {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #0052cc; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,82,204,.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #pce-launcher:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,82,204,.55); }
    #pce-launcher svg { width: 26px; height: 26px; fill: #fff; transition: opacity .2s; }
    #pce-launcher .pce-icon-close { display: none; }

    #pce-launcher.pce-open .pce-icon-chat  { display: none; }
    #pce-launcher.pce-open .pce-icon-close { display: block; }

    #pce-badge {
      position: absolute; top: -4px; right: -4px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border: 2px solid #fff; display: none;
    }

    #pce-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 999998;
      width: 370px; height: 560px; max-height: calc(100dvh - 110px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transform: scale(.92) translateY(16px); opacity: 0; pointer-events: none;
      transform-origin: bottom right;
      transition: transform .22s cubic-bezier(.34,1.56,.64,1), opacity .18s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #pce-panel.pce-visible {
      transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
    }

    /* Header */
    .pce-header {
      background: #0052cc; color: #fff;
      padding: 14px 18px; display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }
    .pce-header-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .pce-header-info h3 {
      margin: 0; font-size: 14px; font-weight: 600; color: #fff;
    }
    .pce-header-info p {
      margin: 2px 0 0; font-size: 11px; opacity: .8; color: #fff;
    }
    .pce-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #4ade80; display: inline-block; margin-right: 4px;
    }

    /* Messages */
    .pce-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    .pce-messages::-webkit-scrollbar { width: 5px; }
    .pce-messages::-webkit-scrollbar-thumb { background: #dde2ea; border-radius: 3px; }

    .pce-msg { display: flex; gap: 8px; max-width: 86%; }
    .pce-msg.pce-user { align-self: flex-end; flex-direction: row-reverse; }
    .pce-msg.pce-bot  { align-self: flex-start; }

    .pce-avatar {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .pce-bot  .pce-avatar { background: #e8f0ff; color: #0052cc; font-weight: 600; }
    .pce-user .pce-avatar { background: #0052cc; color: #fff; font-weight: 600; }

    .pce-bubble {
      padding: 10px 14px; border-radius: 16px;
      font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word;
      color: #1a1a2e;
    }
    .pce-bot  .pce-bubble { background: #e8f0ff; border-bottom-left-radius: 4px; }
    .pce-user .pce-bubble { background: #0052cc; color: #fff; border-bottom-right-radius: 4px; }

    /* Typing dots */
    .pce-typing .pce-bubble {
      display: flex; gap: 4px; align-items: center; padding: 12px 16px;
    }
    .pce-dot-anim {
      width: 6px; height: 6px; border-radius: 50%; background: #0052cc;
      animation: pceBounce .9s infinite;
    }
    .pce-dot-anim:nth-child(2) { animation-delay: .15s; }
    .pce-dot-anim:nth-child(3) { animation-delay: .3s; }
    @keyframes pceBounce {
      0%,80%,100% { transform: translateY(0); }
      40%          { transform: translateY(-5px); }
    }

    /* Welcome */
    .pce-welcome {
      text-align: center; padding: 20px 16px;
      color: #6b7280; font-size: 13px; line-height: 1.6;
    }
    .pce-welcome .pce-wave { font-size: 32px; margin-bottom: 8px; }
    .pce-welcome h4 { font-size: 15px; color: #1a1a2e; margin: 0 0 6px; }

    .pce-quick-wrap { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 14px; }
    .pce-quick {
      background: #e8f0ff; color: #0052cc;
      border: 1px solid #0052cc; border-radius: 20px;
      padding: 5px 12px; font-size: 11px; cursor: pointer;
      font-family: inherit; transition: background .15s, color .15s;
    }
    .pce-quick:hover { background: #0052cc; color: #fff; }

    /* Input */
    .pce-input-wrap {
      border-top: 1px solid #dde2ea; padding: 12px 14px;
      display: flex; gap: 8px; align-items: flex-end;
      background: #fff; flex-shrink: 0;
    }
    .pce-input {
      flex: 1; resize: none; border: 1px solid #dde2ea; border-radius: 20px;
      padding: 8px 14px; font-size: 13px; font-family: inherit; line-height: 1.5;
      max-height: 96px; outline: none; background: #f4f6f9; color: #1a1a2e;
      transition: border-color .2s, background .2s;
    }
    .pce-input:focus { border-color: #0052cc; background: #fff; }
    .pce-input::placeholder { color: #9ca3af; }

    .pce-send {
      width: 36px; height: 36px; border-radius: 50%;
      background: #0052cc; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: background .15s, transform .1s;
    }
    .pce-send:hover:not(:disabled) { background: #003d99; transform: scale(1.06); }
    .pce-send:disabled { background: #dde2ea; cursor: not-allowed; }
    .pce-send svg { fill: #fff; width: 15px; height: 15px; }

    .pce-error {
      background: #fee2e2; color: #991b1b; border-radius: 10px;
      padding: 8px 12px; font-size: 12px; align-self: center; max-width: 85%; text-align: center;
    }

    @media (max-width: 420px) {
      #pce-panel { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
      #pce-launcher { right: 16px; bottom: 16px; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ─────────────────────────────── HTML ─────────────────────────────── */
  // Launcher button
  const launcher = document.createElement("button");
  launcher.id = "pce-launcher";
  launcher.setAttribute("aria-label", "Chat with PCe Solutions");
  launcher.innerHTML = `
    <svg class="pce-icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    <svg class="pce-icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    <span id="pce-badge">1</span>
  `;

  // Chat panel
  const panel = document.createElement("div");
  panel.id = "pce-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "PCe Solutions chat");
  panel.innerHTML = `
    <div class="pce-header">
      <div class="pce-header-avatar">💻</div>
      <div class="pce-header-info">
        <h3>PCe Solutions</h3>
        <p><span class="pce-dot"></span>Online — Ask us anything</p>
      </div>
    </div>
    <div class="pce-messages" id="pce-msgs">
      <div class="pce-welcome" id="pce-welcome">
        <div class="pce-wave">👋</div>
        <h4>Hi! How can we help?</h4>
        <p>Ask about our IT services, support plans, pricing, or contact info.</p>
        <div class="pce-quick-wrap">
          <button class="pce-quick" data-q="What services do you offer?">Services</button>
          <button class="pce-quick" data-q="How do I contact PCe Solutions?">Contact</button>
          <button class="pce-quick" data-q="What cities do you serve?">Coverage</button>
          <button class="pce-quick" data-q="What is your response time?">Response Time</button>
        </div>
      </div>
    </div>
    <div class="pce-input-wrap">
      <textarea class="pce-input" id="pce-input" rows="1" placeholder="Ask about PCe Solutions…" maxlength="1000"></textarea>
      <button class="pce-send" id="pce-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  /* ─────────────────────────────── LOGIC ─────────────────────────────── */
  const msgs    = document.getElementById("pce-msgs");
  const input   = document.getElementById("pce-input");
  const sendBtn = document.getElementById("pce-send");
  const badge   = document.getElementById("pce-badge");
  const welcome = document.getElementById("pce-welcome");
  const history = [];
  let   isOpen  = false;

  // Show badge after 3 s to nudge visitors
  setTimeout(() => {
    if (!isOpen) badge.style.display = "flex";
  }, 3000);

  function toggle() {
    isOpen = !isOpen;
    launcher.classList.toggle("pce-open", isOpen);
    panel.classList.toggle("pce-visible", isOpen);
    badge.style.display = "none";
    if (isOpen) setTimeout(() => input.focus(), 250);
  }

  launcher.addEventListener("click", toggle);

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (isOpen && !panel.contains(e.target) && e.target !== launcher && document.body.contains(e.target)) toggle();
  });

  // Auto-resize textarea
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 96) + "px";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // Quick reply buttons
  panel.addEventListener("click", (e) => {
    if (e.target.classList.contains("pce-quick")) {
      input.value = e.target.dataset.q;
      send();
    }
  });

  sendBtn.addEventListener("click", send);

  function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }

  function addMsg(role, text) {
    if (welcome) welcome.remove();
    const wrap   = document.createElement("div");
    wrap.className = `pce-msg pce-${role}`;
    const avatar = document.createElement("div");
    avatar.className = "pce-avatar";
    avatar.textContent = role === "user" ? "You" : "🤖";
    const bubble = document.createElement("div");
    bubble.className = "pce-bubble";
    bubble.textContent = text;
    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    scrollDown();
    return bubble;
  }

  function addTyping() {
    if (welcome) welcome.remove();
    const wrap = document.createElement("div");
    wrap.className = "pce-msg pce-bot pce-typing";
    wrap.id = "pce-typing";
    const avatar = document.createElement("div");
    avatar.className = "pce-avatar";
    avatar.textContent = "🤖";
    const bubble = document.createElement("div");
    bubble.className = "pce-bubble";
    bubble.innerHTML = '<div class="pce-dot-anim"></div><div class="pce-dot-anim"></div><div class="pce-dot-anim"></div>';
    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    scrollDown();
  }

  function removeTyping() {
    const el = document.getElementById("pce-typing");
    if (el) el.remove();
  }

  function addError(msg) {
    const el = document.createElement("div");
    el.className = "pce-error";
    el.textContent = msg;
    msgs.appendChild(el);
    scrollDown();
  }

  async function send() {
    const text = input.value.trim();
    if (!text || sendBtn.disabled) return;

    addMsg("user", text);
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;
    history.push({ role: "user", content: text });
    addTyping();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      removeTyping();
      const bubble = addMsg("bot", "");
      let full = "";

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buf     = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const data = JSON.parse(raw);
            if (data.error) { addError(data.error); return; }
            if (data.text)  { full += data.text; bubble.textContent = full; scrollDown(); }
            if (data.done)  { history.push({ role: "assistant", content: full }); }
          } catch (_) {}
        }
      }
    } catch (err) {
      removeTyping();
      addError("Connection error — please try again.");
      history.pop();
      console.error("[PCe widget]", err);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }
})();
