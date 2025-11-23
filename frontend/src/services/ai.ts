import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
// Note: In production, you should proxy this through your backend to hide the key,
// but for this demo/MVP, we'll use it directly in frontend as requested.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Using Gemini 2.5 Flash - Available in free tier with good rate limits
// 10 RPM, 250K TPM - Perfect for chat and summarization tasks
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const aiService = {
    askGemini: async (prompt: string, context?: string) => {
        if (!API_KEY) {
            return "⚠️ Chưa cấu hình Gemini API Key. Vui lòng kiểm tra file .env";
        }

        try {
            let fullPrompt = prompt;
            if (context) {
                fullPrompt = `Context from PDF:\n"${context}"\n\nQuestion: ${prompt}\n\nAnswer in Vietnamese:`;
            }

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Error:", error);
            return "Xin lỗi, tôi gặp sự cố khi kết nối với Gemini. Vui lòng thử lại sau.";
        }
    },

    summarizeText: async (text: string) => {
        const prompt = "Tóm tắt ngắn gọn nội dung sau bằng tiếng Việt:";
        return await aiService.askGemini(prompt, text);
    },

    explainConcept: async (text: string) => {
        const prompt = "Giải thích thuật ngữ/đoạn văn này một cách dễ hiểu bằng tiếng Việt:";
        return await aiService.askGemini(prompt, text);
    }
};
