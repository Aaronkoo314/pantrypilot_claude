import { useMemo, useState } from 'react';
import {
  INGREDIENTS,
  INGREDIENT_BY_ID,
  mostUsedIn,
} from '../data/pantryData.js';

/**
 * One category, one page.
 *
 * This used to be the whole ingredient list on a single card: five collapsible
 * categories, two of them with a second level, all on the setup screen. It
 * worked, but it meant the setup screen grew every time the dataset did, and
 * the user had no idea how much was left below the fold.
 *
 * Now the step controller in MealSetup hands this component one category at a
 * time. What is on the page depends on how big the category is, because the
 * same layout does not suit twenty-six items and seven:
 *
 *   - A large, flat category (Vegetables & Aromatics, Pantry & Flavour) leads
 *     with the six ingredients its own recipes use most, then hides the rest
 *     behind "See all". The six are DERIVED from the recipes, not authored.
 *   - A large, grouped category (Meat & Seafood) shows its six second-level
 *     groups instead. Counting cannot separate proteins — every recipe has
 *     exactly one, so the counts tie at three — and a "most used" row there
 *     would put Chickpeas above Chicken Breast.
 *   - A small category (Dairy & Eggs, seven items) shows everything. Promoting
 *     six and hiding the seventh behind a link costs a tap to reveal nothing.
 *
 * Search is the exception to all of it: it looks across all 93 ingredients
 * regardless of which page you are on, because somebody at an open fridge
 * knows what they are holding and should not have to work out which of six
 * pages it lives on.
 */
export default function IngredientPicker({ category, selectedIds, onToggle, query, onQuery }) {
  const [expanded, setExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState([]);

  const searching = query.trim().length > 0;

  const searchHits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return INGREDIENTS.filter((item) => item.name.toLowerCase().includes(needle));
  }, [query]);

  const all = useMemo(
    () => INGREDIENTS.filter((item) => item.category === category),
    [category]
  );

  const mostUsed = useMemo(() => mostUsedIn(category), [category]);

  const groupNames = useMemo(
    () => [...new Set(all.map((item) => item.group).filter(Boolean))],
    [all]
  );

  function renderChip(item, size) {
    const isSelected = selectedIds.includes(item.id);
    return (
      <button
        key={item.id}
        type="button"
        className={`chip ${size === 'big' ? 'chip-big' : ''} ${isSelected ? 'chip-on' : ''}`}
        aria-pressed={isSelected}
        onClick={() => onToggle(item.id)}
      >
        <span className="chip-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <span className="chip-label">{item.name}</span>
      </button>
    );
  }

  // ---- searching: one flat list across every category -------------------
  if (searching) {
    return (
      <div className="step-body">
        <SearchBox query={query} onQuery={onQuery} />
        {searchHits.length === 0 ? (
          <p className="empty-note">Nothing matches &ldquo;{query}&rdquo;.</p>
        ) : (
          <>
            <p className="section-hint">
              {searchHits.length} {searchHits.length === 1 ? 'match' : 'matches'} across all
              categories. Tap to add without leaving this page.
            </p>
            <div className="chip-grid">{searchHits.map((item) => renderChip(item))}</div>
          </>
        )}
      </div>
    );
  }

  // ---- grouped category: its own second level is the index --------------
  if (groupNames.length > 0) {
    return (
      <div className="step-body">
        <SearchBox query={query} onQuery={onQuery} />
        {/* A grouped category can still have a meaningful shortcut. Pantry &
            Flavour does: olive oil and light soy sauce are in a quarter of the
            recipes each, and making somebody open "Chinese" to reach soy sauce
            costs a tap for no reason. Meat & Seafood does not, so mostUsedIn
            returns null there and this row does not appear. */}
        {mostUsed && (
          <div className="most-used">
            <p className="section-hint">The six these recipes use most.</p>
            <div className="chip-grid">{mostUsed.map((item) => renderChip(item, 'big'))}</div>
          </div>
        )}
        {groupNames.map((name) => {
          const items = all.filter((item) => item.group === name);
          const picked = items.filter((item) => selectedIds.includes(item.id)).length;
          const open = openGroups.includes(name);
          return (
            <div className="ingredient-subgroup" key={name}>
              <button
                type="button"
                className={`group-header ${open ? 'group-open' : ''}`}
                aria-expanded={open}
                onClick={() =>
                  setOpenGroups((current) =>
                    current.includes(name)
                      ? current.filter((item) => item !== name)
                      : [...current, name]
                  )
                }
              >
                <span className="group-caret" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
                <span className="group-name">{name}</span>
                <span className="group-count">
                  {items.length} items
                  {picked > 0 && <span className="group-selected"> &middot; {picked} selected</span>}
                </span>
              </button>
              {open && <div className="chip-grid">{items.map((item) => renderChip(item))}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  // ---- flat category: most used first, the rest on request --------------
  const showAll = !mostUsed || expanded;
  const shown = showAll ? all : mostUsed;

  return (
    <div className="step-body">
      <SearchBox query={query} onQuery={onQuery} />
      {mostUsed && !expanded && (
        <p className="section-hint">
          The six these recipes use most. Tap &ldquo;See all&rdquo; for the other{' '}
          {all.length - mostUsed.length}.
        </p>
      )}
      <div className="chip-grid">
        {shown.map((item) => renderChip(item, mostUsed && !expanded ? 'big' : null))}
      </div>
      {mostUsed && (
        <button type="button" className="text-button see-all" onClick={() => setExpanded((v) => !v)}>
          {expanded ? `Show only the six most used` : `See all ${all.length} ${category}`}
        </button>
      )}
    </div>
  );
}

function SearchBox({ query, onQuery }) {
  return (
    <div className="search-row">
      <input
        className="search-input"
        type="search"
        value={query}
        placeholder={`Search all ${INGREDIENTS.length} ingredients`}
        aria-label="Search all ingredients"
        onChange={(event) => onQuery(event.target.value)}
      />
    </div>
  );
}

export { INGREDIENT_BY_ID };
