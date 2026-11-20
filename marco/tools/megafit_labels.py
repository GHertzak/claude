"""Parse Megafit product pages into Macro Snap known-food records.

Refresh steps (run from a scratch dir <d>, not the repo):
  1. Catalog: curl "https://megafitmeals.com/wp-json/wc/store/v1/products?per_page=50&page=N" (N=1..4)
     -> keep products in category "Meals" that are purchasable, minus "custom-meal";
     save as <d>/meals.json: [{slug, name, url, buy, cats}].
  2. Pages: curl each url into <d>/pages/<slug>.html.
  3. python3 -I marco/tools/megafit_labels.py <d>  -> <d>/foods.json + a problems list.
  4. Write each record (minus id/fiber, plus source/checked date) to
     data/users/me/profile/foods/<id> with ArtifactData batch (50 per batch).
Labels are per serving; sauce cups are separate and NOT included in the meal label.
"""
import html, json, re, sys
from pathlib import Path

d = Path(sys.argv[1])
meals = {m["slug"]: m for m in json.load(open(d / "meals.json")) if m["buy"]}

def text(s):
    s = re.sub(r"<style.*?</style>|<script.*?</script>", " ", s, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()

def grab(t, pat):
    m = re.search(pat, t, re.I)
    return float(m.group(1)) if m else None

def label(t):
    sm = re.search(r"Serving Size\s+(.*?)\s+Servings Per Container\s+([\d.]+)", t, re.I)
    serving = sm.group(1).strip() if sm else None
    grams = None
    if serving:
        g = re.search(r"([\d.]+)\s*g\b", serving); oz = re.search(r"([\d.]+)\s*oz\b", serving, re.I)
        grams = round(float(g.group(1))) if g else round(float(oz.group(1)) * 28.35) if oz else None
    return {
        "serving": serving, "grams": grams,
        "servings_per_container": float(sm.group(2)) if sm else None,
        "calories": grab(t, r"Calories\s+([\d.]+)"),
        "protein_g": grab(t, r"Protein\s+([\d.]+)\s*g"),
        "carbs_g": grab(t, r"Total carbohydrate\s+([\d.]+)\s*g"),
        "fat_g": grab(t, r"Total Fat\s+([\d.]+)\s*g"),
        "fiber_g": grab(t, r"Dietary Fiber\s+([\d.]+)\s*g"),
    }

out, problems = [], []
for slug, m in meals.items():
    f = d / "pages" / f"{slug}.html"
    if not f.exists():
        problems.append((slug, "no page")); continue
    raw = f.read_text(errors="replace")
    tables = re.findall(r'<table class="wnfl-table">(.*?)</table>', raw, re.S)
    if not tables:
        problems.append((slug, "no label")); continue
    main = label(text(tables[0]))
    sauce_names = [text(x) for x in re.findall(r"Sauce cup nutrition.*?</[^>]+>\s*(?:<[^>]+>\s*)*([^<]{2,60})<", raw, re.S)]
    sauces = []
    for i, tb in enumerate(tables[1:]):
        s = label(text(tb)); s["name"] = sauce_names[i] if i < len(sauce_names) else "Sauce"
        sauces.append(s)
    cond_excluded = "not included in nutrition facts" in raw.lower()
    rec = {"id": f"megafit-{slug}", "brand": "Megafit Meals", "name": m["name"], "url": m["url"],
           **main, "sauces": sauces, "sauce_in_label": not cond_excluded if sauces else None}
    if None in (main["calories"], main["protein_g"], main["carbs_g"], main["fat_g"]):
        problems.append((slug, f"incomplete {main}"))
    else:
        kcal = 4 * main["protein_g"] + 4 * (main["carbs_g"] - 0.5 * (main["fiber_g"] or 0)) + 9 * main["fat_g"]
        if abs(kcal - main["calories"]) > 0.15 * main["calories"]:
            problems.append((slug, f"4/4/9 mismatch: label {main['calories']} vs {kcal:.0f}"))
    out.append(rec)

json.dump(out, open(d / "foods.json", "w"), indent=1)
print(len(out), "records;", len(problems), "problems")
for p in problems: print(" ", *p)
