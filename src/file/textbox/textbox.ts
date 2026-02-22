/**
 * Textbox module for WordprocessingML documents.
 *
 * This module provides support for text boxes using VML shapes. Textboxes allow for
 * creating floating text containers with custom positioning and styling.
 *
 * @module
 */
import { FileChild } from "@file/file-child";
import { type IParagraphOptions, ParagraphProperties } from "@file/paragraph";
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
 * The textbox is implemented as a paragraph containing a picture element (w:pict) with
 * a VML shape (v:shape) that contains a VML textbox (v:textbox) with the actual content.
 *
 * @publicApi
 *
 * ## XSD Schema
 * The Textbox combines multiple OOXML elements:
 * - w:p (paragraph container)
 * - w:pict (picture element containing VML)
 * - v:shape (VML shape with styling)
 * - v:textbox (VML textbox content container)
 * - w:txbxContent (WordprocessingML textbox content)
 *
 * @example
 * ```typescript
 * // Simple textbox with text
 * new Textbox({
 *   children: [new TextRun("Hello World")],
 *   style: {
 *     width: "3in",
 *     height: "1in"
 *   }
 * });
 *
 * // Positioned textbox with wrapping
 * new Textbox({
 *   children: [
 *     new TextRun({ text: "Floating Text", bold: true }),
 *     new TextRun({ text: " in a textbox", break: 1 })
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
 * ```
 */
export class Textbox extends FileChild {
    public constructor({ style, children, ...rest }: ITextboxOptions) {
        super("w:p");
        this.root.push(new ParagraphProperties(rest));

        this.root.push(
            createPictElement({
                shape: createShape({
                    children: children,
                    id: uniqueId(),
                    style: style,
                }),
            }),
        );
    }
}
