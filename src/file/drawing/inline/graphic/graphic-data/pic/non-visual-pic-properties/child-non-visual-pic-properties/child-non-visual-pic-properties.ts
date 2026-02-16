/**
 * Child non-visual picture properties module.
 *
 * This module provides picture-specific non-visual properties including
 * locking settings that control operations on the picture.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { PicLocks } from "./pic-locks/pic-locks";

/**
 * Represents non-visual picture drawing properties.
 *
 * This element specifies the non-visual properties specific to a picture.
 * These properties include picture-specific locking settings that control
 * which operations are allowed on the picture.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NonVisualPictureProperties">
 *   <xsd:sequence>
 *     <xsd:element name="picLocks" type="CT_PictureLocking" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="preferRelativeResize" type="xsd:boolean" use="optional" default="true"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const cNvPicPr = new ChildNonVisualProperties();
 * ```
 */
export class ChildNonVisualProperties extends XmlComponent {
    public constructor() {
        super("pic:cNvPicPr");

        this.root.push(new PicLocks());
    }
}
