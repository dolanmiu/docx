// http://officeopenxml.com/drwPicFloating-position.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createAlign } from "./align";
import { IVerticalPositionOptions, VerticalPositionRelativeFrom } from "./floating-position";
import { createPositionOffset } from "./position-offset";

/**
 * Vertical Positioning
 *
 * This simple type specifies the possible values for the base from which the relative vertical positioning of an object shall be calculated.
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-wp_positionV-1.html
 */
export const createVerticalPosition = ({ relative, align, offset }: IVerticalPositionOptions): XmlComponent =>
    new BuilderElement<{
        /** Vertical Position Relative Base */
        readonly relativeFrom: (typeof VerticalPositionRelativeFrom)[keyof typeof VerticalPositionRelativeFrom];
    }>({
        name: "wp:positionV",
        attributes: {
            relativeFrom: { key: "relativeFrom", value: relative ?? VerticalPositionRelativeFrom.PAGE },
        },
        children: [
            (() => {
                if (align) {
                    return createAlign(align);
                } else if (offset !== undefined) {
                    return createPositionOffset(offset);
                } else {
                    throw new Error("There is no configuration provided for floating position (Align or offset)");
                }
            })(),
        ],
    });
