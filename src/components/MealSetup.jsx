import { useState } from 'react';
import IngredientPicker from './IngredientPicker.jsx';
import {
  CUISINE_OPTIONS,
  INGREDIENT_BY_ID,
  INGREDIENT_CATEGORIES,
  TIME_OPTIONS,
  WEIGHT_BANDS,
} from '../data/pantryData.js';

const MIN_PEOPLE = 1;
const MAX_PEOPLE = 12;

/** Five ingredient categories, then the four questions that are not about ingredients. */
const STEPS = [
  ...INGREDIENT_CATEGORIES.map((category) => ({ kind: 'category', category })),
  { kind: 'questions' },
];

/**
 * Screen 1, as a six-step flow.
 *
 * It used to be one page carrying the whole ingredient list plus four more
 * questions, and it grew every time the dataset did. One thing per page fixes
 * the length, but a wizard has its own failure: people lose track of where they
 * are and whether they can leave. Three things answer that here.
 *
 *   - "1 of 6" and a six-segment bar, always on screen, and every segment is a
 *     button. Nobody has to walk forward through pages they do not care about.
 *   - Skip sits next to Next and does the same thing. It exists because "Next"
 *     alone makes a user wonder whether moving on means "I have none of these"
 *     or "I have not finished".
 *   - Everything picked stays visible at the bottom of every page, and nothing
 *     is lost by moving, jumping or searching.
 *
 * Clear all is the one irreversible action in the product, so it is undoable
 * here rather than confirmed: a confirmation costs everybody a tap to protect
 * the few who misfire, and an undo costs only the people who did.
 */
export default function MealSetup({ setup, onChange, onFindMeals, resultCount, readyCount }) {
  const { ingredientIds, people, timeId, cuisineIds, weightBands } = setup;
  const [stepIndex, setStepIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [cleared, setCleared] = useState(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const mealWord = resultCount === 1 ? 'meal' : 'meals';

  function goTo(index) {
    setStepIndex(index);
    setQuery('');
    setCleared(null);
  }

  function toggleIngredient(id) {
    setCleared(null);
    onChange((current) => ({
      ingredientIds: current.ingredientIds.includes(id)
        ? current.ingredientIds.filter((item) => item !== id)
        : [...current.ingredientIds, id],
    }));
  }

  function clearAll() {
    setCleared(ingredientIds);
    onChange({ ingredientIds: [] });
  }

  function undoClear() {
    onChange({ ingredientIds: cleared });
    setCleared(null);
  }

  function stepPeople(delta) {
    onChange((current) => ({
      people: Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, current.people + delta)),
    }));
  }

  function toggleIn(key, id) {
    onChange((current) => ({
      [key]: current[key].includes(id)
        ? current[key].filter((item) => item !== id)
        : [...current[key], id],
    }));
  }

  function renderMultiSelect(key, options, selected) {
    return (
      <div className="option-row">
        {options.map((option) => {
          const isOn = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={`option-tile ${isOn ? 'option-on' : ''}`}
              aria-pressed={isOn}
              onClick={() => toggleIn(key, option.id)}
            >
              {option.emoji && (
                <span className="option-emoji" aria-hidden="true">
                  {option.emoji}
                </span>
              )}
              <span className="option-label">{option.label}</span>
              {option.helper && <span className="option-helper">{option.helper}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  const picked = ingredientIds.map((id) => INGREDIENT_BY_ID[id]).filter(Boolean);

  return (
    <div className="screen screen-stepped">
      <header className="step-header">
        {/* Page one is where a stranger arrives, so it keeps the line that says
            what the product is for. Splitting the setup into steps removed the
            old page header, and with it the only sentence on the screen that
            answered "what is this". Every classmate who was asked what the
            product did quoted this line and nothing else, so it earns its
            space here — and only here, because pages two to six are being read
            by somebody who already knows. */}
        {stepIndex === 0 && (
          <p className="step-brand">
            <span aria-hidden="true">&#127813;</span> PantryPilot — cook what you already have
          </p>
        )}
        <div className="step-progress" role="group" aria-label="Setup steps">
          {STEPS.map((entry, index) => {
            const label = entry.kind === 'category' ? entry.category : 'Last questions';
            const done = index < stepIndex;
            return (
              <button
                key={label}
                type="button"
                className={`step-segment ${index === stepIndex ? 'is-current' : ''} ${
                  done ? 'is-done' : ''
                }`}
                aria-label={`Step ${index + 1} of ${STEPS.length}: ${label}`}
                aria-current={index === stepIndex ? 'step' : undefined}
                onClick={() => goTo(index)}
              />
            );
          })}
        </div>
        <p className="step-counter">
          {stepIndex + 1} of {STEPS.length}
        </p>
        <h1 className="step-title">
          {step.kind === 'category' ? step.category : 'A few last questions'}
        </h1>
        <p className="step-sub">
          {step.kind === 'category'
            ? 'Tap everything you have.'
            : 'These narrow the list. None of them is required.'}
        </p>
      </header>

      {step.kind === 'category' ? (
        <IngredientPicker
          key={step.category}
          category={step.category}
          selectedIds={ingredientIds}
          onToggle={toggleIngredient}
          query={query}
          onQuery={setQuery}
        />
      ) : (
        <div className="step-body">
          <section className="card" aria-labelledby="people-heading">
            <h2 id="people-heading" className="section-title">
              How many people?
            </h2>
            <p className="section-hint">We scale the recipe when you open it.</p>
            <div className="stepper">
              <button
                type="button"
                className="stepper-button"
                onClick={() => stepPeople(-1)}
                disabled={people <= MIN_PEOPLE}
                aria-label="One fewer person"
              >
                &minus;
              </button>
              <div className="stepper-value">
                <span className="stepper-number">{people}</span>
                <span className="stepper-unit">{people === 1 ? 'person' : 'people'}</span>
              </div>
              <button
                type="button"
                className="stepper-button"
                onClick={() => stepPeople(1)}
                disabled={people >= MAX_PEOPLE}
                aria-label="One more person"
              >
                +
              </button>
            </div>
          </section>

          <section className="card" aria-labelledby="time-heading">
            <h2 id="time-heading" className="section-title">
              How much time?
            </h2>
            <p className="section-hint">Prep and cooking time together.</p>
            <div className="option-row">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`option-tile ${timeId === option.id ? 'option-on' : ''}`}
                  aria-pressed={timeId === option.id}
                  onClick={() => onChange({ timeId: option.id })}
                >
                  <span className="option-label">{option.label}</span>
                  <span className="option-helper">{option.helper}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="cuisine-heading">
            <h2 id="cuisine-heading" className="section-title">
              What are you in the mood for?
            </h2>
            <p className="section-hint">
              {cuisineIds.length === 0
                ? 'Pick any, or leave them all off for everything.'
                : `Showing ${cuisineIds.length} of ${CUISINE_OPTIONS.length} cuisines.`}
            </p>
            {renderMultiSelect('cuisineIds', CUISINE_OPTIONS, cuisineIds)}
          </section>

          <section className="card" aria-labelledby="weight-heading">
            <h2 id="weight-heading" className="section-title">
              How heavy?
            </h2>
            <p className="section-hint">
              {weightBands.length === 0
                ? 'By calories per person. Leave them all off for everything.'
                : 'By calories per person.'}
            </p>
            {renderMultiSelect('weightBands', WEIGHT_BANDS, weightBands)}
          </section>
        </div>
      )}

      {/* What you have, on every page, where you can undo it. */}
      <section className="picked-tray" aria-labelledby="picked-heading">
        <div className="picked-head">
          <h2 id="picked-heading" className="picked-label">
            Your ingredients
            <span className="count-pill" aria-live="polite">
              {ingredientIds.length}
            </span>
          </h2>
          {ingredientIds.length > 0 && (
            <button type="button" className="text-button" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        {cleared && cleared.length > 0 && ingredientIds.length === 0 ? (
          <p className="undo-note">
            Cleared {cleared.length} {cleared.length === 1 ? 'ingredient' : 'ingredients'}.{' '}
            <button type="button" className="text-button" onClick={undoClear}>
              Undo
            </button>
          </p>
        ) : ingredientIds.length === 0 ? (
          <p className="picked-empty">
            Nothing yet. You can skip every page and browse by cuisine instead.
          </p>
        ) : (
          <ul className="picked-tags">
            {picked.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="picked-tag"
                  onClick={() => toggleIngredient(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  {item.name}
                  <span className="picked-x" aria-hidden="true">
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="step-bar">
        {stepIndex > 0 && (
          <button type="button" className="secondary-button step-back" onClick={() => goTo(stepIndex - 1)}>
            Back
          </button>
        )}
        {!isLast && (
          <button type="button" className="secondary-button step-skip" onClick={() => goTo(stepIndex + 1)}>
            Skip
          </button>
        )}
        <button
          type="button"
          className="primary-button step-next"
          onClick={() => (isLast ? onFindMeals() : goTo(stepIndex + 1))}
        >
          {isLast ? 'Find recipes' : 'Next'}
          <span className="button-note">
            {ingredientIds.length === 0
              ? `${resultCount} ${mealWord}`
              : `${resultCount} ${mealWord} · ${readyCount} ready`}
          </span>
        </button>
      </div>
    </div>
  );
}
