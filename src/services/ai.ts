import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import partOfSpeechData from "../partOfSpeech.json";
import { themeVocabularies } from "../themeVocabularies";

dotenv.config();

const VALID_POS = partOfSpeechData.parts_of_speech.map((pos) => pos.key);
const VALID_THEMES = themeVocabularies;

export const aiService = {
  async generateContent(input: string, systemInstruction: string, apiKey?: string) {
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
      throw new Error("Gemini API key is required");
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "";
    try {
      // Even with response_mime_type, defensive cleaning is good
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Failed to parse AI response:", text);
      throw new Error("AI returned invalid JSON structure");
    }
  },

  getSystemInstruction(type: 'new' | 'enhance', customFields?: string[]) {
    const posStr = VALID_POS.join(", ");
    const themesStr = VALID_THEMES.join(", ");

    let instruction = `You are a professional Korean-Bangla translator and Korean language teacher.\n\n`;

    if (type === 'new') {
      instruction += `The user will provide vocabulary data which may include the Korean word and its Bangla meaning. 
Your task is to extract this information and generate all missing fields to complete the vocabulary object according to the required structure.
If only a list of words or phrases is provided, generate everything from scratch. 
If both Korean and Bangla are provided, ensure you use those and then add the missing details like romanization, part of speech, examples, etc.\n\n`;
    } else {
      const fieldList = customFields && customFields.length > 0 ? customFields.join(', ') : 'all missing fields';
      instruction += `Your task is to enhance the provided vocabulary object. 
Focus specifically on enhancing these fields: ${fieldList}. 
If a field is already present and accurate, you may keep it, but ensure it meets high-quality standards (e.g., explanations should be detailed, examples should be natural).\n\n`;
    }

    instruction += `Required JSON Structure for each object:
{
  "korean_word": "The word in Hangul",
  "bangla_meaning": "Accurate meaning in Bengali",
  "romanization": "Standard Revised Romanization like this :: sa-ram",
  "part_of_speech": "One of: ${posStr}",
  "explanation": "Detailed usage explanation in Bengali (min 50 chars). Include when to use it, where it's common, and stylistic nuances. Answer 'who, what, where, when, why, how' if applicable. Suitable for Bangladeshi learners.",
  "themes": ["at least one or more from ONLY this list: ${themesStr}"],
  "chapters": [],
  "examples": [
    {
      "korean": "real world example sentence in Korean",
      "bangla": "real world example Bengali translation"
    }
  ],
  "verb_forms": {
    "present": "Present tense form (e.g. 가요)",
    "past": "Past tense form (e.g. 갔어요)",
    "future": "Future tense form (e.g. 갈 거예요)",
    "polite": "Formal polite form (e.g. 갑니다)"
  }
}

Rules:
- Provide exactly 2 examples per word. Examples should be practical for ESP Topic learners.
- Always include "verb_forms" ONLY if part_of_speech is "verb"
- If not a verb, OMIT the "verb_forms" key
- Response must be ONLY a valid JSON array
- Do NOT include markdown, comments, or explanations
- Set "chapters" to an empty array [] always; do NOT generate values for it.
- Do NOT use markdown code blocks.
- Do NOT add any text before or after the JSON.
`;
    return instruction;
  }
};
