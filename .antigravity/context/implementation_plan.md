# CIRO Mobile App - Part 4 Implementation Plan

This is the final implementation step (Part 4 of 4) based on the updated `agent_prompt.md`. We will create the Incident Log screen, polish the demo mode, implement API robustness, and write the main project README.

## Proposed Changes

### New Files
#### [NEW] [logs.tsx](file:///c:/Users/Addministrator/ciro/app/(tabs)/logs.tsx)
The Incident Log screen. It will feature horizontal filter tabs for the different agent types, render `<LogEntry />` components from the `executionLogs` state, and auto-scroll to the latest logs. It will also have a "False Alarm" highlighted section and a "Baseline Comparison" table with an export button.

#### [NEW] [README.md](file:///c:/Users/Addministrator/ciro/README.md)
The primary documentation file for the CIRO system, exactly matching the provided template in the prompt.

### State & Robustness
#### [MODIFY] [crisisStore.ts](file:///c:/Users/Addministrator/ciro/store/crisisStore.ts)
- Add a `degradedMode` boolean flag to toggle a warning banner when API fallback responses are used.

#### [MODIFY] [index.tsx](file:///c:/Users/Addministrator/ciro/app/(tabs)/index.tsx)
- Enhance `runDemoSequence` to sequentially run agents, auto-navigate across tabs (`router.push`), and execute Action A1.
- Introduce `axios` timeout settings (30,000ms) and `try/catch` fallbacks mimicking the requested `FALLBACK_FUSION` structure across API endpoints.
- Render a `⚠️ DEGRADED MODE` banner when the system fails over to mock data.

## Verification Plan

### Manual Verification
- Run the "Run Demo" button from the Home Screen and observe the automatic sequence progressing through Map, Actions, Stakeholders, and Logs.
- Verify the `logs.tsx` screen correctly filters by agent name and copies to the clipboard.
- Intentionally shut down the backend or introduce a bad IP in `constants/config.ts` to test if the "Degraded Mode" triggers seamlessly.
