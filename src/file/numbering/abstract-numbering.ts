/**
 * Abstract numbering definitions module for WordprocessingML documents.
 *
 * Abstract numbering definitions contain the formatting and style information
 * that can be shared across multiple numbering instances.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

import { type ILevelsOptions, Level } from "./level";
import { MultiLevelType } from "./multi-level-type";

/**
 * Attributes for abstract numbering definitions.
 *
 * @property abstractNumId - Unique identifier for the abstract numbering definition
 * @property restartNumberingAfterBreak - Whether to restart numbering after section breaks
 */
class AbstractNumberingAttributes extends XmlAttributeComponent<{
    /** Unique identifier for the abstract numbering definition. */
    readonly abstractNumId: number;
    /** Whether to restart numbering after section breaks (0 or 1). */
    readonly restartNumberingAfterBreak: number;
}> {
    protected readonly xmlKeys = {
        abstractNumId: "w:abstractNumId",
        restartNumberingAfterBreak: "w15:restartNumberingAfterBreak",
    };
}

/**
 * Represents an abstract numbering definition in a WordprocessingML document.
 *
 * Abstract numbering definitions define the formatting and style of numbered or
 * bulleted lists that can be referenced by concrete numbering instances.
 * Each abstract definition can contain up to 9 levels.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_AbstractNum">
 *   <xsd:sequence>
 *     <xsd:element name="nsid" type="CT_LongHexNumber" minOccurs="0"/>
 *     <xsd:element name="multiLevelType" type="CT_MultiLevelType" minOccurs="0"/>
 *     <xsd:element name="tmpl" type="CT_LongHexNumber" minOccurs="0"/>
 *     <xsd:element name="name" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="styleLink" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="numStyleLink" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="lvl" type="CT_Lvl" minOccurs="0" maxOccurs="9"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="abstractNumId" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create an abstract numbering definition with multiple levels
 * const abstractNumbering = new AbstractNumbering(1, [
 *   {
 *     level: 0,
 *     format: LevelFormat.DECIMAL,
 *     text: "%1.",
 *     alignment: AlignmentType.LEFT,
 *   },
 *   {
 *     level: 1,
 *     format: LevelFormat.LOWER_LETTER,
 *     text: "%2)",
 *     alignment: AlignmentType.LEFT,
 *   },
 * ]);
 * ```
 */
export class AbstractNumbering extends XmlComponent {
    /** The unique identifier for this abstract numbering definition. */
    public readonly id: number;

    /**
     * Creates a new abstract numbering definition.
     *
     * @param id - Unique identifier for this abstract numbering definition
     * @param levelOptions - Array of level definitions (up to 9 levels)
     */
    public constructor(id: number, levelOptions: readonly ILevelsOptions[]) {
        super("w:abstractNum");
        this.root.push(
            new AbstractNumberingAttributes({
                abstractNumId: decimalNumber(id),
                restartNumberingAfterBreak: 0,
            }),
        );
        this.root.push(new MultiLevelType("hybridMultilevel"));
        this.id = id;

        for (const option of levelOptions) {
            this.root.push(new Level(option));
        }
    }
}
