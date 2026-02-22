/**
 * Wrap None module for DrawingML text wrapping.
 *
 * This module provides no text wrapping for floating drawings
 * where text does not wrap around the drawing.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Creates no text wrapping for a floating drawing.
 *
 * WrapNone causes text to flow behind or in front of the drawing
 * without wrapping around it.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 */
export const createWrapNone = (): XmlComponent =>
    new BuilderElement({
        name: "wp:wrapNone",
    });
