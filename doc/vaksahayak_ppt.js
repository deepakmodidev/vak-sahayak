const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Vak Sahayak - Voice-Enabled Government Forms";

// Palette
const NAVY = "0F2A5C";
const SAFFRON = "F97316";
const WHITE = "FFFFFF";
const LIGHT_BG = "F0F6FF";
const SLATE = "1E293B";
const MUTED = "64748B";
const TEAL = "0D9488";

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

// ─── SLIDE 1: TITLE ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addShape(pres.shapes.OVAL, { x: 7.8, y: -0.4, w: 3.2, h: 3.2, fill: { color: "1A3A72", transparency: 30 }, line: { color: "1A3A72" } });
  s.addShape(pres.shapes.OVAL, { x: 8.5, y: 2.8, w: 2.2, h: 2.2, fill: { color: SAFFRON, transparency: 75 }, line: { color: SAFFRON, transparency: 75 } });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 0.6, w: 2.4, h: 0.38, fill: { color: SAFFRON, transparency: 20 }, line: { color: SAFFRON }, rectRadius: 0.1 });
  s.addText("AceHack 5.0  |  2026", { x: 0.5, y: 0.6, w: 2.4, h: 0.38, fontSize: 11, color: WHITE, bold: true, align: "center", valign: "middle", margin: 0 });

  s.addText("Vak Sahayak", { x: 0.5, y: 1.25, w: 7, h: 1.4, fontSize: 72, color: WHITE, bold: true, fontFace: "Calibri", margin: 0 });
  s.addText("वाक् सहायक", { x: 0.52, y: 2.55, w: 7, h: 0.6, fontSize: 24, color: SAFFRON, fontFace: "Calibri", margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.3, w: 5.5, h: 0.04, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("E-Governance for Everyone.\nJust Speak.", { x: 0.5, y: 3.5, w: 7, h: 1.0, fontSize: 22, color: "B8D4F8", fontFace: "Calibri", lineSpacingMultiple: 1.4, margin: 0 });
  s.addText("Voice-Native  •  Sovereign AI  •  11 Indian Languages  •  Zero Friction", { x: 0.5, y: 4.9, w: 9, h: 0.45, fontSize: 13, color: "8AACDC", align: "left", margin: 0 });
}

// ─── SLIDE 2: THE PROBLEM ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("The Digital Barrier", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });

  s.addText('"Imagine a citizen in rural Bihar. He needs a Domicile Certificate. The portal is complex, English-first, and requires expert typing. He travels 15km, waits 3 hours, and pays ₹200 to a middleman for a form that should be free. Digitization was supposed to help him, but the barrier of literacy left him behind."', {
    x: 0.5, y: 1.25, w: 9, h: 1.0, fontSize: 13, color: SLATE, italic: true, fontFace: "Calibri", align: "left"
  });

  const stats = [
    { num: "600M+", label: "Indians with limited\ndigital literacy", sub: "TRAI / IAMAI 2024", color: NAVY },
    { num: "85%", label: "Govt portals are\nEnglish-Primary", sub: "Linguistic Exclusion", color: SAFFRON },
    { num: "₹1,200Cr", label: "Estimated annual\nMiddleman 'Tax'", sub: "For basic civic services", color: TEAL },
  ];
  stats.forEach((st, i) => {
    const x = 0.4 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.45, w: 2.85, h: 2.7, fill: { color: WHITE }, line: { color: "E2E8F0" }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.45, w: 2.85, h: 0.1, fill: { color: st.color }, line: { color: st.color } });
    s.addText(st.num, { x, y: 2.55, w: 2.85, h: 1.1, fontSize: 48, color: st.color, bold: true, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(st.label, { x, y: 3.6, w: 2.85, h: 0.7, fontSize: 14, color: SLATE, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(st.sub, { x, y: 4.35, w: 2.85, h: 0.5, fontSize: 11, color: MUTED, align: "center", italic: true, fontFace: "Calibri", margin: 0 });
  });
}

// ─── SLIDE 3: SOLUTION ──────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("The Solution", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 18, color: SAFFRON, fontFace: "Calibri", margin: 0 });
  s.addText("Vak Sahayak", { x: 0.5, y: 0.95, w: 9, h: 1.2, fontSize: 64, color: WHITE, bold: true, fontFace: "Calibri", margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.2, w: 4, h: 0.04, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("A voice-first, low-latency AI agent that allows any citizen to fill any government form through natural spoken conversation in their native tongue.", {
    x: 0.5, y: 2.4, w: 6.5, h: 1.1, fontSize: 17, color: "B8D4F8", fontFace: "Calibri", lineSpacingMultiple: 1.5
  });
  const pills = ["No Keyboards", "No English Barrier", "No Middlemen", "No Complexity"];
  pills.forEach((pill, i) => {
    const x = 0.5 + i * 2.35;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.7, w: 2.1, h: 0.52, fill: { color: SAFFRON, transparency: 15 }, line: { color: SAFFRON }, rectRadius: 0.12 });
    s.addText(pill, { x, y: 3.7, w: 2.1, h: 0.52, fontSize: 13, color: WHITE, bold: true, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
  });
}

// ─── SLIDE 4: LINGUISTIC SOVEREIGNTY ──────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("Linguistic Sovereignty", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addText("Vak Sahayak communicates in the language of the citizen. Powered by Sarvam AI's specialized Indian linguistic stack.", {
    x: 0.5, y: 1.3, w: 9, h: 0.5, fontSize: 16, color: SLATE, fontFace: "Calibri"
  });
  const langs = ["Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi", "English (Indian Accent)"];
  langs.forEach((lang, i) => {
    const col = i % 4; const row = Math.floor(i / 4);
    const x = 0.5 + col * 2.3; const y = 2.0 + row * 0.8;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.1, h: 0.6, fill: { color: WHITE }, line: { color: TEAL }, rectRadius: 0.1, shadow: makeShadow() });
    s.addText(lang, { x, y, w: 2.1, h: 0.6, fontSize: 14, color: NAVY, bold: true, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
  });
}

// ─── SLIDE 5: HOW IT WORKS ───────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("The Voice Loop", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });
  const steps = [
    { num: "1", title: "Speech Ingestion", body: "WebRTC streams raw audio. Sarvam STT 'Saaras' transcribes with dialect accuracy.", emoji: "🎙️" },
    { num: "2", title: "Smart Reasoning", body: "Groq Llama 3.3 parses intent, extracts JSON fields, and handles conversation flow.", emoji: "🧠" },
    { num: "3", title: "UI Orchestration", body: "Server emits DataPackets to browser, physically highlighting and filling form fields.", emoji: "📋" },
    { num: "4", title: "Human Synthesis", body: "Sarvam 'Bulbul' generates natural voice output to guide the next step.", emoji: "🔊" },
  ];
  steps.forEach((step, i) => {
    const x = 0.3 + i * 2.38;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 2.15, h: 3.7, fill: { color: WHITE }, line: { color: "E2E8F0" }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 2.15, h: 0.08, fill: { color: SAFFRON }, line: { color: SAFFRON } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.72, y: 1.42, w: 0.68, h: 0.68, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(step.num, { x: x + 0.72, y: 1.42, w: 0.68, h: 0.68, fontSize: 18, color: WHITE, bold: true, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    s.addText(step.emoji, { x, y: 2.2, w: 2.15, h: 0.7, fontSize: 28, align: "center", fontFace: "Segoe UI Emoji", margin: 0 });
    s.addText(step.title, { x, y: 2.95, w: 2.15, h: 0.55, fontSize: 14, color: NAVY, bold: true, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(step.body, { x: x + 0.1, y: 3.55, w: 1.95, h: 1.3, fontSize: 12, color: SLATE, align: "center", fontFace: "Calibri", lineSpacingMultiple: 1.3, margin: 0 });
  });
}

// ─── SLIDE 6: SECURITY & PRIVACY ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("Safety & Integrity", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });
  const secs = [
    { title: "Auth0 identity", body: "Secure login with RBAC (Role-Based Access Control). Citizen vs Admin separation.", color: "7C3AED" },
    { title: "Supabase RLS", body: "Row-Level Security ensures no data leakage. 100% mathematical user isolation.", color: "059669" },
    { title: "Sovereign Infra", body: "Linguistic processing stays within Indian model boundaries (Sarvam.ai).", color: TEAL },
  ];
  secs.forEach((sec, i) => {
    const y = 1.3 + i * 1.3;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 9, h: 1.1, fill: { color: WHITE }, line: { color: "E2E8F0" }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 0.15, h: 1.1, fill: { color: sec.color }, line: { color: sec.color } });
    s.addText(sec.title, { x: 0.8, y: y + 0.1, w: 3, h: 0.4, fontSize: 18, color: NAVY, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(sec.body, { x: 0.8, y: y + 0.55, w: 8, h: 0.4, fontSize: 14, color: SLATE, fontFace: "Calibri", margin: 0 });
  });
}

// ─── SLIDE 7: HARD ENGINEERING ───────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("Hard Engineering Challenges", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });
  const challenges = [
    { title: "408 Idle Timeout Fix", body: "Sarvam terminates on 60s silence. We injected prototype-level wrappers around event emitters to swallow 408 codes and prevent session crashes.", emoji: "🔌", color: NAVY },
    { title: "Token Optimization", body: "Indian context payloads are massive. We implemented a dynamic schema pruner that truncates forms to exactly 4 active fields per session.", emoji: "⚡", color: TEAL },
    { title: "Tool Atomicity", body: "Prevented AI auto-submissions by enforcing a mandatory 'userHasConfirmed' boolean guard, ensuring citizens always audit data first.", emoji: "🛡️", color: SAFFRON },
  ];
  challenges.forEach((ch, i) => {
    const x = 0.3 + i * 3.2;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 3.0, h: 3.8, fill: { color: WHITE }, line: { color: "E2E8F0" }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 3.0, h: 0.6, fill: { color: ch.color }, line: { color: ch.color } });
    s.addText(ch.emoji + "  " + ch.title, { x, y: 1.3, w: 3.0, h: 0.6, fontSize: 15, color: WHITE, bold: true, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    s.addText(ch.body, { x: x + 0.15, y: 2.05, w: 2.7, h: 2.8, fontSize: 14, color: SLATE, fontFace: "Calibri", lineSpacingMultiple: 1.5, valign: "top", margin: 0 });
  });
}

// ─── SLIDE 8: TECH STACK ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("Production Tech Stack", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });
  const techRows = [
    ["Voice Pipeline", "LiveKit WebRTC + Agents Framework"],
    ["STT / TTS", "Sarvam AI (Saaras + Bulbul Models)"],
    ["LLM Engine", "Groq Llama 3.3 70B (Sub-100ms Inference)"],
    ["Frontend", "Next.js 15 + Tailwind CSS + Radix UI"],
    ["Backend", "Supabase (Postgres, Storage, RLS)"],
    ["Auth", "Auth0"],
  ];
  s.addTable(techRows, { x: 0.5, y: 1.5, w: 9, h: 3.5, border: { pt: 1, color: "E2E8F0" }, fill: "FFFFFF", fontSize: 14, color: SLATE, fontFace: "Calibri", valign: "middle", rowH: 0.58, colW: [3, 6] });
}

// ─── SLIDE 9: PRIZES ─────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("Prize Tracks We're Targeting", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });
  const prizes = [
    { track: "🏆  Open Track", amount: "$1,000", how: "Best overall hack. Voice-first, high social impact, sovereign AI story.", color: NAVY },
    { track: "💎  Llama API", amount: "MLH Prize", how: "Used Llama 3.3 70B via Groq for high-speed deterministic form filling.", color: TEAL },
    { track: "🔐  Auth0", amount: "MLH Prize", how: "Citizen and Admin role-based authentication baked into the platform.", color: "7C3AED" },
    { track: "🤖  Google Antigravity", amount: "MLH Prize", how: "Managed the entire 36-hour dev workflow using Antigravity AI.", color: SAFFRON },
  ];
  prizes.forEach((p, i) => {
    const row = Math.floor(i / 2); const col = i % 2;
    const x = 0.3 + col * 4.9; const y = 1.3 + row * 2.05;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.55, h: 1.85, fill: { color: WHITE }, line: { color: "E2E8F0" }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.1, h: 1.85, fill: { color: p.color }, line: { color: p.color } });
    s.addText(p.track, { x: x + 0.2, y: y + 0.1, w: 2.8, h: 0.45, fontSize: 15, color: SLATE, bold: true, fontFace: "Calibri", margin: 0 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 3.15, y: y + 0.12, w: 1.28, h: 0.38, fill: { color: p.color, transparency: 15 }, line: { color: p.color }, rectRadius: 0.1 });
    s.addText(p.amount, { x: x + 3.15, y: y + 0.12, w: 1.28, h: 0.38, fontSize: 12, color: p.color, bold: true, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    s.addText(p.how, { x: x + 0.2, y: y + 0.6, w: 4.2, h: 1.1, fontSize: 13, color: MUTED, fontFace: "Calibri", lineSpacingMultiple: 1.4, margin: 0 });
  });
}

// ─── SLIDE 10: ROADMAP ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: LIGHT_BG };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: NAVY }, line: { color: NAVY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 1.1, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("Future Roadmap", { x: 0.4, y: 0, w: 9, h: 1.1, fontSize: 32, color: WHITE, bold: true, fontFace: "Calibri", valign: "middle", margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.65, w: 8.2, h: 0.06, fill: { color: "CBD5E1" }, line: { color: "CBD5E1" } });
  const phases = [
    { phase: "Now", title: "Hackathon MVP", items: ["3 voice forms", "Hindi support", "Auth + Supabase"], color: NAVY, x: 0.4 },
    { phase: "Month 1-3", title: "Pilot", items: ["State gov partnership", "5+ form types", "2 more languages"], color: SAFFRON, x: 2.8 },
    { phase: "Month 3-6", title: "WhatsApp", items: ["No website needed", "Citizens use WA", "Wider reach"], color: TEAL, x: 5.2 },
    { phase: "Year 1+", title: "Platform", items: ["Open API", "500+ forms", "All 11 languages"], color: "7C3AED", x: 7.5 },
  ];
  phases.forEach((ph) => {
    s.addShape(pres.shapes.OVAL, { x: ph.x + 0.9, y: 2.5, w: 0.32, h: 0.32, fill: { color: ph.color }, line: { color: ph.color } });
    s.addShape(pres.shapes.RECTANGLE, { x: ph.x + 0.3, y: 1.25, w: 2.2, h: 1.1, fill: { color: WHITE }, line: { color: "E2E8F0" }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: ph.x + 0.3, y: 1.25, w: 2.2, h: 0.08, fill: { color: ph.color }, line: { color: ph.color } });
    s.addText(ph.phase, { x: ph.x + 0.3, y: 1.3, w: 2.2, h: 0.38, fontSize: 12, color: ph.color, bold: true, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(ph.title, { x: ph.x + 0.3, y: 1.72, w: 2.2, h: 0.55, fontSize: 14, color: SLATE, bold: true, align: "center", fontFace: "Calibri", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: ph.x + 0.3, y: 3.0, w: 2.2, h: 2.3, fill: { color: WHITE }, line: { color: "E2E8F0" }, shadow: makeShadow() });
    s.addText(ph.items.map((item, i) => ({ text: item, options: { bullet: true, breakLine: i < ph.items.length - 1 } })), { x: ph.x + 0.45, y: 3.1, w: 1.9, h: 2.1, fontSize: 12, color: SLATE, fontFace: "Calibri", paraSpaceAfter: 8 });
  });
}

// ─── SLIDE 11: CLOSING ───────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addShape(pres.shapes.OVAL, { x: 7.2, y: -0.5, w: 4, h: 4, fill: { color: "1A3A72", transparency: 30 }, line: { color: "1A3A72" } });
  s.addText("E-Governance should be a conversation,", { x: 0.5, y: 0.7, w: 7.5, h: 0.65, fontSize: 24, color: "B8D4F8", fontFace: "Calibri", margin: 0 });
  s.addText("not a barrier to entry.", { x: 0.5, y: 1.3, w: 7.5, h: 0.65, fontSize: 24, color: "B8D4F8", fontFace: "Calibri", margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.3, w: 5.5, h: 0.04, fill: { color: SAFFRON }, line: { color: SAFFRON } });
  s.addText("Vak Sahayak.", { x: 0.5, y: 2.6, w: 7, h: 1.4, fontSize: 72, color: WHITE, bold: true, fontFace: "Calibri", margin: 0 });
  s.addText("Team Vak Sahayak  |  AceHack 5.0  |  Built with Sarvam AI", { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 12, color: "8AACDC", align: "left", italic: true, fontFace: "Calibri" });
}

const outputPath = "./doc/Vak_Sahayak_Pitch.pptx";
pres.writeFile({ fileName: outputPath }).then(() => console.log("Successfully generated report at:", outputPath));