/**
 * Picture locks module.
 *
 * This module provides locking settings for pictures that control
 * which operations are allowed on the picture element.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { PicLocksAttributes } from "./pic-locks-attributes";

/**
 * Represents picture locking properties in DrawingML.
 *
 * This element specifies all locking properties for a picture. These properties
 * inform the generating application about which operations are forbidden on the
 * parent picture object.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_PictureLocking">
 *   <xsd:sequence>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="noGrp" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noSelect" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noRot" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noChangeAspect" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noMove" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noResize" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noEditPoints" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noAdjustHandles" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noChangeArrowheads" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noChangeShapeType" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="noCrop" type="xsd:boolean" use="optional" default="false"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const locks = new PicLocks();
 * ```
 */
export class PicLocks extends XmlComponent {
    public constructor() {
        super("a:picLocks");
        this.root.push(
            new PicLocksAttributes({
                noChangeAspect: 1,
                noChangeArrowheads: 1,
            }),
        );
    }
}
