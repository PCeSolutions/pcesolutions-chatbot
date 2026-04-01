require("dotenv").config();
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk").default || require("@anthropic-ai/sdk");
const path = require("path");

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });


app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// CORS — allow pcesolutions.ca (and any origin) to load the widget and call the API
app.use((req, res, next) => {
  const allowed = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
    : ["*"];
  const origin = req.headers.origin;
  if (allowed.includes("*") || allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// PCe Solutions knowledge base — static, cached via prompt caching
const SYSTEM_PROMPT = `You are a helpful virtual assistant for PCe Solutions, a Canadian IT services and managed support company. Your job is to answer questions ONLY about PCe Solutions and its services.

## About PCe Solutions

**Company Overview**
PCe Solutions is Canada's #1 IT services and managed support provider, founded in 2010 and headquartered in Calgary, Alberta. The company is founded by Peter Perez and has earned a 4.9/5 star rating based on 42 reviews.

**Contact Information**
- Phone (primary): +1-403-879-8643
- Phone (alternate): +1-403-283-2707
- Email: contact@pcesolutions.ca
- Address: 500-5940 Macleod Trail SW, Calgary, AB T2H 2G4
- Website: pcesolutions.ca
- Business Hours: Monday–Friday, 8:00 AM – 6:00 PM

**Social Media**
- Facebook, LinkedIn, Instagram, and X (Twitter)

**Service Areas**
Calgary, Edmonton, Red Deer, Toronto, and Vancouver

**Target Industries**
- Healthcare firms
- Legal practices
- Financial institutions
- Engineering companies
- Small to medium-sized businesses across Alberta and Canada

---

## Services

### 1. Managed IT Services
24/7 monitoring, help desk support, system maintenance, and strategic IT consulting. Guaranteed 30-minute response time.

### 2. Cybersecurity Services
Threat detection, data protection, compliance support, and employee security training.

### 3. Cloud Services
Cloud migration, infrastructure management, backup solutions, and disaster recovery.

---

## Key Differentiators
- Founded in 2010 with over a decade of experience
- 24/7 support with a guaranteed 30-minute response time
- 4.9/5 star rating (42 reviews)
- Serves multiple major Canadian cities
- Mid-range pricing ("$$") — competitive for SMBs
- Specializes in regulated industries (healthcare, legal, financial)

---

## STRICT RULES — READ CAREFULLY

1. You ONLY answer questions about PCe Solutions, its services, pricing range, contact info, and related IT topics as they pertain to PCe Solutions.
2. If someone asks about anything unrelated to PCe Solutions (politics, recipes, general tech support for other companies, coding help, current events, etc.), politely decline and redirect them back to PCe Solutions topics.
3. If you don't know a specific detail (e.g., exact pricing tiers), be honest and direct the user to contact PCe Solutions directly via phone or email.
4. Keep answers concise, helpful, and professional.
5. Never make up information. Only state facts that are in this knowledge base.
6. When declining off-topic questions, be friendly: "I'm only able to help with questions about PCe Solutions. Is there anything about our IT services, support plans, or contact information I can help you with?"
7. NEVER use markdown formatting. Do not use ** for bold, ## or ### for headings, or - / * for bullet points. Write in plain sentences and short paragraphs only.`;

// POST /api/chat — accepts { messages: [{role, content}] }
// Streams the response back as Server-Sent Events
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Validate message structure
  for (const msg of messages) {
    if (!msg.role || !msg.content || typeof msg.content !== "string") {
      return res.status(400).json({ error: "each message needs role and content (string)" });
    }
    if (msg.role !== "user" && msg.role !== "assistant") {
      return res.status(400).json({ error: "role must be user or assistant" });
    }
  }

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // cache the static system prompt
        },
      ],
      messages: messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Claude API error:", err);

    let message = "Something went wrong. Please try again.";
    if (err instanceof Anthropic.AuthenticationError) {
      message = "API key is invalid. Please check server configuration.";
    } else if (err instanceof Anthropic.RateLimitError) {
      message = "Rate limit reached. Please wait a moment and try again.";
    }

    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
});

// Catch-all: serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PCe Solutions chatbot running at http://localhost:${PORT}`);
});
