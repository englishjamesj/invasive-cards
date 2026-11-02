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
    // Which cards to fan across the hero (by num). Pick your strongest.
    heroFan: [3, 14, 1, 6, 11]
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

  // ---- INIT ----------------------------------------------------------
  buildFan();
  renderGrid(CARDS);
  wireControls();
  wireGeneral();
  wireSci();
})();
