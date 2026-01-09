import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { aiService } from "./services/ai";

const app = express();

/* ---------------- middleware ---------------- */
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

/* ---------------- routes ---------------- */
app.get("/", (_req, res) => {
    res.json({ message: "Server running 🚀" });
});

app.post("/gemini/update-missing-vocabulary-fields", async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) return res.status(400).json({ error: "Input text is required" });

        const instruction = aiService.getSystemInstruction('new');
        const text = await aiService.generateContent(input, instruction);

        res.json({ data: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gemini API error" });
    }
});

app.post("/gemini/enhance", async (req, res) => {
    try {
        const { vocabulary, fields } = req.body;
        if (!vocabulary) return res.status(400).json({ error: "Vocabulary object is required" });

        const instruction = aiService.getSystemInstruction('enhance', fields);
        const data = await aiService.generateContent(JSON.stringify(vocabulary), instruction);

        res.json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gemini Enhancement error" });
    }
});

/* ---------------- local dev server ---------------- */
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running 🚀 on http://localhost:${PORT}`);
    });
}

/* ---------------- Vercel export ---------------- */
export default app;
