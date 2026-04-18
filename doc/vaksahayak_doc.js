const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// Theme Colors: Metallic Blue palette
const PRIMARY_NAVY = "0F172A"; // Very dark blue/slate
const METALLIC_BLUE = "3B82F6"; // Bright vibrant blue
const LIGHT_BG = "F8FAFC"; // Very light blue/gray
const ACCENT_CYAN = "06B6D4"; // Cyan highlight
const TEXT_GRAY = "334155";
const TABLE_WIDTH = 9360;

const border = { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: METALLIC_BLUE, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 32, color: METALLIC_BLUE, font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, color: PRIMARY_NAVY, font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 180, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: ACCENT_CYAN, font: "Arial" })]
  });
}

function p(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_GRAY, ...options })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_GRAY })]
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: TEXT_GRAY })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function callout(text, color = LIGHT_BG) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [TABLE_WIDTH],
    rows: [new TableRow({
      children: [new TableCell({
        borders: { left: { style: BorderStyle.SINGLE, size: 10, color: METALLIC_BLUE } },
        width: { size: TABLE_WIDTH, type: WidthType.DXA },
        shading: { fill: color, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [new Paragraph({
          children: [new TextRun({ text, size: 22, font: "Arial", color: PRIMARY_NAVY, italics: true })]
        })]
      })]
    })]
  });
}

function stackTable(rows) {
  const colWidths = [2000, 7360];
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        children: ["Component", "Technology Used"].map((h, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: PRIMARY_NAVY, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF", font: "Arial" })] })]
        }))
      }),
      ...rows.map(([layer, desc], idx) => new TableRow({
        children: [layer, desc].map((val, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: i === 0 ? LIGHT_BG : (idx % 2 === 0 ? "F8FAFC" : "FFFFFF"), type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, font: "Arial", color: TEXT_GRAY, bold: i === 0 })] })]
        }))
      }))
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // TITLE PAGE
      new Paragraph({ spacing: { before: 480 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "VAK SAHAYAK", bold: true, size: 72, color: PRIMARY_NAVY, font: "Arial" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 60 }, children: [new TextRun({ text: "Next-Generation Voice AI Agent", size: 32, color: METALLIC_BLUE, font: "Arial" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 400 }, children: [new TextRun({ text: "Technical Architecture & Project Report", size: 24, color: TEXT_GRAY, font: "Arial", italics: true })] }),

      callout("A platform built for every citizen who deserves access to complex government services, regardless of language scale, typing literacy, or digital confidence. Simply speak, and the AI fills the form for you."),

      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // SECTION 1: INTRODUCTION
      h1("1. Introduction & Real Use Cases"),
      p("Vak Sahayak ('Voice Assistant') is an advanced AI agent that bridges the gap between complex digital infrastructure and non-technical citizens. Instead of navigating confusing dropdowns, users simply talk to the computer. The system listens, understands the intent, replies naturally, and physically fills the screen in real-time."),
      spacer(),
      
      h2("Real-World Use Cases Built Into The System"),
      h3("1. Aadhaar Card Updates"),
      callout("Scenario: A 60-year-old grandfather needs to update his Aadhaar address but doesn't own a keyboard.\nUse Case: The agent politely asks for his Name, Age, Gender, and New Address in Hindi. As he speaks, the text boxes on the screen fill themselves perfectly."),
      
      h3("2. PAN Card Applications"),
      callout("Scenario: A rural shopkeeper needs a PAN card for his business.\nUse Case: The agent collects his full name, precise Date of Birth, 12-digit Aadhaar Number, and Mobile number, securely packaging it for submission."),
      
      h3("3. Ration Card Benefits"),
      callout("Scenario: A daily wage worker applying for food subsidies.\nUse Case: The agent asks simple questions like 'Who is the Head of the Family?' and 'What is your monthly income?' and processes it instantly."),
      
      new Paragraph({ children: [new PageBreak()] }),

      // SECTION 2: TECHNOLOGY STACK
      h1("2. The Architecture (How it Works)"),
      p("Building a voice assistant with zero lag requires tying together specialized technologies. Here is our precise stack:"),
      
      stackTable([
        ["Frontend UI", "Next.js 15 & React. We built a beautiful metallic-blue visualizer that highlights form fields dynamically as the AI speaks."],
        ["Networking (WebRTC)", "LiveKit. Standard HTTP is too slow for voice. LiveKit opens a continuous WebSocket pipeline between the browser and our server."],
        ["The 'Brain' (LLM)", "Meta Llama-3.3 (70 Billion parameters) running on Groq LPUs. Groq provides the world's fastest inference, letting the brain think without lag."],
        ["The 'Ears' (STT)", "Sarvam AI (Saaras Model). When a user speaks Hindi or Tamil, Sarvam converts the physical audio waves into digital text instantly."],
        ["The 'Mouth' (TTS)", "Sarvam AI (Bulbul Model). Generates ultra-realistic Indian voices from text and streams the audio back to the user's speakers."]
      ]),
      
      spacer(),
      h2("The 500-Millisecond Pipeline"),
      numbered("User Speaks: 'Meri umar bias saal hai.' (My age is 22)"),
      numbered("LiveKit streams the audio to the server."),
      numbered("Sarvam STT translates the audio to digital text."),
      numbered("Groq (Llama 3.3) receives the text, recognizes it belongs in the 'Age' box, and triggers an invisible Javascript function: focus_field('age', '22')."),
      numbered("Groq formulates the next question: 'Aapka pata kya hai?' (What is your address?)."),
      numbered("Sarvam TTS turns that text into audio."),
      numbered("LiveKit streams it to the speakers while the React frontend highlights the 'Address' box!"),

      new Paragraph({ children: [new PageBreak()] }),

      // SECTION 3: ENGINEERING CHALLENGES (BEING REAL)
      h1("3. Hard Engineering Challenges We Solved"),
      p("Tying cutting-edge AI networks together is incredibly difficult. We had to solve several critical stability crashes during development:"),

      h3("Challenge A: The Groq Token Limit Crash"),
      p("Because Large Language Models need context, we pass the entire conversation history to Groq every time the user speaks. By the 5th question, the text size balloons so large it hits Groq's Free-Tier limit of 6,000 Tokens-Per-Minute, causing an instant server crash."),
      callout("The Fix: We forcefully optimized our Form Schemas. We truncated Aadhaar and PAN inputs to a maximum of 4 critical fields. This guarantees the entire conversation sequence concludes perfectly inside a 3-minute window without triggering the speed trap."),

      h3("Challenge B: The Sarvam Idle Timeout (408 Error)"),
      p("After the form reaches 100%, the AI waits for the user to read the summary screen and say 'Yes'. But if the user stays silent for 60 seconds, Sarvam AI cloud servers get bored and aggressively terminate the WebSocket connection (Error 408), which cascaded and killed our entire LiveKit Session."),
      callout("The Fix: We engineered a deep intercept parameter on the internal Javascript Event Emitter. When Sarvam throws its 408 Idle Error, our backend swallows the error silently and lies to LiveKit. The session survives unharmed, and instantly wakes up when the user finally speaks again."),

      h3("Challenge C: The 'Ghost Submission' Bug"),
      p("The AI was 'too helpful'. Once all boxes were filled, it would automatically trigger the submit_form() software hook without waiting for the human to verbally confirm the details were correct."),
      callout("The Fix: We introduced 'Tool Atomicity'. We altered the submit_form software definition so that it strictly required a 'userHasConfirmed: true' boolean parameter."),

      new Paragraph({ children: [new PageBreak()] }),

      // SECTION 4: HACKATHON STRATEGY & PRIZE ALIGNMENT
      h1("4. Hackathon Strategy & Prize Alignment"),
      p("Vak Sahayak was engineered specifically to target high-impact prize tracks at AceHack 5.0:"),
      
      h3("Target Prize Tracks"),
      bullet("Open Track: Solving a massive socio-economic problem using voice-native AI."),
      bullet("Llama 3.3 API: Utilizing advanced Meta models via Groq to achieve sub-100ms conversational inference."),
      bullet("Auth0: Production-ready RBAC implementation for secure civic identity management."),
      bullet("Google Antigravity: Managed via the Antigravity agentic environment, ensuring absolute engineering precision."),

      h3("Security & Data Privacy"),
      bullet("Auth0 RBAC: Strict identity enforcement between Citizen and Admin roles."),
      bullet("Supabase RLS: Mathematical row-level isolation preventing data leakage."),
      bullet("Sovereign Context: 100% Indian linguistic processing via Sarvam.ai models."),

      spacer(),
      new Paragraph({ children: [new PageBreak()] }),

      // SECTION 5: ROADMAP
      h1("5. Future Implementation Roadmap"),
      p("Vak Sahayak is built as an infrastructure platform. Our goal is to move beyond the browser:"),

      h2("Phase 1: WhatsApp Native (Month 1-3)"),
      p("Integration with WhatsApp Audio to allow citizens to fill forms via voice notes or calls, bypassing the need for a web browser entirely."),
      
      h2("Phase 2: Dialect Expansion (Month 3-6)"),
      p("Expansion to all 22 official languages of India, including deep regional dialect training for improved accuracy in North-East and South-Indian states."),

      h2("Phase 3: Multi-Agent Handoff"),
      p("Implementing a supervisor node that detects if the citizen is extremely frustrated and seamlessly hands the WebRTC call over to a live human operator via SIP trunking."),

      spacer(),

      // SECTION 6: CONCLUSION
      h1("6. Conclusion"),
      p("Vak Sahayak proves that complex e-governance systems do not need complicated graphical interfaces. By heavily optimizing WebSocket buffers, intercepting 3rd-party idle timeouts, and applying strict parameter rules to wild language models, we built an incredibly robust voice engine."),
      p("Vak Sahayak represents the future of accessibility—where anyone, regardless of education level or typing capability, can simply sit down, speak clearly to their screen, and effortlessly manage their digital identity.")
    ]
  }]
});

// Update the path to point to a relative directory
const outputPath = "./doc/Vak_Sahayak_Architecture_Report.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Successfully generated report at:", outputPath);
});