// http://officeopenxml.com/drwPicFloating-position.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createAlign } from "./align";
import { HorizontalPositionRelativeFrom, IHorizontalPositionOptions } from "./floating-position";
import { createPositionOffset } from "./position-offset";

/**
 * Horizontal Positioning
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-wp_positionH-1.html
 */
export const createHorizontalPosition = ({ relative, align, offset }: IHorizontalPositionOptions): XmlComponent =>
    new BuilderElement<{
        /** Horizontal Position Relative Base */
        readonly relativeFrom: (typeof HorizontalPositionRelativeFrom)[keyof typeof HorizontalPositionRelativeFrom];
    }>({
        name: "wp:positionH",
        attributes: {
            relativeFrom: { key: "relativeFrom", value: relative ?? HorizontalPositionRelativeFrom.PAGE },
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
