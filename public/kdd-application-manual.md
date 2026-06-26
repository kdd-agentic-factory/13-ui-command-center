# KDD Application Manual

## 1. What KDD is

KDD is a Decision Intelligence Layer for motorcycle performance. It does not replace ECU, logger, GPS, IMU, video or CSV telemetry. It sits above those sources and turns signal into decisions, missions, validation and reusable learning.

The product goal is simple: help riders, engineers, coaches and teams move from raw telemetry to validated action without exposing sensitive raw data unnecessarily.

## 2. Entry flow

1. Open the public landing page.
2. Choose **Solicitar Early Access** when you want access to the product evaluation path.
3. Choose **Convertirme en Founding Node** when you want to help shape the first learning network.
4. Submit the requested context: role, discipline, telemetry stack, team size and privacy expectations.
5. Wait for the onboarding response with the recommended node type and next steps.

## 3. Early Access path

1. Request Early Access from `/trial`.
2. Describe your motorcycle, championship or training context.
3. List available sources: ECU, logger, GPS, IMU, video, CSV files or external telemetry feeds.
4. Define the first objective: faster corner exit, cleaner brake release, setup comparison, rider learning or team debrief.
5. Receive the access invitation and login instructions.

## 4. Founding Node path

1. Request Founding Node access from `/founding-nodes`.
2. Confirm whether your node should be Private, Team or Federated.
3. Define which learnings may travel and which raw sources must stay protected.
4. Participate in the first validation model: events, causes, missions and evidence rules.
5. Use the first sessions to shape the Knowledge Network benchmarks.

## 5. Telemetry sources

KDD can sit above several source types:

1. **ECU** — engine, throttle and electronic control signals.
2. **Logger** — consolidated channels and lap data.
3. **GPS** — line, speed, sectors and position.
4. **IMU** — lean, acceleration, braking and movement patterns.
5. **Video** — rider behaviour, line and context.
6. **CSV** — exported channels from existing tools.
7. **External telemetry** — weather, tyre, track or operational feeds.

Start with the sources you already trust. KDD should clarify their meaning, not force a stack replacement.

## 6. Decision loop

Use the same loop for every session:

1. **Data** — upload or connect the available telemetry and context.
2. **Events** — identify where something meaningful changed.
3. **Causes** — connect the event to rider input, setup, tyre, track or condition.
4. **Decision** — decide what changed and why it matters.
5. **Recommendation** — define the most plausible improvement path.
6. **Mission** — assign the next concrete action to rider, engineer or team.
7. **Validation** — set the rule that proves whether the mission worked.
8. **Learning** — keep only validated knowledge for the node or the network.

## 7. Knowledge Network

The KDD Knowledge Network compounds learning across sessions and nodes. Raw data remains protected at the source. What travels is validated learning: patterns, benchmarks, missions that worked and evidence rules.

This is the core distinction: telemetry measures; KDD learns from validated decisions.

## 8. Privacy model

1. Raw telemetry stays inside the originating node unless explicitly configured otherwise.
2. Video, setup notes and sensitive sessions remain protected by the node policy.
3. Federated learning exports validated patterns, not raw telemetry files.
4. Teams decide which benchmarks can contribute to the network.
5. Access should be granted by role: rider, engineer, coach, team principal or admin.

## 9. Node concepts

### Private Node

Use a Private Node when a rider, academy or private programme needs local learning without sharing data externally.

### Team Node

Use a Team Node when several riders, engineers and crew members need a shared decision loop and common debrief memory.

### Federated Node

Use a Federated Node when validated learning can contribute to the wider Knowledge Network while raw data remains protected.

## 10. Example: T15 Bucine

1. Load the Bucine session and focus on turn T15.
2. Compare sector loss, entry speed, brake release, lean angle and throttle pickup.
3. KDD isolates the likely event: time lost on corner exit.
4. KDD connects the cause to late brake release or conservative throttle pickup.
5. The mission becomes: run the next lap with a cleaner release window and earlier controlled pickup.
6. Validation compares the following lap against the mission target.
7. If the delta improves, the learning is saved for the node. If not, refine the cause and mission.

## 11. How to use the app after login

1. Login with the account provided during onboarding.
2. Select the active node: Private, Team or Federated.
3. Create or open a session.
4. Upload telemetry files or connect the available data source.
5. Add context: circuit, conditions, bike, rider, tyres and setup notes.
6. Review detected events and choose the ones that matter.
7. Inspect the proposed causes and reject weak explanations.
8. Convert the accepted cause into a decision.
9. Assign a mission to the rider, engineer or team.
10. Define the validation rule before the next run.
11. After the next lap or session, compare results against the validation target.
12. Save validated learning to the node.
13. If the node is federated, approve which learning may travel to the Knowledge Network.

## 12. Operating principles

1. Do not chase every signal. Focus on decisions that can be validated.
2. Do not replace telemetry tools that already work. Put KDD above them.
3. Do not share raw data when learning is enough.
4. Keep missions concrete and testable.
5. Treat the Knowledge Network as a compounding memory, not a public data dump.
