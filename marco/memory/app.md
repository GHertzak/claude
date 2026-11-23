# The app: Macro Snap

Marco owns this app: he keeps it working, fixes bugs, and ships improvements the client
asks for or agrees to.

## Where it lives
- **Live app (primary):** Claude Artifact at https://claude.ai/artifact/JQagQcCB77r99wYQwXqVZt
  (private to the client). Source: `marco/app/artifact/macro-snap.html`.
- **Fallback:** Node web app in `marco/app/` (`server.js`, `analyze.js`, `public/`). Not
  deployed. Use only if the artifact stops working; see `marco/app/README.md`.

## How the artifact works
- Declared capabilities: `{"sample": {"images": true}, "db": {}, "user": {}}`.
  Republishing must keep all three, or photos/saving break.
- Photo analysis: `sample.json(prompt, {images, modelTier: "complex", effort: "high"})`.
  The dietitian prompt is in `buildPrompt()`. The page (not the model) does the
  grams × per-100 g math in `computeItem()`.
- Storage (per-user, private to the client):
  - Goals: `data/users/<id>/profile` → `{goals: {calories, protein_g, carbs_g, fat_g}}`
  - Log: `data/users/<id>/profile/days/<YYYY-MM-DD>` → `{date, entries: [...]}`.
    Each entry: `{id, t, meal_name, note, thumb, items: [{name, grams, per_100g, calories,
    protein_g, carbs_g, fat_g}], totals}`. One document per day keeps document counts low.
  - **Don't change these paths or shapes** without migrating existing data, or the
    client's history disappears from the app.

## Quick add (frequent items), live since 2026-11-13 (artifact version 3)
- "Quick add" button on the main view opens a bottom sheet of foods logged **at least twice in
  the last 30 days** (max 12; most logged first, then most recent). A food not logged in 30 days
  drops off; it returns once it is logged twice within a 30-day window again.
- **Add** logs one serving to the day being viewed in one tap (reuses the stored items, per-100 g
  values and thumbnail; no photo, no model call), with a 6-second Undo toast. Tapping a food
  opens a servings stepper (½ to 10, steps of ½; scales every item's grams) and **Edit items**,
  which opens the normal review screen prefilled so grams can be changed per item.
- Matching: name tokens from the meal name plus item names (lowercased, quantity/size/stop words
  and bare numbers dropped, crude singular), Jaccard ≥ 0.6, single-linkage, and calorie density
  (kcal/g) within 1.5× so grilled vs fried stay apart. The template is the median-calorie log.
- Data: no new storage. On load the page runs one query on `days` with `date >= today − 29`; the
  live day subscription keeps today current. Entries logged by Quick add have the same shape
  as any other entry; the meal name gets a "2 × " prefix when servings ≠ 1.
- Logic lives in its own `<script>` (`window.MacroSnapFrequent`); tests:
  `node marco/app/artifact/test-frequent.cjs`.

## Known foods (exact labels), live since 2026-11-20 (artifact version 4)
- Why: the analysis call (`sample.json`) has no web access, so a link in the note is just
  text. On 2026-11-20 a Megafit Cheeseburger Bowl with its URL was logged as a made-up dish
  (potatoes instead of jasmine rice; 564 kcal / 33 C / 29 F vs the label's 510 / 46 C / 17 F
  plus a 130 kcal Thavage sauce cup).
- Storage: `data/users/<id>/profile/foods/<id>`, one doc per item: `{brand, name, url, serving,
  grams, servings_per_container, calories, protein_g, carbs_g, fat_g, fiber_g, sauces: [{name,
  serving, grams, calories, protein_g, carbs_g, fat_g}], sauce_in_label, source, checked}`.
  Values are PER SERVING from the published label. `grams: null` = label gives pieces only
  ("1 Muffin"); the page then treats 100 g as 1 serving.
- Loaded: all 95 purchasable Megafit meals (2026-11-20). Refresh with
  `marco/tools/megafit_labels.py` (steps in its docstring). Other brands can use the same shape.
- Page: loads the collection once at boot (`foodsCol().limit(1000).get()`), puts a compact
  list (grams + per_100g, sauce cups) into `buildPrompt()`, and tells the model to copy those
  numbers exactly on a match and add the sauce cup unless the note says it was skipped. Adds
  ~12 KB to each analysis prompt. The prompt also says links can't be opened and unknown brand
  items must be marked low confidence.
- Not verified end to end: the model call only runs inside claude.ai, so the first real Megafit
  log is the test. Check it.

## Reading the client's data
**Dates are Greg's local date (Austin, America/Chicago), not the container's UTC date.**
After ~6 pm Central the container already says tomorrow. Work out "today" with
`TZ=America/Chicago date +%F` before reading or writing a day doc. (Mistake on 2026-11-22:
logged a dinner to the next day.)
Use `ArtifactData` with the URL above. `me` resolves to the client's id.
1. `get` collection `data/users/me`, doc `profile` (goals).
2. `list` collection `data/users/me/profile/days` with `out_dir` set to the scratchpad
   (documents carry base64 thumbnails; don't pull them into context).
3. Save the profile with `out_dir` too, then run
   `python3 -I marco/tools/summarize.py <out_dir> --days 14`.

Writing: only goals, and only after the client says yes. Pin every write with
`if_version` from your last read. Never add, edit or delete logged meals unless the
client explicitly asks for that specific change.

## Shipping a change to the artifact
**2026-11-20:** it happened again in a different way. Quick add (version 3) was published
from branch `claude/relaxed-albattani-76yx39` and never merged, so master held the version-2
source. Fixed by restoring the live source to master. Always diff live vs repo before a publish.

Before publishing, compare the live page (`Artifact` `read` with `path: "index.html"`) with the
repo source. On 2026-11-13 the live page had changes that were never committed (comment chips,
Retake/Change photo, analyze only on tap, notes shown on meals). They were merged into the source
before the Quick add publish, so the repo matched live again.

1. Edit `marco/app/artifact/macro-snap.html`.
2. Check the page script parses (extract the `<script>` and run `node --check`), and take
   one phone-width screenshot if anything visual changed.
3. Publish: in a new conversation, `Artifact` `read` the URL first, then publish with
   `url` set to the URL and `file_path` set to the source file. Omit `icon` and
   `capabilities` unless they change (omitting keeps the stored ones).
4. Commit and push the source so the repo matches what's live.

## Known issues / backlog
- Goals are read once at page load (`profileRef().get()`), so goal changes made from
  outside the page show only after reopening. Fix: switch to `onSnapshot`.
- No weight or waist tracking. The client reports these in chat; Marco records them in
  `marco/memory/checkins.md`. Possible feature: a weekly weigh-in field stored at
  `data/users/<id>/profile/weights/<YYYY-MM-DD>`.
- Logging a meal to a past date uses the date shown in the header; there's no way to
  move a meal between days.
- Quick add follow-ups to consider: let him pin or hide items (needs a small per-user
  document), and a "protein left today" hint inside the sheet.
- Ideas the client may want: a "protein left today" hint, weekly averages view.
