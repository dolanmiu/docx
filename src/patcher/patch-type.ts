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
     * Repeat the rows of a table that hold the placeholder's fields, such as `{{items.name}}`, once for each row of
     * data. See {@link TableRowsPatch}
     */
    TABLE_ROWS: "tableRows",
    /**
     * Change a drawing whose alt text holds the placeholder, and the parts it refers to, such as the data of a chart made
     * in Word. See {@link DrawingPatch}
     */
    DRAWING: "drawing",
} as const;
