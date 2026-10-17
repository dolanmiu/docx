import JSZip from "jszip";
import type { ImportGlobFunction } from "vite";
import { describe, expect, it } from "vitest";

import { parseXml } from "./parse";
import { stringifyElement } from "./stringify";
import type { XmlElement } from "./types";

/**
 * Checks parseXml and stringifyElement against every XML part in the repository: the parts of each Word document, such
 * as those Word saved for the layout probes, and the OOXML schemas. jsdom's DOMParser, a separate XML parser, says what
 * each part holds, so a mistake parseXml and stringifyElement make alike still shows.
 */

declare global {
    // Vite's own types for import.meta, vite/client, would type every "?raw" import, which other specs expect not to be
    // typed
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface ImportMeta {
        readonly glob: ImportGlobFunction;
    }
}

// Vite gives each document as a data URL, and each schema as text
const documents = import.meta.glob<string>(["/demo/assets/*.{docx,dotx}", "/scripts/layout-probes/**/*.docx"], {
    query: "?inline",
    import: "default",
});
const texts = import.meta.glob<string>(["/ooxml-schemas/**/*.xsd", "/demo/assets/*.xml"], {
    query: "?raw",
    import: "default",
    eager: true,
});

/**
 * The largest part read. The parts over it, a dozen of the layout probes' documents, each repeat one run thousands of
 * times to measure Word's character widths. They hold nothing the smaller parts don't, and jsdom takes seconds over each.
 */
const MAX_PART_LENGTH = 1_000_000;

const partsOf = async (dataUrl: string): Promise<ReadonlyMap<string, string>> => {
    const zip = await JSZip.loadAsync(dataUrl.slice(dataUrl.indexOf(",") + 1), { base64: true });
    const names = Object.keys(zip.files).filter((name) => name.endsWith(".xml") || name.endsWith(".rels"));
    const parts = await Promise.all(names.map(async (name) => [name, await zip.file(name)!.async("string")] as const));
    return new Map(parts.filter(([, xml]) => xml.length <= MAX_PART_LENGTH));
};

/** A node of the DOM as parseXml reads it */
const fromDom = (node: Node): XmlElement | undefined => {
    switch (node.nodeType) {
        case Node.ELEMENT_NODE: {
            const element = node as Element;
            const attributes = Object.fromEntries([...element.attributes].map(({ name, value }) => [name, value]));
            const elements = [...element.childNodes].map(fromDom).filter((child) => child !== undefined);
            return {
                type: "element",
                name: element.tagName,
                ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
                ...(elements.length > 0 ? { elements } : {}),
            };
        }
        case Node.TEXT_NODE:
            return { type: "text", text: (node as Text).data };
        case Node.CDATA_SECTION_NODE:
            return (node as CDATASection).data === "" ? undefined : { type: "cdata", cdata: (node as CDATASection).data };
        case Node.COMMENT_NODE:
            return (node as Comment).data === "" ? undefined : { type: "comment", comment: (node as Comment).data };
        case Node.PROCESSING_INSTRUCTION_NODE:
            return { type: "instruction", name: (node as ProcessingInstruction).target, instruction: (node as ProcessingInstruction).data };
        default:
            return { type: "doctype" };
    }
};

/**
 * A node with each line break as "\n". XML parsers such as jsdom's read "\r\n" as "\n", but parseXml keeps it, as
 * xml-js did, so that patchDocument writes a template's text back as it was.
 */
const withLineFeeds = (node: XmlElement): XmlElement => {
    const lineFeeds = (value: string): string => value.replace(/\r\n?/g, "\n");
    switch (node.type) {
        case "element":
            return {
                ...node,
                ...(node.attributes
                    ? {
                          attributes: Object.fromEntries(
                              Object.entries(node.attributes).map(([key, value]) => [key, lineFeeds(String(value))]),
                          ),
                      }
                    : {}),
                ...(node.elements ? { elements: node.elements.map(withLineFeeds) } : {}),
            };
        case "text":
            return { ...node, text: lineFeeds(String(node.text)) };
        case "cdata":
            return { ...node, cdata: lineFeeds(node.cdata!) };
        case "comment":
            return { ...node, comment: lineFeeds(node.comment!) };
        case "instruction":
            return { ...node, instruction: lineFeeds(node.instruction!) };
        default:
            // The DOM keeps a DOCTYPE's name and identifiers, not its text
            return { type: node.type };
    }
};

/**
 * The nodes of a document as the DOM has them: without the declaration, which the DOM has no node for, or the whitespace
 * between the top-level nodes
 */
const comparable = (document: XmlElement): readonly XmlElement[] =>
    (document.elements ?? []).filter(({ type }) => type !== "text").map(withLineFeeds);

const check = (xml: string, part: string): void => {
    const dom = new DOMParser().parseFromString(xml, "application/xml");
    expect(dom.getElementsByTagName("parsererror"), `jsdom can't read ${part}`).to.have.length(0);

    const parsed = parseXml(xml, { keepWhitespaceText: true });
    expect(comparable(parsed), part).to.deep.equal([...dom.childNodes].map(fromDom));
    expect(parseXml(stringifyElement(parsed), { keepWhitespaceText: true }), `${part}, written and read again`).to.deep.equal(parsed);
};

describe("parseXml and stringifyElement with the repository's XML", () => {
    describe("documents", () => {
        for (const [path, load] of Object.entries(documents)) {
            it(`should read and write each part of ${path} as jsdom reads it`, async () => {
                for (const [name, xml] of await partsOf(await load())) {
                    check(xml, name);
                }
            });
        }
    });

    describe("schemas", () => {
        for (const [path, xml] of Object.entries(texts)) {
            it(`should read and write ${path} as jsdom reads it`, () => {
                check(xml, path);
            });
        }
    });
});
