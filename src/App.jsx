import { useEffect, useMemo, useState } from 'react';
import SplashScreen from './components/SplashScreen.jsx';
import ServiceStatus from './components/ServiceStatus.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import WelcomeBack from './components/WelcomeBack.jsx';
import MealSetup from './components/MealSetup.jsx';
import MealRecommendations from './components/MealRecommendations.jsx';
import MealDetail from './components/MealDetail.jsx';
import { MEALS, MEAL_BY_ID } from './data/pantryData.js';
import { buildRecommendations, defaultSortDir, matchMeal } from './utils/mealMatching.js';
import {
  DEFAULT_SETUP,
  forgetSavedSetup,
  isDefaultSetup,
  loadSavedSetup,
  saveSetup,
  whenSaved,
} from './utils/savedKitchen.js';

/*
 * Which screen an address shows. Only the three screens get an entry in the
 * browser's history (PS4 finding from IKD and CCH: Back left the app and a
 * reload lost everything). The seven setup steps and the five recipe pages
 * stay inside their screens, so leaving the app is still one or two presses
 * of Back rather than a dozen. A hash rather than a path, so a reload on any
 * screen needs no server rewrite; Disqus pins its own URL and identifier, so
 * the hash never splits the comment thread.
 */
// Own keys only: MEAL_BY_ID is a plain object, so "#meal-constructor" would
// otherwise find Object.prototype.constructor and crash the recipe screen.
const isMealId = (id) => Object.prototype.hasOwnProperty.call(MEAL_BY_ID, id);

function routeFromHash(hash) {
  if (hash === '#results') return { screen: 'results', mealId: null };
  const meal = /^#meal-(.+)$/.exec(hash);
  if (meal && isMealId(meal[1])) return { screen: 'detail', mealId: meal[1] };
  return { screen: 'setup', mealId: null };
}

/** Where keyboard and screen-reader focus goes when the line it was on goes. */
function focusPageHeading() {
  window.setTimeout(() => {
    const heading = document.querySelector('h1');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }, 0);
}

function addressFor(screen, mealId) {
  const hash = screen === 'results' ? '#results' : screen === 'detail' ? `#meal-${mealId}` : '';
  return `${window.location.pathname}${window.location.search}${hash}`;
}

/**
 * PantryPilot root.
 *
 * All three screens live in one page: `screen` decides which one renders,
 * so moving between them never reloads the browser. Each screen change is
 * also a history entry, so the browser's Back and the app's own back buttons
 * do the same thing.
 */
export default function App() {
  const [initial] = useState(() => ({
    route: routeFromHash(window.location.hash),
    saved: loadSavedSetup(),
  }));

  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState(initial.route.screen);
  const [activeMealId, setActiveMealId] = useState(initial.route.mealId);

  // What the user tells us on screen 1. Cuisines and weight bands are
  // multi-select: an empty array means no restriction rather than nothing.
  // Starts from what this browser remembered, if anything.
  const [initialSetup] = useState(() => (initial.saved ? initial.saved.setup : DEFAULT_SETUP));
  const [setup, setSetup] = useState(initialSetup);

  // A remembered kitchen is always announced, never restored silently.
  const [notice, setNotice] = useState(() =>
    initial.saved && !isDefaultSetup(initial.saved.setup)
      ? {
          kind: 'welcome',
          count: initial.saved.setup.ingredientIds.length,
          when: whenSaved(initial.saved.savedAt),
        }
      : null
  );
  const [beforeFresh, setBeforeFresh] = useState(null);

  // Save every change, but not the setup we started from, which would only
  // rewrite the saved time of a kitchen nobody touched. Compared by identity
  // rather than with a first-run flag, so StrictMode's double effect in
  // development cannot slip a save through. Back to the defaults means there
  // is nothing worth remembering.
  useEffect(() => {
    if (setup === initialSetup) return;
    if (isDefaultSetup(setup)) forgetSavedSetup();
    else saveSetup(setup);
  }, [setup, initialSetup]);

  // Mark the entry we arrived on as ours, and follow the browser's Back and
  // Forward between the three screens. A reload keeps the entry's state, so
  // its depth is kept too: resetting it to 0 made the app's back buttons
  // add an entry instead of stepping back, leaving two identical entries.
  useEffect(() => {
    const previous = window.history.state;
    const depth =
      previous && previous.pantrypilot && Number.isInteger(previous.depth) && previous.depth > 0
        ? previous.depth
        : 0;
    window.history.replaceState(
      { pantrypilot: true, depth },
      '',
      addressFor(initial.route.screen, initial.route.mealId)
    );
    function onPopState() {
      const route = routeFromHash(window.location.hash);
      if (route.mealId) setActiveMealId(route.mealId);
      setScreen(route.screen);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [initial]);

  function goTo(nextScreen, mealId = null) {
    const depth = (window.history.state && window.history.state.depth) || 0;
    window.history.pushState({ pantrypilot: true, depth: depth + 1 }, '', addressFor(nextScreen, mealId));
    if (mealId) setActiveMealId(mealId);
    setScreen(nextScreen);
  }

  // The app's own back buttons: step back through history when the previous
  // entry is one of ours, exactly like the browser's Back. A visitor who
  // arrived on this screen (a link, a bookmark) has no entry of ours behind
  // it, so the screen before is pushed instead: the app never leaves, and a
  // push, unlike rewriting the current entry, also drops any stale entries
  // ahead of it that Forward could otherwise reach.
  function goBack(fallbackScreen) {
    const state = window.history.state;
    if (state && state.pantrypilot && state.depth > 0) {
      window.history.back();
      return;
    }
    goTo(fallbackScreen);
  }

  // Start fresh opens setup as a new screen, for the same reason: rewriting
  // the current entry in place left two identical setup entries (a dead Back)
  // and a recipe ahead whose "Back to meals" led to setup.
  function startFresh() {
    setBeforeFresh(setup);
    setSetup(DEFAULT_SETUP);
    setNotice({ kind: 'fresh' });
    if (screen !== 'setup') goTo('setup');
    // The Start fresh button is gone; its Undo takes the focus. Done here, once,
    // rather than with autoFocus, which a dynamically inserted button ignores
    // and which would fire again every time the line re-mounts on a new screen.
    window.setTimeout(() => {
      const undo = document.querySelector('.welcome-undo');
      if (undo) undo.focus();
    }, 0);
  }

  function undoFresh() {
    if (beforeFresh) {
      setSetup(beforeFresh);
      // Saved here rather than by the save effect: when nothing was edited
      // before Start fresh, beforeFresh is the very object the page started
      // from, which the effect skips, so the copy Start fresh deleted never
      // came back and the next reload lost the kitchen.
      if (isDefaultSetup(beforeFresh)) forgetSavedSetup();
      else saveSetup(beforeFresh);
    }
    setBeforeFresh(null);
    setNotice(null);
    focusPageHeading();
  }

  function dismissNotice() {
    setNotice(null);
    focusPageHeading();
  }

  // Controls that only exist on the results screen.
  const [listOptions, setListOptions] = useState({
    sortId: 'match',
    sortDir: 'desc',
    readyOnly: false,
    vegetarianOnly: false,
  });

  // Every screen change starts at the top of the page, like a real app would.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, activeMealId]);

  const filters = {
    timeId: setup.timeId,
    cuisineIds: setup.cuisineIds,
    weightBands: setup.weightBands,
    sortId: listOptions.sortId,
    sortDir: listOptions.sortDir,
    readyOnly: listOptions.readyOnly,
    vegetarianOnly: listOptions.vegetarianOnly,
  };

  const recommendations = useMemo(
    () => buildRecommendations(MEALS, { ownedIds: setup.ingredientIds, ...filters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setup, listOptions]
  );

  /**
   * Counts for the labels that promise something.
   *
   * Each applies every filter EXCEPT the one whose own label it sits on, so a
   * toggle can never advertise a number it is itself about to exclude. v1
   * shipped a counter that ignored the ingredient list entirely and read the
   * same whether nothing or fourteen things were ticked; see PROMPTS.md 2.14.
   */
  const counts = useMemo(() => {
    const base = {
      ownedIds: setup.ingredientIds,
      timeId: setup.timeId,
      cuisineIds: setup.cuisineIds,
      weightBands: setup.weightBands,
      sortId: 'match',
      sortDir: 'desc',
    };
    return {
      // ignores readyOnly, because it labels the readyOnly toggle
      ready: buildRecommendations(MEALS, {
        ...base,
        vegetarianOnly: listOptions.vegetarianOnly,
        readyOnly: true,
      }).length,
      // ignores vegetarianOnly, because it labels the vegetarian toggle
      vegetarian: buildRecommendations(MEALS, {
        ...base,
        readyOnly: listOptions.readyOnly,
        vegetarianOnly: true,
      }).length,
      // what pressing Find Meals will actually show
      setupTotal: buildRecommendations(MEALS, base).length,
      // The setup screen's own version, applying only the controls that screen
      // has. `ready` above carries the results-screen vegetarian toggle, which
      // on setup would silently shape a number against a control that is not
      // on the page - the same thing that made v1's counter unreconcilable.
      readyForSetup: buildRecommendations(MEALS, { ...base, readyOnly: true }).length,
    };
  }, [setup, listOptions.readyOnly, listOptions.vegetarianOnly]);

  const activeMeal = useMemo(() => {
    if (!activeMealId || !isMealId(activeMealId)) return null;
    return matchMeal(MEAL_BY_ID[activeMealId], setup.ingredientIds);
  }, [activeMealId, setup.ingredientIds]);

  // `patch` may be an object, or a function of the current setup for updates
  // that depend on what is already selected.
  function updateSetup(patch) {
    setSetup((current) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }));
    // Once the user edits the kitchen, the restored list is theirs again, and
    // an Undo of Start fresh would overwrite what they have just ticked.
    setNotice(null);
    setBeforeFresh(null);
  }

  function updateFilters(patch) {
    const { timeId, cuisineIds, weightBands, ...rest } = patch;
    if (timeId !== undefined || cuisineIds !== undefined || weightBands !== undefined) {
      updateSetup({
        ...(timeId !== undefined ? { timeId } : {}),
        ...(cuisineIds !== undefined ? { cuisineIds } : {}),
        ...(weightBands !== undefined ? { weightBands } : {}),
      });
    }
    if (Object.keys(rest).length > 0) {
      // Picking a new sort starts it in its own natural direction rather than
      // inheriting the previous one's, which would silently mean something else.
      if (rest.sortId && rest.sortDir === undefined) {
        rest.sortDir = defaultSortDir(rest.sortId);
      }
      setListOptions((current) => ({ ...current, ...rest }));
    }
  }

  function openMeal(mealId) {
    goTo('detail', mealId);
  }

  // The cover sits above whatever screen is already mounted behind it, so
  // nothing has to load again once it fades.
  const cover = showSplash ? <SplashScreen onDone={() => setShowSplash(false)} /> : null;

  const welcome = (
    <WelcomeBack
      notice={notice}
      onStartFresh={startFresh}
      onUndo={undoFresh}
      onDismiss={dismissNotice}
    />
  );

  if (screen === 'detail' && activeMeal) {
    return (
      <>
        {cover}
        <ServiceStatus />
        {welcome}
        <MealDetail
          key={activeMeal.id}
          meal={activeMeal}
          initialServings={setup.people}
          onBack={() => goBack('results')}
        />
        <SiteFooter />
      </>
    );
  }

  if (screen === 'results') {
    return (
      <>
        {cover}
        <ServiceStatus />
        {welcome}
        <MealRecommendations
          meals={recommendations}
          counts={counts}
          setup={setup}
          filters={filters}
          onFilterChange={updateFilters}
          onOpenMeal={openMeal}
          onEditSetup={() => goBack('setup')}
        />
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      {cover}
      <ServiceStatus />
      {welcome}
      <MealSetup
        setup={setup}
        onChange={updateSetup}
        onFindMeals={() => goTo('results')}
        resultCount={counts.setupTotal}
        readyCount={counts.readyForSetup}
      />
      <SiteFooter />
    </>
  );
}
