# Replacing the location picture with a period image

This proposal keeps artwork separate from game information. Replacing the picture changes the place portrait, its credit, and the exported files; it does not change tile rules or game state.

## Selection brief

Use a photograph, postcard, print, or painting that helps identify the location and contributes period atmosphere. Prefer a broad town view, landmark, or landscape that remains recognizable in a 302 × 136 pixel crop. Keep its date explicit. If its date or subject does not match the game period exactly, label it as a reference view rather than implying that it depicts the current game year.

Read the collection's item record and reuse terms before choosing the asset. Save the item page, creator, title, date or date range, item identifier, collection, supplied reuse terms, and required credit. Record unknown fields as unknown. The source page and credit appear below the standalone proposal, outside the compact game window.

## Replacement steps

1. Keep the downloaded original unchanged. Add a versioned local file inside this proposal folder, for example `images/marugame-period-v1.jpg`. Do not overwrite the generated concept image or previous source images.
2. Update `artwork.json`. Required rendering fields are `file`, `mimeType`, `width`, and `height`. Set `width` and `height` to the image's actual pixel dimensions. The image must be local to this proposal folder; the generator embeds it in the SVG and HTML.
3. Set `kind` to `period-image`, write an accurate `alt`, and populate the provenance fields. `credit` is displayed below the proposal. The compact vignette label changes from “Concept art” to “Period image.”
4. Adjust `focalPoint.x` and `focalPoint.y` between 0 and 1. A value of 0 aligns the crop to the left/top, 0.5 centers it, and 1 aligns it to the right/bottom. The SVG frame crops the display; it does not edit the source image.
5. Run the generator from this folder: `node build-proposal.mjs`. It rebuilds `index.html` and `proposed-area-survey.svg` with the new embedded picture.
6. Open `index.html` at its intended width of 960 pixels and inspect the small vignette. Check that the landmark survives the crop, that the place name remains legible, and that the picture suggests no additional game rule.
7. Re-export the PNG from the `.prototype > svg` element at device scale factor 2. The result should be **1920 × 1280**. A Playwright capture is shown below; use the project's available browser runtime.

```js
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({
  viewport: { width: 1000, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto(pathToFileURL(path.resolve('index.html')).href);
await page.locator('.prototype > svg').screenshot({
  path: 'proposed-area-survey.png',
});
await browser.close();
```

The snippet assumes `chromium` from Playwright, `path` from `node:path`, and `pathToFileURL` from `node:url` have been imported. The SVG export is also usable directly without a browser capture.

## Example manifest shape

The values below are placeholders, not a researched image recommendation.

```json
{
  "file": "images/marugame-period-v1.jpg",
  "mimeType": "image/jpeg",
  "width": 1800,
  "height": 1200,
  "focalPoint": { "x": 0.5, "y": 0.45 },
  "title": "Title from the collection record",
  "alt": "Description of the actual view",
  "kind": "period-image",
  "creator": "Creator as recorded, or unknown",
  "date": "Date or date range as recorded, or unknown",
  "sourceUrl": "https://collection.example/item-page",
  "collection": "Holding collection",
  "itemIdentifier": "Collection identifier",
  "reuseTerms": "Reuse terms supplied by the collection",
  "credit": "Required attribution or agreed source credit"
}
```

## For the eventual live application

Maintain a location-to-artwork manifest keyed by hex (for example `I2`) using this same source metadata. Keep gameplay values in the authoritative state projection. Do not infer a port, station, build cost, or upgrade option from an image. Missing art should use a neutral district vignette without changing the information layout. The current generated artwork remains documented in `wide-v1/design-notes.md`.

## Live application

The compact survey is now implemented in the game. Its artwork contract is documented in [district-artwork.md](../../district-artwork.md). The live application reads `src/data/districtArtwork.json` and serves images from `public/assets/districts/`. The `artwork.json` and generator in this folder continue to control only the standalone proposal.
