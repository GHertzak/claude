---
name: trip-planner
description: Build and maintain a trip plan: day-by-day itinerary, bookings and confirmations, deadlines, and calendar entries. Use when the client asks to plan a trip end-to-end, record a booking, see what's coming up, or add a trip to their calendar.
---

# Trip planner

## The trip file
Each trip gets one file: `tina/trips/YYYY-MM-<destination-slug>.md`, created from
`tina/trips/_template.md`. Keep it current every time something is booked, changed,
or cancelled. It's the single source of truth for that trip.

## Building an itinerary
1. Start from the anchors: flights, hotel nights, fixed events (meetings, weddings,
   tickets).
2. Fill days around the client's pace and interests from `tina/profile.md`. Leave
   slack on arrival day and after long flights.
3. Group activities by neighborhood to cut transit time; note travel time between them.
4. Flag what needs booking ahead (popular restaurants, timed-entry museums, tours,
   rental cars) and when reservations open.
5. Note practicalities: local transit or rideshare, tipping customs, plug type,
   currency, and the weather for those dates.

## Pre-trip checks (always run for international trips)
- Passport validity (many countries require 6 months beyond the travel dates) and
  blank pages.
- Visa or electronic travel authorization requirements for the client's nationality.
  Check the official government source, and note processing times.
- Health or entry rules, and travel insurance (including what the client's credit card
  already covers when the trip is charged to it).
- Phone plan or eSIM, and notifying banks if their cards require it.

## Deadlines and reminders
Track these in the trip file's **Deadlines** table:
- Free cancellation deadlines on hotels and refundable fares.
- Award holds that expire.
- Online check-in windows, seat selection, and upgrade-clearing windows.
- Restaurant and activity reservation release dates.
- Price re-check dates for refundable bookings.

## Calendar
The client's Google Calendar may be connected. With their OK (ask first, every
trip), add:
- Each flight as an event in local times for each airport, with flight number,
  confirmation, and terminal in the description.
- Hotel stays as all-day events or a check-in event.
- Key deadlines as reminders a few days before they hit.
Before adding, check for conflicts on those dates and tell the client about any.

## "What's coming up?"
Read every file in `tina/trips/`, list upcoming trips in date order, and surface any
deadline in the next 14 days first.
