/**
 * Footnotes and endnotes for content inserted into an existing document.
 *
 * @module
 */
import xml from "xml";
import type { Element } from "xml-js";

import { Formatter } from "@export/formatter";
import { EndnoteRefRun } from "@file/endnotes/endnote/run/endnote-ref-run";
import { Endnotes } from "@file/endnotes/endnotes";
import { FootnoteRefRun } from "@file/footnotes/footnote/run/footnote-ref-run";
import { FootNotes } from "@file/footnotes/footnotes";
import type { Paragraph } from "@file/paragraph";
import type { RelationshipType } from "@file/relationships/relationship/relationship";
import {
    EndnoteReferenceStyle,
    EndnoteText,
    EndnoteTextChar,
    FootnoteReferenceStyle,
    FootnoteText,
    FootnoteTextChar,
} from "@file/styles/style/default-styles";
import type { IContext, XmlComponent } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";

import type { RenumberBookmarks } from "./bookmark-ids";
import { relationshipsPathOf, relativeTarget, resolveTarget } from "./drawing-patch";
import { getFirstLevelElements, toJson } from "./util";

const formatter = new Formatter();

const DOCUMENT_PATH = "word/document.xml";

/**
 * The notes of one kind that patches refer to, by the id their reference runs are given, such as 1 for
 * `new FootnoteReferenceRun(1)`.
 */
export type PatchNotes = Readonly<Record<string, { readonly children: readonly Paragraph[] }>>;

type Note = PatchNotes[string];

/**
 * How a kind of note, footnotes or endnotes, is written.
 */
type NoteKind = {
    /** Where the notes' part goes in a document that doesn't have one */
    readonly path: string;
    readonly rootName: string;
    readonly noteName: string;
    readonly referenceName: string;
    readonly contentType: string;
    readonly relationshipType: RelationshipType;
    readonly create: {
        /** The part, with the separator lines Word draws above the notes */
        readonly part: () => XmlComponent;
        /** The run a note starts with, which shows its number */
        readonly mark: () => XmlComponent;
        /** The styles a docx document has for these notes. A note's number is written in the reference style */
        readonly styles: () => readonly XmlComponent[];
    };
};

const FOOTNOTES: NoteKind = {
    path: "word/footnotes.xml",
    rootName: "w:footnotes",
    noteName: "w:footnote",
    referenceName: "w:footnoteReference",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml",
    relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes",
    create: {
        part: () => new FootNotes(),
        mark: () => new FootnoteRefRun(),
        styles: () => [new FootnoteText({}), new FootnoteTextChar({}), new FootnoteReferenceStyle({})],
    },
};

const ENDNOTES: NoteKind = {
    path: "word/endnotes.xml",
    rootName: "w:endnotes",
    noteName: "w:endnote",
    referenceName: "w:endnoteReference",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml",
    relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/endnotes",
    create: {
        part: () => new Endnotes(),
        mark: () => new EndnoteRefRun(),
        styles: () => [new EndnoteText({}), new EndnoteTextChar({}), new EndnoteReferenceStyle({})],
    },
};

/**
 * The patcher's helpers for what the notes' content refers to.
 */
type NotesHelpers = {
    /** A context to format content for a part with, which records the relationships the content adds to the part */
    readonly createContext: (path: string) => IContext;
    readonly addContentTypeOverride: (contentType: string, partName: string) => void;
    readonly renumberBookmarks: RenumberBookmarks;
};

/**
 * Writes the footnotes and endnotes that the content inserted by patches refers to.
 */
export type NotesPatcher = {
    /**
     * Gives each reference to one of the notes, in content that is about to be inserted, a new id that no note of its
     * kind in the document has. Each reference gets a note of its own, so a patch that is inserted twice has two.
     */
    readonly renumber: (elements: readonly Element[]) => readonly Element[];
    /**
     * Writes a note for each reference that was renumbered. A document without a part for the notes is given one, and
     * the notes' styles are added to the document's own if it doesn't have them.
     */
    readonly write: () => void;
};

const formatElement = (component: XmlComponent, context: IContext): Element =>
    toJson(xml(formatter.format(component, context))).elements![0];

const findIds = (element: Element, names: readonly string[]): readonly number[] => {
    const id = names.includes(element.name ?? "") ? Number(element.attributes?.["w:id"]) : NaN;
    return [...(Number.isInteger(id) ? [id] : []), ...(element.elements ?? []).flatMap((child) => findIds(child, names))];
};

// A note starts with its number, before the first paragraph's text, as in a Document. It is added to what the
// paragraph is written as, rather than to the Paragraph, so notes given to more than one patchDocument each have one
const withMark = (paragraph: Element, mark: Element): Element => {
    const elements = paragraph.elements ?? [];
    const index = elements[0]?.name === "w:pPr" ? 1 : 0;
    return { ...paragraph, elements: [...elements.slice(0, index), mark, ...elements.slice(index)] };
};

const patchNotesOfKind = (
    kind: NoteKind,
    notes: PatchNotes,
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    { createContext, addContentTypeOverride, renumberBookmarks }: NotesHelpers,
): NotesPatcher => {
    const givenNotes = new Map(Object.entries(notes).map(([id, note]) => [Number(id), note]));
    // The note each new id is for, in the order the ids were given
    const noteOfId = new Map<number, Note>();
    // Always the highest id in use, so the one after it is free. The document is only searched for its notes' ids when
    // a patch inserts a reference to one of the given notes
    let highestId: number | undefined;

    const renumber = (element: Element): Element => {
        const note = element.name === kind.referenceName ? givenNotes.get(Number(element.attributes?.["w:id"])) : undefined;
        if (note === undefined) {
            return element.elements === undefined ? element : { ...element, elements: element.elements.map(renumber) };
        }

        highestId =
            (highestId ??
                [...parts.values()]
                    .flatMap((part) => findIds(part, [kind.noteName, kind.referenceName]))
                    .reduce((highest, id) => Math.max(highest, id), 0)) + 1;
        // eslint-disable-next-line functional/immutable-data
        noteOfId.set(highestId, note);
        return { ...element, attributes: { ...element.attributes, "w:id": String(highestId) } };
    };

    // The document's part for the notes, which is added to it if it has none
    const findOrAddPart = (): string => {
        const relationship = getFirstLevelElements(parts.get(relationshipsPathOf(DOCUMENT_PATH)) ?? {}, "Relationships").find(
            (element) => element.attributes?.Type === kind.relationshipType,
        );
        const path = relationship ? resolveTarget(DOCUMENT_PATH, String(relationship.attributes!.Target)) : kind.path;

        if (!parts.has(path)) {
            // eslint-disable-next-line functional/immutable-data
            parts.set(path, {
                declaration: { attributes: { version: "1.0", encoding: "UTF-8", standalone: "yes" } },
                elements: [formatElement(kind.create.part(), createContext(path))],
            });
            addContentTypeOverride(kind.contentType, `/${path}`);
        }
        if (!relationship) {
            createContext(DOCUMENT_PATH).viewWrapper.Relationships.addRelationship(
                uniqueId(),
                kind.relationshipType,
                relativeTarget(DOCUMENT_PATH, path),
            );
        }
        return path;
    };

    const write = (): void => {
        if (noteOfId.size === 0) {
            return;
        }

        const path = findOrAddPart();
        const context = createContext(path);
        // A note is written once for each reference to it, but formatted once, so its relationships are only added once
        const contentOfNote = new Map(
            [...new Set(noteOfId.values())].map((note) => {
                const mark = formatElement(kind.create.mark(), context);
                const paragraphs = note.children.map((paragraph) => formatElement(paragraph, context));
                return [
                    note,
                    renumberBookmarks(paragraphs.map((paragraph, index) => (index === 0 ? withMark(paragraph, mark) : paragraph))),
                ];
            }),
        );

        // eslint-disable-next-line functional/immutable-data
        getFirstLevelElements(parts.get(path)!, kind.rootName).push(
            ...[...noteOfId].map(([id, note]) => ({
                type: "element",
                name: kind.noteName,
                attributes: { "w:id": String(id) },
                elements: [...contentOfNote.get(note)!],
            })),
        );

        const stylesPart = parts.get("word/styles.xml");
        if (stylesPart) {
            const styles = getFirstLevelElements(stylesPart, "w:styles");
            const styleIds = new Set(styles.map((style) => style.attributes?.["w:styleId"]));
            // eslint-disable-next-line functional/immutable-data
            styles.push(
                ...kind.create
                    .styles()
                    .map((style) => formatElement(style, context))
                    .filter((style) => !styleIds.has(style.attributes?.["w:styleId"])),
            );
        }
    };

    return { renumber: (elements) => elements.map(renumber), write };
};

/**
 * Creates the writer of the footnotes and endnotes that patches refer to.
 *
 * A patch refers to a note with a reference run, such as `new FootnoteReferenceRun(1)`, whose id is the note's in
 * `footnotes`. Only references to the given notes are renumbered, and only the notes that are referred to are written.
 *
 * @param notes - The footnotes and endnotes, by the id the patches' reference runs are given
 * @param parts - The document's XML parts, parsed, by their paths, which the notes are written to
 * @param helpers - The patcher's helpers for what the notes refer to
 */
export const patchNotes = (
    { footnotes = {}, endnotes = {} }: { readonly footnotes?: PatchNotes; readonly endnotes?: PatchNotes },
    // eslint-disable-next-line functional/prefer-readonly-type
    parts: Map<string, Element>,
    helpers: NotesHelpers,
): NotesPatcher => {
    const patchers = [patchNotesOfKind(FOOTNOTES, footnotes, parts, helpers), patchNotesOfKind(ENDNOTES, endnotes, parts, helpers)];

    return {
        renumber: (elements) => patchers.reduce((renumbered, patcher) => patcher.renumber(renumbered), elements),
        write: () => {
            for (const patcher of patchers) {
                patcher.write();
            }
        },
    };
};
