/**
 * The standing credit, and the standing caveat.
 *
 * USDA asks to be listed as the source of the data: "No permission is needed
 * for their use, but we request that users list FoodData Central as the source
 * of the data." That request does not become conditional when a lookup fails,
 * so this sits on every screen rather than inside the panel that shows a
 * record. Before this existed, the attribution appeared only in the successful
 * branch — which meant the four screens a user is most likely to see on a bad
 * evening carried no credit at all.
 *
 * The second paragraph is the honest summary of what this product is: one
 * sourced figure and a great deal of invented data, said plainly and in the
 * same breath as the credit rather than buried a screen away.
 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        Nutrition lookups use <strong>FoodData Central</strong>, U.S. Department of Agriculture,
        Agricultural Research Service —{' '}
        <a href="https://fdc.nal.usda.gov" target="_blank" rel="noreferrer">
          fdc.nal.usda.gov
        </a>
        . Public domain, CC0 1.0.
      </p>
      <p>
        Everything else in PantryPilot is invented sample data for a prototype: the recipes, the
        times, the prices and every nutrition figure except the one record each meal cites. Nothing
        here is health, dietary or medical advice, no price is a real price, and no shop is named or
        implied.
      </p>
      {/* Both third parties, named together, on every screen. Splitting them —
          Clarity here, Disqus beside the comment box — would mean a visitor who
          never opens the comments never reads half of it. */}
      <p className="privacy-note">
        This page uses Microsoft Clarity and Disqus, which use cookies to record how visitors use
        the site and to host comments. By using this page you agree that we and Microsoft may
        collect and use this data. See the{' '}
        <a
          href="https://www.microsoft.com/privacy/privacystatement"
          target="_blank"
          rel="noreferrer"
        >
          Microsoft Privacy Statement
        </a>
        , the{' '}
        <a href="https://disqus.com/privacy-policy/" target="_blank" rel="noreferrer">
          Disqus privacy policy
        </a>{' '}
        and the{' '}
        <a href="https://disqus.com/data-sharing-settings/" target="_blank" rel="noreferrer">
          Disqus data sharing settings
        </a>
        .
      </p>
    </footer>
  );
}
