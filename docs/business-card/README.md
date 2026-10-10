# Business card: front (approved 2026-10-10)

`card-front.png` is the approved design: the preview image, 1260 × 717 px.

## Files for the printer

| File | What it is |
|---|---|
| `card-front.png` | The approved front, as a reference picture of the finished card |
| `carpet-roll.svg` | The carpet and roll, **vector**: prints sharp at any size. Drawn for the card's green background (#11261E). |
| `pattern-corners.svg` | The faint 8-point star background pattern and the four corner flourishes, **vector**, full card size |

The frame, its corner stars and the "MosqueCarpetsCanada" lettering came from the original card image, so build the
print file in the tool where you made that design (e.g. Canva) and drop the two SVGs in at the positions below.

## Positions (from the card's top-left corner, standard 88.9 × 50.8 mm card)

| Element | Position and size |
|---|---|
| Carpet and roll (`carpet-roll.svg`) | left 13.8 mm, top 19.1 mm, 61.2 × 12.9 mm |
| "MosqueCarpetsCanada" | left 14.1 mm, letters sitting on 25.2 mm from the top, 45.3 mm wide (capitals about 3.3 mm tall), cream #EEEFE6. Same font as the original card. |
| "PRAYER-HALL CARPET · SUPPLIED" | centred left to right, centred 38.1 mm from the top. Work Sans Medium, all capitals, letter spacing 0.28 em, gold #C9AE72, with a small gold diamond and a short rule on each side |
| Background pattern and corners (`pattern-corners.svg`) | full card, pattern at 16% opacity, fading out toward the centre |

The whole group (name, carpet, roll and tagline) is centred left to right and sits 4 mm below the card's centre.

## Colours

| Name | HEX |
|---|---|
| Card green (background) | #11261E |
| Gold (carpet border, arches, roll, tagline, pattern) | #C9AE72 |
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

The back of the card (contact details) isn't designed yet.
