#!/usr/bin/env python3
"""Summarize the Macro Snap log that ArtifactData saved to disk.

Marco downloads the log with ArtifactData (out_dir=<DIR>), then runs:

    python3 -I marco/tools/summarize.py <DIR> [--days 14]

<DIR> is the out_dir root; the script looks for
<DIR>/data/users/me/profile.json and <DIR>/data/users/me/profile/days/*.json.
It never prints photo thumbnails, so the output stays small.
"""
import argparse
import json
import pathlib
import sys
from datetime import date, timedelta

KEYS = ("calories", "protein_g", "carbs_g", "fat_g")


def load(path):
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--days", type=int, default=14, help="how many recent calendar days to show")
    args = ap.parse_args()

    root = pathlib.Path(args.dir) / "data" / "users" / "me"
    profile = load(root / "profile.json") or {}
    goals = profile.get("goals") or {}
    days = {}
    for f in sorted((root / "profile" / "days").glob("*.json")):
        d = load(f)
        if d and isinstance(d.get("entries"), list):
            days[d.get("date", f.stem)] = d["entries"]

    if not days:
        print("No logged days found under", root)
        return 1

    last = max(date.fromisoformat(k) for k in days)
    start = last - timedelta(days=args.days - 1)

    print("GOALS:", ", ".join(f"{k} {goals.get(k, '?')}" for k in KEYS))
    print()
    print(f"{'date':<11}{'meals':>6}{'kcal':>7}{'P':>6}{'C':>6}{'F':>6}  notes")
    logged = []
    for i in range(args.days):
        d = (start + timedelta(days=i)).isoformat()
        entries = days.get(d)
        if not entries:
            print(f"{d:<11}{'-':>6}  (nothing logged)")
            continue
        t = {k: sum(float(e.get("totals", {}).get(k, 0)) for e in entries) for k in KEYS}
        logged.append((d, t, entries))
        notes = []
        if goals.get("protein_g") and t["protein_g"] < goals["protein_g"] * 0.9:
            notes.append(f"protein short {round(goals['protein_g'] - t['protein_g'])}g")
        if goals.get("calories") and t["calories"] > goals["calories"] * 1.1:
            notes.append(f"over by {round(t['calories'] - goals['calories'])} kcal")
        if len(entries) == 1:
            notes.append("only 1 entry, may be incomplete")
        print(f"{d:<11}{len(entries):>6}{round(t['calories']):>7}{round(t['protein_g']):>6}"
              f"{round(t['carbs_g']):>6}{round(t['fat_g']):>6}  {'; '.join(notes)}")

    if logged:
        n = len(logged)
        avg = {k: sum(t[k] for _, t, _ in logged) / n for k in KEYS}
        print()
        print(f"AVERAGE over {n} logged day(s): " + ", ".join(f"{k} {round(avg[k])}" for k in KEYS))
        if goals.get("protein_g"):
            hit = sum(1 for _, t, _ in logged if t["protein_g"] >= goals["protein_g"] * 0.9)
            print(f"Protein within 10% of goal on {hit}/{n} days")
        if goals.get("calories"):
            hit = sum(1 for _, t, _ in logged if t["calories"] <= goals["calories"] * 1.05)
            print(f"Calories at or under goal (+5%) on {hit}/{n} days")

        meals = [(e.get("totals", {}).get("calories", 0), d, e) for d, _, es in logged for e in es]
        meals.sort(key=lambda m: m[0], reverse=True)
        print()
        print("BIGGEST MEALS (kcal / protein g):")
        for kcal, d, e in meals[:5]:
            tot = e.get("totals", {})
            note = f'  note: "{e["note"]}"' if e.get("note") else ""
            print(f"  {d}  {e.get('meal_name', 'Meal')[:50]:<50} {round(kcal):>5} / {round(tot.get('protein_g', 0))}{note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
