/**
 * Vertical position module for floating drawings in WordprocessingML documents.
 *
 * This module provides vertical positioning for floating drawing objects,
 * specifying the vertical placement relative to a base element.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-position.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createAlign } from "./align";
import { type IVerticalPositionOptions, VerticalPositionRelativeFrom } from "./floating-position";
import { createPositionOffset } from "./position-offset";

/**
 * Creates a vertical position element for floating drawings.
 *
 * The positionV element specifies the vertical positioning of a floating
 * object relative to a base element (page, margin, paragraph, line, etc.).
 *
 * Reference: https://www.datypic.com/sc/ooxml/e-wp_positionV-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PosV">
 *   <xsd:choice>
 *     <xsd:element name="align" type="ST_AlignV"/>
 *     <xsd:element name="posOffset" type="ST_PositionOffset"/>
 *   </xsd:choice>
 *   <xsd:attribute name="relativeFrom" type="ST_RelFromV" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Vertical position configuration
 * @returns The positionV XML element
 *
 * @example
 * ```typescript
 * // Align to the top of the page
 * createVerticalPosition({
 *   relative: VerticalPositionRelativeFrom.PAGE,
 *   align: VerticalPositionAlign.TOP,
 * });
 *
 * // Offset from the paragraph
 * createVerticalPosition({
 *   relative: VerticalPositionRelativeFrom.PARAGRAPH,
 *   offset: 457200, // 0.5 inch in EMUs
 * });
 * ```
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
