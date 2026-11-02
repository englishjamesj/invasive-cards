/* =====================================================================
   review.js - behavior for the SME review workbench (review.html).
   Reads window.CARDS (data/cards.js). No build step, no deps.

   HOW SUBMIT WORKS (per card, bulletproof "B1"):
     1. SME edits any science box. Changed boxes highlight gold.
     2. "Send edits for this card" builds a tidy, AUTO-LABELED text
        block (card #, species, reviewer, and only the changed boxes
        with ORIGINAL vs SUGGESTED), copies it to the clipboard, and
        opens the MS Form in a new tab.
     3. SME pastes (Ctrl+V) into the form's one big "edits" box, Submit.
   The block is also shown on-page in a copy-again safety box so there
   is never a dead end if the clipboard or the form tab hiccups.

   The SME never has to describe WHICH card or WHICH box - the tool
   writes all of that. That's the whole point.
   ===================================================================== */
(function () {
  'use strict';

  // ---- CONFIG you edit -----------------------------------------------
  var CONFIG = {
    email: 'jjenglish@usgs.gov',

    // MS Form PRE-FILL wiring. formBase is the ResponsePage.aspx URL up to
    // (and including) the id= value. The three field codes come from the
    // form's "Get pre-filled URL" link (one per question). With these, the
    // Send button opens the form ALREADY FILLED - the SME just clicks Submit.
    formBase: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=urWTBhhLe02TQfMvQApUlFC2PmeBqxpJiAsn7sYI3S5URDNJVTNDNDREMUZSVDVURlpXWEJWNllRNS4u',
    fieldInitials: 'r8a95b60d2d8643be8ebddee1196af669',
    fieldCard:     'ra55dc1077c9b45ce9863d07123ecf894',
    fieldEdits:    'r985b52c9be0c41a9a9c6a0af16f2871e',

    // Browsers/servers cap URL length. Edge/Chrome handle very long URLs,
    // but we keep a safe ceiling: beyond it we still open the form (initials
    // + card pre-filled) and have the SME paste the edits, so nothing is
    // ever lost or silently truncated.
    maxUrlLen: 8000,

    // -----------------------------------------------------------------
    //  >>> EDIT ME:  "MOST NEEDED" NUDGE  <<<
    //  A friendly note at the top of the page steering reviewers toward
    //  the species that still need eyes, so coverage spreads out instead
    //  of everyone piling onto the popular cards. There is no automatic
    //  tracking - YOU update this list as responses come in.
    //
    //  HOW TO EDIT: just change the names in the list below, then re-upload
    //  review.js to the repo. To HIDE the box entirely, set it to:  []
    //  (empty list). Names are free text - whatever reads best to you.
    // -----------------------------------------------------------------
    nudgeSpecies: [
      'Cheatgrass', 'Hydrilla', 'Coconut Rhinoceros Beetle', 'Spotted Lanternfly', 'Feral Hog', 'Red Imported Fire Ant', 'Blue Catfish', 'Southern House Mosquito'
    ],
    // Optional: the lead-in wording before the list. Leave as-is or tweak.
    nudgeLead: 'We especially need expert eyes on these next'
  };

  // The EXACT radio-option labels in the form's "Which card?" question.
  // The pre-fill value must match one of these character-for-character, so
  // we build it from here rather than from the card's display name.
  function cardOptionLabel(c) { return '#' + c.num + ' ' + (c.f_common || c.b_common || ('Card ' + c.num)); }

  // The five editable back-side science boxes = the stars of the show.
  // [key, human label shown on the card]
  var SCI = [
    ['b_first',   'First Detection / Origin'],
    ['b_path',    'Pathway of Spread'],
    ['b_impacts', 'Impacts'],
    ['b_detect',  'Detection'],
    ['b_manage',  'Management']
  ];

  // Optional "anything else?" notes - quiet, collapsed by default.
  // These are NOT pre-filled; they start empty and only go in the block
  // if the SME actually writes something.
  var EXTRA = [
    ['x_art',   'The artwork / hero image'],
    ['x_name',  'The name, team name, or tagline'],
    ['x_stats', 'The front stat ratings'],
    ['x_qr',    'The QR link / source'],
    ['x_other', 'Anything else']
  ];

  var CARDS = (window.CARDS || []).slice().sort(function (a, b) { return a.num - b.num; });
  var byNum = {};
  CARDS.forEach(function (c) { byNum[c.num] = c; });

  var LS_INIT = 'smeReviewInitials';
  var LS_CLAIM = 'smeReviewClaims';

  // ---- helpers -------------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function common(c) { return c.f_common || c.b_common || ('Card ' + c.num); }
  function sci(c) { return c.f_sci || c.b_sci || ''; }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function getInitials() { return (document.getElementById('initials').value || '').trim().toUpperCase(); }

  function loadClaims() {
    try { return JSON.parse(localStorage.getItem(LS_CLAIM) || '[]'); } catch (e) { return []; }
  }
  function saveClaims(arr) {
    try { localStorage.setItem(LS_CLAIM, JSON.stringify(arr)); } catch (e) {}
  }
  var claims = loadClaims();            // array of card nums
  var edited = {};                      // num -> true once a card has any changed box

  // ---- toast ---------------------------------------------------------
  var toastEl = document.getElementById('toast');
  var toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  // ---- initials (remembered) ----------------------------------------
  var initialsEl = document.getElementById('initials');
  var whoTag = document.getElementById('whoTag');
  (function initInitials() {
    var saved = localStorage.getItem(LS_INIT);
    if (saved) { initialsEl.value = saved; reflectInitials(); }
    initialsEl.addEventListener('input', function () {
      var v = getInitials();
      initialsEl.value = v;
      localStorage.setItem(LS_INIT, v);
      reflectInitials();
    });
  })();
  function reflectInitials() {
    var v = getInitials();
    if (v) { whoTag.textContent = v; whoTag.style.display = 'inline-block'; }
    else { whoTag.style.display = 'none'; }
  }

  // ---- roster (claim) ------------------------------------------------
  var rosterEl = document.getElementById('roster');
  var rosterHint = document.getElementById('rosterHint');

  function buildRoster() {
    rosterEl.innerHTML = '';
    CARDS.forEach(function (c) {
      var chip = el('div', 'chip');
      chip.dataset.num = c.num;
      var img = new Image(); img.className = 'thumb'; img.loading = 'lazy'; img.src = c.front; img.alt = '';
      var meta = el('div', 'meta',
        '<div class="nm">#' + c.num + '  ' + esc(common(c)) + '</div>' +
        '<div class="sc">' + esc(sci(c)) + '</div>');
      var box = el('div', 'box', '');
      chip.appendChild(img); chip.appendChild(meta); chip.appendChild(box);
      chip.addEventListener('click', function () { toggleClaim(c.num); });
      rosterEl.appendChild(chip);
    });
    reflectClaims();
  }

  function toggleClaim(num) {
    var i = claims.indexOf(num);
    if (i >= 0) {
      // Unclaiming: warn if they've edited it
      if (edited[num] && !confirm('Remove ' + common(byNum[num]) + ' from your list? Any unsent edits on it will be cleared.')) return;
      claims.splice(i, 1);
      delete edited[num];
    } else {
      claims.push(num);
      claims.sort(function (a, b) { return a - b; });
    }
    saveClaims(claims);
    reflectClaims();
    renderDeck();
    if (claims.indexOf(num) >= 0) {
      // smooth scroll to the deck on first claim
      setTimeout(function () {
        var blk = document.querySelector('.cardblock[data-num="' + num + '"]');
        if (blk) blk.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }
  }

  function reflectClaims() {
    Array.prototype.forEach.call(rosterEl.children, function (chip) {
      var num = +chip.dataset.num;
      var on = claims.indexOf(num) >= 0;
      chip.classList.toggle('claimed', on);
      chip.classList.toggle('edited', !!edited[num]);
      chip.querySelector('.box').innerHTML = edited[num] ? '&#9998;' : (on ? '&#10003;' : '');
    });
    var n = claims.length;
    rosterHint.textContent = n
      ? ('You\u2019ve picked ' + n + ' card' + (n === 1 ? '' : 's') + '. They\u2019re in your review list below.')
      : 'Nothing picked yet \u2014 tap a card above to start.';
    if (typeof markNudgeDone === 'function') markNudgeDone();
  }

  // ---- deck (per-card review blocks) --------------------------------
  var deckEl = document.getElementById('deck');
  var deckEmpty = document.getElementById('deckEmpty');

  function renderDeck() {
    // Remove blocks no longer claimed
    Array.prototype.slice.call(deckEl.children).forEach(function (blk) {
      if (claims.indexOf(+blk.dataset.num) < 0) deckEl.removeChild(blk);
    });
    // Add blocks for newly claimed (keep existing so edits survive)
    claims.forEach(function (num) {
      if (!deckEl.querySelector('.cardblock[data-num="' + num + '"]')) {
        deckEl.appendChild(cardBlock(byNum[num]));
      }
    });
    // Order to match claims
    claims.forEach(function (num) {
      var blk = deckEl.querySelector('.cardblock[data-num="' + num + '"]');
      if (blk) deckEl.appendChild(blk);
    });
    deckEmpty.style.display = claims.length ? 'none' : 'block';
  }

  function cardBlock(c) {
    var blk = el('div', 'cardblock');
    blk.dataset.num = c.num;

    // header
    var head = el('div', 'cb-head',
      '<span class="n">#' + c.num + '</span>' +
      '<div><div class="nm">' + esc(common(c)) + '</div>' +
      '<div class="sc">' + esc(sci(c)) + '</div></div>' +
      '<span class="status"></span>');
    var drop = el('button', 'drop', 'Hide');
    head.appendChild(drop);
    blk.appendChild(head);

    // body: card image + edit column
    var body = el('div', 'cb-body');

    // -- image column with flip + enlarge
    var cv = el('div', 'cv');
    var flipwrap = el('div', 'flipwrap');
    var inner = el('div', 'inner');
    var front = el('div', 'face front');
    var fimg = new Image(); fimg.loading = 'lazy'; fimg.src = c.front; fimg.alt = common(c) + ' front';
    fimg.addEventListener('click', function () { openLB(c.frontZoom || c.front, common(c)); });
    front.appendChild(fimg);
    var back = el('div', 'face back');
    if (c.back) {
      var bimg = new Image(); bimg.loading = 'lazy'; bimg.src = c.back; bimg.alt = common(c) + ' back';
      bimg.addEventListener('click', function () { openLB(c.backZoom || c.back, common(c) + ' (back)'); });
      back.appendChild(bimg);
    } else {
      back.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#888">No back image</div>';
    }
    inner.appendChild(front); inner.appendChild(back);
    flipwrap.appendChild(inner);
    cv.appendChild(flipwrap);

    var vtools = el('div', 'vtools');
    var bFlip = el('button', null, 'Flip to the science &#8635;');
    bFlip.addEventListener('click', function () { inner.classList.toggle('flipped'); });
    var bZoom = el('button', null, 'Enlarge &#9974;');
    bZoom.addEventListener('click', function () {
      var flipped = inner.classList.contains('flipped');
      if (flipped) openLB(c.backZoom || c.back, common(c) + ' (back)');
      else openLB(c.frontZoom || c.front, common(c));
    });
    vtools.appendChild(bFlip); vtools.appendChild(bZoom);
    cv.appendChild(vtools);
    cv.appendChild(el('div', 'tip', 'Tip: the facts you\u2019re checking are on the <strong>back</strong>.'));
    body.appendChild(cv);

    // -- edit column
    var edit = el('div', 'editcol');
    edit.appendChild(el('p', 'edithead', 'The science (back of card)'));
    edit.appendChild(el('p', 'editsub', 'Edit any box whose wording isn\u2019t right. Leave the rest alone.'));

    SCI.forEach(function (pair) {
      var key = pair[0], lab = pair[1];
      var orig = c[key] || '';
      var wrap = el('div', 'field');
      wrap.dataset.key = key;
      wrap.innerHTML =
        '<label>' + esc(lab) + ' <span class="ch">edited</span></label>' +
        '<textarea rows="3"></textarea>' +
        '<button class="revert" type="button">&#8592; undo my change</button>';
      var ta = wrap.querySelector('textarea');
      ta.value = orig;
      ta.dataset.orig = orig;
      ta.addEventListener('input', function () { onEdit(blk, c); });
      wrap.querySelector('.revert').addEventListener('click', function () {
        ta.value = ta.dataset.orig; onEdit(blk, c);
      });
      edit.appendChild(wrap);
    });

    // optional extras
    var det = el('details', 'optional');
    var sum = el('summary', null, 'Something off on the front or artwork? (optional)');
    det.appendChild(sum);
    det.appendChild(el('p', 'note', 'Totally optional. A quick note is plenty \u2014 I\u2019ll handle the rest.'));
    EXTRA.forEach(function (pair) {
      var key = pair[0], lab = pair[1];
      var wrap = el('div', 'field');
      wrap.dataset.key = key;
      wrap.dataset.extra = '1';
      wrap.innerHTML =
        '<label>' + esc(lab) + ' <span class="ch">noted</span></label>' +
        '<textarea rows="2" placeholder="(leave blank if fine)"></textarea>';
      var ta = wrap.querySelector('textarea');
      ta.dataset.orig = '';
      ta.addEventListener('input', function () { onEdit(blk, c); });
      det.appendChild(wrap);
    });
    edit.appendChild(det);
    body.appendChild(edit);
    blk.appendChild(body);

    // footer: submit + safety copy box
    var foot = el('div', 'cb-foot');
    var send = el('button', 'btn btn-gold', 'Send this card to the form &rarr;');
    send.disabled = true;
    // "Looks good" = a POSITIVE signal. A clean card still gets submitted as
    // "reviewed, no changes" so you can tell "an expert checked it and it's
    // fine" apart from "nobody ever looked at it." Always available.
    var okbtn = el('button', 'btn btn-ghost btn-ok', 'Looks good \u2014 no changes &#10003;');
    var msg = el('span', 'foot-msg ok', 'Checked it and it\u2019s right? Hit \u201cLooks good.\u201d Found something off? Edit the box, then Send.');
    foot.appendChild(send);
    foot.appendChild(okbtn);
    foot.appendChild(msg);
    // persistent note so the "a form will open" expectation is set BEFORE clicking
    foot.appendChild(el('div', 'foot-note',
      'Either button opens our Microsoft form in a new tab, already filled in for this card \u2014 you just click <strong>Submit</strong> there, then come back for any other cards.'));
    blk.appendChild(foot);

    var copybox = el('div', 'copybox');
    copybox.innerHTML =
      '<div class="cbx-head">&#9989; This edit was long, so it\u2019s on your clipboard. Two quick steps:</div>' +
      '<ol class="cbx-steps">' +
        '<li>The form opened with your <strong>name</strong> and <strong>card</strong> already filled.' +
          ' <button class="btn btn-ghost openform" type="button">Re-open it</button> if it didn\u2019t.</li>' +
        '<li>In the form\u2019s <strong>edits</strong> box, <strong>paste</strong> (press <kbd>Ctrl</kbd>+<kbd>V</kbd>), then click <strong>Submit</strong>.</li>' +
      '</ol>' +
      '<details class="cbx-preview"><summary>See exactly what was copied</summary>' +
        '<textarea readonly></textarea>' +
        '<button class="btn btn-ghost copyagain" type="button">Copy again</button>' +
      '</details>';
    blk.appendChild(copybox);

    // wire submit
    send.addEventListener('click', function () { submitCard(blk, c); });
    okbtn.addEventListener('click', function () { submitApproval(blk, c); });
    copybox.querySelector('.copyagain').addEventListener('click', function () {
      copyText(copybox.querySelector('textarea').value); toast('Copied again \u2014 paste into the form.');
    });
    copybox.querySelector('.openform').addEventListener('click', function () {
      if (blk.dataset.lasturl) window.open(blk.dataset.lasturl, '_blank', 'noopener');
    });

    // collapse toggle
    drop.addEventListener('click', function () {
      body.classList.toggle('collapsed');
      foot.classList.toggle('collapsed');
      var hidden = body.classList.contains('collapsed');
      foot.style.display = hidden ? 'none' : '';
      drop.textContent = hidden ? 'Show' : 'Hide';
    });

    return blk;
  }

  // ---- change tracking ----------------------------------------------
  function changedFields(blk, c) {
    var out = [];
    blk.querySelectorAll('.field').forEach(function (wrap) {
      var ta = wrap.querySelector('textarea');
      var changed = ta.value.trim() !== (ta.dataset.orig || '').trim() && ta.value.trim() !== '';
      // for science boxes, a change to blank still counts as "they want it removed"
      var isExtra = wrap.dataset.extra === '1';
      if (!isExtra) changed = ta.value !== ta.dataset.orig;
      wrap.classList.toggle('changed', changed);
      if (changed) {
        var lab = wrap.querySelector('label').childNodes[0].textContent.trim();
        out.push({ key: wrap.dataset.key, label: lab, orig: ta.dataset.orig || '', val: ta.value, extra: isExtra });
      }
    });
    return out;
  }

  function onEdit(blk, c) {
    var ch = changedFields(blk, c);
    var send = blk.querySelector('.btn-gold');
    var okbtn = blk.querySelector('.btn-ok');
    var msg = blk.querySelector('.foot-msg');
    edited[c.num] = ch.length > 0;
    if (ch.length) {
      send.disabled = false;
      if (okbtn) okbtn.style.display = 'none'; // editing = send edits, not "looks good"
      msg.className = 'foot-msg changed';
      msg.textContent = ch.length + ' box' + (ch.length === 1 ? '' : 'es') + ' changed \u2014 ready to send.';
    } else {
      send.disabled = true;
      if (okbtn) okbtn.style.display = '';
      msg.className = 'foot-msg ok';
      msg.textContent = 'Checked it and it\u2019s right? Hit \u201cLooks good.\u201d Found something off? Edit the box, then Send.';
    }
    reflectClaims();
  }

  // ---- build the submission block -----------------------------------
  function buildBlock(c, changes) {
    var who = getInitials() || '(initials not given)';
    var L = [];
    L.push('CARD #' + c.num + ' \u2014 ' + common(c) + ' (' + sci(c) + ')');
    L.push('Reviewer: ' + who);
    L.push('');
    changes.forEach(function (ch) {
      if (ch.extra) {
        L.push('NOTE \u2014 ' + ch.label + ':');
        L.push('  ' + ch.val.replace(/\n/g, '\n  '));
      } else {
        L.push('CHANGED \u2014 "' + ch.label + '":');
        L.push('  ORIGINAL:  ' + (ch.orig || '(blank)').replace(/\n/g, '\n  '));
        L.push('  SUGGESTED: ' + (ch.val || '(delete this box)').replace(/\n/g, '\n  '));
      }
      L.push('');
    });
    L.push('--- sent from the review page ---');
    return L.join('\n');
  }

  // ---- clipboard -----------------------------------------------------
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // Build a Microsoft Forms PRE-FILL url. If includeEdits is false we leave
  // the edits field out (used only when the full URL would be too long).
  function buildPrefillUrl(c, editsText, includeEdits) {
    var u = CONFIG.formBase +
      '&' + CONFIG.fieldInitials + '=' + encodeURIComponent(getInitials()) +
      '&' + CONFIG.fieldCard + '=' + encodeURIComponent(cardOptionLabel(c));
    if (includeEdits) u += '&' + CONFIG.fieldEdits + '=' + encodeURIComponent(editsText);
    return u;
  }

  // Build a short "do the rest the same way" line for after a send. This is
  // the reassurance SMEs want right after their FIRST submit: you send one
  // card at a time, this page stays open, your other cards are still here.
  function nextCardHint(justSent) {
    // other claimed cards that currently have unsent edits
    var pending = claims.filter(function (num) {
      return num !== justSent.num && edited[num];
    });
    var base = ' <span class="next">This page stays open, so after you Submit just come back here';
    if (pending.length === 1) {
      return base + ' \u2014 your other edited card (' + esc(common(byNum[pending[0]])) +
        ') is still ready. Send it the same way: one card at a time.</span>';
    }
    if (pending.length > 1) {
      return base + ' \u2014 your other ' + pending.length +
        ' edited cards are still ready. Send each the same way: one card at a time.</span>';
    }
    return base + ' for any other cards. You send one card at a time, and this page remembers where you were.</span>';
  }

  // ---- submit one card ----------------------------------------------
  // GCC-safe one-click flow: build the form's PRE-FILL url with the SME's
  // real initials, card, and edits, then open it. The form appears already
  // filled - they just click Submit. If the edits are long enough to blow
  // the URL length cap, we still open the form pre-filled with initials +
  // card and show the paste panel for the edits text (nothing is ever lost
  // or silently cut).
  function submitCard(blk, c) {
    if (!getInitials()) {
      toast('Add your initials up top first, so I know who to thank.');
      initialsEl.focus();
      return;
    }
    var changes = changedFields(blk, c);
    if (!changes.length) { toast('No changes on this card \u2014 nothing to send.'); return; }

    // "What's next" reassurance: one card at a time, this page stays put.
    var nextLine = nextCardHint(c);

    var block = buildBlock(c, changes);
    var fullUrl = buildPrefillUrl(c, block, true);
    var msg = blk.querySelector('.foot-msg');
    var copybox = blk.querySelector('.copybox');
    copybox.querySelector('textarea').value = block;

    if (fullUrl.length <= CONFIG.maxUrlLen) {
      // One-click path: everything pre-filled, SME just clicks Submit.
      window.open(fullUrl, '_blank', 'noopener');
      copybox.classList.remove('show');
      blk.querySelector('.btn-gold').textContent = 'Re-open the filled form';
      blk.dataset.lasturl = fullUrl;
      msg.className = 'foot-msg ok';
      msg.innerHTML = '&#10003; The form opened in a new tab with this card&#8217;s edits filled in \u2014 click <strong>Submit</strong> there to send it. Didn&#8217;t see a new tab? Use the button on the left.' + nextLine;
      toast('Form opened in a new tab, already filled \u2014 click Submit there.');
    } else {
      // Long-edit path: pre-fill initials + card, paste the edits (one paste).
      copyText(block);
      window.open(buildPrefillUrl(c, '', false), '_blank', 'noopener');
      copybox.classList.add('show');
      blk.querySelector('.btn-gold').textContent = 'Re-copy this card\u2019s edits';
      blk.dataset.lasturl = buildPrefillUrl(c, '', false);
      msg.className = 'foot-msg changed';
      msg.innerHTML = '&#9757; This edit is long, so paste it: the form opened with your name + card filled \u2014 paste (Ctrl+V) into the edits box, then Submit.' + nextLine;
      setTimeout(function () { copybox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
      toast('Copied! Paste the edits into the form, then Submit.');
    }
  }

  // ---- "Looks good, no changes" approval ----------------------------
  // Sends a POSITIVE review for a clean card so "an expert checked it and
  // it's fine" is recorded as its own row - distinct from a card nobody
  // ever opened. Same one-click pre-fill flow; the edits field carries a
  // short, clearly-labeled "no changes" note (always well under the cap).
  function submitApproval(blk, c) {
    if (!getInitials()) {
      toast('Add your initials up top first, so I know who to thank.');
      initialsEl.focus();
      return;
    }
    var who = getInitials();
    var block =
      'CARD #' + c.num + ' \u2014 ' + common(c) + ' (' + sci(c) + ')\n' +
      'Reviewer: ' + who + '\n\n' +
      'REVIEWED \u2014 NO CHANGES NEEDED. The science on this card looks correct to me as written.\n\n' +
      '--- sent from the review page ---';
    var url = buildPrefillUrl(c, block, true); // always short; one-click path
    var msg = blk.querySelector('.foot-msg');
    var copybox = blk.querySelector('.copybox');
    copybox.querySelector('textarea').value = block;
    copybox.classList.remove('show');

    // mark as reviewed (an "approved" state distinct from "edited")
    edited[c.num] = true;

    var nextLine = nextCardHint(c);
    window.open(url, '_blank', 'noopener');
    blk.querySelector('.btn-gold').style.display = 'none';
    blk.querySelector('.btn-ok').textContent = 'Re-open the filled form';
    blk.dataset.lasturl = url;
    msg.className = 'foot-msg ok';
    msg.innerHTML = '&#10003; Thanks \u2014 the form opened marking this card <strong>reviewed, no changes</strong>. Click <strong>Submit</strong> in that tab to record it.' + nextLine;
    toast('Form opened \u2014 click Submit to record your sign-off.');
    reflectClaims();
  }

  // ---- lightbox ------------------------------------------------------
  var lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg');
  function openLB(src, alt) { if (!src) return; lbImg.src = src; lbImg.alt = alt || ''; lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeLB() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  document.getElementById('lbX').addEventListener('click', closeLB);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) closeLB(); });

  // ---- footer mail ---------------------------------------------------
  var fm = document.getElementById('footMail');
  if (fm) fm.href = 'mailto:' + CONFIG.email;

  // ---- "most needed" nudge ------------------------------------------
  // Renders CONFIG.nudgeSpecies as a friendly steer-the-workload note.
  // A listed name that matches a card's common name becomes a one-tap
  // chip (claims that card + scrolls to it); any name that doesn't match
  // a card still shows as plain text, so you can't "break" it with a typo.
  function buildNudge() {
    var host = document.getElementById('nudge');
    if (!host) return;
    var names = (CONFIG.nudgeSpecies || []).filter(function (s) { return String(s).trim() !== ''; });
    if (!names.length) { host.classList.remove('show'); host.innerHTML = ''; return; }

    // map lowercased common name -> card num, for click-to-claim
    var byName = {};
    CARDS.forEach(function (c) { byName[common(c).toLowerCase()] = c.num; });

    var html = '<span class="lead">' + esc(CONFIG.nudgeLead || 'Most needed') + ':</span> ';
    names.forEach(function (nm) {
      var num = byName[String(nm).trim().toLowerCase()];
      if (num != null) {
        html += '<span class="pick" data-num="' + num + '">' + esc(nm) + '</span>';
      } else {
        html += '<span class="pick" data-nomatch="1" style="cursor:default">' + esc(nm) + '</span>';
      }
    });
    host.innerHTML = html;
    host.classList.add('show');

    host.querySelectorAll('.pick[data-num]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var num = +chip.dataset.num;
        if (claims.indexOf(num) < 0) toggleClaim(num); // claim + scroll handled inside
        else {
          var blk = document.querySelector('.cardblock[data-num="' + num + '"]');
          if (blk) blk.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
    markNudgeDone();
  }

  // Grey out a nudge chip once that card is claimed, so it reads as handled.
  function markNudgeDone() {
    var host = document.getElementById('nudge');
    if (!host) return;
    host.querySelectorAll('.pick[data-num]').forEach(function (chip) {
      chip.classList.toggle('done', claims.indexOf(+chip.dataset.num) >= 0);
    });
  }

  // ---- init ----------------------------------------------------------
  buildRoster();
  buildNudge();
  renderDeck();
})();
