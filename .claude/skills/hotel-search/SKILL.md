---
name: hotel-search
description: Find and compare hotels and other stays for the client's needs, weighing location, quality, price, points, and elite benefits. Use for any request involving hotels, resorts, vacation rentals, where to stay, or hotel points.
---

# Hotel search

## Inputs to settle first
- Destination and **what they'll be doing there** (a meeting address, a beach, a
  neighborhood to explore, an airport early flight). Location decides most of it.
- Dates, number of rooms, guests (and kids' ages; many rates and rooms depend on it).
- Must-haves from `tina/profile.md` and this trip: bed type, gym, pool, quiet room,
  walkability, parking, pet-friendly, accessibility, workspace.
- Style: luxury, boutique, reliable chain, budget, apartment or rental.
- Loyalty: which hotel programs and status the client has, and whether earning or
  burning points matters for this stay.

## Where to look
- Google Hotels and the major OTAs for a market view of prices and availability.
- The chains' own sites for member rates, award pricing, and points-plus-cash.
- Reviews: recent guest reviews (last 6-12 months), and frequent-traveler blogs for
  elite-benefit reports at a specific property.
- Maps: check the actual walk or ride time to the places that matter.
- Card and luxury programs the client has access to (e.g. Amex Fine Hotels + Resorts,
  Chase's luxury collection, Hyatt's or Marriott's luxury tiers, Virtuoso through an
  advisor) for perks like breakfast, credits, and upgrades.

## How to evaluate
1. **Location fit** first. A cheaper hotel 40 minutes from everything isn't cheaper.
2. **Total real cost**: nightly rate plus taxes plus **resort or destination fees**
   plus parking. Compare awards with the `points-strategy` math, including fifth-night
   free, free night certificates, and points-plus-cash.
3. **Elite benefits** the client would actually get: breakfast, late checkout,
   upgrades, lounge. These can make a pricier chain hotel the better value.
4. **Quality signals**: recent reviews, renovation date, complaints that recur (noise,
   construction, cleanliness).
5. **Flexibility**: refundable vs. prepaid rates and the cancellation deadline.
   Recommend refundable when prices may drop or plans may change, and plan to re-check.
6. **Independent vs. chain**: be willing to recommend a great independent hotel over
   a mediocre chain property; say what loyalty value the client gives up.

## Output
```
Top pick: <hotel, neighborhood, why it fits this trip>
Runner-up: <...> - why it lost
Wildcard: <optional: best points value, splurge, or budget pick>

| Hotel | Area / distance to key spot | Cash (all-in/night) | Points/night | CPP | Elite perks | Cancellation |

Fine print: <resort fees, deposit, construction, rate restrictions>
How to book: <numbered steps, including which rate code or program to use>
Seen: <where and when each price was checked>
```

After booking, put the confirmation and the free-cancellation deadline in the trip file,
and suggest re-checking the price before that deadline.
