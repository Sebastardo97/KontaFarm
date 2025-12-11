
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCciHAQTT4chEPMopvfXQF1NZ3JLzwG_1A";

async function check() {
    const genAI = new GoogleGenerativeAI(API_KEY);

    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-pro-vision",
        "gemini-1.0-pro-vision-latest"
    ];

    console.log("Checking API Key permissions...");

    for (const modelName of models) {
        try {
            console.log(`\nTesting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            // Simple prompt to test compatibility
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName} is working!`);
            console.log(`Response: ${response.text().substring(0, 50)}...`);
            return; // Exit after finding first working model
        } catch (error) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`Error: ${error.message}`);
        }
    }
}

check();
