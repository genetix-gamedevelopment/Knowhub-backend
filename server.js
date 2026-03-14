// -------------------------
// KnowHub AI Backend
// -------------------------

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Needed for Node 18+ environments like Replit

const app = express();

// Allow requests from any origin (so your frontend can call this backend)
app.use(cors());
app.use(express.json());

// -------------------------
// API Key
// -------------------------
// IMPORTANT: Do NOT hardcode your key here!
// Instead, set it as an environment variable in Replit (Secrets) called OPENROUTER_KEY
const API_KEY = process.env.OPENROUTER_KEY;

// -------------------------
// AI Endpoint
// -------------------------
app.post("/api/ask", async (req, res) => {
    const { message } = req.body;

    if (!message) return res.json({ reply: "No message provided" });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct",
                messages: [
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();

        console.log("FULL AI RESPONSE:", data);

        const reply = data?.choices?.[0]?.message?.content || "AI failed: check server console.";

        res.json({ reply });

    } catch (err) {
        console.error("Error calling AI:", err);
        res.json({ reply: "Server error." });
    }
});

// -------------------------
// Test Endpoint
// -------------------------
app.get("/", (req, res) => {
    res.send("KnowHub AI backend is running!");
});

// -------------------------
// Start Server
// -------------------------
// Replit automatically provides the port in process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});