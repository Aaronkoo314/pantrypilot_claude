/*
 * Ingredient search, across all 93 ingredients.
 *
 * PS4 finding from MML (heuristic #6, severity 2): "chiken" found nothing and
 * offered nothing, "scallion" missed Spring Onion, and "shrimp" missed Prawns.
 * The search only worked for somebody who already knew the app's own word.
 *
 * Three layers, in this order, and the order is the point:
 *   1. A name contains what was typed, as before. Every text that used to
 *      find an ingredient still finds it; the names are also compared with
 *      "chilli" and "chili" spelled the same, so either spelling finds all
 *      three chilli items.
 *   2. Another name for the same item (SEARCH_ALIASES) counts as a normal hit.
 *      To stop "egg" finding Aubergine through "eggplant", an alias matches a
 *      whole word, or a word it starts with once four letters are typed. So
 *      "green" also offers Spring Onion (green onion) beside Green Curry Paste.
 *   3. Only when 1 and 2 find nothing: the closest names by spelling, shown
 *      apart and labelled as closest, never mixed into real matches, so a
 *      near miss cannot be ticked by mistake for what was meant. Deliberately
 *      strict, because a list that offers Salmon for "salt" teaches people to
 *      ignore it: nearest tier only, same first letter, no guesses at all for
 *      one or two letters, and nothing for pasted paragraphs.
 */

import { INGREDIENTS, SEARCH_ALIASES } from '../data/pantryData.js';

const MAX_CLOSEST = 5;
const MIN_FUZZY_LENGTH = 3;
const MAX_FUZZY_LENGTH = 40;

/** Lowercase, accents off, punctuation to spaces, single spaces. */
function base(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * One spelling for both "chili" and "chilli", used beside the plain text,
 * never instead of it: a half-typed "chill" has no full word to fold, and
 * must still find Red Chilli the way it always did.
 */
const fold = (text) => text.replace(/chil+i/g, 'chili');

const words = (text) => text.split(' ').filter(Boolean);

/** Every run of two or more words, joined: "seabass", "beansprouts". */
function joinedRuns(text) {
  const parts = words(text);
  const runs = [];
  for (let i = 0; i < parts.length; i += 1) {
    for (let j = i + 2; j <= parts.length; j += 1) runs.push(parts.slice(i, j).join(''));
  }
  return runs;
}

const INDEX = INGREDIENTS.map((item) => {
  const name = base(item.name);
  const aliases = (SEARCH_ALIASES[item.id] || []).map(base);
  const phrases = [name, ...aliases].map(fold);
  // Typos are measured against both spellings: "chille" is one slip from
  // "chilli" but two from "chili".
  const spellings = [...new Set([name, ...aliases, ...phrases])];
  return {
    item,
    name,
    folded: fold(name),
    aliases: aliases.map(fold),
    aliasWords: aliases.map(fold).flatMap(words),
    phrases: spellings,
    fuzzyWords: [...new Set([...spellings.flatMap(words), ...spellings.flatMap(joinedRuns)])],
  };
});

function nameMatches(entry, raw, folded) {
  return entry.name.includes(raw) || entry.folded.includes(folded);
}

function aliasMatches(entry, needle) {
  if (entry.aliases.includes(needle) || entry.aliasWords.includes(needle)) return true;
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

// One slip in a word of up to five letters, two in a longer one, judged on the
// shorter of the two so "ham" is not one slip from "lamb" and "daikon" is not
// two from "dijon". Anything looser suggests unrelated food.
const allowedSlips = (length) => (length <= 5 ? 1 : 2);

/**
 * How close one typed word is to one word of a name, or Infinity. A whole word
 * may be a slip or two away; the start of a longer word only one slip away,
 * compared with one letter more than was typed, so a half-typed "chik" finds
 * the chickens (one letter missing) but "mint" does not find "minced".
 */
function wordDistance(needle, word) {
  if (word[0] !== needle[0]) return Infinity; // typos rarely hit the first letter
  const whole = editDistance(needle, word);
  if (whole <= allowedSlips(Math.min(needle.length, word.length))) return whole;
  // Four letters before guessing at a half-typed word: "jam" is not the start
  // of "jasmine".
  if (needle.length >= 4 && word.length > needle.length + 1) {
    const start = editDistance(needle, word.slice(0, needle.length + 1));
    if (start <= 1) return start;
  }
  return Infinity;
}

/** A multi-word text against a phrase: each run of as many words, whole or begun. */
function phraseDistance(needle, phrase) {
  const span = words(needle).length;
  const parts = words(phrase);
  const limit = allowedSlips(needle.length);
  let best = Infinity;
  for (let start = 0; start + span <= parts.length; start += 1) {
    const run = parts.slice(start, start + span).join(' ');
    if (run[0] !== needle[0]) continue;
    best = Math.min(best, editDistance(needle, run));
    if (run.length > needle.length + 1) {
      best = Math.min(best, editDistance(needle, run.slice(0, needle.length + 1)));
    }
  }
  return best <= limit ? best : Infinity;
}

function distanceTo(entry, needle) {
  if (needle.includes(' ')) {
    return Math.min(...entry.phrases.map((phrase) => phraseDistance(needle, phrase)));
  }
  return Math.min(...entry.fuzzyWords.map((word) => wordDistance(needle, word)));
}

/** Does one typed word point at this entry, by any of the three layers? */
function wordPointsAt(entry, word) {
  return (
    nameMatches(entry, word, fold(word)) ||
    aliasMatches(entry, word) ||
    (word.length >= MIN_FUZZY_LENGTH && distanceTo(entry, word) !== Infinity)
  );
}

function nearestTier(scored, better) {
  if (scored.length === 0) return [];
  const best = scored.reduce((top, candidate) => (better(candidate, top) ? candidate : top));
  return scored
    .filter((candidate) => !better(best, candidate) && !better(candidate, best))
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_CLOSEST)
    .map((candidate) => candidate.entry.item);
}

/**
 * { hits, closest }: hits are real matches in catalogue order; closest is
 * filled only when there are no hits, nearest first, at most five.
 */
export function searchIngredients(query) {
  const needle = base(query);
  if (!needle) return { hits: [], closest: [] };

  const folded = fold(needle);
  const hits = INDEX.filter(
    (entry) => nameMatches(entry, needle, folded) || aliasMatches(entry, folded)
  ).map((entry) => entry.item);
  if (hits.length > 0) return { hits, closest: [] };

  if (folded.length < MIN_FUZZY_LENGTH || folded.length > MAX_FUZZY_LENGTH) {
    return { hits: [], closest: [] };
  }

  // Spelling first: the nearest names by edit distance.
  const bySpelling = INDEX.map((entry, order) => ({ entry, order, distance: distanceTo(entry, folded) }))
    .filter((candidate) => candidate.distance !== Infinity);
  if (bySpelling.length > 0) {
    return { hits: [], closest: nearestTier(bySpelling, (a, b) => a.distance < b.distance) };
  }

  // Then, for several words, the names most of them point at: "thigh chicken"
  // or "fresh thai basil" still reach the item, word by word.
  const typedWords = words(folded);
  if (typedWords.length < 2) return { hits: [], closest: [] };
  const byWords = INDEX.map((entry, order) => ({
    entry,
    order,
    count: typedWords.filter((word) => wordPointsAt(entry, word)).length,
  })).filter((candidate) => candidate.count > 0);
  return { hits: [], closest: nearestTier(byWords, (a, b) => a.count > b.count) };
}
