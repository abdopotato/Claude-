# Business card (approved 2026-10-10)

- `card-front.png`: the approved front (masjid + name on the gold prayer carpet), 1260 × 717 px.
- `card-back.png`: the back as supplied by the owner (name, title, phone, email, QR code), 1260 × 720 px.

## Files for the printer

| File | What it is |
|---|---|
| `card-front.png` | The approved front, as a reference picture of the finished card |
| `carpet-roll.svg` | The carpet and roll, **vector**: prints sharp at any size. Drawn for the card's green background (#11261E). |
| `pattern.svg` | The faint 8-point star background pattern, **vector**, full card size (goes *under* the logo) |
| `corners.svg` | The four corner flourishes, **vector**, full card size |

The frame, its corner stars and the "MosqueCarpetsCanada" lettering came from the original card image, so build the
print file in the tool where you made that design (e.g. Canva) and drop the SVGs in at the positions below.

## Positions (from the card's top-left corner, standard 88.9 × 50.8 mm card)

| Element | Position and size |
|---|---|
| Carpet and roll (`carpet-roll.svg`) | left 9.0 mm, top 19.5 mm, 70.8 × 12.9 mm |
| Masjid icon | left 9.3 mm, standing on the same line as the name (bottom 25.6 mm from the top), 6.4 mm tall. Same icon as the original card. |
| "MosqueCarpetsCanada" | left 18.9 mm, letters sitting on 25.6 mm from the top, 45.3 mm wide (capitals about 3.3 mm tall), cream #EEEFE6. Same font as the original card. |
| "PRAYER-HALL CARPET · SUPPLIED" | centred left to right, centred 38.1 mm from the top. Work Sans Medium, all capitals, letter spacing 0.28 em, gold #C9AE72, with a small gold diamond and a short rule on each side |
| Background pattern and corners | full card; pattern at 16% opacity, fading out toward the centre, behind the logo |

The whole group (masjid, name, carpet, roll and tagline) is centred left to right and sits 4 mm below the card's centre.

## Colours

| Name | HEX |
|---|---|
| Card green (background) | #11261E |
| Gold (carpet and roll, solid; tagline; pattern) | #C9AE72 |
| Cut lines on the carpet and roll (border, rows, arches, highlights) | card green #11261E |
| Cream (name) | #EEEFE6 |

## Check before printing

- **Tagline size:** at real card size the tagline is only about **3.8 pt**. That's too small to print cleanly; make it
  **6 pt or larger** (keep it centred and on one line, shortening the side rules if needed).
- **Fine lines:** the carpet's thinnest lines are about 0.07 mm. Ask the printer for a hard proof; if they fade, thicken
  the lines in `carpet-roll.svg` slightly.
- Add 3 mm bleed on every side (the green background extends past the trim), keep text 3 mm inside the trim,
  export as a CMYK PDF. See `../BUSINESS-CARD.md` for the full print checklist.
- **Wording:** the tagline no longer mentions installation (the business no longer installs). The website still
  does; see `OPEN-QUESTIONS.md` #28.

The back uses the owner's own design (`card-back.png`). Its email is the Gmail address; switch it to a business address once one exists.
