/**
 * Table layout module for WordprocessingML documents.
 *
 * This module provides table layout algorithm settings.
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

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

/**
 * Creates table layout settings in a WordprocessingML document.
 *
 * The tblLayout element specifies the algorithm used to lay out the table.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TblLayoutType">
 *   <xsd:attribute name="type" type="ST_TblLayoutType"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createTableLayout(TableLayoutType.FIXED);
 * ```
 */
export const createTableLayout = (type: (typeof TableLayoutType)[keyof typeof TableLayoutType]): XmlComponent =>
    new BuilderElement<{ readonly type: (typeof TableLayoutType)[keyof typeof TableLayoutType] }>({
        name: "w:tblLayout",
        attributes: {
            type: { key: "w:type", value: type },
        },
    });
