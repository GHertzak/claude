// Tests for the Quick add (frequent items) logic in macro-snap.html.
// Run: node macros/artifact/test-frequent.cjs
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert/strict");

const html = fs.readFileSync(path.join(__dirname, "macro-snap.html"), "utf8");
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const F = ctx.window.MacroSnapFrequent;

let n = 0;
const test = (name, fn) => { fn(); n++; console.log("ok -", name); };

// Entry builder in the stored shape: {id, t, meal_name, note, thumb, items, totals}
let seq = 0;
function entry(date, meal_name, items, thumb = null) {
  items = items.map(([name, grams, kcal100, p = 0, c = 0, f = 0]) => {
    const k = grams / 100;
    return { name, grams, per_100g: { calories: kcal100, protein_g: p, carbs_g: c, fat_g: f },
      calories: Math.round(kcal100 * k), protein_g: p * k, carbs_g: c * k, fat_g: f * k };
  });
  const totals = items.reduce((a, i) => ({ calories: a.calories + i.calories, protein_g: a.protein_g + i.protein_g,
    carbs_g: a.carbs_g + i.carbs_g, fat_g: a.fat_g + i.fat_g }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  return { id: String(++seq), t: `${date}T12:00:${String(seq % 60).padStart(2, "0")}.000Z`, meal_name, note: "", thumb, items, totals };
}
function days(list) {
  const d = {};
  for (const e of list) (d[e.t.slice(0, 10)] ||= []).push(e);
  return d;
}
const TODAY = "2026-11-13";

test("a food logged once does not qualify; twice does", () => {
  const one = days([entry("2026-11-12", "Protein shake, chocolate", [["Protein shake, chocolate", 330, 48, 9, 1.5, 0.9]])]);
  assert.equal(F.compute(one, TODAY).length, 0);
  const two = days([
    entry("2026-11-11", "Protein shake, chocolate", [["Protein shake, chocolate", 330, 48, 9, 1.5, 0.9]]),
    entry("2026-11-12", "Protein shake, chocolate", [["Protein shake, chocolate", 330, 48, 9, 1.5, 0.9]]),
  ]);
  const r = F.compute(two, TODAY);
  assert.equal(r.length, 1);
  assert.equal(r[0].count, 2);
});

test("slightly different names for the same packaged food are grouped", () => {
  const r = F.compute(days([
    entry("2026-11-11", "H-E-B 30g Protein Chocolate Nutritional Shake", [["H-E-B 30g protein chocolate shake", 330, 48.5, 9.1, 1.5, 0.9]]),
    entry("2026-11-12", "H-E-B 30g protein chocolate shake", [["H-E-B protein shake, chocolate, 30 g protein", 340, 47, 8.8, 1.5, 0.9]]),
  ]), TODAY);
  assert.equal(r.length, 1);
  assert.equal(r[0].count, 2);
});

test("brand prefix and portion words don't split a group", () => {
  const r = F.compute(days([
    entry("2026-11-10", "Sargento light string cheese", [["Light mozzarella string cheese", 21, 238, 28.6, 4.8, 11.9]]),
    entry("2026-11-11", "Light string cheese", [["Light string cheese (part-skim mozzarella)", 23, 195, 25, 2, 9.5]]),
    entry("2026-11-12", "Light string cheese", [["Light mozzarella string cheese", 28, 214, 25, 3.6, 10.7]]),
    entry("2026-11-10", "Shot of blanco tequila", [["Blanco tequila, 80 proof", 42, 231]]),
    entry("2026-11-10", "Shot of tequila", [["Tequila, 80 proof", 42, 231]]),
    entry("2026-11-11", "Espolon Blanco tequila, 3 shots", [["Tequila, Espolon Blanco (80 proof)", 126, 231]]),
  ]), TODAY);
  assert.equal(r.length, 2);
  const cheese = r.find((x) => /cheese/i.test(x.meal_name));
  const tequila = r.find((x) => /tequila/i.test(x.meal_name));
  assert.equal(cheese.count, 3);
  assert.equal(tequila.count, 3);
  // Typical portion is the median-calorie log: one shot, not three.
  assert.equal(tequila.totals.calories, 97);
});

test("different foods stay apart", () => {
  const r = F.compute(days([
    entry("2026-11-10", "H-E-B Cafeccino cappuccino protein shake", [["H-E-B Cafeccino protein shake, cappuccino", 230, 58, 4.35, 4.35, 2.6]]),
    entry("2026-11-11", "H-E-B 30g Protein Chocolate Nutritional Shake", [["H-E-B 30g protein chocolate shake", 330, 48.5, 9.1, 1.5, 0.9]]),
    entry("2026-11-10", "Velvet Taco rotisserie chicken bowl", [["Basmati rice", 200, 150, 3, 30, 2], ["Rotisserie chicken", 120, 187, 27, 0.5, 8.5]]),
    entry("2026-11-11", "Baked chicken, rice and slaw bowl", [["Chicken breast, baked", 120, 165, 31, 0, 3.6], ["White rice, steamed", 170, 130, 2.7, 28.2, 0.3]]),
  ]), TODAY);
  assert.equal(r.length, 0);
});

test("very different calorie density keeps similar names apart", () => {
  const r = F.compute(days([
    entry("2026-11-11", "Chicken breast, grilled", [["Chicken breast, grilled", 150, 165, 31, 0, 3.6]]),
    entry("2026-11-12", "Chicken breast, fried", [["Chicken breast, fried, breaded", 150, 290, 24, 12, 16]]),
  ]), TODAY);
  assert.equal(r.length, 0);
});

test("30-day window: foods not logged in the last 30 days drop off", () => {
  const shake = (d) => entry(d, "Protein shake", [["Protein shake", 330, 48, 9, 1.5, 0.9]]);
  // Window for 2026-11-13 is 2026-10-15 .. 2026-11-13 (30 days including today).
  assert.equal(F.cutoffDate(TODAY), "2026-10-15");
  const old = days([shake("2026-10-01"), shake("2026-10-05"), shake("2026-10-14")]);
  assert.equal(F.compute(old, TODAY).length, 0, "all logs older than 30 days");
  const edge = days([shake("2026-10-15"), shake("2026-11-01")]);
  assert.equal(F.compute(edge, TODAY).length, 1, "a log exactly 30 days back still counts");
});

test("an item that dropped off comes back once it repeats again in the window", () => {
  const shake = (d) => entry(d, "Protein shake", [["Protein shake", 330, 48, 9, 1.5, 0.9]]);
  const d = days([shake("2026-09-01"), shake("2026-09-02"), shake("2026-09-03"), shake("2026-11-10")]);
  assert.equal(F.compute(d, TODAY).length, 0, "one recent log is not enough; old ones don't count");
  (d["2026-11-12"] ||= []).push(shake("2026-11-12"));
  const r = F.compute(d, TODAY);
  assert.equal(r.length, 1);
  assert.equal(r[0].count, 2, "only the in-window logs are counted");
});

test("future-dated documents are ignored", () => {
  const shake = (d) => entry(d, "Protein shake", [["Protein shake", 330, 48, 9, 1.5, 0.9]]);
  assert.equal(F.compute(days([shake("2026-11-12"), shake("2026-11-20")]), TODAY).length, 0);
});

test("ranking: most logged first, then most recent; capped at 12", () => {
  const list = [];
  const foods = ["Oatmeal packet", "Protein chips", "Greek yogurt", "Turkey jerky", "Banana", "Apple",
    "Almonds", "Rice cakes", "Cottage cheese", "Tuna pouch", "Egg bites", "Beef sticks", "Hummus cup", "Pickles"];
  foods.forEach((name, i) => {
    const kcal = 50 + i * 37;   // distinct densities so nothing merges by accident
    list.push(entry("2026-11-10", name, [[name, 100, kcal]]), entry("2026-11-11", name, [[name, 100, kcal]]));
  });
  list.push(entry("2026-11-12", "Pickles", [["Pickles", 100, 50 + 13 * 37]]));
  const r = F.compute(days(list), TODAY);
  assert.equal(r.length, 12);
  assert.equal(r[0].meal_name, "Pickles");
  assert.equal(r[0].count, 3);
});

test("quick-logged entries (with a servings prefix) still group with the original", () => {
  const base = [["Kodiak oatmeal, maple brown sugar, dry", 65, 369, 30.8, 49.2, 6.2]];
  const r = F.compute(days([
    entry("2026-11-11", "Kodiak oatmeal (1 packet)", base),
    entry("2026-11-12", "2 × Kodiak oatmeal (1 packet)", [["Kodiak oatmeal, maple brown sugar, dry", 130, 369, 30.8, 49.2, 6.2]]),
  ]), TODAY);
  assert.equal(r.length, 1);
  assert.equal(r[0].count, 2);
});

test("scaleItems scales grams only; servingsLabel formats halves", () => {
  const items = [{ name: "Tequila", grams: 42, per_100g: { calories: 231, protein_g: 0, carbs_g: 0, fat_g: 0 }, calories: 97 }];
  const s = F.scaleItems(items, 1.5);
  assert.equal(s[0].grams, 63);
  assert.deepEqual({ ...s[0].per_100g }, { calories: 231, protein_g: 0, carbs_g: 0, fat_g: 0 });
  assert.equal(items[0].grams, 42, "template is not mutated");
  assert.equal(F.servingsLabel(1), "");
  assert.equal(F.servingsLabel(0.5), "½ × ");
  assert.equal(F.servingsLabel(1.5), "1½ × ");
  assert.equal(F.servingsLabel(3), "3 × ");
});

test("tolerates malformed entries", () => {
  const d = { "2026-11-12": [null, {}, { items: [] }, { meal_name: "x", items: [{ name: "x", grams: 1 }] }] };
  assert.equal(F.compute(d, TODAY).length, 0);
  assert.equal(F.compute({}, TODAY).length, 0);
});

console.log(`\n${n} tests passed`);
