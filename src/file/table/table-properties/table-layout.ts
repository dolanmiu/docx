/**
 * Table layout module for WordprocessingML documents.
 *
 * This module provides table layout algorithm settings.
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Table layout algorithm types.
 *
 * Specifies how the table width is calculated.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_TblLayoutType">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="fixed"/>
 *     <xsd:enumeration value="autofit"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const TableLayoutType = {
    /** Auto-fit layout - column widths are adjusted based on content */
    AUTOFIT: "autofit",
    /** Fixed layout - column widths are fixed as specified */
    FIXED: "fixed",
} as const;

class TableLayoutAttributes extends XmlAttributeComponent<{
    readonly type: (typeof TableLayoutType)[keyof typeof TableLayoutType];
}> {
    protected readonly xmlKeys = { type: "w:type" };
}

/**
 * Represents table layout settings in a WordprocessingML document.
 *
 * The tblLayout element specifies the algorithm used to lay out the table.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblLayoutType">
 *   <xsd:attribute name="type" type="ST_TblLayoutType"/>
 * </xsd:complexType>
 * ```
 */
export class TableLayout extends XmlComponent {
    public constructor(type: (typeof TableLayoutType)[keyof typeof TableLayoutType]) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({ type }));
    }
}
