/**
 * Textbox module for WordprocessingML documents.
 *
 * This module provides support for text boxes using VML shapes. Textboxes allow for
 * creating floating text containers with custom positioning and styling.
 *
 * @module
 */
import { FileChild } from "@file/file-child";
import { type IParagraphOptions, Paragraph, ParagraphProperties } from "@file/paragraph";
import { BuilderElement, type IContext, type IXmlableObject, type XmlComponent } from "@file/xml-components";
import { uniqueId } from "@util/convenience-functions";

import { createPictElement } from "./pict-element/pict-element";
import { type VmlShapeStyle, createShape } from "./shape/shape";

/**
 * Options for creating a Textbox.
 *
 * Extends paragraph options while replacing the style property with VML shape styling.
 *
 * @property style - VML shape style properties for positioning and sizing
 * @property children - Array of child elements (text runs, hyperlinks, etc.)
 */
type ITextboxOptions = Omit<IParagraphOptions, "style"> & {
    /** VML shape style properties for the textbox (positioning, sizing, wrapping, etc.) */
    readonly style?: VmlShapeStyle;
};

/**
 * Represents a textbox in a WordprocessingML document.
 *
 * A Textbox creates a floating text container using VML shapes that can be positioned
 * anywhere on the page. Unlike regular paragraphs, textboxes support absolute positioning,
 * custom dimensions, and text wrapping control.
 *
 * The textbox is implemented as a paragraph with a run containing a picture element (w:pict)
 * with a VML shape (v:shape) that contains a VML textbox (v:textbox) with the actual content.
 * In a paragraph's children, the textbox is only the run, in that paragraph, and its own
 * paragraph options, such as its alignment, don't apply.
 *
 * @publicApi
 *
 * ## XSD Schema
 * The Textbox combines multiple OOXML elements:
 * - w:p (paragraph container)
 * - w:r (run containing the picture)
 * - w:pict (picture element containing VML)
 * - v:shape (VML shape with styling)
 * - v:textbox (VML textbox content container)
 * - w:txbxContent (WordprocessingML textbox content)
 *
 * @example
 * ```typescript
 * // Simple textbox with text
 * new Textbox({
 *   children: [new Paragraph("Hello World")],
 *   style: {
 *     width: "3in",
 *     height: "1in"
 *   }
 * });
 *
 * // Positioned textbox with wrapping
 * new Textbox({
 *   children: [
 *     new Paragraph({
 *       children: [
 *         new TextRun({ text: "Floating Text", bold: true }),
 *         new TextRun({ text: " in a textbox", break: 1 })
 *       ]
 *     })
 *   ],
 *   style: {
 *     width: "2.5in",
 *     height: "1.5in",
 *     position: "absolute",
 *     left: "1in",
 *     top: "2in",
 *     wrapStyle: "square"
 *   }
 * });
 *
 * // Textbox in a paragraph, after its text
 * new Paragraph({
 *   children: [
 *     new TextRun("See the note: "),
 *     new Textbox({
 *       children: [new Paragraph("A note")],
 *       style: { width: "2in", height: "auto" }
 *     })
 *   ]
 * });
 * ```
 */
export class Textbox extends FileChild {
    private readonly run: XmlComponent;

    public constructor({ style, children, ...rest }: ITextboxOptions) {
        super("w:p");
        this.root.push(new ParagraphProperties(rest));

        // The schema only allows the picture in a run
        this.run = new BuilderElement({
            name: "w:r",
            children: [
                createPictElement({
                    shape: createShape({
                        children: children,
                        id: uniqueId(),
                        style: style,
                    }),
                }),
            ],
        });
        this.root.push(this.run);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        // A paragraph can't contain another, so in a paragraph's children, the textbox is only its run
        return context.stack[context.stack.length - 1] instanceof Paragraph ? this.run.prepForXml(context) : super.prepForXml(context);
    }
}
