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
        <button type="button" className="text-button" onClick={onUndo}>
          Undo
        </button>
      </div>
    );
  }

  const { count, when } = notice;
  const what =
    count > 0
      ? `The ${count} ${count === 1 ? 'ingredient' : 'ingredients'} you ticked${when ? ` ${when}` : ''} ${
          count === 1 ? 'is' : 'are'
        } still ticked.`
      : `Your answers${when ? ` from ${when.replace(/^on /, '')}` : ''} are kept.`;

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
