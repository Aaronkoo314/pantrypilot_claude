import { useEffect, useState } from 'react';

/**
 * One Disqus thread, reachable from the bottom of every page, but closed until
 * somebody asks for it.
 *
 * It started open on every page and that undid the change it shipped alongside.
 * The app had just been split into short pages; the embed is about 925px, which
 * on the recipe steps page was 34% of the height and pushed every page in the
 * flow past the longest page the split had been made to eliminate. A row of
 * twelve pages each carrying a thousand pixels of comment box is a longer app
 * than the one page it replaced.
 *
 * So the invitation is one line and the thread loads on the first tap. Three
 * things follow from that and each is deliberate:
 *
 *   - The script is fetched the first time anybody opens it, not on page load.
 *     Most visitors never open it and should not pay for it.
 *   - It closes again when the page changes. Keeping it open would re-init
 *     Disqus on every Next, which is three iframes per tap.
 *   - page.identifier is the fixed string "home" and page.url is the full live
 *     https address, so every comment lands in the same thread wherever it was
 *     written from. Without the pinned URL, localhost, a preview deployment and
 *     the per-deployment *.vercel.app address would each open a thread nobody
 *     else can see.
 *
 * No package was added. Disqus ships a plain script tag.
 */

const SHORTNAME = 'aaronkoojy';
const PAGE_URL = 'https://pantrypilot-phi.vercel.app';
const PAGE_IDENTIFIER = 'home';

/** Module scope, so it survives every re-render and re-mount of the component. */
let scriptRequested = false;

export default function DisqusThread() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Disqus reads this when it loads, and again on every reset.
    window.disqus_config = function disqusConfig() {
      this.page.url = PAGE_URL;
      this.page.identifier = PAGE_IDENTIFIER;
    };

    if (!scriptRequested) {
      scriptRequested = true;
      const script = document.createElement('script');
      script.src = `https://${SHORTNAME}.disqus.com/embed.js`;
      script.setAttribute('data-timestamp', String(Date.now()));
      script.async = true;
      document.body.appendChild(script);
      return;
    }

    // Already loaded on an earlier page: the container below is new, so ask
    // Disqus to draw into it.
    if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
      window.DISQUS.reset({ reload: true, config: window.disqus_config });
    }
  }, [open]);

  return (
    <section className="comments" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="visually-hidden">
        Feedback
      </h2>
      <button
        type="button"
        className="comments-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="comments-caret" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
        <span className="comments-invite">
          {open ? 'Hide feedback' : 'Tell me what worked and what did not'}
        </span>
      </button>

      {open && (
        <div className="comments-body">
          <p className="section-hint">
            One thread for the whole product. Say what you found useful, where you hesitated, and
            anything that looked wrong.
          </p>
          <div id="disqus_thread" />
          <noscript>
            Comments need JavaScript.{' '}
            <a href="https://disqus.com/?ref_noscript" rel="noreferrer">
              Read them on Disqus
            </a>{' '}
            instead.
          </noscript>
        </div>
      )}
    </section>
  );
}
