export default async function handler(req, res) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: req.body.model || "mistralai/mistral-7b-instruct",
        messages: req.body.messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message });
  }
}
