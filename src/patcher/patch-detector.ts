/**
 * Patch detector for discovering placeholders in document templates.
 *
 * @module
 */
import { altTextOf, findDrawings } from "./drawing-patch";
import type { InputDataType } from "./from-docx";
import { loadZip } from "./load-zip";
import { traverse } from "./traverser";
import { decodeUtf8, toJson } from "./util";

/**
 * Options for patch detection.
 *
 * @property data - The document template to scan for placeholders
 * @property trimPlaceholders - Whether to give the key of a placeholder with spaces inside its delimiters without them
 */
type PatchDetectorOptions = {
    readonly data: InputDataType;
    /**
     * Give the key of a placeholder with spaces inside its delimiters without them, such as "name" for `{{ name }}`, as
     * `patchDocument`'s `trimPlaceholders` patches it (default: false)
     */
    readonly trimPlaceholders?: boolean;
};

// The parts placeholders are looked for in: those in word/ that are XML, other than their relationships
const isSearched = (path: string): boolean => path.startsWith("word/") && /\.(xml|rels)$/.test(path) && !path.endsWith(".xml.rels");

/**
 * Detects all placeholders present in a document template.
 *
 * Scans through all XML content in a .docx file to find placeholder text
 * enclosed in delimiters (default: {{placeholder}}), and placeholders in the
 * alt text of drawings, such as a chart for `docx/charts`' `ChartDataPatch`.
 * This is useful for discovering what patches a template expects before
 * performing replacement.
 *
 * @param options - Patch detector configuration
 * @returns Array of placeholder keys found in the document
 *
 * @example
 * ```typescript
 * const placeholders = await patchDetector({ data: templateBuffer });
 * // Returns: ["name", "date", "address"] if template contains {{name}}, {{date}}, {{address}}
 *
 * // Use detected placeholders to create patches
 * const patches = {};
 * placeholders.forEach(key => {
 *   patches[key] = {
 *     type: PatchType.PARAGRAPH,
 *     children: [new TextRun(getUserData(key))],
 *   };
 * });
 * ```
 */
export const patchDetector = async ({ data, trimPlaceholders = false }: PatchDetectorOptions): Promise<readonly string[]> => {
    // Only the parts placeholders can be in are inflated, not a template's images or embedded files
    const zipContent = await loadZip(data, isSearched);
    const patches = new Set<string>();

    for (const [, value] of zipContent) {
        const json = toJson(decodeUtf8(value));
        const texts = [...traverse(json).map((p) => p.text), ...findDrawings(json).flatMap(({ properties }) => altTextOf(properties))];
        const keys = texts
            .flatMap((text) => findPatchKeys(text))
            .map((patch) => (trimPlaceholders ? patch.trim() : patch))
            // A placeholder of only spaces has no key
            .filter((patch) => patch !== "");
        // eslint-disable-next-line functional/immutable-data
        keys.forEach((patch) => patches.add(patch));
    }
    return Array.from(patches);
};

/**
 * Extracts placeholder keys from text using regex pattern.
 *
 * @param text - Text to search for placeholders
 * @returns Array of placeholder keys (without delimiters)
 */
const findPatchKeys = (text: string): readonly string[] => {
    const pattern = /(?<=\{\{).+?(?=\}\})/gs;
    return text.match(pattern) ?? [];
};
