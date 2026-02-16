/**
 * XML attribute components for the docx library.
 *
 * This module provides base classes for creating XML element attributes.
 * Attributes are represented as special components with the "_attr" key.
 *
 * @module
 */
import { BaseXmlComponent, IContext } from "./base";
import { IXmlAttribute, IXmlableObject } from "./xmlable-object";

/**
 * Maps TypeScript property names to their XML attribute names.
 *
 * This type is used to define how JavaScript-friendly property names
 * are translated into namespaced XML attribute names.
 */
export type AttributeMap<T> = Record<keyof T, string>;

/**
 * Simple attribute data as a key-value record.
 */
export type AttributeData = Record<string, boolean | number | string>;

/**
 * Structured attribute payload with explicit key-value mapping.
 *
 * This type is used by NextAttributeComponent to provide more explicit
 * control over attribute name mapping.
 */
export type AttributePayload<T> = { readonly [P in keyof T]: { readonly key: string; readonly value: T[P] } };

/**
 * Base class for creating XML attributes with automatic name mapping.
 *
 * XmlAttributeComponent allows you to define attributes using JavaScript-friendly
 * property names that are automatically mapped to XML attribute names. Subclasses
 * can define an xmlKeys map to specify the transformation.
 *
 * @example
 * ```typescript
 * class MyAttributes extends XmlAttributeComponent<{ fontSize: number }> {
 *   protected readonly xmlKeys = { fontSize: "w:sz" };
 * }
 *
 * new MyAttributes({ fontSize: 24 });
 * // Generates: _attr: { "w:sz": 24 }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class XmlAttributeComponent<T extends Record<string, any>> extends BaseXmlComponent {
    /** Optional mapping from property names to XML attribute names. */
    protected readonly xmlKeys?: AttributeMap<T>;

    /**
     * Creates a new attribute component.
     *
     * @param root - The attribute data object
     */
    public constructor(private readonly root: T) {
        super("_attr");
    }

    /**
     * Converts the attribute data to an XML-serializable object.
     *
     * This method transforms the property names using xmlKeys (if defined)
     * and filters out undefined values.
     *
     * @param _ - Context (unused for attributes)
     * @returns Object with _attr key containing the mapped attributes
     */
    public prepForXml(_: IContext): IXmlableObject {
        const attrs: Record<string, string> = {};
        Object.entries(this.root).forEach(([key, value]) => {
            if (value !== undefined) {
                const newKey = (this.xmlKeys && this.xmlKeys[key]) || key;
                // eslint-disable-next-line functional/immutable-data
                attrs[newKey] = value;
            }
        });
        return { _attr: attrs };
    }
}

/**
 * Next-generation attribute component with explicit key-value pairs.
 *
 * NextAttributeComponent provides an alternative approach to attributes where
 * each property explicitly specifies both its XML attribute name and value.
 * This gives more control but is more verbose than XmlAttributeComponent.
 *
 * @example
 * ```typescript
 * new NextAttributeComponent({
 *   fontSize: { key: "w:sz", value: 24 },
 *   bold: { key: "w:b", value: true }
 * });
 * // Generates: _attr: { "w:sz": 24, "w:b": true }
 * ```
 */
export class NextAttributeComponent<T extends AttributeData> extends BaseXmlComponent {
    /**
     * Creates a new NextAttributeComponent.
     *
     * @param root - Attribute payload with explicit key-value mappings
     */
    public constructor(private readonly root: AttributePayload<T>) {
        super("_attr");
    }

    /**
     * Converts the attribute payload to an XML-serializable object.
     *
     * Extracts the key and value from each property and filters out
     * undefined values.
     *
     * @param _ - Context (unused for attributes)
     * @returns Object with _attr key containing the attributes
     */
    public prepForXml(_: IContext): IXmlableObject {
        const attrs = Object.values<{ readonly key: string; readonly value: string | boolean | number }>(this.root)
            .filter(({ value }) => value !== undefined)
            .reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as IXmlAttribute);
        return { _attr: attrs };
    }
}
