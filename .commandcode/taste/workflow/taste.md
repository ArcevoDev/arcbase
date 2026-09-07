# workflow
- Prefers understanding the full architecture before directing next development steps — wants clarity on the system's structure, gaps, and direction ("we need to fully understand arcbase's architecture to understand and know the next development direction") before committing to implementation. Confidence: 0.8
- Wants comparative architectural evaluations, not just status reports — explicitly asks the agent to evaluate options ("confirm the best api architecture... if it is to mirror that of arcid... or maintain the structure we already have") and present a recommendation with reasoning. Confidence: 0.75
- Uses conventional commit branch naming convention (`type/description` format, e.g. `chore/audit-fixes`). Confidence: 0.85
- Before migrating to or consuming @arcevo/facet-* packages, verifies the actual installed package exports (dist declarations / resolved entry points) rather than assuming API shapes exist — migrations must stay in sync with what the packages really export. Confidence: 0.9
- Prefers full repository-wide audit sweeps (read every relevant file, run a full typecheck) over piecemeal fixes to ensure everything is correctly implemented before previewing. Confidence: 0.9
- Treats a clean typecheck/build (graceful server preview) as a gate — work isn't considered done until the server builds/runs without errors. Confidence: 0.85
