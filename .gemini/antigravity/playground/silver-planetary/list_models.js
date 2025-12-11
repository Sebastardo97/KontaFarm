
import https from 'https';

const API_KEY = "AIzaSyCciHAQTT4chEPMopvfXQF1NZ3JLzwG_1A";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Response Status:", res.statusCode);
            if (json.error) {
                console.log("API Error:", JSON.stringify(json.error, null, 2));
            } else {
                console.log("Available Models:");
                if (json.models) {
                    json.models.forEach(m => {
                        if (m.supportedGenerationMethods.includes("generateContent")) {
                            console.log(`- ${m.name}`);
                        }
                    });
                } else {
                    console.log("No models found in response:", json);
                }
            }
        } catch (e) {
            console.error("Parse Error:", e);
            console.log("Raw Data:", data);
        }
    });
}).on('error', (err) => {
    console.error("Network Error:", err);
});
