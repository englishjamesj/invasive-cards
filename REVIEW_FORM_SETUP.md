# SME Review — Microsoft Form setup & how the one-click submit works

The review page (`review.html`) now does the work for the SME: when they finish a card,
it opens your Microsoft Form in a new tab **already filled in** (their initials, the card,
and their edits). They just click **Submit**. No typing into the form, no copy/paste in the
normal case.

This is wired and working. This doc records how it's set up so future-you (or a new form)
can reproduce it.

---

## The form (already built) — 3 questions

1. **Your initials** — Text, short answer, Required.
2. **Which card is this edit for?** — Choice, Required. Options are the 21 cards, each
   labeled exactly `#<n> <Common Name>` (e.g. `#1 Black Rat` … `#21 Grass Carp`). These must
   match the card names in `data/cards.js` character-for-character, because the page sends
   that exact label.
3. **Paste your edits here (Ctrl+V)** — Text, **Long answer**, Required. The page pre-fills
   this with the auto-labeled edit block (card #, reviewer, box, ORIGINAL vs SUGGESTED).

## CRITICAL setting: pre-filled answers must stay ON

The one-click flow only works because **"Enable pre-filled answers"** is turned ON for this
form. (Forms editor → `⋯` More menu → **Get pre-filled URL** → the **Enable pre-filled
answers** toggle.) If that toggle is ever turned off, the form will open blank and SMEs would
have to type everything. Leave it ON.

## How the page is wired to the form (`review.js` CONFIG)

If you ever rebuild the form, the field codes change and must be re-captured:

1. Forms editor → `⋯` → **Get pre-filled URL**.
2. Make sure **Enable pre-filled answers** is ON.
3. Type dummy answers: initials `AAA`, card `#1 Black Rat`, edits `DUMMYEDIT`.
4. Click **Get pre-filled link**, copy the long URL. It contains three codes like
   `r8a95b60...=AAA`, `ra55dc10...=%231 Black Rat`, `r985b52c...=DUMMYEDIT`.
5. In `review.js` top CONFIG, set:
   - `formBase`     = the URL up to and including the `id=...` value (drop the `&r...=` parts)
   - `fieldInitials`= the code whose value was `AAA`
   - `fieldCard`    = the code whose value was `#1 Black Rat`
   - `fieldEdits`   = the code whose value was `DUMMYEDIT`

Current values are already set from the live form (tenant: USGS GCC).

## The long-edit safety net

Very long edits could exceed a safe URL length (`maxUrlLen` in CONFIG, 8000 chars). If that
happens for a card, the page still opens the form pre-filled with **initials + card**, copies
the edit text to the clipboard, and shows a small panel asking the SME to paste it into the
edits box before Submit. This keeps anything from being silently truncated. For normal
single-box edits this never triggers (a full block is ~700 chars).

## Sharing with SMEs

- Host the `Portfolio/` folder where SMEs can reach it (GitHub Pages, an internal share, or
  zip it — `review.html` also works opened locally/offline).
- Tell them: *"Open review.html, type your initials, tap the species you know, fix any wrong
  wording on the back, hit Send — the form pops up already filled, just click Submit. Most
  cards won't need anything."*

## Reading the results

- Form → **Responses → Open in Excel.** One row per card an SME submitted; columns = initials,
  card, and the edit block (which already spells out the box, original, and suggestion).
- Sort by the card column to group all feedback per species.
