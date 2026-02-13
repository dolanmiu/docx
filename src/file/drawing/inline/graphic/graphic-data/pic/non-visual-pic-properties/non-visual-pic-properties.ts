/**
 * Non-visual picture properties module.
 *
 * This module provides metadata and locking settings for pictures
 * that don't affect their visual appearance.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { ChildNonVisualProperties } from "./child-non-visual-pic-properties/child-non-visual-pic-properties";
import { NonVisualProperties } from "./non-visual-properties/non-visual-properties";

/**
 * Represents non-visual picture properties.
 *
 * This element specifies non-visual properties for a picture. These properties
 * include metadata like name, description, and locking settings that don't affect
 * the visual appearance of the picture.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PictureNonVisual">
 *   <xsd:sequence>
 *     <xsd:element name="cNvPr" type="a:CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="cNvPicPr" type="a:CT_NonVisualPictureProperties" minOccurs="1" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const nvPicPr = new NonVisualPicProperties();
 * ```
 */
export class NonVisualPicProperties extends XmlComponent {
    public constructor() {
        super("pic:nvPicPr");

        this.root.push(new NonVisualProperties());
        this.root.push(new ChildNonVisualProperties());
    }
}
