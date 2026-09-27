/*
 * The kitchen, remembered in this browser.
 *
 * PS4 finding (IKD, CCH; severity 3): a reload, or coming back the next
 * evening, started over at step 1 with nothing ticked, and a household that
 * shops once a week re-ticked the same list most nights. So the setup - the
 * ingredients and the answers to the seven steps - is kept in localStorage
 * until the user clears it.
 *
 * Only this browser holds it: there is no account and no server copy, and it
 * never goes into the address, which is shared and logged in ways storage is
 * not. Storage can be missing or refuse (a private window, blocked site data),
 * so every access is wrapped and the app then behaves exactly as it did before.
 */

import { CUISINE_BY_ID, INGREDIENT_BY_ID, TIME_OPTIONS, WEIGHT_BAND_BY_ID } from '../data/pantryData.js';

const STORAGE_KEY = 'pantrypilot.kitchen.v1';

// Same bounds as the people stepper in MealSetup.jsx.
const MIN_PEOPLE = 1;
const MAX_PEOPLE = 12;

// No time limit until the user picks one (PS4 finding from IKD, severity 3):
// the old default of 30 minutes was chosen because nobody specified one, was
// not shown until step 6, and quietly hid 23 of the 47 recipes from anyone who
// skipped ahead. null means "any time" everywhere a time is read.
export const DEFAULT_SETUP = {
  ingredientIds: [],
  people: 2,
  timeId: null,
  cuisineIds: [],
  weightBands: [],
};

export function isDefaultSetup(setup) {
  return (
    setup.ingredientIds.length === 0 &&
    setup.people === DEFAULT_SETUP.people &&
    setup.timeId === DEFAULT_SETUP.timeId &&
    setup.cuisineIds.length === 0 &&
    setup.weightBands.length === 0
  );
}

/**
 * The saved setup, or null. Anything the current catalogue does not know - an
 * ingredient removed since, a hand-edited value - is dropped rather than
 * trusted, so an old save can never tick something that no longer exists.
 */
export function loadSavedSetup() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const { setup = {}, savedAt = null } = JSON.parse(raw);
    // Own keys only, strings only, each once: a plain-object lookup would let
    // "constructor" or "__proto__" through as if they were ingredients.
    const own = (known, id) =>
      typeof id === 'string' && Object.prototype.hasOwnProperty.call(known, id);
    const list = (value, known) =>
      Array.isArray(value) ? [...new Set(value.filter((id) => own(known, id)))] : [];
    const clean = {
      ingredientIds: list(setup.ingredientIds, INGREDIENT_BY_ID),
      people: Number.isInteger(setup.people)
        ? Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, setup.people))
        : DEFAULT_SETUP.people,
      timeId: TIME_OPTIONS.some((option) => option.id === setup.timeId)
        ? setup.timeId
        : DEFAULT_SETUP.timeId,
      cuisineIds: list(setup.cuisineIds, CUISINE_BY_ID),
      weightBands: list(setup.weightBands, WEIGHT_BAND_BY_ID),
    };
    return { setup: clean, savedAt: typeof savedAt === 'string' ? savedAt : null };
  } catch {
    return null;
  }
}

export function saveSetup(setup) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ setup, savedAt: new Date().toISOString() })
    );
  } catch {
    // Nothing to do: the app works as before, it just will not remember.
  }
}

export function forgetSavedSetup() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // As above.
  }
}

/**
 * "earlier today", "yesterday", "on Monday", "on 14 Sept", or "on 14 Sept 2025"
 * in an earlier year. It is the time of the last change to the kitchen, which
 * is what the Welcome back line calls "your last visit".
 */
export function whenSaved(savedAt, now = new Date()) {
  const then = savedAt ? new Date(savedAt) : null;
  if (!then || Number.isNaN(then.getTime())) return null;
  const day = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((day(now) - day(then)) / 86400000);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `on ${then.toLocaleDateString('en-SG', { weekday: 'long' })}`;
  const options = { day: 'numeric', month: 'short' };
  if (then.getFullYear() !== now.getFullYear()) options.year = 'numeric';
  return `on ${then.toLocaleDateString('en-SG', options)}`;
}
