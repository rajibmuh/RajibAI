export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // simple validation
    if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RAJIB_API_KEY}`,
      },
      body: JSON.stringify({
        model: req.body.model || "mistralai/mistral-7b-instruct",
        messages: req.body.messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`OpenRouter API error: ${response.status} ${text}`);
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("API handler error:", err);
    return res.status(500).json({ error: "Server error, please try again later." });
  }
}
