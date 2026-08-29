
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


// =====================================================
// AI SECURITY EXPLANATION
// =====================================================

async function analyzeSecurityFinding({
  finding,
  sourceCode = "",
}) {

  const prompt = `
You are CodeSentinel AI, an expert application security engineer.

Analyze the security finding below using the provided source code.

SECURITY FINDING:
${JSON.stringify(finding, null, 2)}

SOURCE CODE:
${sourceCode || "No source code was provided."}

Return ONLY valid JSON in exactly this structure:

{
  "title": "",
  "severity": "",
  "isLikelyReal": true,
  "confidence": 0,
  "explanation": "",
  "rootCause": "",
  "impact": "",
  "recommendation": "",
  "secureCode": ""
}

Rules:
- Do not invent facts.
- Use the supplied source code as evidence.
- If there is not enough evidence, clearly say so.
- Explain why the finding is potentially dangerous.
- Explain the root cause.
- Explain the potential impact.
- Give a practical remediation.
- Provide secure replacement code when possible.
- confidence must be a number between 0 and 100.
`;

  const response =
  await groq.chat.completions.create({

    model: "openai/gpt-oss-120b",

    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],

    temperature: 0.2,
  });

const text =
  response.choices?.[0]?.message?.content?.trim();

  if (!text) {
  throw new Error(
    "Groq returned an empty security analysis."
  );
}

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}


// =====================================================
// AI SECURITY FIX — GROQ
// =====================================================

async function generateAIFix(prompt) {

  console.log("====================================");
  console.log("       GROQ AI FIX GENERATION");
  console.log("====================================");

  if (!prompt || typeof prompt !== "string") {
    throw new Error(
      "AI fix prompt is empty or invalid."
    );
  }

  console.log(
    "AI fix prompt length:",
    prompt.length
  );

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {

    try {

      console.log(
        `Groq attempt ${attempt}/${maxRetries}`
      );

      const response =
        await groq.chat.completions.create({

          model: "openai/gpt-oss-120b",

          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.2,

        });

      const text =
        response.choices?.[0]?.message?.content?.trim();

      if (!text) {
        throw new Error(
          "Groq returned an empty AI fix response."
        );
      }

      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {

        const result =
          JSON.parse(cleaned);

        console.log(
          "✓ Groq AI fix generated successfully"
        );

        return result;

      } catch {

        console.error(
          "Groq returned invalid JSON:"
        );

        console.error(text);

        throw new Error(
          "Groq returned invalid JSON for the AI fix."
        );
      }

    } catch (error) {

      console.error(
        `Groq attempt ${attempt} failed:`,
        error.message
      );

      if (
        attempt < maxRetries
      ) {

        const delay =
          attempt * 2000;

        console.log(
          `Groq request failed. Retrying in ${delay / 1000} seconds...`
        );

        await new Promise(
          (resolve) =>
            setTimeout(resolve, delay)
        );

        continue;
      }

      throw error;
    }
  }
}


// =====================================================
// EXPORT FUNCTIONS
// =====================================================

module.exports = {
  analyzeSecurityFinding,
  generateAIFix,
};