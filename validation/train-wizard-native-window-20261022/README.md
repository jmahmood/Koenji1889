# Visible walkthrough viewport correction · 22 October 2026

The visible operating-round walkthrough forced a 1440×1000 emulated viewport. On a shorter physical Chrome window, the application could correctly fit that emulated viewport while its footer was outside the part of the window visible to the user.

`scripts/puppet-round.mjs` now uses `viewport: null` for visible runs, so the page follows Chrome's actual content area and window resizing. Headless runs retain deterministic dimensions. Footer actions are checked against the visible viewport before the runner can click them; those actions no longer trigger automatic scrolling that could mask clipping.

A complete visible operating round passed, including all five train steps, purchase, and finishing the turn. The recorded native window had a 1200×881 content area inside a 1200×968 outer Chrome window. The report records the viewport mode and measurements. All 22 focused train and playback-control tests also passed.

The change applies to newly launched walkthroughs. Existing browser contexts created with the old forced viewport must be restarted.
