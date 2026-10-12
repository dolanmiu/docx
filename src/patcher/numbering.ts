/**
 * Lists in content inserted into an existing document.
 *
 * @module
 */
import xml from "xml";
import type { Element } from "xml-js";

import { Formatter } from "@export/formatter";
import type { ConcreteNumbering, Numbering } from "@file/numbering";
import type { IContext, XmlComponent } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";

import { relationshipsPathOf, relativeTarget, resolveTarget } from "./drawing-patch";
import { getFirstLevelElements, toJson } from "./util";

const formatter = new Formatter();

const DOCUMENT_PATH = "word/document.xml";
// Where the numbering part goes in a document that doesn't have one
const NUMBERING_PATH = "word/numbering.xml";
const NUMBERING_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml";
const NUMBERING_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering";
// The list a Document has for `bullet` paragraphs, whose id they are written with
const BULLET_REFERENCE = "default-bullet-numbering";
const BULLET_NUM_ID = "1";

/**
 * The patcher's helpers for the numbering part.
 */
type NumberingHelpers = {
    /** A context to format content for a part with, which records the relationships the content adds to the part */
    readonly createContext: (path: string) => IContext;
    readonly addContentTypeOverride: (contentType: string, partName: string) => void;
};

/**
 * Writes the lists that the content inserted by patches uses.
 */
export type NumberingPatcher = {
    /**
     * Gives each list that content about to be inserted uses, by its reference or as a bullet list, an id that no list
     * in the document has. A list keeps its id each time it is used, so its paragraphs are numbered on from each other.
     *
     * @throws If the content uses a reference that isn't in the numbering, as it would have no list to be in
     */
    readonly renumber: (elements: readonly Element[]) => readonly Element[];
    /**
     * Writes the lists that were renumbered to the document's numbering part, with abstract lists of their own. A
     * document without a numbering part is given one.
     */
    readonly write: () => void;
};

const formatElement = (component: XmlComponent, context: IContext): Element =>
    toJson(xml(formatter.format(component, context))).elements![0];

const highestOf = (ids: readonly number[]): number => ids.reduce((highest, id) => Math.max(highest, id), 0);

/**
 * Creates the writer of the lists that patches use.
 *
 * A paragraph in a patch is put in a list as in a Document, with `numbering: { reference, level }` for one of the
 * numbering's references, or with `bullet`. It is written with a placeholder for its list's id, or for a bullet, with
 * the id a Document's bullet list has, which a template's lists may have too.
 *
 * @param numbering - The numbering the patches' paragraphs add their lists to as they are written
 * @param parts - The document's XML parts, parsed, by their paths, which the lists are written to
 * @param helpers - The patcher's helpers for the numbering part
 */
export const patchNumbering = (
    numbering: Numbering,
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    { createContext, addContentTypeOverride }: NumberingHelpers,
): NumberingPatcher => {
    // The id each list has in the document, by the id it has in the numbering
    const newNumIds = new Map<number, number>();
    // Always the highest id of a list in the document, so the one after it is free. The template is only searched for
    // its lists' ids when a patch inserts a paragraph in a list
    let highestNumId: number | undefined;

    const numberingRelationship = (): Element | undefined =>
        getFirstLevelElements(parts.get(relationshipsPathOf(DOCUMENT_PATH)) ?? {}, "Relationships").find(
            (element) => element.attributes?.Type === NUMBERING_RELATIONSHIP,
        );
    const numberingPath = (relationship = numberingRelationship()): string =>
        relationship ? resolveTarget(DOCUMENT_PATH, String(relationship.attributes!.Target)) : NUMBERING_PATH;
    const idsInTemplate = (name: string, attribute: string): readonly number[] =>
        getFirstLevelElements(parts.get(numberingPath()) ?? {}, "w:numbering")
            .filter((element) => element.name === name)
            .map((element) => Number(element.attributes![attribute]));

    const listOf = (numId: string): ConcreteNumbering | undefined => {
        if (numId === BULLET_NUM_ID) {
            return numbering.ConcreteNumbering.find(({ reference }) => reference === BULLET_REFERENCE);
        }
        if (!numId.startsWith("{")) {
            // Such as 0, for a paragraph taken out of a list with `numbering: false`
            return undefined;
        }

        const list = numbering.ConcreteNumbering.find(({ reference, instance }) => numId === `{${reference}-${instance}}`);
        if (!list) {
            const reference = numId.slice(1, -1).replace(/-\d+$/, "");
            throw new Error(
                `A paragraph in a patch uses the numbering "${reference}", which isn't in the numbering option of patchDocument. Add it there with its levels, as in a Document`,
            );
        }
        return list;
    };

    const newNumIdOf = (list: ConcreteNumbering): number => {
        const knownId = newNumIds.get(list.numId);
        if (knownId !== undefined) {
            return knownId;
        }

        highestNumId = (highestNumId ?? highestOf(idsInTemplate("w:num", "w:numId"))) + 1;
        // eslint-disable-next-line functional/immutable-data
        newNumIds.set(list.numId, highestNumId);
        return highestNumId;
    };

    const renumber = (element: Element): Element => {
        const list = element.name === "w:numId" ? listOf(String(element.attributes!["w:val"])) : undefined;
        if (list === undefined) {
            return element.elements === undefined ? element : { ...element, elements: element.elements.map(renumber) };
        }
        return { ...element, attributes: { ...element.attributes, "w:val": String(newNumIdOf(list)) } };
    };

    // The document's numbering part, which is added to it if it has none
    const findOrAddPart = (written: Element): string => {
        const relationship = numberingRelationship();
        const path = numberingPath(relationship);

        if (!parts.has(path)) {
            // eslint-disable-next-line functional/immutable-data
            parts.set(path, {
                declaration: { attributes: { version: "1.0", encoding: "UTF-8", standalone: "yes" } },
                elements: [{ ...written, elements: [] }],
            });
            addContentTypeOverride(NUMBERING_CONTENT_TYPE, `/${path}`);
        }
        if (!relationship) {
            createContext(DOCUMENT_PATH).viewWrapper.Relationships.addRelationship(
                uniqueId(),
                NUMBERING_RELATIONSHIP,
                relativeTarget(DOCUMENT_PATH, path),
            );
        }
        return path;
    };

    const write = (): void => {
        if (newNumIds.size === 0) {
            return;
        }

        const context = createContext(numberingPath());
        // Every list in the numbering, as a Document writes them, of which only those that were used are added
        const written = formatElement(numbering, context);
        const abstractNumIdOf = (list: Element): number =>
            Number(list.elements!.find((element) => element.name === "w:abstractNumId")!.attributes!["w:val"]);

        const lists = written.elements!.filter(
            (element) => element.name === "w:num" && newNumIds.has(Number(element.attributes!["w:numId"])),
        );
        // The abstract lists that the lists are instances of, with ids no abstract list in the template has
        const highestAbstractNumId = highestOf(idsInTemplate("w:abstractNum", "w:abstractNumId"));
        const newAbstractNumIds = new Map(
            [...new Set(lists.map(abstractNumIdOf))].map((id, index) => [id, highestAbstractNumId + index + 1]),
        );
        const abstractLists = written.elements!.flatMap((element) => {
            const newId =
                element.name === "w:abstractNum" ? newAbstractNumIds.get(Number(element.attributes!["w:abstractNumId"])) : undefined;
            return newId === undefined ? [] : [{ ...element, attributes: { ...element.attributes, "w:abstractNumId": String(newId) } }];
        });

        const path = findOrAddPart(written);
        const root = parts.get(path)!.elements!.find((element) => element.name === "w:numbering")!;
        // The abstract lists are written with the namespaces of a Document's numbering part, such as w15's
        root.attributes = {
            ...Object.fromEntries(Object.entries(written.attributes!).filter(([name]) => name.startsWith("xmlns:"))),
            ...root.attributes,
            "mc:Ignorable": [
                ...new Set([
                    ...String(root.attributes?.["mc:Ignorable"] ?? "").split(" "),
                    ...String(written.attributes!["mc:Ignorable"]).split(" "),
                ]),
            ]
                .filter((prefix) => prefix !== "")
                .join(" "),
        };

        const elements = getFirstLevelElements(parts.get(path)!, "w:numbering");
        // In a numbering part, the abstract lists come before the lists, which come before numIdMacAtCleanup
        const firstIndexOf = (names: readonly string[]): number => {
            const index = elements.findIndex((element) => names.includes(element.name!));
            return index === -1 ? elements.length : index;
        };
        // eslint-disable-next-line functional/immutable-data
        elements.splice(firstIndexOf(["w:num", "w:numIdMacAtCleanup"]), 0, ...abstractLists);
        // eslint-disable-next-line functional/immutable-data
        elements.splice(
            firstIndexOf(["w:numIdMacAtCleanup"]),
            0,
            ...lists.map((list) => ({
                ...list,
                attributes: { ...list.attributes, "w:numId": String(newNumIds.get(Number(list.attributes!["w:numId"]))) },
                elements: list.elements!.map((element) =>
                    element.name === "w:abstractNumId"
                        ? { ...element, attributes: { "w:val": String(newAbstractNumIds.get(abstractNumIdOf(list))) } }
                        : element,
                ),
            })),
        );
    };

    return { renumber: (elements) => elements.map(renumber), write };
};
