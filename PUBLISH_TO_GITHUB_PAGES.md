# Put the review tool online & get the link to send SMEs

Goal: turn the `Portfolio` folder into a web page with a public link. You email SMEs that
link; they click it and the review tool just works — no files, no folders, no downloads.

You only do this ONCE. After that, updating cards = re-upload the changed files.

Time: ~15 minutes. You need your GitHub account.

---

## Part 1 — Make a repository (a web folder on GitHub)

1. Go to **https://github.com** and sign in.
2. Top-right, click the **+** → **New repository**.
3. **Repository name:** type `invasive-cards` (any name works; keep it simple).
4. Set it to **Public** (GitHub Pages needs Public on free accounts).
5. Leave everything else as-is. Click **Create repository**.
6. **Check you're right:** you land on a page that says "Quick setup" with an address like
   `https://github.com/YOURNAME/invasive-cards`.

## Part 2 — Upload the Portfolio files

1. On that repo page, click the link **"uploading an existing file"**
   (or go to **Add file** → **Upload files**).
2. Open the `Portfolio` folder on your computer in File Explorer.
3. Select **everything inside** `Portfolio` (Ctrl+A) — the files AND the `assets`, `data`,
   `build` folders — and **drag it all** onto the GitHub upload page.
   - Make sure `assets` (with the card images), `data`, `review.html`, `review.js`,
     `index.html`, and `favicon.png` are all in the list.
4. Wait for the upload to finish (the images take a minute).
5. Under "Commit changes," click the green **Commit changes** button.
6. **Check you're right:** the repo now lists your files (`review.html`, `assets`, etc.).

## Part 3 — Turn on GitHub Pages

1. In the repo, click the **Settings** tab (top, gear-ish area).
2. Left sidebar, click **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, pick **main** and **/(root)**, then click **Save**.
5. Wait ~1–2 minutes. Refresh the page.
6. **Check you're right:** a green banner/link appears: *"Your site is live at
   `https://YOURNAME.github.io/invasive-cards/`"*.

## Part 4 — Get the exact link to send SMEs

Your review link is the site address with `review.html` on the end:

```
https://YOURNAME.github.io/invasive-cards/review.html
```

- Open that in your browser to confirm it loads (card icon in the tab, all 21 cards).
- That is the ONE link you email SMEs. Nothing else to send.

**Suggested email to SMEs:**
> Subject: 5 minutes? Help me check the science on some USGS trading cards
>
> I'm building trading cards about invasive species and want expert eyes on the facts.
> Open this, put your initials, pick the species you know, and fix any wrong wording:
> https://YOURNAME.github.io/invasive-cards/review.html
> Most cards won't need a thing. Thanks!

---

## Updating later (after you change/add cards)

1. Re-run `Portfolio/build/generate.ps1` so `data/cards.js` and `assets/cards/` are current.
2. On the repo page: **Add file → Upload files**, drag the changed files (or the whole
   `data` and `assets/cards` folders), **Commit changes**.
3. The live site updates in a minute. Same link.

## Notes
- The site is **public** (anyone with the link can view the cards and open the review page).
  The cards are a pitch concept, not sensitive, so this is normally fine — but if you'd
  rather it not be public before the boss sees it, tell me and we'll weigh alternatives.
- Feedback still flows into your **private** MS Form — only the viewing is public.
