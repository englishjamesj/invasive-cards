/* =====================================================================
   card_facets.js — lightweight per-card FACETS for the Portfolio
   "Sort by State" / multi-facet filter tool (index.html + app.js).
   Loaded alongside data/cards.js and data/card_states.js. STANDALONE +
   hand-editable (NOT emitted by generate.ps1 yet) — a one-file re-upload.

   window.CARD_FACETS[cardNum] = {
     taxon:   "<taxon>",          // one of the TAXA vocab below
     primary: "<region>",         // ecoregion lens: where DOI/USGS program $$/attention sits
     alsoFits:[ "<region>", ... ] // honest wider range, for cross-region pack filtering
     wave:    <int 1..10>         // 5-card release wave (packs ship 5 serialized cards)
   }

   WHY THIS FILE EXISTS (and is separate):
   - The AUTHORITATIVE region model lives in the Builder's species_data.js as a
     `regions:{ primary, alsoFits[], serialTarget, wave, ... }` block — but that block
     was only added to the UNBUILT tail (#22-50). The built #1-21 don't carry it yet,
     so these facets are derived HERE (best-guess, hand-editable) to power the tool now.
     FUTURE TIDY-UP: have generate.ps1 emit card_facets.js from species_data.js's
     `regions` block so there's a single source (same plan as card_states.js).

   ECOREGION VOCAB (8-region working lens from PROJECT_NOTES 2026-11-02 B). primary =
   where DOI/USGS program attention/$$ sits (NOT necessarily where the species is worst);
   alsoFits = honest wider range. Comms/Leadership can re-slice later (DOI Unified Regions,
   HUC, political/caucus lines) — this is one lens, not the only one.
     Southeast | Great Lakes | Mississippi Basin | West | Pacific Coast |
     Northeast | Pacific Islands | Nationwide

   TAXA VOCAB: mammal | reptile | fish | insect | plant | mollusk | crustacean |
   amphibian | alga   (matches the Builder taxon tally vocabulary).

   WAVE = 5-card release wave (collector model). #1-21 fall in waves 1-5:
     W1 = #1-5, W2 = #6-10, W3 = #11-15, W4 = #16-20, W5 = #21 (+ the unbuilt #22-25).

   *** BEST-GUESS DRAFT — validate alongside card_states.js as SME input arrives. ***
   Card numbers = PORTFOLIO build order (matches data/cards.js: 1 Black Rat .. 21 Grass Carp).
   ===================================================================== */
window.CARD_FACETS = {
  // 1 Black Rat — commensal, warm coastal + island core; truly nationwide/global.
  1:  { taxon: "mammal",     primary: "Nationwide",       alsoFits: ["Pacific Islands","Pacific Coast","Southeast"], wave: 1 },

  // 2 Brown Treesnake — Guam; Pacific-island biosecurity program.
  2:  { taxon: "reptile",    primary: "Pacific Islands",  alsoFits: [], wave: 1 },

  // 3 Burmese Python — S. Florida Everglades; USGS SE program.
  3:  { taxon: "reptile",    primary: "Southeast",        alsoFits: [], wave: 1 },

  // 4 Spotted Lanternfly — mid-Atlantic/NE epicenter (PA); USDA/state quarantines.
  4:  { taxon: "insect",     primary: "Northeast",        alsoFits: ["Great Lakes","Southeast"], wave: 1 },

  // 5 Zebra Mussel — Great Lakes birthplace + eastern Miss. drainage; spreading West.
  5:  { taxon: "mollusk",    primary: "Great Lakes",      alsoFits: ["Mississippi Basin","Northeast","West"], wave: 1 },

  // 6 Feral Hog — South/CA core, expanding; nationwide damage program.
  6:  { taxon: "mammal",     primary: "Southeast",        alsoFits: ["West","Mississippi Basin","Nationwide"], wave: 2 },

  // 7 Silver Carp — Mississippi/Missouri/Ohio/Illinois basins; Great Lakes front.
  7:  { taxon: "fish",       primary: "Mississippi Basin",alsoFits: ["Great Lakes"], wave: 2 },

  // 8 Southern House Mosquito — warm South + Hawaii (avian-malaria; USGS PIERC).
  8:  { taxon: "insect",     primary: "Pacific Islands",  alsoFits: ["Southeast","West","Nationwide"], wave: 2 },

  // 9 Kudzu — Southeast core, creeping north.
  9:  { taxon: "plant",      primary: "Southeast",        alsoFits: ["Mississippi Basin","Northeast"], wave: 2 },

  // 10 Red Imported Fire Ant — Southern tier + PR; edge spread.
  10: { taxon: "insect",     primary: "Southeast",        alsoFits: ["Mississippi Basin","West","Pacific Islands"], wave: 2 },

  // 11 Sea Lamprey — INVASIVE Great Lakes / NATIVE Atlantic; USGS/GLFC program.
  11: { taxon: "fish",       primary: "Great Lakes",      alsoFits: ["Northeast"], wave: 3 },

  // 12 Bighead Carp — same Mississippi-basin footprint as silver carp.
  12: { taxon: "fish",       primary: "Mississippi Basin",alsoFits: ["Great Lakes"], wave: 3 },

  // 13 Hydrilla — SE/Gulf core + Atlantic + CA; many states.
  13: { taxon: "plant",      primary: "Southeast",        alsoFits: ["Pacific Coast","Northeast","Mississippi Basin"], wave: 3 },

  // 14 Lionfish — MARINE/COASTAL (coastal-waters rule); SE Atlantic + Gulf + Caribbean.
  14: { taxon: "fish",       primary: "Southeast",        alsoFits: [], wave: 3 },

  // 15 Cheatgrass — Great Basin / Intermountain West; USGS fire-cycle program.
  15: { taxon: "plant",      primary: "West",             alsoFits: ["Pacific Coast"], wave: 3 },

  // 16 Coconut Rhinoceros Beetle — Pacific U.S. islands.
  16: { taxon: "insect",     primary: "Pacific Islands",  alsoFits: [], wave: 4 },

  // 17 Northern Snakehead — Chesapeake/Potomac + Hudson + lower-Miss foothold.
  17: { taxon: "fish",       primary: "Northeast",        alsoFits: ["Mississippi Basin","Southeast"], wave: 4 },

  // 18 Blue Catfish — INVASIVE Chesapeake / NATIVE Miss-Ohio-Missouri; USGS/Chesapeake.
  18: { taxon: "fish",       primary: "Northeast",        alsoFits: ["Southeast","Mississippi Basin"], wave: 4 },

  // 19 Golden Mussel — brand-new CA Delta (2024); USGS/CA rapid response.
  19: { taxon: "mollusk",    primary: "Pacific Coast",    alsoFits: ["West"], wave: 4 },

  // 20 Black Carp — Lower/Mid Mississippi basin.
  20: { taxon: "fish",       primary: "Mississippi Basin",alsoFits: ["Great Lakes"], wave: 4 },

  // 21 Grass Carp — Mississippi basin + reproducing in Lake Erie tributaries.
  21: { taxon: "fish",       primary: "Mississippi Basin",alsoFits: ["Great Lakes","Southeast"], wave: 5 }
};
