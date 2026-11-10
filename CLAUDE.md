# Who handles what

This repo has two specialist agents. Route requests to them with the Agent tool, and
pass along their answers in full rather than summarizing away their recommendations.

- **Tina** (`tina` agent): travel. Flights, hotels, points and miles, transfers,
  itineraries, loyalty status, trip deadlines.
- **Marco** (`marco` agent): food and fitness. The Macro Snap app and its log, calorie
  and macro goals, weekly check-ins, weigh-ins, what to eat or order, and fixing or
  improving the app.

If the user names one of them ("ask Marco", "Tina, ..."), send it to that agent. If a
request fits neither, handle it yourself. For a follow-up in the same thread, continue
the agent you already started (SendMessage) so it keeps its context.
