# Sponsor logo assets

These files are the real logos shown on the in-scene sponsor billboards (around
the diorama rim). Each is wired to a sponsor via the `logo` field in
`src/game/sponsors.ts` — the exact filename must match.

| sponsor id  | file                                | on board            |
|-------------|-------------------------------------|---------------------|
| `socar`     | `SOCAR_logo.jpg`                    | real logo           |
| `greda`     | `greda_logo.png`                    | real logo           |
| `grpo`      | `georgian_renewable_power_logo.jpg` | real logo           |
| `vdc`       | `vdc_logo.png`                      | real logo           |
| `technopark`| `techno_park.png`                   | real logo           |
| `hunnewell` | `hunnewellcement_logo.jpg`          | real logo           |
| `gita`      | — (no file yet)                     | styled name plaque  |

To change/add a logo: drop the file here and set the matching `logo:` filename in
`src/game/sponsors.ts`. The board composites it onto a clean white card
(contained, so any aspect ratio reads undistorted). Recommended: a logo with some
padding, PNG (transparent) or JPG (white background). To give GITA a real logo,
add e.g. `gita.png` here and set `logo: 'gita.png'` on the gita entry.
