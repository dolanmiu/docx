/**
 * Styles of content inserted into an existing document.
 *
 * @module
 */
import xml from "xml";
import type { Element } from "xml-js";

import { Formatter } from "@export/formatter";
import { createDefaultStyles } from "@file/styles/factory";
import type { IContext } from "@file/xml-components";

import { getFirstLevelElements, toJson } from "./util";

const formatter = new Formatter();

const STYLES_PATH = "word/styles.xml";
// The elements that refer to a style by its id: a paragraph's, run's or table's style, and the styles that a style is
// based on, followed by or linked to
const REFERENCES = new Set(["w:pStyle", "w:rStyle", "w:tblStyle", "w:basedOn", "w:next", "w:link"]);

/**
 * Adds the styles that the content inserted by patches uses to the document.
 */
export type StylesPatcher = {
    /**
     * Records the styles that content about to be inserted uses, such as a heading's. One of docx's styles that the
     * document has under another id, as in a template saved by Word in another language, is referred to by that id.
     */
    readonly use: (elements: readonly Element[]) => readonly Element[];
    /** Adds the styles that were used, and that the document doesn't have, to its styles, as a Document writes them */
    readonly write: () => void;
};

const idOf = (style: Element): string => String(style.attributes?.["w:styleId"]);

// Word's names of its styles, such as "heading 1", are in lower case, and docx's, such as "Heading 1", aren't
const nameOf = (style: Element): string | undefined => {
    const name = style.elements?.find((element) => element.name === "w:name")?.attributes?.["w:val"];
    return name === undefined ? undefined : String(name).toLowerCase();
};

const formatDefaultStyles = (context: IContext): ReadonlyMap<string, Element> =>
    new Map(
        Object.values(createDefaultStyles())
            .map((style) => toJson(xml(formatter.format(style, context))).elements![0])
            // Rather than the document's defaults, which aren't a style
            .filter((style) => style.name === "w:style")
            .map((style) => [idOf(style), style]),
    );

/**
 * Creates the writer of the styles that patches use.
 *
 * A paragraph in a patch refers to its style by its id, such as `Heading1` for `HeadingLevel.HEADING_1`, which a
 * template may not have, as Word only saves the styles that a document uses. Word shows a paragraph whose style the
 * document doesn't have in the Normal style, and LibreOffice leaves out its number if it is in a list, so the styles of
 * docx's that the content uses are added to the document.
 *
 * @param parts - The document's XML parts, parsed, by their paths, whose styles part the styles are added to
 * @param createContext - Creates a context to format content for a part with
 */
export const patchStyles = (
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    createContext: (path: string) => IContext,
): StylesPatcher => {
    const templateStyles = getFirstLevelElements(parts.get(STYLES_PATH) ?? {}, "w:styles").filter((element) => element.name === "w:style");
    const templateIds = new Set(templateStyles.map(idOf));
    // docx's styles, as a Document writes them, by their ids. They're only formatted once content refers to a style
    let defaultStyles: ReadonlyMap<string, Element> | undefined;
    const defaultStyleOf = (id: string): Element | undefined => {
        defaultStyles ??= formatDefaultStyles(createContext(STYLES_PATH));
        return defaultStyles.get(id);
    };
    // The ids of docx's styles that the content uses, and that the document doesn't have
    const missingIds = new Set<string>();
    // The id each style that the content refers to has in the document, by the id the content refers to it by
    const idsInDocument = new Map<string, string>();

    const findIdInDocument = (id: string): string => {
        const style = templateIds.has(id) ? undefined : defaultStyleOf(id);
        if (style === undefined) {
            return id;
        }

        const sameStyle = templateStyles.find(
            (templateStyle) =>
                templateStyle.attributes?.["w:type"] === style.attributes?.["w:type"] && nameOf(templateStyle) === nameOf(style),
        );
        if (sameStyle !== undefined) {
            return idOf(sameStyle);
        }
        // eslint-disable-next-line functional/immutable-data
        missingIds.add(id);
        return id;
    };
    const idInDocument = (id: string): string => {
        if (!idsInDocument.has(id)) {
            // eslint-disable-next-line functional/immutable-data
            idsInDocument.set(id, findIdInDocument(id));
        }
        return idsInDocument.get(id)!;
    };

    const withIdsInDocument = (element: Element): Element => {
        if (REFERENCES.has(element.name ?? "")) {
            return { ...element, attributes: { ...element.attributes, "w:val": idInDocument(String(element.attributes!["w:val"])) } };
        }
        return element.elements === undefined ? element : { ...element, elements: element.elements.map(withIdsInDocument) };
    };

    const write = (): void => {
        const stylesPart = parts.get(STYLES_PATH);
        if (!stylesPart) {
            return;
        }

        const styles = getFirstLevelElements(stylesPart, "w:styles");
        // The document's styles, with those added since the template was read, such as the styles of footnotes
        const ids = new Set(styles.map(idOf));
        // A Set is iterated over in the order its ids were added, including those added as it is, so a style that an
        // added style is based on or linked to is added too
        for (const id of missingIds) {
            if (!ids.has(id)) {
                // eslint-disable-next-line functional/immutable-data
                ids.add(id);
                // eslint-disable-next-line functional/immutable-data
                styles.push(withIdsInDocument(defaultStyleOf(id)!));
            }
        }
    };

    return { use: (elements) => elements.map(withIdsInDocument), write };
};
