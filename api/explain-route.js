export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const {
      origin,
      destination,
      motorwaySharePercent,
      motorwayExitInstruction,
      scenicHighlights = [],
      failteHighlights = [],
      quietRoadInstruction,
      naturalHighlightsCount = 0
    } = req.body || {};

    const payload = {
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                 "You write short, natural, friendly route explanations for a scenic driving app. " +
  "Use only the facts provided. Do not invent landmarks, roads, exits, or scenery. " +
  "Prefer natural scenery over commercial attractions. " +
  "Write in a warm human tone, like a helpful travel companion. " +
  "Keep the answer to 2-4 sentences, under 110 words."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                origin,
                destination,
                motorwaySharePercent,
                motorwayExitInstruction,
                scenicHighlights,
                failteHighlights,
                quietRoadInstruction,
                naturalHighlightsCount
              })
            }
          ]
        }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: "OpenAI request failed",
        details: data
      });
    }

    const text =
      data.output_text ||
      data.output?.flatMap(item => item.content || [])
        ?.filter(c => c.type === "output_text")
        ?.map(c => c.text)
        ?.join(" ")
        ?.trim() ||
      "";

    return res.status(200).json({
      explanation: text || "This route was chosen because it stays closer to scenic highlights and spends less time on motorway-heavy sections."
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err?.message || String(err)
    });
  }
}
