// =========================================================
// Ratna Music — Catalog & shared utils  v2
// Added: Wind Instruments, Drums & Percussion categories
// =========================================================

const CATS = [
  { id: "traditional", en: "Traditional",        ne: "परम्परागत",    desc: "Handcrafted instruments rooted in Nepali ritual, raga, and folk." },
  { id: "guitars",     en: "Guitars",             ne: "गिटार",        desc: "Acoustic, classical, and electric guitars for every stage." },
  { id: "keyboards",   en: "Keyboards",           ne: "किबोर्ड",      desc: "Digital pianos, MIDI controllers, and synths." },
  { id: "audio",       en: "Audio Gear",          ne: "ध्वनि सामग्री", desc: "Mics, amps, interfaces — studio-grade tools." },
  { id: "accessories", en: "Accessories",         ne: "सामग्री",      desc: "Strings, picks, tuners, cases — the daily essentials." },
  { id: "wind",        en: "Wind Instruments",    ne: "वायु वाद्य",   desc: "Flutes, harmonicas, and wind instruments from Nepal and beyond." },
  { id: "drums",       en: "Drums & Percussion",  ne: "ताल वाद्य",    desc: "Madal, djembe, cymbals, and percussion instruments." },
];

const PH_TONES = ["", "dark", "saffron"];

const PRODUCTS = [
  // ===== Traditional (12) =====
  { id: "p01", name: "Madal (Classic)",         ne: "मादल",          cat: "traditional", price: 4500,  was: 5200,  tag: "Bestseller", origin: "Bhaktapur",  body: "buffalo hide",  desc: "Double-headed cylindrical drum, the rhythmic spine of Nepali folk music. Hand-tuned skin heads and rosewood shell." },
  { id: "p02", name: "Sarangi (4-string)",      ne: "सारङ्गी",        cat: "traditional", price: 8200,              tag: "Handmade",   origin: "Bhojpur",    body: "khirra wood",   desc: "Bowed lute of the wandering Gandharva minstrels. Carved from a single block of khirra wood, four gut strings." },
  { id: "p03", name: "Bansuri (Bamboo flute)",  ne: "बाँसुरी",        cat: "traditional", price: 1200,              tag: "New",        origin: "Dharan",     body: "bamboo",        desc: "Side-blown bamboo flute, key of C. Six finger holes, traditional tuning. Includes silk wrap and care guide.", darazUrl: "https://www.daraz.com.np/products/bamboo-flute-c-scale-bansuri-i105493736.html" },
  { id: "p04", name: "Tungna",                  ne: "तुङ्ना",         cat: "traditional", price: 6800,              tag: "Heritage",   origin: "Solukhumbu", body: "rhododendron",  desc: "Four-string lute of the Tamang and Sherpa communities. Hand-carved body, gut strings tuned A-D-A-D." },
  { id: "p05", name: "Damaru (Ritual drum)",    ne: "डमरू",           cat: "traditional", price: 1800,              origin: "Patan",      body: "wood + hide",   desc: "Small hourglass-shaped drum used in tantric rituals and folk performance. Beaded strikers and red cord." },
  { id: "p06", name: "Dhime Baja",              ne: "ध्यमे बाजा",     cat: "traditional", price: 9500,              tag: "Newari",     origin: "Patan",      body: "metal + hide",  desc: "Large barrel drum central to Newari processions. Polished metal shell, double-skin head, leather sling." },
  { id: "p07", name: "Murchunga (Jaw harp)",    ne: "मुर्चुङ्गा",      cat: "traditional", price: 650,               tag: "Pocketable", origin: "Kathmandu",  body: "forged iron",   desc: "Hand-forged iron jaw harp from the eastern hills. Pure overtones, fits in your shirt pocket." },
  { id: "p08", name: "Dhyangro (Shaman drum)",  ne: "ध्याङ्ग्रो",     cat: "traditional", price: 7800,              origin: "Dolakha",    body: "goat hide",     desc: "Single-headed frame drum used by Jhakri shamans. Carved wooden handle, painted symbolism." },
  { id: "p09", name: "Jhyamta (Cymbals)",       ne: "झ्याम्टा",       cat: "traditional", price: 2400,              origin: "Kathmandu",  body: "brass",         desc: "Hand-hammered brass cymbals, 8 inch. Bright ringing tone, paired with a cotton sling cord." },
  { id: "p10", name: "Hudko (Hourglass drum)",  ne: "हुड्को",         cat: "traditional", price: 5400,              origin: "Doti",       body: "wood + hide",   desc: "Tension-laced hourglass drum of the western hills. Pitch bends with squeeze — ideal for narrative folk songs." },
  { id: "p11", name: "Panche Baja Set",         ne: "पञ्चे बाजा",     cat: "traditional", price: 28500, tag: "Set", origin: "Tanahun",    body: "ensemble",      desc: "Traditional five-piece wedding ensemble: damaha, tyamko, dholaki, jhyali, narsingha. Sold as full set." },
  { id: "p12", name: "Bansuri (E-key concert)", ne: "बाँसुरी",        cat: "traditional", price: 2400,              tag: "Pro",        origin: "Dharan",     body: "bamboo",        desc: "Concert-grade bamboo flute in key of E. Seasoned bamboo, deeper resonance, sealed inner bore." },

  // ===== Guitars (10) =====
  { id: "p13", name: "Dreadnought Acoustic",    ne: "ध्वनि गिटार",   cat: "guitars",     price: 18500, was: 22000, tag: "Sale",       origin: "Imported",   body: "spruce top",    desc: "Solid spruce top, mahogany back and sides. Bright projection, comfortable neck for new players and pros alike." },
  { id: "p14", name: "Parlor Acoustic",         ne: "ध्वनि गिटार",   cat: "guitars",     price: 14200,             tag: "Compact",    origin: "Imported",   body: "mahogany",      desc: "Small-bodied folk guitar with a warm, focused voice. Comfortable for couch playing and recording." },
  { id: "p15", name: "Classical Nylon",         ne: "क्लासिकल",      cat: "guitars",     price: 9800,              origin: "Imported",   body: "cedar top",     desc: "Wide nut nylon-string classical. Cedar top with mahogany sides. Perfect for fingerstyle and beginners." },
  { id: "p16", name: "Stratocaster-style",      ne: "विद्युतीय गिटार", cat: "guitars",   price: 24500,             tag: "Pro",        origin: "Imported",   body: "alder",         desc: "Three single-coil pickups, five-way switch, tremolo bridge. Maple neck, rosewood fretboard." },
  { id: "p17", name: "Les Paul-style",          ne: "विद्युतीय गिटार", cat: "guitars",   price: 32000,             origin: "Imported",   body: "mahogany",      desc: "Double humbucker electric, set neck, sustain for days. Classic sunburst finish." },
  { id: "p18", name: "Telecaster-style",        ne: "विद्युतीय गिटार", cat: "guitars",   price: 22500,             origin: "Imported",   body: "ash",           desc: "Two single coils, bright bite. Maple neck, three-saddle bridge. The country and indie staple." },
  { id: "p19", name: "Acoustic-Electric",       ne: "ध्वनि-विद्युत", cat: "guitars",     price: 21000, tag: "Stage", origin: "Imported", body: "spruce top",  desc: "Built-in pickup and tuner, cutaway body. Plug straight into any PA — gig-ready from day one." },
  { id: "p20", name: "12-String Acoustic",      ne: "१२-तार गिटार",  cat: "guitars",     price: 26500,             origin: "Imported",   body: "spruce top",    desc: "Shimmering chorus tone from twelve strings. Reinforced neck, octave-paired stringing." },
  { id: "p21", name: "Bass (4-string)",         ne: "बेस गिटार",     cat: "guitars",     price: 19500,             origin: "Imported",   body: "basswood",      desc: "Precision-style bass with split-coil pickup. Maple neck, rosewood board. Punchy lows." },
  { id: "p22", name: "Travel Acoustic",         ne: "यात्रा गिटार",  cat: "guitars",     price: 11200, tag: "New", origin: "Imported",   body: "mahogany",      desc: "Short-scale travel guitar with full-size tone. Includes gig bag and trekking strap." },

  // ===== Keyboards (6) =====
  { id: "p23", name: "61-Key Arranger",         ne: "किबोर्ड",        cat: "keyboards",  price: 24800,             tag: "Bestseller", origin: "Imported",   body: "synth",         desc: "Touch-sensitive keys, 600+ voices, 200 styles, built-in speakers and recording. Great for teachers and stage." },
  { id: "p24", name: "88-Key Digital Piano",    ne: "डिजिटल पियानो",  cat: "keyboards",  price: 68000,             tag: "Pro",        origin: "Imported",   body: "weighted",      desc: "Fully weighted hammer action, three-pedal unit, polished wood-grain stand. Concert-grade sample library." },
  { id: "p25", name: "MIDI Controller 49",      ne: "मिडी कन्ट्रोलर", cat: "keyboards",  price: 14500,             origin: "Imported",   body: "USB",           desc: "49 semi-weighted keys, 8 pads, 8 knobs. USB-powered, plug-and-play with all major DAWs." },
  { id: "p26", name: "Synth (Analog-modeled)",  ne: "सिन्थेसाइजर",    cat: "keyboards",  price: 52000,             tag: "New",        origin: "Imported",   body: "synth",         desc: "Three-oscillator analog-modeled synth with filter envelope, LFO matrix, and step sequencer." },
  { id: "p27", name: "Stage Piano (73)",        ne: "स्टेज पियानो",   cat: "keyboards",  price: 84000,             origin: "Imported",   body: "weighted",      desc: "Lightweight stage piano. Premium grand piano samples, electric piano voices, organ engine. Built for the road." },
  { id: "p28", name: "Kids Mini Keyboard (37)", ne: "बाल किबोर्ड",    cat: "keyboards",  price: 4800,              origin: "Imported",   body: "synth",         desc: "37 mini keys, 100 voices, 100 rhythms, microphone input. The right first instrument." },

  // ===== Audio (6) =====
  { id: "p29", name: "Condenser Mic (Studio)",     ne: "माइक्रोफोन",        cat: "audio", price: 18500, tag: "Studio",    origin: "Imported", body: "XLR",          desc: "Large-diaphragm condenser, cardioid pattern. Includes shock mount and pop filter. -48V required." },
  { id: "p30", name: "Dynamic Vocal Mic",          ne: "माइक्रोफोन",        cat: "audio", price: 8200,               origin: "Imported", body: "XLR",          desc: "Live-stage vocal workhorse. Cardioid dynamic capsule, on/off switch, includes hardshell case." },
  { id: "p31", name: "USB Audio Interface (2-in)", ne: "अडियो इन्टरफेस",    cat: "audio", price: 16800, tag: "Bestseller", origin: "Imported", body: "USB-C",        desc: "Two combo XLR/TRS inputs, phantom power, direct monitoring. Plug and record at 24-bit/96kHz." },
  { id: "p32", name: "Guitar Combo Amp (15W)",     ne: "गिटार एम्प",         cat: "audio", price: 12500,              origin: "Imported", body: "8\" speaker",  desc: "Practice combo with clean and overdrive channels, headphone out, aux in. Perfect bedroom companion." },
  { id: "p33", name: "Stage Amp (40W)",            ne: "गिटार एम्प",         cat: "audio", price: 28500, tag: "Stage",    origin: "Imported", body: "12\" speaker", desc: "Gigging combo amp with reverb, three-band EQ, effects loop, foot-switchable channels." },
  { id: "p34", name: "Studio Headphones (closed)", ne: "हेडफोन",             cat: "audio", price: 9800,               origin: "Imported", body: "closed-back",  desc: "Closed-back monitoring headphones. Flat response, comfortable for long sessions, detachable cable." },

  // ===== Accessories (6) =====
  { id: "p35", name: "Acoustic Strings (set)",      ne: "तार",               cat: "accessories", price: 850,  tag: "Essential", origin: "Imported", body: "phosphor bronze", desc: "Light gauge phosphor bronze acoustic guitar strings. Long-lasting tone, sealed packaging." },
  { id: "p36", name: "Picks Tin (12 pcs)",          ne: "पिक",               cat: "accessories", price: 480,                  origin: "Imported", body: "celluloid",       desc: "Mixed-gauge celluloid picks in a reusable tin: thin, medium, heavy. Includes a felt pick." },
  { id: "p37", name: "Capo (Spring-loaded)",        ne: "क्यापो",             cat: "accessories", price: 1200,                 origin: "Imported", body: "aluminum",        desc: "Single-handed spring capo for acoustic and electric guitars. Smooth silicone pads, no string buzz." },
  { id: "p38", name: "Clip-On Tuner",               ne: "ट्युनर",             cat: "accessories", price: 1450, tag: "New",      origin: "Imported", body: "rotating head",   desc: "Chromatic clip-on tuner. Bright color display, vibration-sensing, fits guitar, bass, ukulele, violin." },
  { id: "p39", name: "Padded Gig Bag (Acoustic)",   ne: "गिग ब्याग",         cat: "accessories", price: 3200,                 origin: "Imported", body: "20mm padding",    desc: "Heavy-duty padded gig bag for dreadnought-size guitars. Backpack straps, accessory pocket." },
  { id: "p40", name: "Folding Guitar Stand",        ne: "गिटार स्ट्यान्ड",   cat: "accessories", price: 1850,                 origin: "Imported", body: "rubber-padded",   desc: "Foldable A-frame stand for acoustic and electric guitars. Rubberized contact points, packs small." },

  // ===== Wind (4) =====
  { id: "p41", name: "D Scale Bamboo Flute",    ne: "बाँसुरी", cat: "wind", price: 650,  origin: "Nepal",     body: "bamboo",  desc: "17-inch bamboo flute in D scale. 8 holes, naturally aged bamboo for impeccable tuning.", darazUrl: "https://www.daraz.com.np/products/d-scale-bamboo-flute-i104256050.html" },
  { id: "p42", name: "Recorder Flute",          ne: "रेकर्डर", cat: "wind", price: 300,  origin: "Imported",  body: "plastic", desc: "8-hole recorder flute. Clear sweet sound, strong and durable, comes with cleaning stick." },
  { id: "p43", name: "24-Hole Mouth Harmonica", ne: "हार्मोनिका", cat: "wind", price: 700, origin: "Imported", body: "steel",   desc: "24-hole chromatic harmonica. Length 17.5cm, light and portable." },
  { id: "p44", name: "Qi Mei 28-Hole Harmonica",ne: "हार्मोनिका", cat: "wind", price: 1800, tag: "Pro", origin: "Imported", body: "steel", desc: "Key of C, 28 holes. Suitable for all harmonica enthusiasts. Comes with exquisite box and cleaning cloth." },

  // ===== Drums (4) =====
  { id: "p45", name: "Djembe (Wood & Leather)",   ne: "ड्जेम्बे",  cat: "drums", price: 4500, origin: "Nepal",     body: "wood + goat skin", desc: "Handcrafted djembe drum with wooden body and goat skin head. 10\" diameter, 17\" height." },
  { id: "p46", name: "Sabian B8 Crash Ride 18\"", ne: "सिम्बल",   cat: "drums", price: 10000, tag: "Pro", origin: "Imported", body: "bronze", desc: "Sabian B8 series 18-inch crash ride cymbal. Bright sound, medium weight, natural finish.", darazUrl: "https://www.daraz.com.np/products/sabian-b8-series-18-inch-crash-ride-cymbal-i108507792.html" },
  { id: "p47", name: "Egg Shakers (Pair)",        ne: "शेकर",     cat: "drums", price: 500,  origin: "Imported",  body: "ABS plastic", desc: "Pair of egg shakers with handle. Pronounced shaker sound, easy to grip. Great for classroom music." },
  { id: "p48", name: "Zildjian 5A Drum Sticks",   ne: "ड्रम स्टिक", cat: "drums", price: 2100, tag: "Bestseller", origin: "Imported", body: "hickory", desc: "World's most popular drumstick size. Oval tip, mid-sized shaft, special dip coating for comfortable grip." },
];

// ===== Formatting & utils =====
const NPR = n => "Rs. " + new Intl.NumberFormat("en-IN").format(n);
const DEVA_DIGITS = ["०","१","२","३","४","५","६","७","८","९"];
const toDeva = n => String(n).split("").map(c => /\d/.test(c) ? DEVA_DIGITS[+c] : c).join("");

const CAT_BY_ID    = Object.fromEntries(CATS.map(c => [c.id, c]));
const COUNT_BY_CAT = CATS.reduce((acc, c) => {
  acc[c.id] = PRODUCTS.filter(p => p.cat === c.id).length;
  return acc;
}, {});
const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

Object.assign(window, { CATS, PRODUCTS, CAT_BY_ID, COUNT_BY_CAT, PRODUCT_BY_ID, NPR, toDeva, PH_TONES });
