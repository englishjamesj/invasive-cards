/* =====================================================================
   card_states.js — per-card state/territory lists for the SME review tool.
   Loaded by review.html alongside data/cards.js. STANDALONE + hand-editable
   (NOT emitted by generate.ps1 yet), so updating it is a one-file re-upload.

   window.CARD_STATES[cardNum] = {
     present: [ ...USPS codes... ],   // "Known infestation" \u2014 established & INVASIVE here now (2026)
     native:  [ ...USPS codes... ],   // "Native here" \u2014 naturally occurs, NOT invasive in this state
     onDeck:  [ ...USPS codes... ]    // "Invaders On Deck" \u2014 approaching / at risk, not yet established
   }
   THREE buckets so species that are invasive in some states but NATIVE in others
   (e.g. Sea Lamprey, Blue Catfish, Walleye) read honestly everywhere. A clean
   foreign invader just leaves `native` empty.

   MARINE/COASTAL RULE: a marine or coastal invader is ascribed to a state if it is
   in that state's COASTAL WATERS \u2014 even though the animal isn't on land "in" the
   state. One consistent convention (vs. letting it vary authority-by-authority).
   Applies to Lionfish (#14) and the coastal crustaceans (European Green Crab,
   Chinese Mitten Crab) in the tail.

   Codes = USPS 2-letter, incl. territories: DC, PR (Puerto Rico), GU (Guam),
   VI (U.S. Virgin Islands), AS (American Samoa), MP (No. Mariana Islands).

   These PRE-CHECK the checkboxes in the review tool so SMEs CORRECT our best
   guess rather than build from scratch. Seeded (2026-11-02) from the USGS-first
   resource priority: USGS (NAS, INHABIT, Siren) > other DOI > other Feds >
   State/Territory/Tribal/Regional/NGO > peer-reviewed > EDDMapS & iMapInvasives.

   *** BEST-GUESS DRAFT \u2014 SMEs validate. *** For widely/continuously distributed
   species (feral hog, kudzu, fire ant, cheatgrass, starling-type), `present` is a
   representative core, not an exhaustive 40-state list; `status:"continuous"` flags
   those so a future tool can treat them as "shows up broadly." `onDeck` = the
   leading-edge / high-risk states just beyond the current front.

   NOTE: card numbers here are the PORTFOLIO build order (matches data/cards.js:
   1 Black Rat ... 21 Grass Carp). The review tool currently loads these 21.
   ===================================================================== */
window.CARD_STATES = {
  // 1 Black Rat — commensal; warm coastal + island core. Continuous-ish.
  1:  { present: ["CA","FL","TX","LA","GA","SC","NC","VA","AL","MS","WA","OR","HI","PR","GU","VI","AS","MP"],
        onDeck: [], status: "continuous" },

  // 2 Brown Treesnake — established on Guam; Pacific islands at risk (esp. Hawaii).
  2:  { present: ["GU"], onDeck: ["HI","MP","AS"] },

  // 3 Burmese Python — established S. Florida; spreading edge north in FL.
  3:  { present: ["FL"], onDeck: ["GA","LA","TX"] },

  // 4 Spotted Lanternfly — PA epicenter + mid-Atlantic/NE spread (USDA/state quarantines).
  4:  { present: ["PA","NJ","DE","MD","VA","WV","NY","CT","OH","IN","MI","NC","MA","RI"],
        onDeck: ["KY","TN","IL","DC","VT","NH","GA"] },

  // 5 Zebra Mussel — Great Lakes + eastern Mississippi drainage; NAS: ~31 states. Representative core.
  5:  { present: ["MI","WI","MN","IL","IN","OH","PA","NY","VT","KY","TN","AR","MO","IA","MS","LA","WV","OK","KS","NE","SD","ND","TX","CO","CA","UT","VA"],
        onDeck: ["MT","WY","ID","NV","AZ","WA","OR","NM"], status: "continuous" },

  // 6 Feral Hog — established across the South/CA; expanding north. Continuous.
  6:  { present: ["TX","OK","LA","AR","MS","AL","GA","FL","SC","NC","TN","MO","KS","CA","AZ","NM","HI","OR","OH","WV","KY","VA"],
        onDeck: ["CO","NE","IA","IL","IN","PA","WA","UT"], status: "continuous" },

  // 7 Silver Carp — Mississippi/Missouri/Ohio/Illinois basins; edge toward Great Lakes.
  7:  { present: ["IL","MO","IA","KY","TN","AR","MS","LA","IN","OH","KS","NE","SD","MN","WI","AL","KY"],
        onDeck: ["MI","OK","TX","PA","WV"] },

  // 8 Southern House Mosquito — warm South + Hawaii (avian-malaria vector).
  8:  { present: ["HI","FL","TX","LA","MS","AL","GA","SC","NC","CA","AZ","NM","AR","OK","TN","PR","GU","AS","MP","VI"],
        onDeck: [], status: "continuous" },

  // 9 Kudzu — Southeast core, spreading north. Continuous.
  9:  { present: ["GA","AL","MS","SC","NC","TN","KY","VA","FL","LA","AR","TX","OK","MO","WV","MD","DE","NJ","PA","OH","IN","IL"],
        onDeck: ["KS","CT","NY","MA"], status: "continuous" },

  // 10 Red Imported Fire Ant — quarantined Southern tier + PR; edge spread. Continuous.
  10: { present: ["TX","OK","LA","AR","MS","AL","GA","FL","SC","NC","TN","CA","NM","VA","PR"],
        onDeck: ["AZ","MD","KY","DE"], status: "continuous" },

  // 11 Sea Lamprey — INVASIVE in the Great Lakes; NATIVE along the Atlantic coast.
  11: { present: ["MI","WI","MN","IL","IN","OH","PA","NY"],
        native: ["ME","NH","MA","RI","CT","NY","NJ","DE","MD","VA","NC"],
        onDeck: [] },

  // 12 Bighead Carp — same Mississippi-basin footprint as silver carp.
  12: { present: ["IL","MO","IA","KY","TN","AR","MS","LA","IN","OH","KS","NE","SD","MN","WI","AL"],
        onDeck: ["MI","OK","TX","PA","WV"] },

  // 13 Hydrilla — SE/Gulf core + Atlantic + CA; many states. Representative core.
  13: { present: ["FL","GA","SC","NC","VA","AL","MS","LA","TX","TN","MD","DE","CT","CA","AZ","WA","PR"],
        onDeck: ["OK","AR","KY","NJ","NY","MA"], status: "continuous" },

  // 14 Lionfish — MARINE/COASTAL. RULE: ascribe to a state if it's in that state's
  // COASTAL WATERS (even though not on land). SE Atlantic + Gulf + Caribbean.
  14: { present: ["NC","SC","GA","FL","AL","MS","LA","TX","PR","VI"],
        native: [], onDeck: ["VA"] },

  // 15 Cheatgrass — Great Basin / Intermountain West dominance. Continuous.
  15: { present: ["NV","UT","ID","OR","WA","CA","MT","WY","CO","AZ","NM","ND","SD","NE","KS"],
        onDeck: ["TX","OK","MN"], status: "continuous" },

  // 16 Coconut Rhinoceros Beetle — Pacific U.S. islands.
  16: { present: ["GU","HI","MP","AS"],
        onDeck: [] },

  // 17 Northern Snakehead — Chesapeake (Potomac) + NY/Hudson + Lower Miss foothold (AR/MS).
  17: { present: ["MD","VA","DC","DE","PA","NY","NJ","AR","MS"],
        onDeck: ["WV","NC","MO","LA","GA"] },

  // 18 Blue Catfish — INVASIVE in Chesapeake tidal rivers; NATIVE in the Mississippi/
  // Ohio/Missouri basins (classic "invasive here, native there" teaching case).
  18: { present: ["VA","MD","DC","NC"],
        native: ["MO","AR","LA","MS","TN","KY","IL","IN","OH","IA","KS","NE","OK","TX","AL","SD","MN","WI","ND"],
        onDeck: ["DE","PA","SC","GA"] },

  // 19 Golden Mussel — brand-new; CA Sacramento-San Joaquin Delta only (2024).
  19: { present: ["CA"],
        onDeck: ["NV","AZ","OR"] },

  // 20 Black Carp — Lower/Mid Mississippi basin (AR, IL, IN, KY, LA, MS, MO, TN).
  20: { present: ["AR","IL","IN","KY","LA","MS","MO","TN"],
        onDeck: ["IA","OH","AL","OK","TX"] },

  // 21 Grass Carp — Mississippi basin + reproducing in Lake Erie tributaries + scattered reservoirs.
  21: { present: ["IL","MO","IA","KY","TN","AR","MS","LA","IN","OH","KS","NE","SD","MN","WI","AL","TX","OK","AZ"],
        onDeck: ["MI","PA","NY","CA","CO"], status: "continuous" }
};
