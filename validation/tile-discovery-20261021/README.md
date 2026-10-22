# Tile-discovery verification — October 21, 2026

- 184 JavaScript tests pass.
- Three new Python tile-discovery regression tests pass.
- 31 general browser regression checks pass, with no browser exceptions or HTTP errors.
- Four isolated J3 browser cases pass: SR straight placement, SR already-used lay explanation, KO formerly hidden option placement, and IR connection explanation.
- Exhaustive discovery comparison over 18 saved track turns: 13,206 candidate attempts; all 133 distinct engine-accepted choices were present in discovery, with no invalid advertised choices.
- Production build succeeds with the existing bundle-size advisory.

[Detailed findings](../../docs/koenji/tile_placement_audit_20261021.md).

The saved-game comparison covers phases 2 and 3, not every possible position. Browser checks used Chrome. Private snapshots and credentials remain temporary and are not included here. The initial investigation was local; the subsequent requested deployment and local fixtures are recorded in [deployment verification](deployment.md).
