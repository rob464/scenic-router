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
      naturalHighlightsCount = 0,
      coastalHighlightsCount = 0
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
                "You write short, warm, natural, friendly route explanations for a scenic driving app. " +
                "The first sentence must begin in a style like: 'On your way to [destination], why not visit...', " +
                "'On your way to [destination], stop by...', or 'On your way to [destination], take a look at...'. " +
                "Use the actual destination provided in the facts. " +
                "Sound like a helpful travel companion. " +
                "Use only the facts provided. Do not invent landmarks, roads, exits, or scenery. " +
                "When mentioning a landmark, include its location context naturally if one is provided, " +
                "for example: 'the Garden of Remembrance at Parnell Square in Dublin'. " +
                "Prefer natural scenery over commercial attractions. " +
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
                naturalHighlightsCount,
                coastalHighlightsCount
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
      (
        data.output_text ||
        (Array.isArray(data.output)
          ? data.output
              .flatMap(item => Array.isArray(item.content) ? item.content : [])
              .filter(c => c && c.type === "output_text" && c.text)
              .map(c => c.text)
              .join(" ")
          : "")
      ).trim();

    return res.status(200).json({
      explanation:
        text ||
        `On your way to ${destination || "your destination"}, why not stop by a few scenic highlights and spend less time on motorway-heavy sections?`
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err?.message || String(err)
    });
  }
}
