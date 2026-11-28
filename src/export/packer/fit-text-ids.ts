/**
 * Numbers the runs of a document that are fitted to a width on their own as it is packed.
 *
 * @module
 */

const TAG = /<w:fitText(?=[\s/>])[^>]*>/g;
// The ids docx gives runs fitted on their own are negative, so they don't meet the groups people give, which count up
const ID = /(\sw:id=")(-\d+)(")/;

/**
 * Creates a function that numbers the runs fitted to a width on their own (`w:fitText` without a group) in the parts
 * of a document, from -1 down, in the order they are written.
 *
 * Each such run is given an id when it is created, from one counter for the whole process, so no two runs share one.
 * Written as they are, the ids of a document would depend on the runs created before it. Word fits runs next to each
 * other with the same id together, so runs that had the same id still share one, and runs that didn't still don't.
 * The parts of a document, including its styles and lists, are numbered by the same function, one after the other.
 *
 * @returns A function that returns a part's XML with its runs numbered after those of the parts before it
 */
export const createFitTextNumbering = (): ((xml: string) => string) => {
    // The new id of each old one
    const newIds = new Map<number, number>();

    return (xml) =>
        xml.replace(TAG, (tag: string) =>
            tag.replace(ID, (_match, before: string, id: string, after: string) => {
                const newId = newIds.get(Number(id)) ?? -(newIds.size + 1);
                // eslint-disable-next-line functional/immutable-data
                newIds.set(Number(id), newId);
                return `${before}${newId}${after}`;
            }),
        );
};
