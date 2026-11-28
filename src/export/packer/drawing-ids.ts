/**
 * Numbers the drawings of a document as it is packed.
 *
 * @module
 */

// The tags of drawings, and of the elements in them that have ids: a drawing's own (`wp:docPr`), those of the shapes,
// pictures and groups in it, and a connector's ends, which refer to the shapes it joins by their ids
const TAG = /<(\/?)(wp:inline|wp:anchor|wp:docPr|wps:cNvPr|wpg:cNvPr|pic:cNvPr|a:stCxn|a:endCxn)(?=[\s/>])[^>]*>/g;
const ID = /(\s)id="(\d+)"/;

/**
 * Creates a function that numbers the drawings in the parts of a document from 1, in the order they are written.
 *
 * Each drawing is given an id when it is created, from one counter for the whole process, so no two drawings share
 * one. Written as they are, the ids of a document would depend on the drawings created before it, and the same
 * document would be written differently each time. Word only needs the ids to be unique in the document, across all
 * of its parts, so the parts of a document are numbered by the same function, one after the other.
 *
 * Every drawing, and every shape, picture and group in it, is given the next id, even when the same drawing is in the
 * document twice, and a connector still joins the shapes it did. A picture's own `pic:cNvPr` keeps the id 0 it is
 * written with, as Word writes it: only its drawing's id needs to be unique.
 *
 * @returns A function that returns a part's XML with its drawings numbered after those of the parts before it
 */
export const createDrawingNumbering = (): ((xml: string) => string) => {
    let lastId = 0;

    return (xml) => {
        // The new id of each tag that has one, by where the tag starts
        const newIds = new Map<number, number>();
        // The new ids of the shapes in each drawing the tags are in, by their old ids
        const drawings: Map<number, number>[] = [];
        // A connector can come before the shapes it joins, so its ends are numbered once every shape has been
        const ends: { readonly offset: number; readonly shapes: ReadonlyMap<number, number>; readonly id: number }[] = [];

        for (const { 0: tag, 1: closing, 2: name, index: offset } of xml.matchAll(TAG)) {
            if (name === "wp:inline" || name === "wp:anchor") {
                if (closing) {
                    // eslint-disable-next-line functional/immutable-data
                    drawings.pop();
                } else {
                    // eslint-disable-next-line functional/immutable-data
                    drawings.push(new Map());
                }
                continue;
            }
            const shapes = drawings[drawings.length - 1];
            const id = Number(ID.exec(tag)?.[2]);
            if (closing || !shapes || !Number.isInteger(id) || (name === "pic:cNvPr" && id === 0)) {
                continue;
            }
            if (name === "a:stCxn" || name === "a:endCxn") {
                // eslint-disable-next-line functional/immutable-data
                ends.push({ offset, shapes, id });
                continue;
            }
            lastId++;
            // eslint-disable-next-line functional/immutable-data
            newIds.set(offset, lastId);
            if (name !== "wp:docPr" && !shapes.has(id)) {
                // eslint-disable-next-line functional/immutable-data
                shapes.set(id, lastId);
            }
        }
        for (const { offset, shapes, id } of ends) {
            const shape = shapes.get(id);
            if (shape !== undefined) {
                // eslint-disable-next-line functional/immutable-data
                newIds.set(offset, shape);
            }
        }

        return newIds.size === 0
            ? xml
            : xml.replace(TAG, (tag: string, _closing: string, _name: string, offset: number) => {
                  const id = newIds.get(offset);
                  return id === undefined ? tag : tag.replace(ID, `$1id="${id}"`);
              });
    };
};
