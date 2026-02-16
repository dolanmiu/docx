import { XmlComponent } from "@file/xml-components";

import { GraphicFrameLockAttributes } from "./graphic-frame-lock-attributes";

/**
 * Represents graphic frame locking properties in DrawingML.
 *
 * This element specifies all locking properties for a graphic frame. These properties
 * inform the generating application about which operations are forbidden on the parent
 * graphic frame.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_GraphicalObjectFrameLocking">
 *   <xsd:sequence>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="noGrp" type="xsd:boolean" use="optional"/>
 *   <xsd:attribute name="noDrilldown" type="xsd:boolean" use="optional"/>
 *   <xsd:attribute name="noSelect" type="xsd:boolean" use="optional"/>
 *   <xsd:attribute name="noChangeAspect" type="xsd:boolean" use="optional"/>
 *   <xsd:attribute name="noMove" type="xsd:boolean" use="optional"/>
 *   <xsd:attribute name="noResize" type="xsd:boolean" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const locks = new GraphicFrameLocks();
 * ```
 */
export class GraphicFrameLocks extends XmlComponent {
    public constructor() {
        super("a:graphicFrameLocks");

        this.root.push(
            new GraphicFrameLockAttributes({
                xmlns: "http://schemas.openxmlformats.org/drawingml/2006/main",
                noChangeAspect: 1,
            }),
        );
    }
}
