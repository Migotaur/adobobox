# Background illustrations

The page currently uses sun.svg, eggroll.svg, sparkle.svg, and rice.svg.
Replace these files with your own SVG artwork using the same filenames to keep the existing placement.
Keep a viewBox on each SVG, a transparent background, and black artwork.

To use a different filename or a PNG/WebP, update its background-image URL in src/app/app.component.css.
Image sizes and responsive scaling are in src/app/app.component.css under .doodle. Positions and rotations are randomized in src/app/app.component.ts after rendering, avoiding other doodles. Artwork that cannot fit is hidden.
CSS background URLs use ../../public/illustrations/<filename>, relative to src/app/app.component.css. Angular bundles these assets and generates paths that work under the GitHub Pages /adobobox/ prefix.
Add page content inside .page-content in src/app/app.component.html. Routed pages render there too. Doodles automatically fade to about 12% behind this container with soft edges; an empty container leaves the doodles fully visible. The fade updates when the container or background changes size.
