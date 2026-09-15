# KBQA-R1 case visualization

This component replays the GrailQA example in the KBQA-R1 paper's experimental-details appendix: “What short story has a character who also is in Doing Clarence a Bit of Good?”

The presentation contains five states: the topic entity; the shared character Reggie Pepper; seven retrieved stories; a short-story type check that retains all seven; and a final answer containing six IDs after excluding the topic story. The type-check step does not remove the topic entity. The final step is an answer emission, not an invented `Finish` tool call.

Narrative text and graph edge labels are shortened for presentation. Expand the detail panel for the action strings and entity IDs. The first action follows the detailed appendix trace (`book.book_character.character_appearing`); the appendix's separate compact comparison uses a different relation spelling. The demo does not silently rewrite the recorded action or perform live queries.

Sources used during reconstruction:

- Paper: https://arxiv.org/abs/2512.10999
- Local paper source: `section/appendix_experimental_details.tex`, full example, environment-feedback blocks and final answer.
- Recovered, previously uncommitted project-page demo and its two GIFs. Those original files remain unchanged in the author's local archive.

`trace.js` contains the verified entity names/IDs, deterministic SVG renderer, step selection and playback. `trace.css` styles the component and switches to a vertical branched graph on mobile. No external drawing library or fonts are required for the visualization itself. `window.kbqaTrace.setStep(index, progress)` exposes deterministic rendering for GIF export (progress is 0–1).

The GIFs are rendered from the same component. Moving markers illustrate the two relation traversals; long holds allow reading each outcome. Exported GIFs omit the webpage's interactive playback controls. The final PNG is a static fallback for browsers with JavaScript disabled.

Playback starts only when requested, can be paused/reset, stops at the answer, and stops when the browser tab is hidden. Reduced-motion preferences disable transition motion. The static graph is labeled for assistive technology and the step controls expose the active step.
