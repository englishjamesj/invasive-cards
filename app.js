/* =====================================================================
   app.js - behavior for the Invasive Species Trading Card portfolio.
   Reads window.CARDS (from data/cards.js). No build step, no deps.
   ===================================================================== */
(function () {
  'use strict';

  // ---- CONFIG you can tweak -----------------------------------------
  var CONFIG = {
    email: 'jjenglish@usgs.gov',
    // Paste a Microsoft Form URL here later to show a "fill the form"
    // option alongside the email buttons. Leave '' to hide it.
    formUrl: '',
    // Which cards to fan across the hero (by num). Center (3rd) is the front-most hero.
    // Lionfish center (most eye-catching); mix of taxa (insect, mollusk, fish, plant, mammal).
    heroFan: [8, 19, 14, 9, 6]
  };

  var CARDS = (window.CARDS || []).slice().sort(function (a, b) { return a.num - b.num; });
  var byNum = {};
  CARDS.forEach(function (c) { byNum[c.num] = c; });

  // The five editable science fields (key -> human label).
  var SCI = [
    ['b_first',   'First seen / origin'],
    ['b_path',    'Pathway / how it spreads'],
    ['b_impacts', 'Impacts'],
    ['b_detect',  'Detection / identification'],
    ['b_manage',  'Management']
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function common(c) { return c.f_common || c.b_common || ('Card ' + c.num); }
  function sci(c) { return c.f_sci || c.b_sci || ''; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---- HERO FAN ------------------------------------------------------
  function buildFan() {
    var fan = document.getElementById('fan');
    if (!fan) return;
    CONFIG.heroFan.forEach(function (n) {
      var c = byNum[n];
      if (!c) return;
      var img = new Image();
      img.className = 'fcard';
      img.src = c.front;
      img.alt = common(c);
      fan.appendChild(img);
    });
  }

  // ---- GALLERY -------------------------------------------------------
  var gridEl = document.getElementById('grid');
  var currentList = CARDS.slice();

  function cardNode(c) {
    var card = el('div', 'card');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', common(c) + ' - click to flip');
    card.dataset.num = c.num;

    var inner = el('div', 'inner');
    var front = el('div', 'face front');
    var fimg = new Image(); fimg.loading = 'lazy'; fimg.src = c.front; fimg.alt = common(c) + ' front';
    front.appendChild(fimg);

    var back = el('div', 'face back');
    if (c.back) {
      var bimg = new Image(); bimg.loading = 'lazy'; bimg.src = c.back; bimg.alt = common(c) + ' back';
      back.appendChild(bimg);
    } else {
      back.innerHTML = '<div style="display:grid;place-items:center;height:100%;color:#888">No back</div>';
    }

    var num = el('div', 'cnum', '#' + c.num);

    var tools = el('div', 'tools');
    var bFlip = el('button', null, '&#8635;'); bFlip.title = 'Flip'; bFlip.setAttribute('aria-label', 'Flip card');
    var bZoom = el('button', null, '&#9974;'); bZoom.title = 'Enlarge'; bZoom.setAttribute('aria-label', 'Enlarge card');
    tools.appendChild(bFlip); tools.appendChild(bZoom);

    inner.appendChild(front); inner.appendChild(back);
    card.appendChild(num); card.appendChild(inner); card.appendChild(tools);

    var label = el('div', 'label',
      '<div class="nm">' + esc(common(c)) + '</div><div class="sc">' + esc(sci(c)) + '</div>');
    card.appendChild(label);

    // interactions
    function flip(e) { if (e) e.stopPropagation(); card.classList.toggle('flipped'); }
    card.addEventListener('click', flip);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    bFlip.addEventListener('click', flip);
    bZoom.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(c.num); });

    // cursor tilt (skipped when reduced-motion)
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.addEventListener('mousemove', function (e) {
        if (card.classList.contains('flipped')) { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '180deg'); return; }
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.setProperty('--ry', (px * 12).toFixed(2) + 'deg');
        inner.style.setProperty('--rx', (-py * 12).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', function () {
        inner.style.setProperty('--rx', '0deg');
        inner.style.setProperty('--ry', card.classList.contains('flipped') ? '180deg' : '0deg');
      });
    }

    return card;
  }

  function renderGrid(list) {
    currentList = list;
    gridEl.innerHTML = '';
    if (!list.length) {
      gridEl.innerHTML = '<p style="color:#667">No species match that search.</p>';
      return;
    }
    var frag = document.createDocumentFragment();
    list.forEach(function (c) { frag.appendChild(cardNode(c)); });
    gridEl.appendChild(frag);
  }

  // ---- SEARCH + VIEW TOGGLE -----------------------------------------
  function wireControls() {
    var q = document.getElementById('q');
    q.addEventListener('input', function () {
      var t = q.value.trim().toLowerCase();
      if (!t) { renderGrid(CARDS); return; }
      renderGrid(CARDS.filter(function (c) {
        return (common(c) + ' ' + sci(c) + ' ' + (c.f_teamA || '') + ' ' + (c.f_teamB || '')).toLowerCase().indexOf(t) >= 0;
      }));
    });

    var vg = document.getElementById('viewGrid');
    var vw = document.getElementById('viewWall');
    vg.addEventListener('click', function () {
      gridEl.classList.remove('wall'); vg.classList.add('on'); vw.classList.remove('on');
    });
    vw.addEventListener('click', function () {
      gridEl.classList.add('wall'); vw.classList.add('on'); vg.classList.remove('on');
    });
  }

  // ---- LIGHTBOX ------------------------------------------------------
  var lb = document.getElementById('lb');
  var lbInner = document.getElementById('lbInner');
  var lbFront = document.getElementById('lbFront');
  var lbBack = document.getElementById('lbBack');
  var lbCap = document.getElementById('lbCap');
  var lbIndex = 0;

  function openLightbox(num) {
    lbIndex = currentList.findIndex(function (c) { return c.num === num; });
    if (lbIndex < 0) lbIndex = 0;
    showLightbox();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function showLightbox() {
    var c = currentList[lbIndex];
    if (!c) return;
    lbInner.classList.remove('flipped');
    lbFront.src = c.frontZoom || c.front;
    lbFront.alt = common(c) + ' front';
    if (c.backZoom || c.back) { lbBack.src = c.backZoom || c.back; lbBack.alt = common(c) + ' back'; }
    lbCap.textContent = '#' + c.num + '  ' + common(c);
  }
  function closeLightbox() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  function step(d) {
    lbIndex = (lbIndex + d + currentList.length) % currentList.length;
    showLightbox();
  }
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbFlip').addEventListener('click', function () { lbInner.classList.toggle('flipped'); });
  document.getElementById('lbPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('lbNext').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'f' || e.key === 'F') lbInner.classList.toggle('flipped');
  });

  // ---- FEEDBACK: general notes --------------------------------------
  function mailto(subject, body) {
    return 'mailto:' + encodeURIComponent(CONFIG.email) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }
  function wireGeneral() {
    var btn = document.getElementById('sendGeneral');
    btn.addEventListener('click', function () {
      var notes = document.getElementById('gn').value.trim();
      var body = 'General feedback on the Invasive Species Trading Card portfolio:\n\n' +
        (notes || '(write your notes here)') + '\n\n---\nSent from the portfolio page.';
      window.location.href = mailto('Trading Cards - general feedback', body);
    });

    // Footer mail + optional Form note
    var fm = document.getElementById('footMail');
    if (fm) fm.href = mailto('Trading Cards - feedback', '');
    var note = document.getElementById('formNote');
    if (CONFIG.formUrl) {
      note.innerHTML = 'Prefer a form? <a href="' + esc(CONFIG.formUrl) + '" target="_blank" rel="noopener">Open the feedback form &rarr;</a>';
    } else {
      note.textContent = 'This opens your email with the notes prefilled, addressed to ' + CONFIG.email + '.';
    }
  }

  // ---- FEEDBACK: per-card science edit ------------------------------
  function wireSci() {
    var pick = document.getElementById('sciPick');
    var fieldsEl = document.getElementById('sciFields');

    CARDS.forEach(function (c) {
      var o = el('option');
      o.value = c.num;
      o.textContent = '#' + c.num + '  ' + common(c);
      pick.appendChild(o);
    });

    function renderFields(c) {
      fieldsEl.innerHTML = '';
      SCI.forEach(function (pair) {
        var key = pair[0], lab = pair[1];
        var orig = c[key] || '';
        var wrap = el('div', 'field');
        wrap.dataset.key = key;
        wrap.innerHTML =
          '<label>' + esc(lab) + '</label>' +
          '<textarea rows="2">' + esc(orig) + '</textarea>' +
          '<div class="orig"><strong>Original:</strong> ' + esc(orig) + '</div>';
        var ta = wrap.querySelector('textarea');
        ta.dataset.orig = orig;
        ta.addEventListener('input', function () {
          wrap.classList.toggle('changed', ta.value !== orig);
        });
        fieldsEl.appendChild(wrap);
      });
    }

    pick.addEventListener('change', function () { renderFields(byNum[+pick.value]); });
    renderFields(byNum[+pick.value || CARDS[0].num]);

    document.getElementById('sendSci').addEventListener('click', function () {
      var c = byNum[+pick.value];
      var lines = ['Science edits for card #' + c.num + ' - ' + common(c) + ' (' + sci(c) + '):', ''];
      var any = false;
      SCI.forEach(function (pair) {
        var wrap = fieldsEl.querySelector('.field[data-key="' + pair[0] + '"]');
        var ta = wrap.querySelector('textarea');
        if (ta.value !== ta.dataset.orig) {
          any = true;
          lines.push('### ' + pair[1]);
          lines.push('ORIGINAL: ' + ta.dataset.orig);
          lines.push('SUGGESTED: ' + ta.value);
          lines.push('');
        }
      });
      if (!any) { lines.push('(No boxes were changed. Edit the text above, then send.)'); }
      lines.push('---\nSent from the portfolio page.');
      window.location.href = mailto('Trading Cards - science edit: #' + c.num + ' ' + common(c), lines.join('\n'));
    });
  }

  // ---- SORT BY STATE (slicer) ---------------------------------------
  // Reads window.CARD_STATES (present/native/onDeck + status) and
  // window.CARD_FACETS (taxon/primary/alsoFits/wave). Both are optional;
  // the section quietly hides if either is missing.
  var STATES = window.CARD_STATES || null;
  var FACETS = window.CARD_FACETS || null;

  // USPS code -> full name (50 + DC + 5 territories). Order: states A-Z, then DC + territories.
  var JURIS = [
    ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
    ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
    ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
    ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
    ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
    ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
    ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
    ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
    ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
    ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
    ['DC','District of Columbia'],
    ['PR','Puerto Rico'],['GU','Guam'],['VI','U.S. Virgin Islands'],['AS','American Samoa'],['MP','No. Mariana Islands']
  ];
  var JNAME = {}; JURIS.forEach(function (p) { JNAME[p[0]] = p[1]; });

  // "continuous" species with a long present list get collapsed/labeled so a
  // ~40-state species doesn't swamp a single state's list.
  var WIDE_THRESHOLD = 18; // present-count at/above which we treat a card as "widely established"

  function facet(num) { return (FACETS && FACETS[num]) || {}; }
  function states(num) { return (STATES && STATES[num]) || null; }

  // latest keyed year in a present object; present may be an array (no years) or {year:[...]}.
  function presentInfo(st) {
    if (!st || !st.present) return { codes: [], year: null };
    var p = st.present;
    if (Array.isArray(p)) return { codes: p, year: null };
    // year-keyed object: pick the latest year, union its codes (fallback: union all years)
    var years = Object.keys(p).sort();
    if (!years.length) return { codes: [], year: null };
    var latest = years[years.length - 1];
    return { codes: (p[latest] || []).slice(), year: latest };
  }

  function isWide(num) {
    var st = states(num);
    if (!st) return false;
    if (st.status === 'continuous') return true;
    return presentInfo(st).codes.length >= WIDE_THRESHOLD;
  }

  // Which of the three buckets does card `num` land in for `code`?
  // Returns {present:bool, native:bool, onDeck:bool}.
  function bucketsFor(num, code) {
    var st = states(num);
    var out = { present: false, native: false, onDeck: false };
    if (!st || !code) return out;
    out.present = presentInfo(st).codes.indexOf(code) >= 0;
    out.native  = (st.native  || []).indexOf(code) >= 0;
    out.onDeck  = (st.onDeck  || []).indexOf(code) >= 0;
    return out;
  }

  // Does card `num` match the (non-state) facet filters? empty filter = matches.
  function facetMatch(num, f) {
    var fc = facet(num);
    if (f.region && f.region !== 'any') {
      var regs = [fc.primary].concat(fc.alsoFits || []);
      if (regs.indexOf(f.region) < 0) return false;
    }
    if (f.taxon && f.taxon !== 'any' && fc.taxon !== f.taxon) return false;
    if (f.wave && f.wave !== 'any' && String(fc.wave) !== String(f.wave)) return false;
    return true;
  }
  function facetsActive(f) {
    return (f.region && f.region !== 'any') ||
           (f.taxon && f.taxon !== 'any') ||
           (f.wave && f.wave !== 'any');
  }

  function wireSlicer() {
    var section = document.getElementById('slicer');
    if (!section) return;
    if (!STATES || !FACETS) { section.style.display = 'none'; return; }

    var selState   = document.getElementById('slState');
    var selRegion  = document.getElementById('slRegion');
    var selTaxon   = document.getElementById('slTaxon');
    var selWave    = document.getElementById('slWave');
    var statusSeg  = document.getElementById('slStatusSeg');
    var combineSeg = document.getElementById('slCombineSeg');
    var resetBtn   = document.getElementById('slReset');
    var results    = document.getElementById('slResults');

    // --- populate state picker (only jurisdictions that appear on some card) ---
    var usedCodes = {};
    CARDS.forEach(function (c) {
      var st = states(c.num); if (!st) return;
      presentInfo(st).codes.forEach(function (x) { usedCodes[x] = true; });
      (st.native || []).forEach(function (x) { usedCodes[x] = true; });
      (st.onDeck || []).forEach(function (x) { usedCodes[x] = true; });
    });
    var o0 = el('option'); o0.value = ''; o0.textContent = 'Choose a state or territory\u2026'; selState.appendChild(o0);
    JURIS.forEach(function (p) {
      if (!usedCodes[p[0]]) return; // skip jurisdictions no built card touches yet
      var o = el('option'); o.value = p[0]; o.textContent = p[1] + ' (' + p[0] + ')';
      selState.appendChild(o);
    });

    // --- populate region picker from facet data (sorted, 'any' first) ---
    var regionSet = {};
    CARDS.forEach(function (c) {
      var fc = facet(c.num);
      if (fc.primary) regionSet[fc.primary] = true;
      (fc.alsoFits || []).forEach(function (r) { regionSet[r] = true; });
    });
    addOpt(selRegion, 'any', 'Any region');
    Object.keys(regionSet).sort().forEach(function (r) { addOpt(selRegion, r, r); });

    // --- taxon picker ---
    var taxonSet = {};
    CARDS.forEach(function (c) { var t = facet(c.num).taxon; if (t) taxonSet[t] = true; });
    addOpt(selTaxon, 'any', 'Any taxon');
    Object.keys(taxonSet).sort().forEach(function (t) {
      addOpt(selTaxon, t, t.charAt(0).toUpperCase() + t.slice(1));
    });

    // --- wave picker ---
    var waveSet = {};
    CARDS.forEach(function (c) { var w = facet(c.num).wave; if (w != null) waveSet[w] = true; });
    addOpt(selWave, 'any', 'Any wave');
    Object.keys(waveSet).map(Number).sort(function (a, b) { return a - b; }).forEach(function (w) {
      addOpt(selWave, String(w), 'Wave ' + w);
    });

    function addOpt(sel, val, label) {
      var o = el('option'); o.value = val; o.textContent = label; sel.appendChild(o);
    }

    // --- segmented controls state ---
    var statusOn = { present: true, onDeck: true, native: true };
    var combine = 'intersection';

    statusSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var s = b.dataset.status;
      statusOn[s] = !statusOn[s];
      // never allow all three off
      if (!statusOn.present && !statusOn.onDeck && !statusOn.native) { statusOn[s] = true; return; }
      b.classList.toggle('on', statusOn[s]);
      b.setAttribute('aria-pressed', String(statusOn[s]));
      render();
    });
    combineSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      combine = b.dataset.combine;
      Array.prototype.forEach.call(combineSeg.children, function (x) {
        var on = x.dataset.combine === combine;
        x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on));
      });
      render();
    });

    [selState, selRegion, selTaxon, selWave].forEach(function (s) {
      s.addEventListener('change', render);
    });
    resetBtn.addEventListener('click', function () {
      selState.value = ''; selRegion.value = 'any'; selTaxon.value = 'any'; selWave.value = 'any';
      statusOn = { present: true, onDeck: true, native: true };
      Array.prototype.forEach.call(statusSeg.children, function (b) {
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
      });
      combine = 'intersection';
      Array.prototype.forEach.call(combineSeg.children, function (x) {
        var on = x.dataset.combine === 'intersection';
        x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on));
      });
      render();
    });

    // --- a single mini card node ---
    function miniNode(c, flag) {
      var a = el('div', 'mini');
      a.setAttribute('tabindex', '0');
      a.setAttribute('role', 'button');
      a.setAttribute('aria-label', common(c) + ' - enlarge');
      var flagHtml = '';
      if (flag) flagHtml = '<span class="flag ' + flag.cls + '">' + esc(flag.text) + '</span>';
      a.innerHTML =
        '<div class="thumb"><span class="mnum">#' + c.num + '</span>' + flagHtml +
          '<img loading="lazy" src="' + esc(c.front) + '" alt="' + esc(common(c)) + ' front"></div>' +
        '<div class="mcap"><div class="nm">' + esc(common(c)) + '</div>' +
          '<div class="sc">' + esc(sci(c)) + '</div></div>';
      function open() { openLightbox(c.num); }
      a.addEventListener('click', open);
      a.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
      return a;
    }

    function bucketBlock(key, title, sub, items, flagFn) {
      var wrap = el('div', 'bucket b-' + key);
      var dot = key === 'present' ? 'dot-present' : key === 'native' ? 'dot-native' : 'dot-ondeck';
      var head = el('div', 'bucket-head');
      head.innerHTML =
        '<h3><span class="dot ' + dot + '"></span>' + esc(title) +
        '<span class="b-count">' + items.length + '</span></h3>' +
        '<span class="b-sub">' + esc(sub) + '</span>';
      wrap.appendChild(head);
      if (!items.length) {
        wrap.appendChild(el('div', 'bucket-empty', 'No cards in this group for the current filters.'));
        return wrap;
      }
      var grid = el('div', 'mini-grid');
      items.forEach(function (c) { grid.appendChild(miniNode(c, flagFn ? flagFn(c) : null)); });
      wrap.appendChild(grid);
      return wrap;
    }

    function render() {
      var f = {
        state:  selState.value,
        region: selRegion.value,
        taxon:  selTaxon.value,
        wave:   selWave.value
      };
      results.innerHTML = '';

      // No state picked: show a facet-only grid (region/taxon/wave) or a prompt.
      if (!f.state) {
        if (!facetsActive(f)) {
          results.innerHTML =
            '<div class="slicer-none">Pick a <b>state or territory</b> above to split the series into ' +
            '<b>Invasive here</b>, <b>Native here</b>, and <b>Invaders On Deck</b> &mdash; ' +
            'or set a region, taxon, or wave to browse a cross-state slice.</div>';
          return;
        }
        var matched = CARDS.filter(function (c) { return facetMatch(c.num, f); });
        var sumF = el('p', 'slicer-summary');
        sumF.innerHTML = 'Cross-state slice &middot; <span class="cnt">' + matched.length + '</span> card' +
          (matched.length === 1 ? '' : 's') + ' match these facets';
        results.appendChild(sumF);
        results.appendChild(el('p', 'state-blurb',
          'No state picked, so these aren\u2019t split by status. Pick a state to see invasive / native / on-deck.'));
        results.appendChild(bucketBlock('present', 'Matching cards', facetLabel(f), matched, flagForWide));
        return;
      }

      // State picked: build the three buckets, respecting facet + combine mode.
      var code = f.state;
      var stName = JNAME[code] || code;
      var anyFacets = facetsActive(f);

      var groups = { present: [], native: [], onDeck: [] };
      CARDS.forEach(function (c) {
        var b = bucketsFor(c.num, code);
        var inState = b.present || b.native || b.onDeck;
        var fm = facetMatch(c.num, f);

        var pass;
        if (!anyFacets) {
          pass = inState;
        } else if (combine === 'union') {
          pass = inState || fm;       // state OR facets
        } else {
          pass = inState && fm;       // state AND facets
        }
        if (!pass) return;

        // In union mode a card may match facets but not the state; it has no
        // state-bucket, so file it under present (its strongest "here" sense) only
        // if it actually sits in the state; otherwise skip bucketing (handled below).
        if (b.present && statusOn.present) groups.present.push(c);
        else if (b.onDeck && statusOn.onDeck) groups.onDeck.push(c);
        else if (b.native && statusOn.native) groups.native.push(c);
        else if (combine === 'union' && !inState) {
          // facet-only match in union mode: show under a present-style "also matches" lane
          groups.present.push(c);
        }
      });

      var total = groups.present.length + groups.native.length + groups.onDeck.length;

      var sum = el('p', 'slicer-summary');
      sum.innerHTML = stName + ' &middot; <span class="cnt">' + total + '</span> card' +
        (total === 1 ? '' : 's') + ' from the first 21' + (anyFacets ? ' &middot; ' + esc(facetLabel(f)) + ' (' + combine + ')' : '');
      results.appendChild(sum);

      results.appendChild(el('p', 'state-blurb',
        'Grouped by role in ' + stName + '. A species can be invasive in one state and native in another \u2014 ' +
        'the groups below keep that honest.'));

      if (statusOn.present) {
        results.appendChild(bucketBlock('present', 'Invasive here',
          'Established & causing harm in ' + stName + ' now.', groups.present, flagForWide));
      }
      if (statusOn.onDeck) {
        results.appendChild(bucketBlock('onDeck', 'Invaders On Deck',
          'Approaching or at risk \u2014 not established yet.', groups.onDeck, flagForWide));
      }
      if (statusOn.native) {
        results.appendChild(bucketBlock('native', 'Native here',
          'Naturally occurs in ' + stName + ' \u2014 NOT invasive here.', groups.native, flagForWide));
      }

      // widely-established note if any shown card is continuous/wide
      var wideShown = groups.present.concat(groups.onDeck, groups.native).filter(function (c) { return isWide(c.num); });
      if (wideShown.length) {
        var names = wideShown.map(function (c) { return common(c); }).join(', ');
        var note = el('div', 'wide-note');
        note.innerHTML = '<b>Widely established:</b> ' + esc(names) + ' show up across many states ' +
          '(not just ' + esc(stName) + '). They\u2019re flagged <b>nationwide</b> so a single state\u2019s list ' +
          'isn\u2019t swamped by a 40-state species \u2014 in a real pack we\u2019d usually cap how many of these ride along.';
        results.appendChild(note);
      }
    }

    function flagForWide(c) {
      if (isWide(c.num)) return { cls: 'flag-wide', text: 'Nationwide' };
      var st = states(c.num);
      var yr = st ? presentInfo(st).year : null;
      if (yr) return { cls: 'flag-yr', text: yr };
      return null;
    }

    function facetLabel(f) {
      var parts = [];
      if (f.region && f.region !== 'any') parts.push(f.region);
      if (f.taxon && f.taxon !== 'any') parts.push(f.taxon.charAt(0).toUpperCase() + f.taxon.slice(1));
      if (f.wave && f.wave !== 'any') parts.push('Wave ' + f.wave);
      return parts.length ? parts.join(' + ') : 'all facets';
    }

    render();
  }

  // ---- INIT ----------------------------------------------------------
  buildFan();
  renderGrid(CARDS);
  wireControls();
  wireGeneral();
  wireSci();
  wireSlicer();
})();
