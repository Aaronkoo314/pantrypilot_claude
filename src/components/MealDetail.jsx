import { useEffect, useMemo, useState } from 'react';
import { CUISINE_BY_ID, WEIGHT_BAND_BY_ID } from '../data/pantryData.js';
import { formatMinutes, formatPrice, scaleMeal } from '../utils/mealMatching.js';
import SourcedNutrition from './SourcedNutrition.jsx';
import DisqusThread from './DisqusThread.jsx';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

/**
 * The detail screen's sections, one per page.
 *
 * Serving size and Time share a page. Alone they are 222px and 128px, and a
 * page you finish before the scroll starts is a tap charged for nothing.
 *
 * The index at the top is a row of names rather than a progress bar, because
 * reading a recipe is not a task with an order: somebody at the stove wants
 * the steps, somebody in the shop wants the cost, and neither should have to
 * page through the other.
 */
const PAGES = [
  { id: 'basics', label: 'Servings & time' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'cost', label: 'Cost' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'steps', label: 'How to cook it' },
];

/**
 * Screen 3: everything the user needs to actually cook the meal,
 * including a serving-size control that rescales quantities, price and totals.
 */
export default function MealDetail({ meal, ownedIds, initialServings, onBack }) {
  const [servings, setServings] = useState(
    Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, initialServings))
  );
  const [pageIndex, setPageIndex] = useState(0);

  // Every move lands at the top. Arriving halfway down a new page is the
  // commonest complaint about paginated reading, and it reads as a broken jump
  // rather than as a scroll position that happened to be kept.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pageIndex]);

  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);
  const scaled = useMemo(() => scaleMeal(meal, servings), [meal, servings]);

  const haveLines = scaled.ingredients.filter((line) => owned.has(line.id));
  const needLines = scaled.ingredients.filter((line) => !owned.has(line.id));
  const shoppingCost = needLines.reduce((total, line) => total + line.linePrice, 0);

  const cuisine = CUISINE_BY_ID[meal.cuisine];
  const band = WEIGHT_BAND_BY_ID[meal.weightBand];

  function stepServings(delta) {
    setServings((current) => Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, current + delta)));
  }

  const page = PAGES[pageIndex].id;

  function ingredientRow(line, kind) {
    return (
      <li className={`ingredient-row row-${kind}`} key={line.id}>
        <span className="row-mark" aria-hidden="true">
          {kind === 'have' ? '✓' : '+'}
        </span>
        <span className="row-emoji" aria-hidden="true">
          {line.ingredient.emoji}
        </span>
        <span className="row-name">{line.ingredient.name}</span>
        <span className="row-qty">{line.display}</span>
        <span className="row-price">{formatPrice(line.linePrice)}</span>
      </li>
    );
  }

  return (
    <div className="screen screen-stepped">
      <header className="app-header compact">
        <button type="button" className="back-button" onClick={onBack}>
          &larr; Back to meals
        </button>
        <div className="detail-title-row">
          <span className="detail-emoji" aria-hidden="true">
            {meal.emoji}
          </span>
          <div>
            <h1 className="app-title">{meal.name}</h1>
            <p className="app-subtitle">{meal.tagline}</p>
          </div>
        </div>
        <div className="tag-row">
          {cuisine && (
            <span className="tag tag-cuisine">
              <span aria-hidden="true">{cuisine.emoji}</span> {cuisine.label}
            </span>
          )}
          <span className="tag tag-category">{meal.category}</span>
          {band && <span className={`tag tag-band tag-band-${meal.weightBand}`}>{band.label}</span>}
          <span className="tag">{meal.difficulty}</span>
          <span className="tag">{meal.matchPercent}% match</span>
          {meal.vegetarian && <span className="tag tag-veg">Vegetarian</span>}
          {meal.isReadyToCook && <span className="tag tag-ready">Nothing missing</span>}
        </div>
      </header>

      {/* Names, not a progress bar: reading a recipe has no required order. */}
      <nav className="page-index" aria-label="Recipe sections">
        {PAGES.map((entry, index) => (
          <button
            key={entry.id}
            type="button"
            className={`page-tab ${index === pageIndex ? 'is-current' : ''}`}
            aria-current={index === pageIndex ? 'page' : undefined}
            onClick={() => setPageIndex(index)}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      {page === 'basics' && (
        <>
      <section className="card" aria-labelledby="servings-heading">
        <h2 id="servings-heading" className="section-title">
          Serving size
        </h2>
        <p className="section-hint">
          Quantities, price and totals rescale. Calories per person stay the same.
        </p>
        <div className="stepper">
          <button
            type="button"
            className="stepper-button"
            onClick={() => stepServings(-1)}
            disabled={servings <= MIN_SERVINGS}
            aria-label="One fewer serving"
          >
            &minus;
          </button>
          <div className="stepper-value">
            <span className="stepper-number">{servings}</span>
            <span className="stepper-unit">{servings === 1 ? 'serving' : 'servings'}</span>
          </div>
          <button
            type="button"
            className="stepper-button"
            onClick={() => stepServings(1)}
            disabled={servings >= MAX_SERVINGS}
            aria-label="One more serving"
          >
            +
          </button>
        </div>
        <p className="base-note">Recipe was written for {meal.baseServings} servings.</p>
      </section>

      <section className="card" aria-labelledby="time-heading-detail">
        <h2 id="time-heading-detail" className="section-title">
          Time
        </h2>
        <dl className="stat-row three">
          <div className="stat">
            <dt>Prep</dt>
            <dd>{formatMinutes(meal.prepMinutes)}</dd>
          </div>
          <div className="stat">
            <dt>Cook</dt>
            <dd>{formatMinutes(meal.cookMinutes)}</dd>
          </div>
          <div className="stat stat-strong">
            <dt>Total</dt>
            <dd>{formatMinutes(meal.totalMinutes)}</dd>
          </div>
        </dl>
      </section>

        </>
      )}

      {page === 'ingredients' && (
      <section className="card" aria-labelledby="ingredients-heading-detail">
        <h2 id="ingredients-heading-detail" className="section-title">
          Ingredients for {servings} {servings === 1 ? 'serving' : 'servings'}
        </h2>

        <h3 className="group-title group-have">You have ({haveLines.length})</h3>
        {haveLines.length === 0 ? (
          <p className="empty-note">Nothing from this recipe is in your kitchen yet.</p>
        ) : (
          <ul className="ingredient-list">{haveLines.map((l) => ingredientRow(l, 'have'))}</ul>
        )}

        <h3 className="group-title group-need">You still need ({needLines.length})</h3>
        {needLines.length === 0 ? (
          <p className="ready-note">You have everything. Start cooking whenever you are ready.</p>
        ) : (
          <>
            <ul className="ingredient-list">{needLines.map((l) => ingredientRow(l, 'need'))}</ul>
            <p className="base-note">
              The {needLines.length} {needLines.length === 1 ? 'item' : 'items'} you are missing
              come to <strong>{formatPrice(shoppingCost)}</strong> at this serving size.
            </p>
          </>
        )}
      </section>

      )}

      {page === 'cost' && (
      <section className="card" aria-labelledby="cost-heading">
        <h2 id="cost-heading" className="section-title">
          Cost
        </h2>
        <div className="calorie-split">
          <div className="calorie-box">
            <span className="calorie-value">{formatPrice(scaled.pricePerServing)}</span>
            <span className="calorie-label">per person</span>
          </div>
          <div className="calorie-box calorie-box-muted">
            <span className="calorie-value">{formatPrice(scaled.totalPrice)}</span>
            <span className="calorie-label">
              whole dish ({servings} {servings === 1 ? 'serving' : 'servings'})
            </span>
          </div>
        </div>
        <p className="disclaimer">
          Invented prices for this prototype. Not real shop prices, and no shop is implied.
        </p>
      </section>

      )}

      {page === 'nutrition' && (
      <section className="card" aria-labelledby="nutrition-heading">
        <h2 id="nutrition-heading" className="section-title">
          Nutrition
        </h2>

        <div className="calorie-split">
          <div className="calorie-box">
            <span className="calorie-value">{scaled.caloriesPerServing}</span>
            <span className="calorie-label">kcal per person</span>
          </div>
          <div className="calorie-box calorie-box-muted">
            <span className="calorie-value">{scaled.totalCalories}</span>
            <span className="calorie-label">
              kcal total ({servings} {servings === 1 ? 'serving' : 'servings'})
            </span>
          </div>
        </div>

        <h3 className="group-title">Per serving</h3>
        <dl className="stat-row three">
          <div className="stat">
            <dt>Protein</dt>
            <dd>{meal.proteinGrams} g</dd>
          </div>
          <div className="stat">
            <dt>Carbs</dt>
            <dd>{meal.carbGrams} g</dd>
          </div>
          <div className="stat">
            <dt>Fat</dt>
            <dd>{meal.fatGrams} g</dd>
          </div>
        </dl>

        <h3 className="group-title">Whole dish</h3>
        <dl className="stat-row three">
          <div className="stat">
            <dt>Protein</dt>
            <dd>{scaled.totalProtein} g</dd>
          </div>
          <div className="stat">
            <dt>Carbs</dt>
            <dd>{scaled.totalCarbs} g</dd>
          </div>
          <div className="stat">
            <dt>Fat</dt>
            <dd>{scaled.totalFat} g</dd>
          </div>
        </dl>

        <p className="disclaimer">
          Invented sample figures for this prototype. Not health or medical advice.
        </p>

        <SourcedNutrition ingredients={scaled.ingredients} />
      </section>

      )}

      {page === 'steps' && (
      <section className="card" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="section-title">
          How to cook it
        </h2>
        <ol className="step-list">
          {meal.steps.map((step, index) => (
            <li className="step-row" key={step}>
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="step-text">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      )}

      <DisqusThread />

      <div className="step-bar">
        {pageIndex > 0 && (
          <button
            type="button"
            className="secondary-button step-back"
            onClick={() => setPageIndex(pageIndex - 1)}
          >
            Back
          </button>
        )}
        {pageIndex < PAGES.length - 1 ? (
          <button
            type="button"
            className="primary-button step-next"
            onClick={() => setPageIndex(pageIndex + 1)}
          >
            Next
            <span className="button-note">{PAGES[pageIndex + 1].label}</span>
          </button>
        ) : (
          <button type="button" className="primary-button step-next" onClick={onBack}>
            Back to meals
          </button>
        )}
      </div>
    </div>
  );
}
