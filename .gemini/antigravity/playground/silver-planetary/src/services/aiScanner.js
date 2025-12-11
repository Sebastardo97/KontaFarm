
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const analyzeProductImage = async (base64Image) => {
    // 1. Check API Key
    if (!API_KEY) {
        throw new Error("ERROR: Falta la API KEY (VITE_GEMINI_API_KEY) en .env. El servidor debe reiniciarse para cargarla.");
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Remove header from base64 if present
        const base64Data = base64Image.split(',')[1];

        const prompt = `
            Analyze this image of a pharmaceutical product package. 
            Extract the following details into a JSON object. 
            If a field is not found or unclear, return null.
            
            Fields:
            - code (barcode number if visible)
            - name (Generic name of the drug, e.g. Acetaminophen)
            - commercial_name (Brand name, e.g. Tylenol)
            - concentration (e.g. 500mg, 10ml)
            - presentation (e.g. Tableta, Jarabe, Caja x 10)
            - lab (Laboratory name)
            - sanitary_register (Reg San, INVIMA...)
            - lot (Lot number, Lote, Batch)
            - expiry_date (Expiration date in YYYY-MM-DD format. If only MM/YY is found, assume last day of month)
            
            Return ONLY the valid JSON string, no markdown formatting.
        `;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if the model adds them
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        // THROW RAW ERROR for debugging
        throw new Error(`Detalle Técnico: ${error.message || error.toString()}`);
    }
};
