import { INGREDIENT_BY_ID } from '../data/pantryData.js';
import FilterBar from './FilterBar.jsx';
import DisqusThread from './DisqusThread.jsx';
import MealCard from './MealCard.jsx';
import { CUISINE_BY_ID, TIME_OPTIONS } from '../data/pantryData.js';

/**
 * Screen 2: the list of meals that fit the user's kitchen and constraints.
 */
export default function MealRecommendations({
  meals,
  counts,
  setup,
  filters,
  onFilterChange,
  onOpenMeal,
  onEditSetup,
}) {
  const timeLabel = (TIME_OPTIONS.find((item) => item.id === filters.timeId) || {}).label;
  const cuisineLabel =
    setup.cuisineIds.length === 0
      ? 'any cuisine'
      : setup.cuisineIds.map((id) => (CUISINE_BY_ID[id] || {}).label).join(' / ');

  // The empty state offers the undo for whatever is actually binding, rather
  // than sending the user to another screen to guess.
  const relaxations = [
    filters.readyOnly && {
      label: 'Show meals with missing items too',
      patch: { readyOnly: false },
    },
    filters.vegetarianOnly && {
      label: 'Include non-vegetarian meals',
      patch: { vegetarianOnly: false },
    },
    filters.weightBands.length > 0 && {
      label: 'Allow any weight',
      patch: { weightBands: [] },
    },
    filters.cuisineIds.length > 0 && {
      label: 'Allow any cuisine',
      patch: { cuisineIds: [] },
    },
    filters.timeId !== '60plus' && {
      label: 'Allow 60+ minutes',
      patch: { timeId: '60plus' },
    },
  ].filter(Boolean);

  const kitchen = setup.ingredientIds.map((id) => INGREDIENT_BY_ID[id]).filter(Boolean);

  return (
    <div className="screen">
      <header className="app-header compact">
        <h1 className="app-title">Meals for tonight</h1>
        <p className="summary-line">
          {setup.people} {setup.people === 1 ? 'person' : 'people'} &middot; {timeLabel} &middot;{' '}
          {cuisineLabel}
        </p>
      </header>

      {/* The kitchen, summarised. The old header had a "Change my kitchen" link
          and a count, which told you how many ingredients you had picked but not
          which — so checking meant leaving the screen. This shows them, and only
          the people who want to change something go back into the picker. */}
      <section className="kitchen-strip" aria-labelledby="kitchen-heading">
        <div className="kitchen-head">
          <h2 id="kitchen-heading" className="kitchen-label">
            My kitchen
            <span className="count-pill">{setup.ingredientIds.length}</span>
          </h2>
          <button type="button" className="text-button" onClick={onEditSetup}>
            Edit
          </button>
        </div>
        {kitchen.length === 0 ? (
          <p className="kitchen-empty">
            Nothing picked, so every meal shows what it would need.{' '}
            <button type="button" className="text-button" onClick={onEditSetup}>
              Add ingredients
            </button>
          </p>
        ) : (
          <ul className="kitchen-tags">
            {kitchen.map((item) => (
              <li key={item.id} className="kitchen-tag">
                <span aria-hidden="true">{item.emoji}</span> {item.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <FilterBar filters={filters} onChange={onFilterChange} counts={counts} />

      <p className="result-count" aria-live="polite">
        {meals.length} {meals.length === 1 ? 'meal' : 'meals'} found
      </p>

      {meals.length === 0 ? (
        <div className="card empty-card">
          <p className="empty-title">Nothing fits those settings.</p>
          <p className="empty-body">
            Loosen one of these, or add a few more ingredients to your kitchen.
          </p>
          {relaxations.map((item) => (
            <button
              key={item.label}
              type="button"
              className="secondary-button"
              onClick={() => onFilterChange(item.patch)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="secondary-button" onClick={onEditSetup}>
            Edit my kitchen
          </button>
        </div>
      ) : (
        <div className="meal-list">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onOpen={onOpenMeal} />
          ))}
        </div>
      )}

      <p className="disclaimer">
        Nutrition figures and prices are invented sample data for this prototype. They are not
        health or medical advice, and they are not real shop prices.
      </p>

      <DisqusThread />
    </div>
  );
}
