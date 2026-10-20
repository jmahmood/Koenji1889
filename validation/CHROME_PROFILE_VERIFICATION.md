# Four-profile browser verification — 18 October 2026

**Result: successful.** Four local, signed-out Chrome profiles were created through Chrome's native UI and controlled through `cua_repl`. These provide separate browser storage and independent authenticated player sessions. They are four profile windows within Chrome, rather than four different browser products or a claim about OS process count.

| Profile | Player | Observed ordinary UI behavior |
|---|---|---|
| Koenji Playtest P1 | Akira Aggressive | Hosted room CYEU10, claimed p1; retained host controls after other profiles joined |
| Koenji Playtest P2 | Chiyo Conservative | Opened p2 private invitation; selected Portrait 2; claimed seat; no host controls; retained p2 after reload |
| Koenji Playtest P3 | Osamu Opportunistic | Opened p3 private invitation; selected Portrait 3; claimed seat; no host controls |
| Koenji Playtest P4 | Nori Newcomer | Opened p4 private invitation; selected Portrait 4; claimed seat; no host controls; retained p4 after reload |

## Procedure and observations

1. Launched native Chrome. Initial automation selection timed out, but Chrome subsequently appeared running and a second selection succeeded.
2. Used Chrome Profiles → Add Profile → Stay signed out, named each profile, and finished setup. No Google account or synchronization was used.
3. P1 visited the existing validation frontend at `http://127.0.0.1:5189`, completed new-visitor appearance setup, and created a new ordinary gathering titled Four isolated Chrome profiles with the four test names.
4. Read each private invitation from the host's visible UI and opened it in the corresponding fresh profile. Each fresh profile presented its own appearance onboarding. No developer fixture, direct state edit or internal gameplay API was used.
5. P2–P4 explicitly clicked Take / update your seat. Readiness advanced 1/4 → 2/4 → 3/4 → 4/4, and each guest screen omitted host controls.
6. Reloaded P4: it remained Nori/p4, with 4/4 claimed and no host controls.
7. Switched to P1 through Chrome's Profiles menu: it remained Akira/p1, displayed all four online/claimed, and enabled Start Match. This establishes lobby updates between separate profiles.
8. Switched to and reloaded P2: it remained Chiyo/p2, showed all four claimed, and still omitted host controls.

An unrelated ChatGPT extension-install prompt appeared during setup and was canceled. No extension installation or additional permissions were accepted. Profile switching uses native desktop accessibility controls, so gameplay can be controlled sequentially across the four profiles without a browser extension.

## Evidence

- [P1 initial host](evidence/05-chrome-p1-host.png)
- [P2 independent non-host](evidence/06-chrome-p2-no-host-controls.png)
- [P3 claimed](evidence/07-chrome-p3-claimed.png)
- [P4 all four claimed](evidence/08-chrome-p4-all-four-claimed.png)
- [P1 all four claimed, Start enabled](evidence/09-chrome-p1-all-four-start-enabled.png)
- [P4 after refresh](evidence/chrome-p4-after-refresh.txt)
- [P1 after switching back](evidence/chrome-p1-four-claimed.txt)
- [P2 after switching and refresh](evidence/chrome-p2-after-refresh.txt)

## Impact on original report

ENV-001 is resolved by native Chrome profile automation. UI-001 remains scoped to shared-profile tabs; its host-control behavior was not observed in the three separate guest profiles. The original room GJDQCD was left intact; CYEU10 is a new, separately documented ordinary run.

Four independent players have now completed lobby entry, but the match has not started. No full-game completion, final scoring, transaction correctness or gameplay resilience claim is made. The profiles and ready lobby are left open for continued validation. Application code was unchanged.
