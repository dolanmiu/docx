import { uniqueNumericIdCreator } from "@util/convenience-functions";

/**
 * Shared Content Control ID generator.
 *
 * This ensures all Content Controls (Run, Block, Dropdown, DatePicker, Checkbox)
 * get unique IDs across the entire document. Using separate generators would cause
 * duplicate IDs, which makes Microsoft Word reject the document.
 *
 * All Content Control classes should import and use this shared generator.
 */
export const contentControlIdGen = uniqueNumericIdCreator();
