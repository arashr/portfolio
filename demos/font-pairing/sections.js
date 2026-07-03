/** @typedef {{ slug: string, title: string, bodyHtml: string }} DemoSection */

/** @type {DemoSection[]} */
export const DEMO_SECTIONS = [
  {
    slug: 'context',
    title: 'Context and constraints',
    bodyHtml: `
      <p>Good pairings start with the job: how much text, how loud the headline, and whether the page feels editorial or product-like. This section is long-form body copy on a saturated ground — the kind of block you skim before committing to a case study.</p>
      <p>Watch the x-height match between body and display. Grotesques with similar proportions often feel calmer; a high-contrast serif display on a geometric sans can feel magazine-sharp without shouting.</p>`
  },
  {
    slug: 'hierarchy',
    title: 'Hierarchy at poster scale',
    bodyHtml: `
      <p>Posters exaggerate every decision. If the display face is too wide or too light, the title floats; if body leading is tight, paragraphs turn into slabs.</p>
      <h3>Subheads still matter</h3>
      <p>They inherit the display family in the reader — check that mid-size weights do not overpower the main title rhythm.</p>`
  },
  {
    slug: 'metrics',
    title: 'Numbers and small type',
    bodyHtml: `
      <div class="table-wrap" role="group" aria-label="Sample metrics">
        <table>
          <thead><tr><th>Signal</th><th>Before</th><th>After</th></tr></thead>
          <tbody>
            <tr><td>Checkout completion</td><td>2.1%</td><td>3.4%</td></tr>
            <tr><td>Time on task</td><td>4m 12s</td><td>2m 48s</td></tr>
          </tbody>
        </table>
      </div>
      <p>Tabular figures and label sizes should stay readable on tinted grounds — especially muted body color on carmine or indigo.</p>`
  },
  {
    slug: 'quote',
    title: 'Voice and pull quotes',
    bodyHtml: `
      <blockquote>
        <p>Typography is the detail that tells you whether someone cared about the whole system or only the hero screenshot.</p>
      </blockquote>
      <p>Quotes stress serif displays and italic cuts. Mono displays can work if the quote is short and the body stays humanist.</p>`
  },
  {
    slug: 'lists',
    title: 'Scannable structure',
    bodyHtml: `
      <p>Case studies live on lists:</p>
      <ul>
        <li>Problem framing in one breath</li>
        <li>Constraints you cannot cheat</li>
        <li>Decisions with trade-offs named</li>
        <li>Outcomes tied to behavior, not vanity metrics</li>
      </ul>
      <p>Bullet markers and list spacing should feel native to the body face — not bolted on after picking a display font.</p>`
  },
  {
    slug: 'closing',
    title: 'Closing beat',
    bodyHtml: `
      <p>End sections are often shorter. They are a good place to judge whether the pairing has enough personality for a portfolio without tiring on long reads.</p>
      <p class="mono-label">Shuffle grounds and pairings until something sticks — then port the winners into <code>gallery.config.json</code>.</p>`
  }
];
