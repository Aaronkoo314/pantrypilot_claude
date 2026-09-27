/**
 * The one line a returning visitor sees about their remembered kitchen.
 *
 * A remembered list is last week's fridge, and some of it is eaten. Restoring
 * it silently would have the app say "you have" about things the user used up,
 * so the restore is always announced, with a way to start again. Start fresh
 * clears the ingredients and the answers together, so, like Clear all, it can
 * be undone from the same line.
 */
export default function WelcomeBack({ notice, onStartFresh, onUndo, onDismiss }) {
  if (!notice) return null;

  if (notice.kind === 'fresh') {
    return (
      <div className="welcome-back" role="status">
        <p className="welcome-text">Started fresh: your ingredients and answers are cleared.</p>
        {/* App moves focus here after Start fresh, whose button this replaces. */}
        <button type="button" className="text-button welcome-undo" onClick={onUndo}>
          Undo
        </button>
      </div>
    );
  }

  // "Last visit" rather than "you ticked": the saved time is the last change to
  // anything in the kitchen, not the day each ingredient was ticked.
  const { count, when } = notice;
  const visit = `your last visit${when ? ` (${when.replace(/^on /, '')})` : ''}`;
  const what =
    count > 0
      ? `The ${count} ${count === 1 ? 'ingredient' : 'ingredients'} from ${visit} ${
          count === 1 ? 'is' : 'are'
        } still ticked.`
      : `Your answers from ${visit} are kept.`;

  return (
    <div className="welcome-back" role="status">
      <p className="welcome-text">
        <strong>Welcome back.</strong> {what}
      </p>
      <button type="button" className="text-button" onClick={onStartFresh}>
        Start fresh
      </button>
      <button
        type="button"
        className="welcome-dismiss"
        onClick={onDismiss}
        aria-label="Keep them and hide this message"
      >
        ×
      </button>
    </div>
  );
}
