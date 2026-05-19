/**
 * Concrete numbering instances module for WordprocessingML documents.
 *
 * Concrete numbering instances reference abstract numbering definitions and
 * can override specific level settings. Each paragraph references a concrete
 * numbering instance to apply list formatting.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * @module
 */
import { Attributes, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

/**
 * Reference to an abstract numbering definition.
 */
class AbstractNumId extends XmlComponent {
    public constructor(value: number) {
        super("w:abstractNumId");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

/**
 * Attributes for concrete numbering instances.
 */
class NumAttributes extends XmlAttributeComponent<{
    /** The unique identifier for this numbering instance. */
    readonly numId: number;
}> {
    protected readonly xmlKeys = { numId: "w:numId" };
}

/**
 * Options for overriding a specific level in a numbering instance.
 *
 * @property num - The level number to override (0-8)
 * @property start - The starting number for this level
 */
type IOverrideLevel = {
    /** The level number to override (0-8). */
    readonly num: number;
    /** The starting number for this level. */
    readonly start?: number;
};

/**
 * Options for creating a concrete numbering instance.
 *
 * @property numId - Unique identifier for this numbering instance
 * @property abstractNumId - ID of the abstract numbering definition to reference
 * @property reference - Reference name for this numbering instance
 * @property instance - Instance number for tracking multiple uses
 * @property overrideLevels - Array of level overrides to customize specific levels
 */
export type IConcreteNumberingOptions = {
    /** Unique identifier for this numbering instance. */
    readonly numId: number;
    /** ID of the abstract numbering definition to reference. */
    readonly abstractNumId: number;
    /** Reference name for this numbering instance. */
    readonly reference: string;
    /** Instance number for tracking multiple uses. */
    readonly instance: number;
    /** Array of level overrides to customize specific levels. */
    readonly overrideLevels?: readonly IOverrideLevel[];
};

/**
 * Represents a concrete numbering instance in a WordprocessingML document.
 *
 * A concrete numbering instance references an abstract numbering definition and
 * can override specific levels. Paragraphs reference concrete numbering instances
 * to apply list formatting.
 *
 * Reference: http://officeopenxml.com/WPnumbering.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Num">
 *   <xsd:sequence>
 *     <xsd:element name="abstractNumId" type="CT_DecimalNumber" minOccurs="1"/>
 *     <xsd:element name="lvlOverride" type="CT_NumLvl" minOccurs="0" maxOccurs="9"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="numId" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create a concrete numbering instance
 * const concreteNumbering = new ConcreteNumbering({
 *   numId: 1,
 *   abstractNumId: 0,
 *   reference: "my-numbering",
 *   instance: 0,
 *   overrideLevels: [
 *     {
 *       num: 0,
 *       start: 5, // Start numbering at 5 instead of 1
 *     },
 *   ],
 * });
 * ```
 */
export class ConcreteNumbering extends XmlComponent {
    /** The unique identifier for this numbering instance. */
    public readonly numId: number;
    /** The reference name for this numbering instance. */
    public readonly reference: string;
    /** The instance number for tracking multiple uses. */
    public readonly instance: number;

    /**
     * Creates a new concrete numbering instance.
     *
     * @param options - Configuration options for the numbering instance
     */
    public constructor(options: IConcreteNumberingOptions) {
        super("w:num");

        this.numId = options.numId;
        this.reference = options.reference;
        this.instance = options.instance;

        this.root.push(
            new NumAttributes({
                numId: decimalNumber(options.numId),
            }),
        );

        this.root.push(new AbstractNumId(decimalNumber(options.abstractNumId)));

        if (options.overrideLevels && options.overrideLevels.length) {
            for (const level of options.overrideLevels) {
                this.root.push(new LevelOverride(level.num, level.start));
            }
        }
    }
}

/**
 * Attributes for level overrides.
 */
class LevelOverrideAttributes extends XmlAttributeComponent<{
    /** The level number being overridden. */
    readonly ilvl: number;
}> {
    protected readonly xmlKeys = { ilvl: "w:ilvl" };
}

/**
 * Represents a level override in a concrete numbering instance.
 *
 * Level overrides allow customization of specific levels within a numbering
 * instance, such as changing the starting number.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NumLvl">
 *   <xsd:sequence>
 *     <xsd:element name="startOverride" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="lvl" type="CT_Lvl" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="ilvl" type="ST_DecimalNumber" use="required"/>
 * </xsd:complexType>
 * ```
 */
export class LevelOverride extends XmlComponent {
    /**
     * Creates a new level override.
     *
     * @param levelNum - The level number to override (0-8)
     * @param start - Optional starting number for the level
     */
    public constructor(levelNum: number, start?: number) {
        super("w:lvlOverride");
        this.root.push(new LevelOverrideAttributes({ ilvl: levelNum }));
        if (start !== undefined) {
            this.root.push(new StartOverride(start));
        }
    }
}

/**
 * Attributes for start override values.
 */
class StartOverrideAttributes extends XmlAttributeComponent<{
    /** The starting number value. */
    readonly val: number;
}> {
    protected readonly xmlKeys = { val: "w:val" };
}

/**
 * Represents a start override for a numbering level.
 *
 * This element overrides the starting number for a specific level.
 */
class StartOverride extends XmlComponent {
    /**
     * Creates a new start override.
     *
     * @param start - The starting number
     */
    public constructor(start: number) {
        super("w:startOverride");
        this.root.push(new StartOverrideAttributes({ val: start }));
    }
}
