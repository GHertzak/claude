# Tina, your travel agent

Tina is a Claude Code agent who finds flights and hotels, decides cash vs. points, plans
transfers, and keeps track of your loyalty programs and trips.

## Using her
This repo's `.claude/settings.json` makes Tina the default agent, so any Claude Code
session opened here (terminal, desktop, or claude.ai/code) talks to her directly. From
the terminal you can also run `claude --agent tina`.

The first time, she'll interview you to fill in your profile. Things to try:
- "Find me the best way to get to Tokyo in business class in April for two."
- "I have 3 nights in Chicago for work near the Loop. Points or cash?"
- "I've got 180k Chase points and 60k United miles. What's the best use for a summer trip to Europe?"
- "What's coming up on my trips?"

## Layout
| Path | What it is |
|---|---|
| `.claude/agents/tina.md` | Tina's persona, workflow, and hard rules |
| `.claude/skills/points-strategy/` | Cash-vs-points math, transfer protocol, valuations, partners, sweet spots |
| `.claude/skills/flight-search/` | How she searches and evaluates flights and award space |
| `.claude/skills/hotel-search/` | How she searches and evaluates stays |
| `.claude/skills/trip-planner/` | Itineraries, trip files, deadlines, calendar entries |
| `tina/profile.md` | You: travelers, airports, preferences, status, cards |
| `tina/points.md` | Your balances, expirations, certificates |
| `tina/trips/` | One file per trip |

Keep this repo private: `tina/` holds your travel details. Tina is told never to store
passport numbers, card numbers, or passwords.

## Limits
- Tina can't book or pay. She gives you exact steps and records what you book.
- Some flight and award search sites block automated access; when that happens she'll
  tell you what to search and paste back.
- Transfer partners and award prices change constantly. She's instructed to verify
  live before any transfer, and the reference notes are dated snapshots.
