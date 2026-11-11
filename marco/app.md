# The app: Macro Snap

Marco owns this app: he keeps it working, fixes bugs, and ships improvements the client
asks for or agrees to.

## Where it lives
- **Live app (primary):** Claude Artifact at https://claude.ai/artifact/JQagQcCB77r99wYQwXqVZt
  (private to the client). Source: `macros/artifact/macro-snap.html`.
- **Fallback:** Node web app in `macros/` (`server.js`, `analyze.js`, `public/`). Not
  deployed. Use only if the artifact stops working; see `macros/README.md`.

## How the artifact works
- Declared capabilities: `{"sample": {"images": true}, "db": {}, "user": {}}`.
  Republishing must keep all three, or photos/saving break.
- Snap flow: picking a photo opens the review screen and **waits**. The client can type an
  optional comment (or tap quick-comment chips like "Ate half", "Dressing on the side"),
  retake/change the photo, then tap **Analyze photo**. An empty comment is one tap. The
  comment goes into the prompt as the user's note and is saved as the entry's `note`
  (shown in italics under the meal name). Retaking keeps the typed comment.
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

## Reading the client's data
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
1. Edit `macros/artifact/macro-snap.html`.
2. Check the page script parses (extract the `<script>` and run `node --check`), and take
   one phone-width screenshot if anything visual changed.
3. Publish: in a new conversation, `Artifact` `read` the URL first, then publish with
   `url` set to the URL and `file_path` set to the source file. Omit `icon` and
   `capabilities` unless they change (omitting keeps the stored ones).
4. Commit and push the source so the repo matches what's live.

## Known issues / backlog
- Done 2026-11-11: "comment before analyzing" shipped. Live artifact republished as
  version 2 (id `1794421318-c987`), capabilities `sample` (images), `db`, `user` kept.
- Main view is narrower than the review view at phone width (`#mainView.wrap` shrink-wraps
  inside the outer flex column). Cosmetic; fix with `width: 100%` on the inner `.wrap`.
- Goals are read once at page load (`profileRef().get()`), so goal changes made from
  outside the page show only after reopening. Fix: switch to `onSnapshot`.
- No weight or waist tracking. The client reports these in chat; Marco records them in
  `marco/checkins.md`. Possible feature: a weekly weigh-in field stored at
  `data/users/<id>/profile/weights/<YYYY-MM-DD>`.
- Logging a meal to a past date uses the date shown in the header; there's no way to
  move a meal between days.
- Ideas the client may want: favorite/repeat meals (his lunches repeat), a "protein left
  today" hint, weekly averages view.
