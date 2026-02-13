/**
 * Textbox module for WordprocessingML documents.
 *
 * This module provides support for text boxes using VML shapes.
 *
 * @module
 */
import { FileChild } from "@file/file-child";
import { IParagraphOptions, ParagraphProperties } from "@file/paragraph";
import { uniqueId } from "@util/convenience-functions";

import { createPictElement } from "./pict-element/pict-element";
import { VmlShapeStyle, createShape } from "./shape/shape";

/**
 * Options for creating a Textbox.
 *
 * @see {@link Textbox}
 */
type ITextboxOptions = Omit<IParagraphOptions, "style"> & {
    /** VML style properties for the textbox shape */
    readonly style?: VmlShapeStyle;
};

/**
 * Represents a textbox in a WordprocessingML document.
 *
 * Textbox creates a rectangular text container that can be positioned
 * anywhere on the page using VML shapes.
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
