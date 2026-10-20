# Individual route revenue validation

Validated in the local browser with the four-train branching-network fixture.

- Recommended cards display 2-5: ¥70, 3-0: ¥100, 2-4: ¥60, 2-1: ¥60; total ¥290.
- Changed 3-0 to Muroto → Nankoku → Susaki. Its card changes to ¥70 and the total to ¥260; the other train values stay unchanged.
- Scrolled to verify both remaining cards show ¥60 with the total and run button still visible.
- Restored recommended routes and confirmed total ¥290. Left the menu open for testing.

Screenshots: `route-values.png`, `changed-route-values.png`, `remaining-train-values.png`.

Automated validation: 125 JavaScript tests and 9 focused Python route tests pass; production build succeeds. Regression coverage checks engine quotes, changed routes, idle trains, pending quotation, and restoring the recommended plan.
