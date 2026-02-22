/**
 * Patch detector for discovering placeholders in document templates.
 *
 * @module
 */
import JSZip from "jszip";

import type { InputDataType } from "./from-docx";
import { traverse } from "./traverser";
import { toJson } from "./util";

/**
 * Options for patch detection.
 *
 * @property data - The document template to scan for placeholders
 */
type PatchDetectorOptions = {
    readonly data: InputDataType;
};

/**
 * Detects all placeholders present in a document template.
 *
 * Scans through all XML content in a .docx file to find placeholder text
 * enclosed in delimiters (default: {{placeholder}}). This is useful for
 * discovering what patches a template expects before performing replacement.
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
export const patchDetector = async ({ data }: PatchDetectorOptions): Promise<readonly string[]> => {
    const zipContent = data instanceof JSZip ? data : await JSZip.loadAsync(data);
    const patches = new Set<string>();

    for (const [key, value] of Object.entries(zipContent.files)) {
        if (!key.endsWith(".xml") && !key.endsWith(".rels")) {
            continue;
        }
        if (key.startsWith("word/") && !key.endsWith(".xml.rels")) {
            const json = toJson(await value.async("text"));
            // eslint-disable-next-line functional/immutable-data
            traverse(json).forEach((p) => findPatchKeys(p.text).forEach((patch) => patches.add(patch)));
        }
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
