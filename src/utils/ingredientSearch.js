/*
 * Ingredient search, across all 93 ingredients.
 *
 * PS4 finding from MML (heuristic #6, severity 2): "chiken" found nothing and
 * offered nothing, "scallion" missed Spring Onion, and "shrimp" missed Prawns.
 * The search only worked for somebody who already knew the app's own word.
 *
 * Three layers, in this order, and the order is the point:
 *   1. A name contains what was typed - exactly what the search did before, so
 *      a search that already worked keeps its list. The one addition is where
 *      an alias adds the same item under its other name: "green" now also
 *      offers Spring Onion (green onion).
 *   2. Another name for the same item (SEARCH_ALIASES) counts as a normal hit.
 *      To stop "egg" finding Aubergine through "eggplant", an alias matches a
 *      whole word, or a word it starts with once four letters are typed.
 *   3. Only when 1 and 2 find nothing: the closest names by spelling, nearest
 *      tier only, shown apart and labelled as closest, never mixed into real
 *      matches, so a near miss cannot be ticked by mistake for what was meant.
 *
 * Spelling is compared, not displayed: "chili" and "chilli" match each other.
 */

import { INGREDIENTS, SEARCH_ALIASES } from '../data/pantryData.js';

const MAX_CLOSEST = 5;

function normalise(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/chilli/g, 'chili')
    .replace(/\s+/g, ' ')
    .trim();
}

const words = (text) => text.split(' ').filter(Boolean);

const INDEX = INGREDIENTS.map((item) => {
  const name = normalise(item.name);
  const aliases = (SEARCH_ALIASES[item.id] || []).map(normalise);
  return {
    item,
    name,
    aliases,
    aliasWords: aliases.flatMap(words),
    allWords: [...words(name), ...aliases.flatMap(words)],
  };
});

function aliasMatches(entry, needle) {
  if (entry.aliases.some((alias) => alias === needle)) return true;
  if (entry.aliasWords.includes(needle)) return true;
  if (needle.length < 4) return false;
  return (
    entry.aliases.some((alias) => alias.startsWith(needle)) ||
    entry.aliasWords.some((word) => word.startsWith(needle))
  );
}

/** Optimal string alignment distance: insertions, deletions, swaps, transpositions. */
function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) => [i, ...new Array(cols - 1).fill(0)]);
  for (let j = 1; j < cols; j += 1) d[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[rows - 1][cols - 1];
}

// One slip in a short word, two in a longer one. Anything looser starts
// suggesting unrelated food.
const allowedSlips = (length) => (length <= 4 ? 1 : 2);

/**
 * How far the typed text is from an ingredient, or Infinity if too far. A
 * one-word search is compared with each word of the name and aliases, and with
 * the start of each word, so a half-typed "chik" still finds the chickens.
 */
function distanceTo(entry, needle) {
  const limit = allowedSlips(needle.length);
  let best = Infinity;
  if (needle.includes(' ')) {
    // Compare with every run of the same number of words, so "soy suace"
    // meets the "soy sauce" inside Light Soy Sauce and Dark Soy Sauce.
    const span = words(needle).length;
    for (const phrase of [entry.name, ...entry.aliases]) {
      const parts = words(phrase);
      best = Math.min(best, editDistance(needle, phrase));
      for (let start = 0; start + span <= parts.length; start += 1) {
        best = Math.min(best, editDistance(needle, parts.slice(start, start + span).join(' ')));
      }
    }
  } else {
    for (const word of entry.allWords) {
      best = Math.min(best, editDistance(needle, word));
      if (word.length > needle.length) {
        best = Math.min(best, editDistance(needle, word.slice(0, needle.length)));
      }
    }
  }
  return best <= limit ? best : Infinity;
}

/**
 * { hits, closest }: hits are real matches in catalogue order; closest is
 * filled only when there are no hits, nearest first, at most five.
 */
export function searchIngredients(query) {
  const needle = normalise(query);
  if (!needle) return { hits: [], closest: [] };

  const hits = INDEX.filter(
    (entry) => entry.name.includes(needle) || aliasMatches(entry, needle)
  ).map((entry) => entry.item);
  if (hits.length > 0) return { hits, closest: [] };

  // Only the nearest tier: "chiken" is one slip from the four chickens and two
  // from Chinese Cabbage, and offering the cabbage beside them is noise.
  const scored = INDEX.map((entry, order) => ({ entry, order, distance: distanceTo(entry, needle) }))
    .filter((candidate) => candidate.distance !== Infinity);
  const nearest = Math.min(...scored.map((candidate) => candidate.distance));
  const closest = scored
    .filter((candidate) => candidate.distance === nearest)
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_CLOSEST)
    .map((candidate) => candidate.entry.item);

  return { hits: [], closest };
}
