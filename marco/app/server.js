import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeMeal, computeItem, computeTotals } from "./analyze.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "log.json");
const APP_PASSWORD = process.env.APP_PASSWORD || "";

const DEFAULT_GOALS = { calories: 2200, protein_g: 160, carbs_g: 220, fat_g: 70 };

// ---------- tiny JSON-file store (one user, so this is plenty) ----------
let db = { entries: [], goals: DEFAULT_GOALS };
let writeChain = Promise.resolve();

async function loadDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    db = { entries: [], goals: DEFAULT_GOALS, ...JSON.parse(await fs.readFile(DB_FILE, "utf8")) };
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

function saveDb() {
  writeChain = writeChain.then(async () => {
    const tmp = `${DB_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db));
    await fs.rename(tmp, DB_FILE);
  });
  return writeChain;
}

// ---------- app ----------
const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Simple shared-password gate so strangers can't spend your API credits.
app.use("/api", (req, res, next) => {
  if (!APP_PASSWORD) return next();
  const given = req.get("x-app-password") || "";
  const a = Buffer.from(given);
  const b = Buffer.from(APP_PASSWORD);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  res.status(401).json({ error: "Wrong or missing password" });
});

const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

app.post("/api/analyze", async (req, res) => {
  const { image, note = "" } = req.body || {};
  let imageBase64, mediaType;
  if (image) {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(image);
    if (!m) return res.status(400).json({ error: "Image must be a JPEG, PNG, WebP or GIF data URL" });
    [, mediaType, imageBase64] = m;
  }
  if (!imageBase64 && !String(note).trim()) {
    return res.status(400).json({ error: "Send a photo, a description, or both" });
  }
  try {
    res.json(await analyzeMeal({ imageBase64, mediaType, note: String(note) }));
  } catch (err) {
    console.error("analyze failed:", err);
    res.status(502).json({ error: err.message || "Analysis failed" });
  }
});

app.get("/api/day/:date", (req, res) => {
  const { date } = req.params;
  if (!isDate(date)) return res.status(400).json({ error: "Bad date" });
  const entries = db.entries.filter((e) => e.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json({ date, entries, totals: computeTotals(entries.map((e) => e.totals)), goals: db.goals });
});

app.post("/api/entries", async (req, res) => {
  const { date, meal_name, items, thumb, note } = req.body || {};
  if (!isDate(date) || !Array.isArray(items)) return res.status(400).json({ error: "Need a date and items" });
  // Recompute every number server-side from grams x per-100 g; never trust client totals.
  const clean = items.map((it) =>
    computeItem({ name: String(it.name || "Food").slice(0, 120), grams: it.grams, per_100g: it.per_100g }),
  );
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    date,
    meal_name: String(meal_name || "Meal").slice(0, 120),
    note: String(note || "").slice(0, 500),
    thumb: typeof thumb === "string" && thumb.startsWith("data:image/") && thumb.length < 60_000 ? thumb : null,
    items: clean,
    totals: computeTotals(clean),
  };
  db.entries.push(entry);
  await saveDb();
  res.status(201).json(entry);
});

app.delete("/api/entries/:id", async (req, res) => {
  const before = db.entries.length;
  db.entries = db.entries.filter((e) => e.id !== req.params.id);
  if (db.entries.length === before) return res.status(404).json({ error: "Not found" });
  await saveDb();
  res.status(204).end();
});

app.get("/api/goals", (_req, res) => res.json(db.goals));

app.put("/api/goals", async (req, res) => {
  const g = req.body || {};
  const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : d);
  db.goals = {
    calories: num(g.calories, db.goals.calories),
    protein_g: num(g.protein_g, db.goals.protein_g),
    carbs_g: num(g.carbs_g, db.goals.carbs_g),
    fat_g: num(g.fat_g, db.goals.fat_g),
  };
  await saveDb();
  res.json(db.goals);
});

// Export everything as CSV (one row per food item).
app.get("/api/export.csv", (_req, res) => {
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [["date", "time", "meal", "item", "grams", "calories", "protein_g", "carbs_g", "fat_g"].join(",")];
  for (const e of db.entries) {
    for (const it of e.items) {
      rows.push(
        [e.date, e.createdAt, esc(e.meal_name), esc(it.name), it.grams, it.calories, it.protein_g, it.carbs_g, it.fat_g].join(","),
      );
    }
  }
  res.type("text/csv").attachment("macros.csv").send(rows.join("\n"));
});

await loadDb();
app.listen(PORT, () => {
  console.log(`Macro Snap running on http://localhost:${PORT}`);
  if (!APP_PASSWORD) console.warn("APP_PASSWORD is not set: anyone who finds this URL can use your API key.");
});
