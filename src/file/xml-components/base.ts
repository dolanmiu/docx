/**
 * Base XML Component infrastructure for the docx library.
 *
 * This module provides the abstract base class for all XML components and the context
 * object used during XML serialization.
 *
 * @module
 */
import type { IViewWrapper } from "../document-wrapper";
import type { File } from "../file";
import type { IXmlableObject } from "./xmlable-object";

/**
 * Context object passed through the XML tree during serialization.
 *
 * This context provides access to the document structure and maintains state
 * during the conversion of components to XML.
 *
 * @property file - The root File object being serialized
 * @property viewWrapper - Access to document relationships and other document parts
 * @property stack - Current traversal stack of components (mutable for performance)
 */
export type IContext = {
    /** The root File object being serialized. */
    readonly file: File;
    /** Access to document relationships and other document parts. */
    readonly viewWrapper: IViewWrapper;
    /** Current traversal stack of components (mutable for performance). */
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly stack: IXmlableObject[];
};

/**
 * Abstract base class for all XML components in the library.
 *
 * BaseXmlComponent defines the minimal interface that all XML components must implement.
 * It stores the XML element name (rootKey) and requires subclasses to implement
 * the prepForXml method for serialization.
 *
 * @example
 * ```typescript
 * class MyElement extends BaseXmlComponent {
 *   constructor() {
 *     super("w:myElement");
 *   }
 *
 *   prepForXml(context: IContext): IXmlableObject {
 *     return { "w:myElement": {} };
 *   }
 * }
 * ```
 */
export abstract class BaseXmlComponent {
    /** The XML element name for this component (e.g., "w:p" for paragraph). */
    protected readonly rootKey: string;

    /**
     * Creates a new BaseXmlComponent with the specified XML element name.
     *
     * @param rootKey - The XML element name (e.g., "w:p", "w:r", "w:t")
     */
    public constructor(rootKey: string) {
        this.rootKey = rootKey;
    }

    /**
     * Prepares this component for XML serialization.
     *
     * This method is called by the Formatter to convert the component into an object
     * structure that can be serialized to XML. Subclasses must implement this to
     * define their XML representation.
     *
     * @param context - The serialization context
     * @returns The XML-serializable object, or undefined to exclude from output
     */
    public abstract prepForXml(context: IContext): IXmlableObject | undefined;

    /**
     * The components written in this one's place, one after another, when it can't be written as a single element,
     * such as a run with another run in its children. Undefined when it is written as itself.
     *
     * @internal
     */
    public get writtenAs(): readonly BaseXmlComponent[] | undefined {
        return undefined;
    }
}

/**
 * Whether a value is a component, from this copy of docx or from another, such as the copy a plugin or another
 * library that builds on docx was bundled with. A component from another copy isn't an instance of this copy's
 * classes, so it is known by the method that writes it.
 *
 * The method is checked, rather than a marker such as a `Symbol.for` brand, because copies of docx that predate any
 * marker wouldn't carry it, while every copy's components have `prepForXml`. Overriding `Symbol.hasInstance` on the
 * base class isn't an option either: subclasses inherit it, so `instanceof Paragraph` would match any component.
 *
 * What it doesn't take for a component stays safe: an object to write as XML, such as `{ "w:b": {} }`, has no
 * methods, and neither has a component copied without its class (with `Object.assign` or spread), which has lost the
 * method that would write it.
 *
 * @internal
 */
export const isXmlComponent = (value: unknown): value is BaseXmlComponent =>
    value instanceof BaseXmlComponent ||
    (typeof value === "object" && value !== null && typeof (value as { readonly prepForXml?: unknown }).prepForXml === "function");

/**
 * The element a component writes, such as `w:p` for a paragraph, from this copy of docx or from another. Undefined
 * when the value isn't a component.
 *
 * Checks that need to know what kind of component a child is, such as whether a cell ends with a paragraph, compare
 * this rather than the child's class, so they hold for components from another copy too. The element is also what
 * those checks are really about, because the rules they enforce are rules of the XML: a cell must end with a `w:p`,
 * and a `w:r` can't be inside another.
 *
 * `rootKey` is protected, so it is read through a cast. That is safe for any copy of docx, because every component
 * is constructed with its element as `rootKey`.
 *
 * @internal
 */
export const elementOf = (value: unknown): string | undefined =>
    isXmlComponent(value) ? (value as unknown as { readonly rootKey: string }).rootKey : undefined;
