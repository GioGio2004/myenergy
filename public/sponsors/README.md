# Sponsor logo drop-in

In-game sponsor boards are generated from each partner's **name** by default
(clean styled plaques, 100% offline — see `src/game/scene/sponsors.ts`).

To replace a plaque with a real logo, drop a PNG here named by the sponsor `id`:

| id           | sponsor                              |
|--------------|--------------------------------------|
| `socar`      | SOCAR                                |
| `greda`      | GREDA                                |
| `gita`       | GITA                                 |
| `technopark` | Technopark                           |
| `vdc`        | VDC Energy                           |
| `grpo`       | Georgian Renewable Power Operations  |
| `hunnewell`  | Hunnewell Cement                     |

e.g. `public/sponsors/socar.png`. Recommended: ~512×288, transparent or solid
background, the logo centered. The board detects the file at runtime (HEAD check)
and swaps it in automatically — no code change, no rebuild logic needed.
