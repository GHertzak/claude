// Turns a food photo (and/or a text note) into itemized macros using Claude vision.
//
// Accuracy strategy (what apps like CalAI do under the hood):
//   1. A strong vision model, prompted to reason like a dietitian.
//   2. Portion estimation in GRAMS using scale cues in the photo (plate, fork, hand, can).
//   3. Nutrition per 100 g from reference data / labels / chain menus, never "guessed totals".
//   4. Explicit accounting for hidden calories (oil, butter, dressings, sugary drinks).
//   5. Arithmetic done here in code, not by the model, so totals are always consistent.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const EFFORT = process.env.CLAUDE_EFFORT || "high";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a registered dietitian who specializes in estimating nutrition from meal photos. Your estimates are used to log calories, protein, carbs and fat, so accuracy matters more than speed. Work through the meal carefully before answering.

Method:
1. Inventory. Identify every distinct food and drink that will be eaten. Split composed dishes into components when that improves accuracy (a burrito bowl becomes rice, chicken, beans, salsa, cheese, guacamole, sour cream). Keep a single item for things with well-known whole values, such as a specific chain menu item or a packaged product.
2. Hidden calories. Add cooking oil, butter, dressing, sauces, cheese, and sugar in drinks as separate items when they are likely present. Restaurant and pan-cooked food almost always has added fat; glossy surfaces, browning and pooled sauce are clues. Do not invent added fat for food that looks plainly steamed, raw or boiled.
3. Portion size. Estimate the edible weight in grams (exclude bones, peels, pits, shells and anything clearly not eaten). Use scale cues: dinner plate 26-28 cm across, side plate 18-20 cm, cereal bowl about 15 cm, dinner fork about 19 cm, teaspoon about 15 cm, standard 12 oz can 12 cm tall, adult hand about 8-9 cm wide, credit card 8.6 cm. Judge height and depth of the food, not only the area it covers. Use cooked weights for cooked food. Note which reference you used.
4. Nutrition per 100 g, as prepared. If a nutrition label is visible, read it exactly and convert to per 100 g using the stated serving weight. If the item is a recognizable brand or chain menu item, use its published nutrition. Otherwise use USDA FoodData Central style reference values for the food as prepared (for example "chicken breast, roasted" rather than raw).
5. Sanity check. For each item, per-100 g calories should be close to 4 x protein + 4 x carbs + 9 x fat (alcohol adds 7 kcal per gram; very high-fiber foods run slightly lower). Fix any values that do not reconcile.
6. Bias. Give your single most likely estimate, not the lowest plausible one. Photos tend to hide oil and underestimate depth, so do not shave portions.

The user's note, if any, overrides what the photo suggests (for example "I only ate half", "double chicken", "it was diet soda", "cooked in olive oil"). If there is no photo, estimate from the note alone using typical portions for anything not specified.

Only ask a clarifying question when a single answer would change total calories by roughly 20% or more (for example regular versus diet soda, whole milk versus skim, or whether a bowl is a full or half portion). Otherwise leave clarifying_question as an empty string.

If the image contains no food or drink, return an empty items list and say so in meal_name.

Write names in plain, short English ("Grilled chicken breast", "White rice", "Olive oil (cooking)").`;

const NUTRIENTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["calories", "protein_g", "carbs_g", "fat_g"],
  properties: {
    calories: { type: "number" },
    protein_g: { type: "number" },
    carbs_g: { type: "number" },
    fat_g: { type: "number" },
  },
};

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["meal_name", "items", "clarifying_question", "notes"],
  properties: {
    meal_name: { type: "string", description: "Short name for the meal, e.g. 'Chicken burrito bowl'" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "portion_description", "grams", "scale_reference", "per_100g", "source", "confidence"],
        properties: {
          name: { type: "string" },
          portion_description: { type: "string", description: "Human-friendly portion, e.g. '1 cup', '1 medium breast', '1 tbsp'" },
          grams: { type: "number", description: "Estimated edible weight in grams (use ml for drinks)" },
          scale_reference: { type: "string", description: "What in the photo was used to judge size" },
          per_100g: NUTRIENTS_SCHEMA,
          source: { type: "string", enum: ["nutrition_label", "brand_or_chain", "reference_database", "estimate"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    clarifying_question: { type: "string" },
    notes: { type: "string", description: "One or two sentences on key assumptions, e.g. hidden oil added" },
  },
};

const round1 = (n) => Math.round(n * 10) / 10;

/** Compute an item's macros from grams and per-100 g values. Used by the server for every save. */
export function computeItem(item) {
  const g = Math.max(0, Number(item.grams) || 0);
  const p = item.per_100g || {};
  const f = g / 100;
  return {
    ...item,
    grams: Math.round(g),
    calories: Math.round((Number(p.calories) || 0) * f),
    protein_g: round1((Number(p.protein_g) || 0) * f),
    carbs_g: round1((Number(p.carbs_g) || 0) * f),
    fat_g: round1((Number(p.fat_g) || 0) * f),
  };
}

export function computeTotals(items) {
  const t = items.reduce(
    (acc, it) => ({
      calories: acc.calories + it.calories,
      protein_g: acc.protein_g + it.protein_g,
      carbs_g: acc.carbs_g + it.carbs_g,
      fat_g: acc.fat_g + it.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  return {
    calories: Math.round(t.calories),
    protein_g: round1(t.protein_g),
    carbs_g: round1(t.carbs_g),
    fat_g: round1(t.fat_g),
  };
}

/**
 * @param {{ imageBase64?: string, mediaType?: string, note?: string }} input
 */
export async function analyzeMeal({ imageBase64, mediaType = "image/jpeg", note = "" }) {
  const content = [];
  if (imageBase64) {
    content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } });
  }
  const trimmed = note.trim();
  content.push({
    type: "text",
    text: trimmed
      ? `Estimate the nutrition for this meal. My note: ${trimmed}`
      : "Estimate the nutrition for this meal.",
  });

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // If the model ever declines a request, the API retries it on a fallback model server-side.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: {
      effort: EFFORT,
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined to analyze this image. Try another photo or describe the meal in the note.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The analysis was cut off. Please try again.");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No analysis returned.");
  const parsed = JSON.parse(textBlock.text);

  const items = parsed.items.map(computeItem);
  return {
    meal_name: parsed.meal_name,
    items,
    totals: computeTotals(items),
    clarifying_question: parsed.clarifying_question || "",
    notes: parsed.notes || "",
    model: response.model,
  };
}
