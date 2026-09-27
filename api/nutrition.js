import { INGREDIENT_BY_ID } from '../src/data/pantryData.js';
import { USDA_RECORDS } from '../src/data/usdaRecords.js';

/** The by-id record dates as "4/1/2019"; the screen prints "2019-04-01", as the search used to. */
function isoDate(value) {
  const match = typeof value === 'string' ? /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value) : null;
  if (!match) return typeof value === 'string' ? value : null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * GET /api/nutrition?id=chicken-breast
 *
 * Looks one ingredient up in USDA FoodData Central and returns only the fields
 * the meal detail screen prints. The credential is read here and never leaves
 * this file; the browser calls this address, never the provider.
 *
 * Source: U.S. Department of Agriculture, Agricultural Research Service.
 * FoodData Central, fdc.nal.usda.gov. Public domain (CC0 1.0).
 */

// FoodData Central does not key nutrients by name. They arrive as an unordered
// array that has to be scanned by numeric id, and the ids are the stable part —
// nutrientName varies in wording between record types.
const NUTRIENT_IDS = {
  protein: 1003,
  carbohydrate: 1005, // "Carbohydrate, by difference"
  fat: 1004, // "Total lipid (fat)"
};

// Two different energy figures exist for the same food, and they disagree:
// chicken breast is 106 kcal by Atwater General and 112 by Atwater Specific.
// We print the General figure and say so on screen, because choosing between
// them is a decision about the product, not a detail of the code.
const ENERGY_GENERAL = 2047;
const ENERGY_SPECIFIC = 2048;
const ENERGY_LEGACY = 1008; // present on SR Legacy records, absent from Foundation

/**
 * Pull one nutrient out of the array. Every field except value is optional:
 * Foundation records carry derivationDescription, SR Legacy records do not,
 * and reading one that is absent is how a citation renders "undefined".
 */
function readNutrient(nutrients, id) {
  const found = nutrients.find((n) => n && n.nutrientId === id);
  if (!found || typeof found.value !== 'number') return null;
  return {
    value: found.value,
    unit: found.unitName || null,
    // "Analytical" means somebody measured it. "Calculated" means it was
    // imputed. That difference is worth showing rather than flattening.
    derivation: found.derivationDescription || null,
  };
}

export default async function handler(req, res) {
  const key = process.env.USDA_API_KEY;

  // Stop before the fetch. An unset variable is not empty: JavaScript turns it
  // into the string "undefined" and sends that, and the provider then answers
  // 403 exactly as it would for a wrong key. Catching it here tells the truth,
  // and naming the variable makes the fix obvious from the response alone.
  if (!key || !key.trim()) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      state: 'not-configured',
      error: 'USDA_API_KEY is not set. Add it in Vercel, then redeploy.',
    });
  }

  // The caller names an ingredient by id, and the text we send upstream comes
  // from our own data rather than from the request. Two reasons, and the second
  // is the important one:
  //
  // 1. No caller-supplied text reaches the upstream query string at all, so
  //    there is nothing to inject with.
  // 2. The set of legitimate queries here is CLOSED and small — the 93
  //    ingredients this product knows about. Anything outside it is refused
  //    before the credential is touched. Without this, /api/nutrition is an
  //    open proxy: a stranger varying a free-text parameter defeats the edge
  //    cache on every request, and each miss spends a slice of an hourly quota
  //    that belongs to me. This assignment's peer-review step explicitly invites
  //    classmates to try to break the product, so that is not a hypothetical.
  //
  // Bounded at 93 distinct upstream calls, all of them cacheable.
  //
  // Own keys only. INGREDIENT_BY_ID is a plain object, so a bare lookup let
  // "?id=constructor" through as if it were an ingredient and sent "Object" to
  // USDA - an open door in exactly the closed set described above (PS4).
  const id = String(req.query.id || '').trim();
  const known =
    id && Object.prototype.hasOwnProperty.call(INGREDIENT_BY_ID, id) ? INGREDIENT_BY_ID[id] : null;

  if (!known) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({
      state: 'bad-request',
      error: 'Pass a known ingredient id, for example /api/nutrition?id=garlic.',
    });
  }

  const ingredient = known.name;

  // One record per ingredient, chosen by hand (src/data/usdaRecords.js). This
  // used to search by name and take the first hit, and a search can only match
  // words: "Minced Chicken" came back as canned luncheon meat, "Potatoes" as
  // potato bread, "Milk" as milk crackers - about a quarter of the records
  // shown were another food (PS4 finding from MML). A pinned record is the
  // same food every time, and an ingredient USDA does not hold as that food
  // has no record at all, which is said on screen rather than papered over.
  const fdcId = Object.prototype.hasOwnProperty.call(USDA_RECORDS, id) ? USDA_RECORDS[id] : null;

  if (!fdcId) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
      state: 'empty',
      query: ingredient,
      reason: 'no-exact-record',
    });
  }

  // format=full carries every nutrient with its numeric id and derivation.
  const url =
    `https://api.nal.usda.gov/fdc/v1/food/${fdcId}` +
    '?format=full' +
    '&api_key=' + encodeURIComponent(key.trim());

  let upstream;
  try {
    upstream = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    // We never reached them. Distinct from a refusal, and the screen says a
    // different sentence for each.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      state: 'unreachable',
      error: 'Could not reach USDA FoodData Central.',
    });
  }

  // Check this BEFORE reading the body. A refusal often arrives with nothing in
  // it, and calling .json() on an empty body throws — so the function would die
  // with a 500 of its own and the 403 that explains everything would never be
  // seen. Passing the upstream status through is what makes /api/health's
  // keyConfigured worth reading.
  if (!upstream.ok) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.status).json({
      state: 'refused',
      error: 'USDA FoodData Central refused the request.',
      upstreamStatus: upstream.status,
    });
  }

  const food = await upstream.json();

  // The by-id record nests each nutrient ({ nutrient: { id, unitName }, amount,
  // foodNutrientDerivation }); readNutrient reads the flat shape the search
  // used to return, so flatten it once here.
  const nutrients = (Array.isArray(food.foodNutrients) ? food.foodNutrients : [])
    .filter((n) => n && n.nutrient)
    .map((n) => ({
      nutrientId: n.nutrient.id,
      // The search rounded to two decimals; the record carries 0.851875.
      value: typeof n.amount === 'number' ? Math.round(n.amount * 100) / 100 : n.amount,
      unitName: n.nutrient.unitName ? n.nutrient.unitName.toUpperCase() : null,
      derivationDescription: (n.foodNutrientDerivation && n.foodNutrientDerivation.description) || null,
    }));
  const energyGeneral = readNutrient(nutrients, ENERGY_GENERAL);
  const energySpecific = readNutrient(nutrients, ENERGY_SPECIFIC);
  const energyLegacy = readNutrient(nutrients, ENERGY_LEGACY);
  const energy = energyGeneral || energyLegacy;

  // USDA publishes these per 100 g. That basis is a documentation convention
  // rather than a field in the response, so we state it rather than read it.
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).json({
    state: 'ok',
    query: ingredient,
    basis: 'per 100 g',
    record: {
      fdcId: food.fdcId,
      description: food.description || null,
      dataType: food.dataType || null,
      publishedDate: isoDate(food.publicationDate),
      // fdc.nal.usda.gov publishes every record at a stable address, so the
      // reader can open the one we cited rather than take our word for it.
      url: food.fdcId ? `https://fdc.nal.usda.gov/food-details/${food.fdcId}/nutrients` : null,
    },
    nutrients: {
      protein: readNutrient(nutrients, NUTRIENT_IDS.protein),
      carbohydrate: readNutrient(nutrients, NUTRIENT_IDS.carbohydrate),
      fat: readNutrient(nutrients, NUTRIENT_IDS.fat),
      // Whole kcal, as the search returned them.
      energy: energy
        ? { ...energy, value: Math.round(energy.value), basis: energyGeneral ? 'Atwater General Factors' : 'Energy' }
        : null,
    },
    // Shown so the screen can say the two figures disagree rather than hiding it.
    energyAlternative: energySpecific
      ? { value: Math.round(energySpecific.value), unit: energySpecific.unit, basis: 'Atwater Specific Factors' }
      : null,
    fetchedAt: new Date().toISOString(),
  });
}
