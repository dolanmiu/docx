import { HorizontalPositionAlign, VerticalPositionAlign } from "@file/shared/alignment";
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * # Relative Horizontal/Vertical Alignment
 *
 * This element specifies how a DrawingML object shall be horizontally/vertically aligned relative to the horizontal/vertical alignment base defined by the parent element. Once an alignment base is defined, this element shall determine how the DrawingML object shall be aligned relative to that location.
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_align_topic_ID0EYZZOB.html
 * - https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_align_topic_ID0ET4ZOB.html
 * - http://officeopenxml.com/drwPicFloating-position.php
 */
export const createAlign = (
    value:
        | (typeof HorizontalPositionAlign)[keyof typeof HorizontalPositionAlign]
        | (typeof VerticalPositionAlign)[keyof typeof VerticalPositionAlign],
): XmlComponent =>
    new BuilderElement({
        name: "wp:align",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: [value as any],
    });
