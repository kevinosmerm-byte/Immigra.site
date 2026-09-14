import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import multer from "multer";

dotenv.config();

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS."));
  }
}));
app.use(express.json({ limit: "256kb" }));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});
// Start the API even before AI credentials are configured. AI endpoints return
// a clear 503 response until OPENAI_API_KEY is added in the hosting provider.
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const MAX_TEXT_LENGTH = 5_000;
const MAX_HISTORY_ITEMS = 12;

function readText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function readAnswer(value) {
  if (Array.isArray(value)) {
    return value.map((item) => readText(item, 1_000)).filter(Boolean).join("; ");
  }
  return readText(value);
}

function requireOpenAI(res) {
  if (openai) return true;
  res.status(503).json({ error: "AI service is not configured." });
  return false;
}

function parseModelJson(output) {
  const json = output.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("The AI response did not include JSON.");
  return JSON.parse(json);
}

function safeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-MAX_HISTORY_ITEMS).flatMap((entry) => {
    const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : null;
    const content = readText(entry?.content, 1_000);
    return role && content ? [{ role, content }] : [];
  });
}

app.post("/evaluate", async (req, res) => {
  try {
    if (!requireOpenAI(res)) return;
    const question = readText(req.body?.question, 1_000);
    const answer = readText(req.body?.answer, 1_000);
    const correctAnswer = readAnswer(req.body?.correctAnswer);
    if (!question || !answer || !correctAnswer) {
      return res.status(400).json({ error: "Question, answer, and accepted answers are required." });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions: `
You are an evaluator for a U.S. naturalization interview practice application.

Evaluate the applicant's answer to the civics question.

Return ONLY valid JSON with this exact structure:
{
  "status": "correct" | "incorrect" | "incomplete",
  "action": "advance" | "retry" | "repeat",
  "feedback": "short explanation"
}

Do not reveal the correct answer.

Judge the meaning of the applicant's answer, not exact wording.
Use the accepted answers as the reference for evaluating the applicant's response.
Accept semantically equivalent answers even when the wording is different.
If the applicant gives the key idea but the answer is missing an important part, classify it as incomplete.
If the answer is wrong or contradicts the accepted answers, classify it as incorrect.
Choose the action according to these rules:

- correct → advance
- incomplete → retry
- incorrect → repeat

Keep the feedback short and appropriate for a real interview.
`,
      input: `
Question:
${question}

Applicant's answer:
${answer}

Accepted answers:
${correctAnswer}
`,
    });

   const result = parseModelJson(response.output_text);

if (!result.action) {
  if (result.status === "correct") {
    result.action = "advance";
  } else if (result.status === "incomplete") {
    result.action = "retry";
  } else if (result.status === "incorrect") {
    result.action = "repeat";
  }
}

res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      feedback: "Unable to evaluate the answer."
    });
  }
});
app.post("/evaluate-writing", async (req, res) => {
  try {
    if (!requireOpenAI(res)) return;
    const sentence = readText(req.body?.sentence, 1_000);
    const answer = readText(req.body?.answer, 1_000);
    if (!sentence || !answer) {
      return res.status(400).json({ error: "Sentence and answer are required." });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
You are an English writing evaluator for a U.S. naturalization interview practice application.

Compare the original sentence with the applicant's written answer.

Evaluate:
- spelling
- missing words
- extra words
- changed words
- grammar
- whether the sentence has the same meaning
- overall writing accuracy

Return ONLY valid JSON with this exact structure:

{
  "score": number,
  "accuracy": "Excellent" | "Good" | "Needs Practice",
  "feedback": "short feedback"
}

The score must be from 0 to 100.

Use these guidelines:
- Excellent: 90-100
- Good: 70-89
- Needs Practice: 0-69

Do not require exact punctuation if the meaning and words are correct.

Keep feedback short, clear, and encouraging.
`,

      input: `
Original sentence:
${sentence}

Applicant's written answer:
${answer}
`,
    });

    const result = parseModelJson(response.output_text);

    res.json(result);

  } catch (error) {
    console.error("Writing evaluation error:", error);

    res.status(500).json({
      error: "Unable to evaluate writing."
    });
  }
});
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!requireOpenAI(res)) return;
    if (!req.file) {
      return res.status(400).json({
        error: "Audio file is required."
      });
    }

    if (!req.file.mimetype.startsWith("audio/")) {
      return res.status(415).json({
        error: "Only audio files are accepted."
      });
    }

    const audioFile = new File(
      [req.file.buffer],
      req.file.originalname || "reading.webm",
      {
        type: req.file.mimetype || "audio/webm"
      }
    );

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      language: "en"
    });

    res.json({
      transcript: transcription.text
    });

  } catch (error) {
    console.error("Reading transcription error:", error);

    res.status(500).json({
      error: "Unable to transcribe audio."
    });
  }
});
app.get("/", (req, res) => {
  res.json({
    message: "Citizenship AI server is running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/evaluate-reading", async (req, res) => {
  try {
    if (!requireOpenAI(res)) return;
    const sentence = readText(req.body?.sentence, 1_000);
    const transcript = readText(req.body?.transcript, 2_000);
    if (!sentence || !transcript) {
      return res.status(400).json({ error: "Sentence and transcript are required." });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
You are an English reading evaluator for a U.S. naturalization interview practice application.

Compare the original sentence with what the applicant said.

Evaluate:
- whether the applicant read all the words
- missing words
- extra words
- changed words
- overall reading accuracy

Return ONLY valid JSON with this exact structure:

{
  "score": number,
  "accuracy": "Excellent" | "Good" | "Needs Practice",
  "feedback": "short feedback",
  "missingWords": [],
  "changedWords": []
}

The score must be from 0 to 100.

Do not evaluate accent or pronunciation from text alone.
Do not invent pronunciation problems.

Keep feedback short and encouraging.
`,

      input: `
Original sentence:
${sentence}

Applicant transcript:
${transcript}
`,
    });

    const result = parseModelJson(response.output_text);

    res.json(result);

  } catch (error) {
    console.error("Reading evaluation error:", error);

    res.status(500).json({
      error: "Unable to evaluate reading."
    });
  }
});
app.post("/coach", async (req, res) => {
  try {
    if (!requireOpenAI(res)) return;
    const message = readText(req.body?.message, 2_000);
    const history = safeHistory(req.body?.history);
    if (!message) {
      return res.status(400).json({ error: "A message is required." });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
You are Sarah, an AI English Coach inside a U.S. citizenship preparation application.

Your job is to help the student practice natural spoken English.

Rules:
- Speak naturally and encouragingly.
- Use clear American English.
- Keep responses short and conversational.
- Ask ONE follow-up question at a time.
- Correct important grammar or vocabulary mistakes, but do not overwhelm the student.
- If the student's English is understandable but imperfect, continue the conversation naturally.
- Do not pretend to be a real USCIS officer.
- Do not provide legal advice.
- This is English practice, not a real immigration interview.

Return ONLY valid JSON:

{
  "reply": "what Sarah should say",
  "correction": "short correction or empty string",
  "encouragement": "short encouraging message"
}
`,

      input: `
      Conversation history:
${JSON.stringify(history)}

Student's latest message:
${message}
`,
    });

    const result = parseModelJson(response.output_text);

    res.json(result);

  } catch (error) {
    console.error("Coach AI error:", error);

    res.status(500).json({
      error: "Unable to connect to AI Coach."
    });
  }
});
app.post("/uscis-case-status", async (req, res) => {
  try {
    const receiptNumber = readText(req.body?.receiptNumber, 13).toUpperCase();

    if (!/^[A-Z]{3}\d{10}$/.test(receiptNumber)) {
      return res.status(400).json({
        error: "Enter a valid 13-character USCIS receipt number."
      });
    }

    if (!process.env.USCIS_CLIENT_ID || !process.env.USCIS_CLIENT_SECRET || !process.env.USCIS_TOKEN_URL || !process.env.USCIS_API_URL) {
      return res.status(503).json({ error: "USCIS case status is not configured yet." });
    }

    const tokenResponse = await fetch(process.env.USCIS_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.USCIS_CLIENT_ID,
        client_secret: process.env.USCIS_CLIENT_SECRET
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("USCIS token error:", tokenData);

      return res.status(tokenResponse.status).json({
        error: "Unable to authenticate with USCIS."
      });
    }

    const caseResponse = await fetch(
      `${process.env.USCIS_API_URL}/${encodeURIComponent(receiptNumber)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json"
        }
      }
    );

    const caseData = await caseResponse.json();

    if (!caseResponse.ok) {
      console.error("USCIS case error:", caseData);

      return res.status(caseResponse.status).json(caseData);
    }

    res.json(caseData);

  } catch (error) {
    console.error("USCIS API error:", error);

    res.status(500).json({
      error: "Unable to connect to USCIS."
    });
  }
});
app.use((error, req, res, _next) => {
  if (error.type === "entity.too.large" || error.status === 413 || error.statusCode === 413) {
    return res.status(413).json({ error: "Request body must be 256 KB or smaller." });
  }
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Audio must be 10 MB or smaller." });
  }
  if (error.message === "Origin is not allowed by CORS.") {
    return res.status(403).json({ error: "Origin is not allowed." });
  }
  console.error("Unhandled server error:", error);
  return res.status(500).json({ error: "Unexpected server error." });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Citizenship AI server running on port ${PORT}`);
});
