# ARIA — Demo Video (2:30)

---

## (0:00 – 0:25) OPEN WITH THE STORY

> *[You're on camera or screen-recording with ARIA's landing page behind you. Speak directly, like you're telling a friend about something that frustrated you.]*

"So here's a thing that drives me insane about running AI in production.

You've got a model — it's answering customer questions, it's working fine. Then one night it starts giving garbage answers. Hallucinating. Users are pissed.

You check the model — the model is fine. Same weights, same config. Nothing changed.

Turns out? A memory leak on the server was silently eating the context window. The model was literally getting half the information it needed. So it started guessing.

The infra team saw 'high memory.' The ML team saw 'bad answers.' *Nobody saw the connection.* Two teams, two dashboards, two 3am pages — same incident.

I built ARIA to kill that gap."

---

## (0:25 – 0:50) SHOW THE PROOF IT'S REAL

> *[Switch to Phoenix UI — localhost:6006. The 40 traces are visible.]*

"This is real. Arize Phoenix — 40 actual LLM traces. See these ones? Healthy. Good answers, high relevance scores. And these? Hallucinating. Truncated prompts. Bad outputs. This is real data sitting in a real observability platform."

> *[Switch to ARIA dashboard. Point to the health indicators.]*

"ARIA connects to this — and to Dynatrace for infrastructure — both through MCP, the Model Context Protocol. Gemini sits in the middle, reasoning across both systems through Google's Agent Development Kit. Three agents: one plans, one reasons, one acts.

Let me show you what happens when something breaks."

---

## (0:50 – 1:50) THE MOMENT

> *[Click ⚡ Inject Incident. Lean back. Let it breathe.]*

"Incident triggered. Watch."

> *[Signals stream in. 3 seconds of just watching.]*

"Hallucination rate — 50%. Prompt tokens crashed. Relevance tanked. That's Phoenix. And from Dynatrace — memory at 94% on the inference pod. Two systems screaming. Now watch Gemini connect the dots."

> *[Reasoning chain starts typing. DO NOT TALK for 5-6 seconds. Let the cursor blink and the text appear. This is the hero moment. Then, quietly:]*

"...There it is. Memory pressure is starving the prompt buffer. The model's getting truncated context. That's why it's hallucinating. Not a model problem. Not an infra problem. A chain that crosses both.

95% confidence. Seven-step causal chain. Found in seconds — not the twenty minutes it takes two teams on a call."

---

## (1:50 – 2:15) THE CONTROL

> *[Action cards visible]*

"Now here's the thing I care about most. ARIA proposes fixes — but look. This one? 'Review Required.' It changes model behavior. ARIA will not touch it without my say-so."

> *[Click Approve]*

"One click. It executes. Pod scales, prompt template patched, report drafted. Done."

> *[Navigate to Configuration via left rail. Show the sliders and toggles.]*

"And you decide exactly how aggressive ARIA is. These sliders — hallucination threshold, memory threshold, correlation window — they control when ARIA wakes up. And these toggles? They define what it's *allowed* to do without asking. Scaling? Auto. Rollbacks? Needs my click. You dial it in like an instrument. More trust over time, you loosen the leash."

---

## (2:15 – 2:35) THE CLOSE

> *[Report visible. Click export.]*

"Full incident report. Exportable. Sendable. Every action documented — what was automatic, what I approved.

That's ARIA. Real data from Arize Phoenix and Dynatrace via MCP. Real reasoning from Gemini via Google ADK. Real human control.

One agent that sees what no dashboard can."

---

## ENERGY NOTES

- **0:00–0:25**: You're frustrated. You've *lived* this problem. Talk like it.
- **0:25–0:50**: You're proud. You built something real. Show it with confidence.
- **0:50–1:50**: You're watching with the audience. The silence while the chain types IS the demo. Don't fill it.
- **1:50–2:10**: You're sharp. "One click. Done." — fast, decisive.
- **2:10–2:30**: You're calm. The problem is solved. Land it cleanly.

## THE PHOENIX MOMENT (Tab 2)

Open `http://localhost:6006` before recording. You'll see:
- A list of 40 `llm.chat.completion` spans
- Click one → see `eval.hallucination_score: 0.82`, `llm.token_count.prompt: 912`, the truncated input text
- Show this for 4 seconds max. It's *proof*, not explanation.

## WHAT JUDGES CATCH WITHOUT YOU SAYING IT

They'll notice these even if you never explain them:
- The typewriter cursor (this is live reasoning, not pre-recorded text)
- Signal values match what was in Phoenix (real integration proof)
- The "infra ↔ model" badge (novel — nobody else will have this)
- The .md file actually downloads (it's real software)
- The config sliders + autonomy toggles (this is a product with depth and trust controls)
- The flow field accelerated during the incident (ambient intelligence)
- The left rail + right panel + three screens (product depth, not a toy)
- Toggle flipping from "auto" → "review required" (humans define the boundaries)
