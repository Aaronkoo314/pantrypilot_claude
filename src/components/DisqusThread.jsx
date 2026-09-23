import { useEffect } from 'react';

/**
 * One Disqus thread, on the main screen only.
 *
 * Three things have to be true for every visitor's comment to land in the same
 * conversation, and all three are decided here rather than left to Disqus's
 * defaults:
 *
 *   1. page.identifier is the fixed string "home". Disqus keys a thread on the
 *      identifier, so a fixed one means one thread forever.
 *   2. page.url is the full live https address with no query string. Without
 *      this, Disqus infers the URL from the browser — which on a preview
 *      deployment, on localhost, or on the per-deployment *.vercel.app hash
 *      address would each create a separate thread that nobody else can see.
 *   3. The script is injected once per page load. React re-renders this
 *      component on every state change on the setup screen, and appending the
 *      script again would load Disqus repeatedly.
 *
 * Re-mounting is a separate problem from re-rendering. This screen unmounts
 * when the user goes to the meal list and mounts again when they come back, by
 * which point the script is already loaded and would do nothing on its own, so
 * DISQUS.reset is called to draw the thread into the new container.
 *
 * No package was added. Disqus ships a plain script tag; a React wrapper would
 * be a dependency to do what fifteen lines do here.
 */

const SHORTNAME = 'aaronkoojy';
const PAGE_URL = 'https://pantrypilot-phi.vercel.app';
const PAGE_IDENTIFIER = 'home';

/** Module scope, so it survives every re-render and re-mount of the component. */
let scriptRequested = false;

export default function DisqusThread() {
  useEffect(() => {
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
      return undefined;
    }

    // Already loaded: the container below is new, so ask Disqus to redraw.
    if (window.DISQUS && typeof window.DISQUS.reset === 'function') {
      window.DISQUS.reset({ reload: true, config: window.disqus_config });
    }
    return undefined;
  }, []);

  return (
    <section className="comments" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="section-title">
        Tell me what worked and what did not
      </h2>
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
    </section>
  );
}
