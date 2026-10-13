/**
 * Finds the notes of HTML, such as the footnotes that Markdown, Pandoc, Word and Google Docs write, which are Word's
 * footnotes or endnotes: the links that refer to them, the notes, and what goes with them, such as the links back from
 * a note to its references and the list the notes are in.
 *
 * A link is a note's reference when it goes to an element after it whose block links back to it, as each of those
 * writes them, and its text is a mark, such as `1` or `[2]` or `*`, or when it or its note says it is one, such as with
 * the `doc-noteref` role of ARIA's digital publishing module or Word's `mso-footnote-id` style. A link to a heading, a
 * link back to the top, or a table of contents' link, isn't one.
 *
 * @module
 */
import type { Element } from "domhandler";

import type { Note } from "./content";
import { decodeFragment, descendantsOf, elementsOf, hasClass, isElement, textOf } from "./dom";

/** The notes of HTML, and the elements that go with them */
export type Notes = {
    /** The note each reference refers to, by the reference's link */
    readonly references: ReadonlyMap<Element, Note>;
    /** Each note, by its element, whose content is read where it is in the HTML */
    readonly notes: ReadonlyMap<Element, Note>;
    /** The elements that are only notes and what goes with them, such as a list of notes, read for their notes only */
    readonly containers: ReadonlySet<Element>;
    /** The elements left out: the links back from notes to their references, what is around them, and the rule above the notes */
    readonly hidden: ReadonlySet<Element>;
};

/** The notes of HTML that has none */
export const NO_NOTES: Notes = { references: new Map(), notes: new Map(), containers: new Set(), hidden: new Set() };

// Elements that are blocks, one of which a note is, or is in
const BLOCKS: ReadonlySet<string> = new Set([
    "p",
    "div",
    "li",
    "dd",
    "aside",
    "section",
    "article",
    "blockquote",
    "footer",
    "td",
    "th",
    "pre",
]);

// Inline elements a reference is in, whose ids its note's links back go to, such as Python-Markdown's <sup id="fnref:1">
const INLINE: ReadonlySet<string> = new Set(["sup", "sub", "span", "small", "b", "strong", "i", "em", "u", "s", "mark", "font", "a"]);

const HEADINGS: ReadonlySet<string> = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

const words = (value: string | undefined): readonly string[] => (value ?? "").toLowerCase().split(/\s+/);

// Word's HTML has a style on each note's reference and on each note, which says whether it is a footnote or an endnote
const WORD_REFERENCE = /mso-(foot|end)note-id\s*:/i;
const WORD_NOTE = /mso-element\s*:\s*(foot|end)note\s*(?:;|$)/i;

/** Whether Word's HTML says an element is a footnote's or an endnote's, as its reference or the note */
const wordKindOf = (element: Element, style: RegExp): "footnote" | "endnote" | undefined => {
    const kind = style.exec(element.attribs.style ?? "")?.[1].toLowerCase();
    return kind === undefined ? undefined : kind === "end" ? "endnote" : "footnote";
};

/** Whether a link says it is a note's reference, or the mark it is in does */
const saysItIsReference = (link: Element): boolean =>
    // A link is in the body, or an element in it
    [link, link.parent as Element].some(
        (element) =>
            words(element.attribs.role).includes("doc-noteref") ||
            words(element.attribs["epub:type"]).includes("noteref") ||
            words(element.attribs.rel).includes("footnote") ||
            element.attribs["data-footnote-ref"] !== undefined ||
            element.attribs["data-type"] === "footnote-reference" ||
            hasClass(element, "footnote-ref") ||
            hasClass(element, "footnote-reference") ||
            wordKindOf(element, WORD_REFERENCE) !== undefined,
    );

/** Whether an element says it is a note */
const saysItIsNote = (element: Element): boolean =>
    words(element.attribs.role).some((role) => role === "doc-footnote" || role === "doc-endnote") ||
    words(element.attribs["epub:type"]).some((type) => type === "footnote" || type === "endnote" || type === "rearnote") ||
    element.attribs["data-type"] === "footnote" ||
    hasClass(element, "footnote-item") ||
    wordKindOf(element, WORD_NOTE) !== undefined;

/** Whether an element says it is a list or section of notes */
const saysItHasNotes = (element: Element): boolean =>
    words(element.attribs.role).some((role) => role === "doc-endnotes" || role === "doc-footnotes") ||
    words(element.attribs["epub:type"]).some((type) => type === "footnotes" || type === "endnotes" || type === "rearnotes") ||
    element.attribs["data-footnotes"] !== undefined ||
    ["footnotes", "footnote", "footnote-list", "footnotes-list", "references", "reflist", "mw-references-wrap"].some((name) =>
        hasClass(element, name),
    ) ||
    /mso-element\s*:\s*(?:footnote|endnote)-list/i.test(element.attribs.style ?? "");

/** Whether a link's text is a note's mark, such as `1`, `[12]`, `(a)` or `*` */
const isMark = (link: Element): boolean => /^[[({]?[^\s[\](){}]{1,6}[\])}]?$/u.test(textOf(link).replace(/\s+/g, ""));

/** The elements an element is in, nearest first, up to the body */
const ancestorsOf = (element: Element, body: Element): readonly Element[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const ancestors: Element[] = [];
    let { parent } = element;
    while (parent?.type === "tag" && parent !== body) {
        // eslint-disable-next-line functional/immutable-data
        ancestors.push(parent);
        ({ parent } = parent);
    }
    return ancestors;
};

const isIn = (element: Element, container: Element, body: Element): boolean =>
    element === container || ancestorsOf(element, body).includes(container);

/**
 * Finds the notes of HTML.
 *
 * @param body - The HTML's body
 * @param kind - What the notes are in Word, other than those of Word's own HTML, which says
 */
export const notesOf = (body: Element, kind: "footnote" | "endnote"): Notes => {
    const elements = descendantsOf(body);
    const links = elements.filter((element) => element.name === "a" && element.attribs.href?.trim().startsWith("#"));
    if (links.length === 0) {
        return NO_NOTES;
    }
    const order = new Map(elements.map((element, index) => [element, index]));
    // A link goes to the first element with its id, or else the first link with its name
    const byId = new Map<string, Element>();
    const byName = new Map<string, Element>();
    for (const element of elements) {
        for (const [map, key] of [
            [byId, element.attribs.id],
            [byName, element.name === "a" ? element.attribs.name : undefined],
        ] as const) {
            if (key !== undefined && !map.has(key)) {
                // eslint-disable-next-line functional/immutable-data
                map.set(key, element);
            }
        }
    }
    const targetOf = (link: Element): Element | undefined => {
        const id = decodeFragment(link.attribs.href.trim().slice(1));
        return byId.get(id) ?? byName.get(id);
    };
    const targets = new Set(links.flatMap((link) => targetOf(link) ?? []));

    /**
     * The <div> a note's block is the first of, when it is the note: Google Docs and Word write a note as a <div> of
     * its paragraphs, the first starting with its mark. It is the note when it has no other note, and not the link.
     */
    const wrapperOf = (block: Element, link: Element): Element | undefined => {
        // A block in the body is in an element
        const parent = block.parent as Element;
        return (block.name === "p" || block.name === "div") &&
            parent !== body &&
            parent.name === "div" &&
            elementsOf(parent)[0] === block &&
            !isIn(link, parent, body) &&
            !descendantsOf(parent).some((element) => targets.has(element) && !isIn(element, block, body))
            ? parent
            : undefined;
    };

    /** The note a link goes to: an element that says it is a note, or the block it is, or is the start of */
    const noteOf = (target: Element, link: Element): Element | undefined => {
        const around = [target, ...ancestorsOf(target, body)];
        const said = around.find(saysItIsNote);
        if (said) {
            return said;
        }
        let note = around.find((element) => BLOCKS.has(element.name));
        let wrapper = note && wrapperOf(note, link);
        while (wrapper) {
            note = wrapper;
            wrapper = wrapperOf(note, link);
        }
        return note;
    };

    /** The ids that a note's links back to a reference go to: the reference's, and those of the mark it is in */
    const idsOf = (link: Element): ReadonlySet<string> => {
        const around = [link, ...ancestorsOf(link, body)];
        const block = around.findIndex((element) => !INLINE.has(element.name));
        return new Set(
            around
                .slice(0, block === -1 ? around.length : block)
                .flatMap((element) => [element.attribs.id, ...(element.name === "a" ? [element.attribs.name] : [])])
                .filter((id): id is string => id !== undefined),
        );
    };

    const candidates = links.flatMap((link) => {
        const target = targetOf(link);
        const note = target && noteOf(target, link);
        // A note comes after its reference, so a note's link back isn't taken for a reference, and isn't around it
        if (!note || order.get(note)! <= order.get(link)! || isIn(note, link, body)) {
            return [];
        }
        const ids = idsOf(link);
        const linksBack = descendantsOf(note).filter(
            (element) =>
                element.name === "a" && element.attribs.href !== undefined && ids.has(decodeFragment(element.attribs.href.trim().slice(1))),
        );
        const isReference =
            saysItIsReference(link) ||
            (isMark(link) && (linksBack.length > 0 || saysItIsNote(note) || ancestorsOf(note, body).some(saysItHasNotes)));
        return isReference ? [{ link, note, linksBack }] : [];
    });
    // A reference in a note, as Word has no notes in notes, is left as a link
    const notedElements = new Set(candidates.map(({ note }) => note));
    const references = candidates.filter(({ link }) => !ancestorsOf(link, body).some((element) => notedElements.has(element)));
    if (references.length === 0) {
        return NO_NOTES;
    }

    const notes = new Map<Element, Note>();
    // The links back from each note to its references
    const linksBackOf = new Map<Element, readonly Element[]>();
    for (const { link, note, linksBack } of references) {
        if (!notes.has(note)) {
            // eslint-disable-next-line functional/immutable-data
            notes.set(note, { kind: wordKindOf(link, WORD_REFERENCE) ?? wordKindOf(note, WORD_NOTE) ?? kind });
        }
        // eslint-disable-next-line functional/immutable-data
        linksBackOf.set(note, [...(linksBackOf.get(note) ?? []), ...linksBack]);
    }
    const hidden = new Set<Element>();
    for (const [note, linksBack] of linksBackOf) {
        const skipped = new Set(linksBack);
        for (const linkBack of linksBack) {
            // A link back is left out with what is around it that has no words, such as Wikipedia's ^ or reST's brackets
            const around = ancestorsOf(linkBack, body);
            const wordless = around.slice(0, around.indexOf(note)).filter((wrapper) => !/[\p{L}\p{N}]/u.test(textOf(wrapper, skipped)));
            // eslint-disable-next-line functional/immutable-data
            hidden.add(linkBack).add(wordless.pop() ?? linkBack);
        }
    }

    // The elements that have only notes, and what goes with them, such as a heading above them
    const containers = new Set<Element>();
    const isLeftOut = (element: Element): boolean => notes.has(element) || containers.has(element) || hidden.has(element);
    for (const note of notes.keys()) {
        for (const ancestor of ancestorsOf(note, body)) {
            // Spaces, comments, notes, rules and line breaks, empty elements, and headings of what says it has notes
            const onlyNotes = ancestor.children.every((child) =>
                child.type === "text"
                    ? !/\S/.test(child.data)
                    : !isElement(child) ||
                      isLeftOut(child) ||
                      child.name === "hr" ||
                      child.name === "br" ||
                      (saysItHasNotes(ancestor) && (HEADINGS.has(child.name) || child.attribs.role === "heading")) ||
                      (textOf(child).trim() === "" &&
                          !descendantsOf(child).some((inner) => ["img", "svg", "math", "input", "table"].includes(inner.name))),
            );
            if (!onlyNotes) {
                break;
            }
            // eslint-disable-next-line functional/immutable-data
            containers.add(ancestor);
        }
    }

    // A rule above the notes, as Markdown and Google Docs write, with nothing after it but them
    for (const rule of elements.filter((element) => element.name === "hr" && !containers.has(element.parent as Element))) {
        const after = rule.parent!.children.slice(rule.parent!.children.indexOf(rule) + 1);
        const onlyNotesAfter = after.every((child) =>
            child.type === "tag" ? isLeftOut(child) || child.name === "br" : child.type !== "text" || !/\S/.test(child.data),
        );
        if (onlyNotesAfter && after.some((child) => child.type === "tag" && isLeftOut(child))) {
            // eslint-disable-next-line functional/immutable-data
            hidden.add(rule);
        }
    }

    return {
        references: new Map(references.map(({ link, note }) => [link, notes.get(note)!])),
        notes,
        containers,
        hidden,
    };
};
