/**
 * XML Component module for the docx library.
 *
 * This module provides the core XmlComponent class that all WordprocessingML elements
 * extend from. XmlComponent manages the conversion of component trees into XML structures
 * that can be serialized into DOCX files.
 *
 * @module
 */
import { BaseXmlComponent, type IContext } from "./base";
import type { IXmlableObject } from "./xmlable-object";

/**
 * Empty object singleton used for empty XML elements.
 *
 * This sealed object is used to generate self-closing XML tags when an element
 * has no children or attributes.
 *
 * @internal
 */
export const EMPTY_OBJECT = Object.seal({});

/**
 * Base class for all XML components in WordprocessingML documents.
 *
 * XmlComponent provides the infrastructure for building XML element trees
 * that are serialized into document.xml and other parts of the DOCX package.
 * It manages a collection of child components and handles the conversion to
 * the intermediate object format used by the xml serialization library.
 *
 * @example
 * ```typescript
 * // Creating a custom XML component
 * class MyElement extends XmlComponent {
 *   constructor(text: string) {
 *     super("w:myElement");
 *     this.root.push(new Attributes({ val: text }));
 *   }
 * }
 *
 * const element = new MyElement("Hello");
 * // When serialized: <w:myElement w:val="Hello"/>
 * ```
 */
export abstract class XmlComponent extends BaseXmlComponent {
    /**
     * Array of child components, text nodes, and attributes.
     *
     * This array forms the content of the XML element. It can contain other
     * XmlComponents, string values (text nodes), or attribute components.
     */
    // eslint-disable-next-line functional/prefer-readonly-type, @typescript-eslint/no-explicit-any
    protected root: (BaseXmlComponent | string | any)[];

    /**
     * Creates a new XmlComponent.
     *
     * @param rootKey - The XML element name (e.g., "w:p", "w:r", "w:t")
     */
    public constructor(rootKey: string) {
        super(rootKey);
        this.root = new Array<BaseXmlComponent | string>();
    }

    /**
     * Prepares this component and its children for XML serialization.
     *
     * This method is called by the Formatter to convert the component tree into
     * an object structure compatible with the xml library (https://www.npmjs.com/package/xml).
     * It recursively processes all children and handles special cases like
     * attribute-only elements and empty elements.
     *
     * The method can be overridden by subclasses to customize XML representation
     * or execute side effects during serialization (e.g., creating relationships).
     *
     * @param context - The serialization context containing document state
     * @returns The XML-serializable object, or undefined to exclude from output
     *
     * @example
     * ```typescript
     * // Override to add custom serialization logic
     * prepForXml(context: IContext): IXmlableObject | undefined {
     *   // Custom logic here
     *   return super.prepForXml(context);
     * }
     * ```
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        // Push this component onto the stack for context-aware processing
        // Mutating the stack is required for performance reasons
        // eslint-disable-next-line functional/immutable-data
        context.stack.push(this);

        // Recursively prepare all children for serialization
        const children = this.root
            .map((comp) => {
                if (comp instanceof BaseXmlComponent) {
                    return comp.prepForXml(context);
                }
                return comp;
            })
            .filter((comp) => comp !== undefined); // Exclude undefined

        // Pop this component from the stack
        // eslint-disable-next-line functional/immutable-data
        context.stack.pop();

        // Optimization: If we only have a single IXmlableObject in our children array
        // and it represents attributes, use the object itself as our children to
        // avoid an unneeded XML close element (generates <element attr="val"/> instead
        // of <element><attr val="val"/></element>).
        // Additionally, if the array is empty, use an empty object to generate
        // a self-closing XML element.
        return {
            [this.rootKey]: children.length ? (children.length === 1 && children[0]?._attr ? children[0] : children) : EMPTY_OBJECT,
        };
    }

    /**
     * Adds a child element to this component.
     *
     * @deprecated Do not use this method. It is only used internally by the library. It will be removed in a future version.
     * @param child - The child component or text string to add
     * @returns This component (for chaining)
     */
    public addChildElement(child: XmlComponent | string): XmlComponent {
        this.root.push(child);

        return this;
    }
}

/**
 * XML component that is excluded from output if it has no meaningful content.
 *
 * IgnoreIfEmptyXmlComponent is useful for optional container elements that
 * should only appear in the XML if they contain children or attributes.
 * If the element would be empty, it returns undefined instead, causing it
 * to be excluded from the output.
 *
 * @example
 * ```typescript
 * class OptionalContainer extends IgnoreIfEmptyXmlComponent {
 *   constructor(items?: Item[]) {
 *     super("w:container");
 *     if (items) {
 *       items.forEach(item => this.root.push(item));
 *     }
 *   }
 * }
 *
 * const container1 = new OptionalContainer([item1, item2]);
 * // Renders: <w:container>...</w:container>
 *
 * const container2 = new OptionalContainer();
 * // Renders: nothing (excluded from output)
 * ```
 */
export abstract class IgnoreIfEmptyXmlComponent extends XmlComponent {
    private readonly includeIfEmpty: boolean | undefined;

    public constructor(rootKey: string, includeIfEmpty?: boolean) {
        super(rootKey);
        this.includeIfEmpty = includeIfEmpty;
    }

    /**
     * Prepares the component for XML serialization, excluding it if empty.
     *
     * @param context - The serialization context
     * @returns The XML-serializable object, or undefined if empty
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        const result = super.prepForXml(context);

        if (this.includeIfEmpty) {
            return result;
        }
        // Ignore the object if its falsey or is an empty object (would produce
        // an empty XML element if allowed to be included in the output).
        if (result && (typeof result[this.rootKey] !== "object" || Object.keys(result[this.rootKey]).length)) {
            return result;
        }

        return undefined;
    }
}
