/**
 * Simple XML element types for common WordprocessingML patterns.
 *
 * This module provides reusable element classes for common XML patterns in OOXML,
 * such as boolean elements, string values, number values, and empty elements.
 * These are building blocks used throughout the library.
 *
 * @module
 */
import { type AttributeData, type AttributePayload, Attributes, NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { type PositiveUniversalMeasure, hpsMeasureValue } from "@util/values";

/**
 * XML element representing a boolean on/off value (CT_OnOff).
 *
 * This element type is used throughout WordprocessingML to represent boolean properties.
 * A value of true (or 1) means the property is enabled. A value of false (or 0) means
 * it is explicitly disabled. When the value is true, the attribute is often omitted.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_OnOff">
 *   <xsd:attribute name="val" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Bold enabled (w:val omitted when true)
 * new OnOffElement("w:b", true);
 * // Generates: <w:b/>
 *
 * // Bold explicitly disabled
 * new OnOffElement("w:b", false);
 * // Generates: <w:b w:val="false"/>
 * ```
 */
export class OnOffElement extends XmlComponent {
    /**
     * Creates an OnOffElement.
     *
     * @param name - The XML element name (e.g., "w:b", "w:i")
     * @param val - The boolean value (defaults to true)
     */
    public constructor(name: string, val: boolean | undefined = true) {
        super(name);
        if (val !== true) {
            this.root.push(new Attributes({ val }));
        }
    }
}

/**
 * XML element representing a half-point size measurement (CT_HpsMeasure).
 *
 * HpsMeasure elements are used for font sizes and other measurements in WordprocessingML.
 * Values can be specified as numbers (interpreted as half-points) or with explicit units.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_HpsMeasure">
 *   <xsd:attribute name="val" type="ST_HpsMeasure" use="required"/>
 * </xsd:complexType>
 *
 * <xsd:simpleType name="ST_HpsMeasure">
 *   <xsd:union memberTypes="s:ST_UnsignedDecimalNumber s:ST_PositiveUniversalMeasure" />
 * </xsd:simpleType>
 * ```
 *
 * @example
 * ```typescript
 * // Font size of 24 half-points (12pt)
 * new HpsMeasureElement("w:sz", 24);
 * // Generates: <w:sz w:val="24"/>
 *
 * // Using explicit units
 * new HpsMeasureElement("w:sz", "12pt");
 * ```
 */
export class HpsMeasureElement extends XmlComponent {
    /**
     * Creates an HpsMeasureElement.
     *
     * @param name - The XML element name
     * @param val - The measurement value (number in half-points or string with units)
     */
    public constructor(name: string, val: number | PositiveUniversalMeasure) {
        super(name);
        this.root.push(new Attributes({ val: hpsMeasureValue(val) }));
    }
}

/**
 * XML element representing an empty element (CT_Empty).
 *
 * EmptyElement creates self-closing XML tags with no attributes or content.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_Empty"/>
 * ```
 *
 * @example
 * ```typescript
 * new EmptyElement("w:noProof");
 * // Generates: <w:noProof/>
 * ```
 */
export class EmptyElement extends XmlComponent {}

/**
 * XML element with a string value attribute (CT_String).
 *
 * StringValueElement creates elements with a single "w:val" attribute
 * containing a string value.
 *
 * OOXML Reference:
 * ```xml
 * <xsd:complexType name="CT_String">
 *   <xsd:attribute name="val" type="s:ST_String" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new StringValueElement("w:style", "Heading1");
 * // Generates: <w:style w:val="Heading1"/>
 * ```
 */
export class StringValueElement extends XmlComponent {
    /**
     * Creates a StringValueElement.
     *
     * @param name - The XML element name
     * @param val - The string value
     */
    public constructor(name: string, val: string) {
        super(name);
        this.root.push(new Attributes({ val }));
    }
}

/**
 * Creates a string element using the builder pattern.
 *
 * This is an alternative to StringValueElement that uses BuilderElement
 * for more explicit attribute naming.
 *
 * @param name - The XML element name
 * @param value - The string value
 * @returns An XmlComponent with the string value
 *
 * @example
 * ```typescript
 * createStringElement("w:pStyle", "Heading1");
 * // Generates: <w:pStyle w:val="Heading1"/>
 * ```
 */
export const createStringElement = (name: string, value: string): XmlComponent =>
    new BuilderElement({
        name,
        attributes: {
            value: { key: "w:val", value },
        },
    });

/**
 * XML element with a numeric value attribute.
 *
 * NumberValueElement creates elements with a single "w:val" attribute
 * containing a numeric value.
 *
 * @example
 * ```typescript
 * new NumberValueElement("w:ilvl", 2);
 * // Generates: <w:ilvl w:val="2"/>
 * ```
 */
export class NumberValueElement extends XmlComponent {
    /**
     * Creates a NumberValueElement.
     *
     * @param name - The XML element name
     * @param val - The numeric value
     */
    public constructor(name: string, val: number) {
        super(name);
        this.root.push(new Attributes({ val }));
    }
}

/**
 * XML element with a string enum value attribute.
 *
 * StringEnumValueElement is similar to StringValueElement but uses a generic
 * type parameter to enforce type safety for enum values.
 *
 * @example
 * ```typescript
 * type AlignmentType = "left" | "center" | "right";
 * new StringEnumValueElement<AlignmentType>("w:jc", "center");
 * // Generates: <w:jc w:val="center"/>
 * ```
 */
export class StringEnumValueElement<T extends string> extends XmlComponent {
    /**
     * Creates a StringEnumValueElement.
     *
     * @param name - The XML element name
     * @param val - The enum value
     */
    public constructor(name: string, val: T) {
        super(name);
        this.root.push(new Attributes({ val }));
    }
}

/**
 * XML element containing text content.
 *
 * StringContainer creates elements with text content (not attributes).
 * This is used for elements where the value is the text node content
 * rather than an attribute.
 *
 * @example
 * ```typescript
 * new StringContainer("w:author", "John Doe");
 * // Generates: <w:author>John Doe</w:author>
 * ```
 */
export class StringContainer extends XmlComponent {
    /**
     * Creates a StringContainer.
     *
     * @param name - The XML element name
     * @param val - The text content
     */
    public constructor(name: string, val: string) {
        super(name);
        this.root.push(val);
    }
}

/**
 * Flexible XML element builder with explicit attribute and child configuration.
 *
 * BuilderElement provides a structured way to create XML elements with typed
 * attributes and children. It uses the NextAttributeComponent pattern for
 * explicit attribute key-value mapping.
 *
 * @example
 * ```typescript
 * // Element with attributes
 * new BuilderElement({
 *   name: "w:spacing",
 *   attributes: {
 *     before: { key: "w:before", value: 240 },
 *     after: { key: "w:after", value: 120 }
 *   }
 * });
 * // Generates: <w:spacing w:before="240" w:after="120"/>
 *
 * // Element with children
 * new BuilderElement({
 *   name: "w:pPr",
 *   children: [
 *     new StringValueElement("w:pStyle", "Heading1")
 *   ]
 * });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class BuilderElement<T extends AttributeData = {}> extends XmlComponent {
    /**
     * Creates a BuilderElement with the specified configuration.
     *
     * @param config - Element configuration
     * @param config.name - The XML element name
     * @param config.attributes - Optional attributes with explicit key-value pairs
     * @param config.children - Optional child elements
     */
    public constructor({
        name,
        attributes,
        children,
    }: {
        /** The XML element name. */
        readonly name: string;
        /** Optional attributes with explicit key-value pairs. */
        readonly attributes?: AttributePayload<T>;
        /** Optional child elements. */
        readonly children?: readonly XmlComponent[];
    }) {
        super(name);

        if (attributes) {
            this.root.push(new NextAttributeComponent(attributes));
        }

        if (children) {
            this.root.push(...children);
        }
    }
}
