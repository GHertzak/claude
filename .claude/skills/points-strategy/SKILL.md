---
name: points-strategy
description: Decide whether to pay cash or points for a flight or hotel, which currency to use, whether and where to transfer flexible points, and how to earn toward upcoming trips. Use whenever a booking decision involves credit card points, airline miles, hotel points, elite status, or travel credits.
---

# Points strategy

The goal is not "use points." The goal is the most trip for the least real value.
Sometimes that means paying cash and saving points for a redemption worth twice as much.

## 1. Know what the client has

Read `tina/points.md` and `tina/profile.md` first. You need:
- Balances in every program, and which are **flexible** (transferable bank points such as
  Chase Ultimate Rewards, Amex Membership Rewards, Capital One, Citi ThankYou, Bilt)
  versus **locked** (a single airline or hotel program).
- Expiration dates and pending sign-up bonuses or minimum-spend deadlines.
- Elite status and how close they are to the next tier.
- Card perks that matter for this trip: free night certificates, companion fares,
  travel credits, free checked bags, lounge access, travel insurance.

If balances look stale (no update date, or older than a couple of months), ask the
client to confirm before building a plan on them.

## 2. Do the cents-per-point (CPP) math

```
CPP = (cash price - taxes and fees paid on the award) / points required x 100
```

Compare the CPP to the client's value for that currency (see
`reference/valuations.md`; the client's own numbers in `tina/points.md` win if set).

- CPP well above the valuation: strong redemption, use points.
- CPP around the valuation: a toss-up; let the other factors below decide.
- CPP below the valuation: pay cash, unless a factor below overrides.

Then adjust for what the simple math misses:
- **Earning on cash bookings.** Paying cash earns miles, hotel points, and elite
  credit; an award usually doesn't. Subtract that from the cash price's real cost.
- **Flexibility.** Many awards can be cancelled for free or a small fee; the
  matching cash fare may be non-refundable (or the reverse). Value that.
- **Surcharges.** Some programs add large carrier-imposed surcharges to partner
  awards. Always include them.
- **Use it or lose it.** Points about to expire, or locked in a program the client
  rarely uses, are worth less than the chart says. Burn them.
- **Upcoming big trip.** If the client is saving for a specific aspirational
  redemption, protect those points.
- **Cash constraints.** If cash is tight this month, say so and weigh it; points
  aren't free, but they're already paid for.

## 3. Find every path to the award

For a given flight or hotel, list each way the client can get there:
1. Points already in the operating program.
2. Points in a partner program (alliance partners for flights; hotel partnerships).
3. Flexible bank points transferred into either of the above (check
   `reference/transfer-partners.md`, then **verify it's current**).
4. Bank travel portals (points at a fixed or boosted value, usually earn
   elite credit like a cash fare).
5. Cash plus a certificate or companion fare.

The same seat often costs very different amounts in different programs. Price it
in at least two or three programs when the client can reach them.

## 4. The transfer protocol (never skip)

Transfers are almost always one-way and permanent.
1. Confirm award space is bookable **right now** on the destination program's own
   site, for the exact flight or dates, in the right cabin, for every traveler.
2. Check the current transfer ratio and whether a **transfer bonus** is running
   (bonuses of 15-40% come and go; it can be worth waiting if travel is far out and
   space is plentiful, never if space is scarce).
3. Check transfer timing. Many are instant; some take days. If it isn't instant,
   check whether the program allows holds.
4. Make sure the destination account name matches the bank account holder (or the
   bank allows transfers to that household member).
5. Transfer only the amount needed (plus a small buffer for fee or price changes),
   then book immediately.

## 5. Strategic advice beyond this trip

When it fits, mention (briefly, one or two lines):
- A transfer bonus worth timing a booking around.
- An expiring balance and the cheapest way to reset the clock.
- Being close to an elite tier and whether a cash booking gets them there.
- A sweet spot (`reference/sweet-spots.md`) that fits a trip they've mentioned.
- Which card to put cash bookings on for the best earn and travel protections.

Don't push new credit cards unprompted. If the client asks, factor in their stated
appetite for new cards and fees.

## Output format for a points decision

```
Recommendation: <one line>

| Option | Cash | Points | Taxes/fees | CPP | vs. value |
|---|---|---|---|---|---|
| ... |

Why: <2-4 bullets>
Steps: <numbered booking/transfer steps, with the "verify space first" step explicit>
```
