/**
 * Reads the text and formatting of a shape's paragraphs, as the document's styles format them. Not part of the public
 * API.
 *
 * The formatting is read as it is written, with the readers docx/shapes shares with docx/layout.
 *
 * @module
 */
import { ExternalHyperlink, type Paragraph, Run, TextRun, XmlComponent } from "docx";

import {
    READING_CONTEXT,
    type RunFormat,
    type TextParagraph,
    type TextStyles,
    type ThemeFonts,
    type XmlObject,
    childrenOf,
    combine,
    find,
    fontOf,
    readParagraphFormat,
    readRunFormat,
    spansOf,
    styleChain,
    valueOf,
} from "../text-layout";

// XmlComponent keeps its children in a protected array. Reading them doesn't change them
const componentChildren = (component: XmlComponent): readonly unknown[] =>
    (component as unknown as { readonly root: readonly unknown[] }).root;

/**
 * The text of a run, with tabs as `"\t"` and line breaks as `"\n"`, and its own formatting and character style.
 */
const readRun = (run: Run, themeFonts: ThemeFonts): { readonly text: string; readonly format: RunFormat; readonly style?: string } => {
    // Formatting a run needs no document, as long as it has no fields or other parts that refer to one
    const xml = run.prepForXml(READING_CONTEXT) as { readonly "w:r": readonly XmlObject[] };
    const children = xml["w:r"];
    const properties = find(children, "w:rPr");
    const text = children
        .map((child) => {
            if ("w:t" in child) {
                return (child["w:t"] as readonly unknown[]).filter((part) => typeof part === "string").join("");
            }
            if ("w:tab" in child) {
                return "\t";
            }
            return "w:br" in child || "w:cr" in child ? "\n" : "";
        })
        .join("");
    return { text, format: readRunFormat(properties, themeFonts), style: valueOf(childrenOf(properties), "w:rStyle") };
};

/**
 * The text runs in a paragraph, including those in hyperlinks. Pictures, shapes and other runs without text are left out.
 */
const runsIn = (children: readonly unknown[]): readonly Run[] =>
    children.flatMap((child): readonly Run[] => {
        if (child instanceof TextRun) {
            // A run with a run in its children is written as itself, that run, then a plain Run with its formatting for
            // the children after it
            return (child.writtenAs ?? [child]).filter((part): part is Run => part instanceof TextRun || part.constructor === Run);
        }
        if (child instanceof ExternalHyperlink) {
            return runsIn(child.options.children);
        }
        return child instanceof XmlComponent && !(child instanceof Run) ? runsIn(componentChildren(child)) : [];
    });

/**
 * Reads a paragraph's text and formatting, as the document's styles format it.
 */
const readParagraph = (paragraph: Paragraph, styles: TextStyles): TextParagraph => {
    // A paragraph's properties come first. They format to nothing when the paragraph has none
    const [properties, ...children] = componentChildren(paragraph) as readonly XmlComponent[];
    const propertyChildren = childrenOf((properties.prepForXml(READING_CONTEXT) as XmlObject | undefined)?.["w:pPr"]);
    const style = valueOf(propertyChildren, "w:pStyle") ?? styles.defaultParagraphStyle;
    const paragraphStyles = styleChain(styles, style, "paragraph");
    const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);

    const spans = runsIn(children).flatMap((run) => {
        const { text, format, style: runStyle } = readRun(run, styles.themeFonts);
        const characterStyles = styleChain(styles, runStyle ?? styles.defaultCharacterStyle, "character");
        return spansOf(text, combine([paragraphRun, ...characterStyles.map(({ run: styleRun }) => styleRun), format]));
    });
    return {
        spans,
        font: fontOf(combine([paragraphRun, readRunFormat(find(propertyChildren, "w:rPr"), styles.themeFonts)])),
        format: combine([
            styles.paragraph,
            ...paragraphStyles.map(({ paragraph: format }) => format),
            readParagraphFormat(propertyChildren),
        ]),
        style,
    };
};

/**
 * Reads the text and formatting of a shape's paragraphs, as the document's styles format them.
 */
export const readTextParagraphs = (paragraphs: readonly Paragraph[], styles: TextStyles): readonly TextParagraph[] =>
    paragraphs.map((paragraph) => readParagraph(paragraph, styles));
