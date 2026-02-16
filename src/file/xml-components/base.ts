/**
 * Base XML Component infrastructure for the docx library.
 *
 * This module provides the abstract base class for all XML components and the context
 * object used during XML serialization.
 *
 * @module
 */
import { IViewWrapper } from "../document-wrapper";
import { File } from "../file";
import { IXmlableObject } from "./xmlable-object";

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
}
