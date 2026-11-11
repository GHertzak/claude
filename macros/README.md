# Macro Snap

Take a photo of your food and it logs **calories, protein, carbs and fat**. That's all it does.

It's a web app you add to your phone's home screen, so it opens full screen like a regular app.
Photos are analyzed by Claude (Anthropic's vision model) using a dietitian-style method.

## How the accuracy works

Photo calorie apps like CalAI get their accuracy from a strong vision model plus a disciplined
estimation method. This app does the same:

1. **Itemizes the plate.** A burrito bowl becomes rice, chicken, beans, cheese, guac and so on,
   so each part gets its own portion and nutrition values.
2. **Counts hidden calories.** Cooking oil, butter, dressings, sauces and sugary drinks are the
   biggest source of under-counting. They're added as separate items when they're likely there.
3. **Estimates weight in grams using scale cues.** It uses the plate (26–28 cm), fork, hand,
   can and so on, and looks at food height, not just area.
4. **Uses real reference data per 100 g.** It reads nutrition labels exactly when one is visible,
   uses published chain-restaurant nutrition when it recognizes the item, and otherwise uses
   USDA-style values for the food *as cooked*.
5. **Checks the math.** The model confirms calories ≈ 4P + 4C + 9F for each item, and the server
   (not the model) multiplies grams × per-100 g values, so totals are always consistent.
6. **Asks only when it matters.** If one answer would swing calories by about 20% or more
   (regular vs. diet soda, whole vs. skim milk), it asks. Type the answer into the comment and tap
   Re-analyze.

You can adjust the grams on any item before logging (+/− buttons step about 10%), delete items,
or add one by hand. You can also skip the photo and just describe what you ate.

**Tips for the best numbers:** shoot from about a 45° angle with the whole plate and a fork or
your hand in frame. After you take the photo, the app waits so you can add a short comment for
anything the camera can't see ("cooked in butter", "dressing on the side", "ate half") before
tapping **Analyze photo**. Leave it blank and tap Analyze if there's nothing to add.

## Run it locally

You need Node.js 20+ and an Anthropic API key (https://console.anthropic.com).

```bash
cd macros
npm install
ANTHROPIC_API_KEY=sk-ant-... APP_PASSWORD=pick-something npm start
```

Open http://localhost:3000.

## Put it on your phone

It needs to run somewhere your phone can reach over HTTPS. The easiest options:

**Railway / Render / Fly.io (about 5 minutes)**
1. Push this repo to GitHub (already done if you're reading this there).
2. Create a new web service from the repo with the root directory set to `macros`.
   Build command `npm install`, start command `npm start`.
3. Set environment variables:
   - `ANTHROPIC_API_KEY`: your key
   - `APP_PASSWORD`: any password (stops strangers spending your API credits)
   - `DATA_DIR`: the path of a **persistent volume/disk** (e.g. `/data`). Without one, most hosts
     wipe your log on every redeploy.
4. Open the URL on your phone:
   - **iPhone (Safari):** Share → Add to Home Screen
   - **Android (Chrome):** ⋮ menu → Add to Home screen / Install app
5. Tap ⚙︎ in the app and enter your password once; it's remembered on that device.

## Settings

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic API key |
| `APP_PASSWORD` | none | Password required for all API calls. Set this when deployed. |
| `DATA_DIR` | `./data` | Where the log (`log.json`) is stored |
| `PORT` | `3000` | Port to listen on |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Model used for photo analysis |
| `CLAUDE_EFFORT` | `high` | How hard the model thinks (`low`, `medium`, `high`, `xhigh`, `max`). Higher is slower and costs more. |

**Cost:** each photo is one API call, roughly a few cents at the default settings. Logging,
editing and viewing are free.

If the model ever declines a request, the API automatically retries it on a fallback model
(server-side `fallbacks: "default"`).

## Data

Everything lives in one JSON file (`DATA_DIR/log.json`): your entries, each item's grams and
per-100 g values, and a small thumbnail of the photo. Full photos aren't stored. Download a CSV
anytime from ⚙︎ → Download CSV.

## Files

- `server.js`: Express server (API, storage, password check)
- `analyze.js`: the Claude prompt, output schema and macro math
- `public/`: the phone app (plain HTML/CSS/JS, no build step)
