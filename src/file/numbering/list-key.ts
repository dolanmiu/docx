/**
 * The key a list's numbering id is found by while a document is written, which paragraphs write as a placeholder for it.
 *
 * Internal: not exported from the numbering module.
 *
 * @module
 */

/**
 * Gives the key of a list of a numbering reference: the list of an `instance` paragraphs give, or a list a paragraph
 * restarts with `restart`, which has an id of its own so it is never mistaken for one of the numbered instances.
 *
 * @param reference - The list's numbering reference
 * @param instance - The `instance` that paragraphs give, used when the list isn't a restarted one
 * @param restartedListId - For a list a paragraph restarts, the id of that restart
 * @returns The list's key
 */
export const listKey = (reference: string, instance: number, restartedListId?: number): string =>
    restartedListId === undefined ? `${reference}-${instance}` : `${reference}-restart ${restartedListId}`;
