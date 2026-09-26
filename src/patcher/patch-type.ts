/**
 * The types of patch `patchDocument` applies.
 *
 * @module
 */

/**
 * Patch type enumeration.
 *
 * Determines how the replacement content should be inserted into the document.
 *
 * @publicApi
 */
export const PatchType = {
    /** Replace entire file-level elements (e.g., whole paragraphs) */
    DOCUMENT: "file",
    /** Replace content within paragraphs (inline replacement) */
    PARAGRAPH: "paragraph",
    /**
     * Change a drawing whose alt text holds the placeholder, and the parts it refers to, such as the data of a chart made
     * in Word. See {@link DrawingPatch}
     */
    DRAWING: "drawing",
} as const;
