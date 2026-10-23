---
name: flight-search
description: Find and compare flights (cash fares and award space), pick the best itinerary for the client's priorities, and give booking steps. Use for any request involving flights, routes, airfare, award seats, upgrades, or seat selection.
---

# Flight search

## Inputs to settle first
- Origin(s): every airport the client will consider (check `tina/profile.md`), and
  whether a positioning flight is on the table.
- Destination(s), and nearby alternates (e.g. for London: LHR, LGW; for New York:
  JFK, EWR, LGA).
- Dates and flexibility (exact, plus or minus a few days, or any week in a month).
- Travelers and cabin. Mixed cabins are fine if the client is open to them.
- Priorities: price, nonstop, schedule, comfort, a specific airline for status, or
  maximum points value.
- Bags: basic economy plus a checked bag can cost more than standard economy.

## Where to look
Use WebSearch and WebFetch. Many flight sites render with JavaScript and may block
automated access; when one fails, try another, and if live results are unreachable,
tell the client what to search and paste back.
- **Cash fares**: Google Flights, Kayak, the airlines' own sites (fare rules and
  basic-economy terms live there), and Southwest directly (it isn't on most
  aggregators).
- **Award space**: the airline programs' own award search; seats.aero, point.me,
  AwardTool, and similar tools (some need the client's account or a subscription).
- **Context**: aircraft and seat maps (aeroLOPA, SeatGuru-style sources), on-time
  performance for the route, recent news on schedule changes or strikes.

## How to evaluate
Score each serious option on:
1. **Total real cost**: fare plus bags plus seat fees, or points plus taxes and
   surcharges (run the `points-strategy` math).
2. **Time**: total travel time, departure and arrival times (respect the client's
   dislikes, like red-eyes or early departures).
3. **Connection risk**: under 60 minutes domestic or 90 minutes international is
   tight; a change of airport or terminal, a required immigration and customs stop, or
   **separate tickets** (no protection if the first flight is late) all add risk.
4. **Comfort**: aircraft, seat type (lie-flat vs. recliner in premium cabins), Wi-Fi.
5. **Loyalty value**: miles and elite credit earned, and whether status perks apply
   (free upgrades, bags, lounge).
6. **Flexibility**: change and cancel rules; free 24-hour cancellation on US bookings
   made 7+ days out.

## Tricks worth checking when they fit
- Nearby airports and positioning flights.
- One-ways vs. round-trip pricing (often equal on US carriers; not always abroad).
- Open-jaw itineraries for multi-city trips.
- Mixed cash and points (outbound on points, return on cash).
- Paid or points upgrades vs. booking premium outright.
- Fare drops after booking: many US airlines give a credit for the difference on
  standard fares; note the fare to watch.

## Output
```
Top pick: <airline, flight numbers, times, stops, cabin, price/points>
Runner-up: <...> - why it lost
Wildcard: <optional: cheapest, best points play, or most comfortable>

| Option | Route & times | Duration | Stops | Cabin/aircraft | Cash | Points + fees | Notes |

Fine print: <bag rules, fare class restrictions, connection warnings>
How to book: <numbered steps; transfer steps only after space is verified>
Seen: <where and when each price was checked>
```
