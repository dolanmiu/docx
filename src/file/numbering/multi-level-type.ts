/**
 * Multi-level type definitions for WordprocessingML documents.
 *
 * Defines the type of numbering structure (single-level, multi-level, or hybrid).
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * @module
 */
import { Attributes, XmlComponent } from "@file/xml-components";

/**
 * Represents the multi-level type of a numbering definition.
 *
 * The multi-level type specifies whether the numbering definition uses a single
 * level, multiple levels, or a hybrid approach.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_MultiLevelType">
 *   <xsd:attribute name="val" type="ST_MultiLevelType" use="required"/>
 * </xsd:complexType>
 *
 * <xsd:simpleType name="ST_MultiLevelType">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="singleLevel"/>
 *     <xsd:enumeration value="multilevel"/>
 *     <xsd:enumeration value="hybridMultilevel"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a hybrid multi-level numbering
 * const multiLevel = new MultiLevelType("hybridMultilevel");
 *
 * // Create a single-level numbering
 * const singleLevel = new MultiLevelType("singleLevel");
 * ```
 */
export class MultiLevelType extends XmlComponent {
    /**
     * Creates a new multi-level type specification.
     *
     * @param value - The multi-level type: "singleLevel", "multilevel", or "hybridMultilevel"
     */
    public constructor(value: string) {
        super("w:multiLevelType");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}
