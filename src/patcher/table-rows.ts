/**
 * Patches that repeat the rows of a table in a template, once for each row of data.
 *
 * @module
 */
import type { Element } from "xml-js";

import type { IPatch, TableRowsPatch } from "./from-docx";
import { PatchType } from "./patch-type";
import { findLocationOfText } from "./traverser";

/**
 * Patches a placeholder, by its key such as "items.name", in a copy of the rows.
 */
type PatchPlaceholder = (copy: Element, key: string, patch: IPatch | TableRowsPatch) => void;

/**
 * Rows next to each other in a table that are repeated together, and where they are.
 */
type RowsToRepeat = {
    /** The table, or what holds the rows in it, such as a content control */
    readonly parent: Element;
    /** The table and what holds it, to remove the table if it is left with no rows */
    readonly table: { readonly element: Element; readonly parent: Element } | undefined;
    /** The rows, and anything between them, such as the end of a bookmark */
    readonly elements: readonly Element[];
};

/**
 * A row that holds a field, and where it is.
 */
type FoundRow = {
    readonly parent: Element;
    readonly table: RowsToRepeat["table"];
    readonly row: Element;
    readonly path: readonly number[];
};

// A field a row has no patch for is left empty
const EMPTY: IPatch = { type: PatchType.PARAGRAPH, children: [] };

/**
 * Repeats the rows of the tables in an element that hold the patch's fields, such as `{{items.name}}` for the key
 * "items", once for each of the patch's rows, and patches the fields in each copy with the row's patches.
 *
 * @param json - The element to patch, such as a part's root
 * @param key - The patch's key, such as "items"
 * @param patch - The rows of data
 * @param delimiters - The placeholders' delimiters
 * @param patchPlaceholder - Patches a field in a copy of the rows, as `patchDocument` patches a placeholder
 */
export const patchTableRows = ({
    json,
    key,
    patch,
    delimiters: { start, end },
    patchPlaceholder,
}: {
    readonly json: Element;
    readonly key: string;
    readonly patch: TableRowsPatch;
    readonly delimiters: { readonly start: string; readonly end: string };
    readonly patchPlaceholder: PatchPlaceholder;
}): void => {
    const fieldStart = `${start}${key}.`;

    for (const rows of findRowsToRepeat(json, fieldStart)) {
        const fields = fieldsIn(rows.elements, fieldStart, end);
        const copies = patch.rows.flatMap((row, index) => {
            // Like content pasted in Word, only the first copy keeps what must be unique in the document, such as bookmarks
            const copy: Element = {
                type: "element",
                name: "w:tbl",
                elements: [...(index === 0 ? rows.elements.map(copyOf) : withoutIds(rows.elements))],
            };
            const fieldPatches = new Map(Object.entries(row).flatMap(([field, p]) => (p === undefined ? [] : [[field, p] as const])));

            for (const [field, fieldPatch] of fieldPatches) {
                patchPlaceholder(copy, `${key}.${field}`, fieldPatch);
            }
            for (const field of fields.filter((f) => !fieldPatches.has(f))) {
                patchPlaceholder(copy, `${key}.${field}`, EMPTY);
            }
            return copy.elements!;
        });

        // eslint-disable-next-line functional/immutable-data
        rows.parent.elements!.splice(rows.parent.elements!.indexOf(rows.elements[0]), rows.elements.length, ...copies);

        // Word won't open a table without rows, and one with none would show nothing
        if (rows.table && !hasRows(rows.table.element)) {
            // eslint-disable-next-line functional/immutable-data
            rows.table.parent.elements!.splice(rows.table.parent.elements!.indexOf(rows.table.element), 1);
        }
    }
};

/**
 * The rows that hold a field, grouped into the rows next to each other in a table, which are repeated together.
 */
const findRowsToRepeat = (json: Element, fieldStart: string): readonly RowsToRepeat[] => {
    const found = findLocationOfText(json, fieldStart).flatMap((paragraph) => {
        const row = rowHolding(json, paragraph.pathToParagraph);
        return row ? [row] : [];
    });
    // A row in a row that is repeated, such as in a table in one of its cells, is copied with it
    const rows = found
        .filter((row) => !found.some((other) => isInside(row.path, other.path)))
        .filter((row, index, all) => all.findIndex((other) => other.row === row.row) === index);

    return [...new Set(rows.map((row) => row.parent))].flatMap((parent) => {
        const siblingRows = parent.elements!.filter((e) => e.name === "w:tr");
        const positions = rows
            .filter((row) => row.parent === parent)
            .map((row) => siblingRows.indexOf(row.row))
            .sort((a, b) => a - b);
        const { table } = rows.find((row) => row.parent === parent)!;

        // Each run of rows next to each other
        const groups = positions.reduce<readonly (readonly number[])[]>((all, position) => {
            const previous = all[all.length - 1];
            return previous?.[previous.length - 1] === position - 1 ? [...all.slice(0, -1), [...previous, position]] : [...all, [position]];
        }, []);

        return groups.map((group) => {
            const first = parent.elements!.indexOf(siblingRows[group[0]]);
            const last = parent.elements!.indexOf(siblingRows[group[group.length - 1]]);
            return { parent, table, elements: parent.elements!.slice(first, last + 1) };
        });
    });
};

/**
 * The row nearest to the paragraph at the end of the path that holds it, if it is in a table.
 */
const rowHolding = (json: Element, pathToParagraph: readonly number[]): FoundRow | undefined => {
    let element = json;
    let row: FoundRow | undefined;
    let table: RowsToRepeat["table"];

    // The path starts with the root element itself
    for (let i = 1; i < pathToParagraph.length; i++) {
        const child: Element = element.elements![pathToParagraph[i]];
        if (child.name === "w:tbl") {
            table = { element: child, parent: element };
        }
        if (child.name === "w:tr") {
            row = { parent: element, table, row: child, path: pathToParagraph.slice(0, i + 1) };
        }
        element = child;
    }

    return row;
};

const isInside = (path: readonly number[], ancestorPath: readonly number[]): boolean =>
    path.length > ancestorPath.length && ancestorPath.every((index, i) => path[i] === index);

const hasRows = (table: Element): boolean =>
    (table.elements ?? []).some((e) => e.name === "w:tr" || (e.name !== "w:tblPr" && e.name !== "w:tblGrid" && hasRows(e)));

/**
 * The names of the fields in the elements, such as "name" for `{{items.name}}`.
 */
const fieldsIn = (elements: readonly Element[], fieldStart: string, end: string): readonly string[] => {
    const fields = findLocationOfText({ elements: [...elements] }, fieldStart).flatMap(({ text }) =>
        text
            .split(fieldStart)
            .slice(1)
            .flatMap((after) => {
                const fieldEnd = after.indexOf(end);
                return fieldEnd > 0 ? [after.slice(0, fieldEnd)] : [];
            }),
    );
    return [...new Set(fields)];
};

const copyOf = (element: Element): Element => JSON.parse(JSON.stringify(element)) as Element;

// The things in content that must be unique in a document: bookmarks, the ids Word 2010 gives paragraphs and rows, and
// the ids of content controls
const ATTRIBUTES_TO_REMOVE = ["w14:paraId", "w14:textId"];
const ELEMENTS_TO_REMOVE = ["w:bookmarkStart", "w:bookmarkEnd"];

/**
 * A copy of elements without what must be unique in a document, so they can be in the document more than once.
 *
 * @param parent - The elements' parent, as a content control's id is an element in its properties
 */
const withoutIds = (elements: readonly Element[], parent?: Element): readonly Element[] =>
    elements
        .filter((e) => !ELEMENTS_TO_REMOVE.includes(e.name ?? "") && !(parent?.name === "w:sdtPr" && e.name === "w:id"))
        .map((e) => ({
            ...e,
            ...(e.attributes === undefined
                ? {}
                : {
                      attributes: Object.fromEntries(Object.entries(e.attributes).filter(([name]) => !ATTRIBUTES_TO_REMOVE.includes(name))),
                  }),
            ...(e.elements === undefined ? {} : { elements: [...withoutIds(e.elements, e)] }),
        }));
