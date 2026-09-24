/**
 * Compares the pages drawn by scripts/render-shape-demos.sh with the reference images in scripts/shape-demos/references.
 *
 * Usage: npm run run-ts -- scripts/compare-shape-renders.ts [renders directory] [--references directory] [--update]
 *
 * The renders directory defaults to build/shape-demos. A page fails when more than a few of its pixels differ from the
 * reference, or when a page was added or is missing. An image of each difference, with the changed pixels in red, is
 * written to the renders directory's `diff` folder.
 *
 * With --references, the pages are compared with those in another directory instead, such as pages Apple Pages drew
 * from the master branch (see scripts/render-shape-demos-in-pages.sh).
 *
 * With --update, the references are replaced with the renders. Only update them from renders drawn in the Docker image
 * (SHAPE_RENDER_IMAGE), as LibreOffice versions and fonts draw pages differently.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const DEFAULT_REFERENCES = "scripts/shape-demos/references";
// How different two pixels' colours can be before they count as different, from 0 to 1. This ignores slight changes in anti-aliasing
const COLOUR_THRESHOLD = 0.1;
// How many pixels of a page can differ before it fails
const MAX_DIFFERENT_PIXELS = 25;

const args = process.argv.slice(2);
const update = args.includes("--update");
// Where the directory after --references is, if it is given
const referencesIndex = args.indexOf("--references") + 1;
const REFERENCES = referencesIndex > 0 ? args[referencesIndex] : DEFAULT_REFERENCES;
const renders =
    args.find((arg, index) => !arg.startsWith("--") && (referencesIndex === 0 || index !== referencesIndex)) ?? "build/shape-demos";

const pagesIn = (directory: string): readonly string[] =>
    existsSync(directory)
        ? readdirSync(directory)
              .filter((name) => name.endsWith(".png"))
              .sort()
        : [];

const rendered = pagesIn(renders);
if (rendered.length === 0) {
    console.error(`No pages in ${renders}. Run scripts/render-shape-demos.sh first`);
    process.exit(1);
}

if (update) {
    rmSync(REFERENCES, { recursive: true, force: true });
    mkdirSync(REFERENCES, { recursive: true });
    for (const page of rendered) {
        copyFileSync(join(renders, page), join(REFERENCES, page));
    }
    console.log(`Updated ${rendered.length} reference images in ${REFERENCES}`);
    process.exit(0);
}

const references = pagesIn(REFERENCES);
const diffs = join(renders, "diff");
rmSync(diffs, { recursive: true, force: true });

const failures = [
    ...references.filter((page) => !rendered.includes(page)).map((page) => `${page} is missing: the demo has fewer pages`),
    ...rendered.filter((page) => !references.includes(page)).map((page) => `${page} is new: add it with --update`),
    ...references
        .filter((page) => rendered.includes(page))
        .flatMap((page) => {
            const expected = PNG.sync.read(readFileSync(join(REFERENCES, page)));
            const actual = PNG.sync.read(readFileSync(join(renders, page)));
            if (expected.width !== actual.width || expected.height !== actual.height) {
                return [`${page} is ${actual.width}×${actual.height} pixels, but the reference is ${expected.width}×${expected.height}`];
            }
            const diff = new PNG({ width: expected.width, height: expected.height });
            const different = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, {
                threshold: COLOUR_THRESHOLD,
            });
            if (different <= MAX_DIFFERENT_PIXELS) {
                return [];
            }
            mkdirSync(diffs, { recursive: true });
            writeFileSync(join(diffs, page), PNG.sync.write(diff));
            return [`${page} has ${different} different pixels. See ${join(diffs, page)}`];
        }),
];

for (const failure of failures) {
    console.error(`::error::${failure}`);
}
console.log(`Compared ${rendered.length} pages with ${references.length} references: ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
