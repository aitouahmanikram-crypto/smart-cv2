import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY environment variable is not defined or is empty!");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_FOR_LINT",
    });
  }
  return aiClient;
}

export async function parseCVText(textContent: string) {
  const ai = getGemini();

  const promptMessage = `
    Please analyze the following CV text. Extract standard details and perform a detailed, rigorous assessment.
    Score the CV on CV Quality metric parameters between 0 and 100:
    - score (overall score)
    - grammarScore (correct layouts, readability, consistency)
    - impactScore (action-verb strength, measurable business metrics or bullet performance)
    - skillsScore (presence of key tools, structure of skills section)

    Provide:
    - summary: A brief elevator pitch of the candidate.
    - strengths: List of 3 to 5 core strengths.
    - weaknesses: List of 2 to 3 main weaknesses or missing components.
    - atsOptimizations: 3 actionable suggestions to improve ATS parsing.
    - grammarImprovements: 2 to 3 suggestions to fix typos or grammar nuances.
    - recommendations: 3 highly actionable professional recommendations to improve the resume.
    - skillsMatched: Explicit skills found.
    - skillsMissing: Highly standard skills missing based on their role level.
    - parsedDetails: Including name, email, phone, experience (array of items), education (array of items).

    Output must be strictly raw valid JSON. Use this structure exactly:
    {
      "score": number, "grammarScore": number, "impactScore": number, "skillsScore": number,
      "summary": "string", "strengths": ["string"], "weaknesses": ["string"], 
      "atsOptimizations": ["string"], "grammarImprovements": ["string"], "recommendations": ["string"],
      "skillsMatched": ["string"], "skillsMissing": ["string"],
      "parsedDetails": {
        "name": "string", "email": "string", "phone": "string",
        "skills": ["string"], "experience": ["string"], "education": ["string"]
      }
    }

    CV Context Text:
    ${textContent}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: promptMessage,
    config: {
      systemInstruction: "You are an expert HR and ATS parser. Respond with JSON only.",
      responseMimeType: "application/json",
    }
  });

  const responseText = response.text || "{}";
  return JSON.parse(responseText.trim());
}

export async function generateSkillsSummary(textContent: string) {
  const ai = getGemini();

  const promptMessage = `
    Analyze the following CV text and extract a structured skills summary.
    Provide a list of technical and soft skills, mapped into logical categories (e.g., Programming Languages, Frameworks, Tools, Soft Skills).

    Output must be strictly raw valid JSON. Use this structure exactly:
    {
      "skillsSummary": {
        "categoryName": ["skill1", "skill2"],
        ...
      }
    }

    CV Context Text:
    ${textContent}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: promptMessage,
    config: {
      systemInstruction: "You are an expert resume analyzer. Respond with JSON only.",
      responseMimeType: "application/json",
    }
  });

  const responseText = response.text || "{}";
  return JSON.parse(responseText.trim());
}
