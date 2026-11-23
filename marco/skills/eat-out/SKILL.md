---
name: eat-out
description: Tell Greg what to order (tonight, at a named restaurant, or for a craving) so the day still hits protein and calories. Use for "what can I get", "I'm craving X", "I'm at Y, what should I order", or any meal-out decision.
---

# Eat out and still hit the numbers

Greg coaches to **protein and calories only**. Carbs and fat are guides. Lead with what
is left today, then give orders he can actually say at the counter.

## 1. Find what is left today
- "Today" = `TZ=America/Chicago date +%F`, not the container date (UTC runs ahead in the evening).
- Pull today's day doc (and goals) per "Reading the client's data" in
  `marco/memory/app.md`. Remaining = goals − logged.
- Check if the log looks complete. Missing lunch = ask, do not plan on a phantom budget.
- Note the weekday. Weekends = family dinner out; drinks were week 1's whole overage
  (~100 kcal per shot of tequila). Mention it once if drinks are likely.

## 2. Get real numbers before giving any
- Check `marco/memory/profile.md` first: official numbers for his regular spots live there.
- Otherwise find the chain's published nutrition (WebSearch, then the PDF or page).
- **PDFs:** the web-fetch agent returns compressed PDF bytes it cannot read. Take the saved
  file path from the harness note and run `pdftotext -layout <file> -` in Bash.
- No published data (local spot, Picnik): estimate, and say it is an estimate.
- Save any new official numbers to the profile (one compact line per chain) and cite the URL.

## 3. Build the order; don't only list menu items
Greg's feedback (2026-11-22): "give good suggestions, like remove cheese or sauce."
A list of standard menu items is not enough. Work out what each change saves and
combine them. The levers:

| Lever | Typical effect | How to get the number |
|---|---|---|
| Lettuce wrap / no bun | −120 to −180 kcal, −18 to −45 g carbs | Item minus its lettuce-wrap version |
| Drop cheese | −70 kcal per American slice, −4 g P | Cheeseburger minus hamburger |
| Hold sauce / mayo / queso | −40 to −100+ kcal | Rarely published; estimate and say so |
| Double the protein | +20 to +30 g P per extra patty or chicken | Double vs single, or his double-chicken hack |
| Two small items instead of one big one | More food, same protein | E.g. hamburger + grilled chicken |
| Split or skip the side | Fries ≈ 350–500 kcal; half with family | Published side numbers |

Derive the per-component numbers from the chain's own pairs (single vs double,
with vs without cheese, bun vs lettuce wrap) and say which are official and which are estimates.

## 4. Present it
- One line: what is left (kcal / protein).
- Table: order | dinner kcal / P | **day total** kcal / P, with ✅ when both goals hit.
  Show 3–4 builds that trade differently (more food, fries kept, bun kept).
- Table of what each change saves (official vs estimate).
- **A single pick with the reason.** Keep what makes the food worth eating (e.g. the burger's
  sauce) and cut elsewhere. No moralizing: fries are a budget line, not a sin.
- Tell him what to write in the log note (restaurant + changes) so the photo estimate is tight.
- Short. No more than he needs at the counter.

## Do not
- Do not quote chain numbers from memory as if checked. If you could not check, say "±10%,
  from memory" and offer to verify.
- Do not suggest a shake or a third meal he did not ask for unless protein is far short.
