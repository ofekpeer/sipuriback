export function parseJSON(text) {

    try {

        const cleaned = text

            .replace(/```json/g, "")

            .replace(/```/g, "")

            .trim();

        return JSON.parse(cleaned);

    }

    catch (err) {

        throw new Error("OpenAI returned invalid JSON.");

    }

}