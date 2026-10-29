/**
 * Imported XML Component module for handling external XML content.
 *
 * This module provides functionality to import existing XML content and convert it
 * into XmlComponent trees. This is useful for incorporating XML from external sources
 * or templates into generated documents.
 *
 * @module
 */

import { type IXmlableObject, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { type XmlElement, parseXml } from "@util/xml";

import type { BaseXmlComponent, IContext } from "./base";

/**
 * Converts an XML element, in the shape of xml-js's non-compact `Element`, into an XmlComponent tree.
 *
 * This function recursively processes the element and creates a tree of
 * ImportedXmlComponent objects that match the structure of the original XML.
 *
 * @param element - The XML element as an {@link XmlElement}
 * @returns An ImportedXmlComponent tree, text string, or undefined
 *
 * @example
 * ```typescript
 * const component = convertToXmlComponent({
 *   type: "element",
 *   name: "w:p",
 *   elements: [{ type: "element", name: "w:r", elements: [{ type: "element", name: "w:t", elements: [{ type: "text", text: "Hello" }] }] }],
 * });
 * ```
 */
export const convertToXmlComponent = (element: XmlElement): ImportedXmlComponent | string | undefined => {
    switch (element.type) {
        case undefined:
        case "element":
            // eslint-disable-next-line no-case-declarations
            const xmlComponent = new ImportedXmlComponent(element.name as string, element.attributes);
            // eslint-disable-next-line no-case-declarations
            const childElements = element.elements || [];
            for (const childElm of childElements) {
                const child = convertToXmlComponent(childElm);
                if (child !== undefined) {
                    xmlComponent.push(child);
                }
            }
            return xmlComponent;
        case "text":
            return element.text as string;
        default:
            return undefined;
        /* c8 ignore next 2 */
    }
};

/**
 * Internal attribute component for imported XML elements.
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ImportedXmlComponentAttributes extends XmlAttributeComponent<any> {
    // noop
}

/**
 * XML component representing imported XML content.
 *
 * ImportedXmlComponent allows you to parse XML strings and incorporate them
 * into the document structure. This is particularly useful when working with
 * templates or when you need to include pre-existing XML fragments.
 *
 * @example
 * ```typescript
 * // Parse XML string into component tree
 * const component = ImportedXmlComponent.fromXmlString(
 *   '<w:p><w:r><w:t>Hello World</w:t></w:r></w:p>'
 * );
 *
 * // Manually create an imported component
 * const element = new ImportedXmlComponent("w:customElement", { "w:val": "value" });
 * element.push(new ImportedXmlComponent("w:child"));
 * ```
 */
export class ImportedXmlComponent extends XmlComponent {
    /**
     * Parses an XML string and converts it to an ImportedXmlComponent tree.
     *
     * This static method is the primary way to import external XML content.
     * It parses the XML string into an {@link XmlElement} tree,
     * then converts that into a tree of XmlComponent objects.
     *
     * The component is for the parsed document, with the XML's element in it, and is written as that element, with no
     * element of its own around it.
     *
     * @param importedContent - The XML content as a string
     * @returns An ImportedXmlComponent representing the parsed XML
     *
     * @example
     * ```typescript
     * const xml = '<w:p><w:r><w:t>Hello</w:t></w:r></w:p>';
     * const component = ImportedXmlComponent.fromXmlString(xml);
     * ```
     */
    public static fromXmlString(importedContent: string): ImportedXmlComponent {
        const xmlObj = parseXml(importedContent);
        return convertToXmlComponent(xmlObj) as ImportedXmlComponent;
    }

    /**
     * Creates an ImportedXmlComponent.
     *
     * @param rootKey - The XML element name
     * @param _attr - Optional attributes for the root element
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(rootKey: string, _attr?: any) {
        super(rootKey);
        if (_attr) {
            this.root.push(new ImportedXmlComponentAttributes(_attr));
        }
    }

    /**
     * Adds a child component or text to this element.
     *
     * @param xmlComponent - The child component or text string to add
     */
    public push(xmlComponent: XmlComponent | string): void {
        this.root.push(xmlComponent);
    }

    /**
     * A component of no element, such as the one {@link fromXmlString} gives for the parsed document, is written as the
     * elements in it. Written as itself, it would be an `<undefined>` element, which Word can't open.
     *
     * The component itself is still returned, rather than its element, because code written for earlier versions takes
     * the element from its children.
     *
     * @internal
     */
    public get writtenAs(): readonly BaseXmlComponent[] | undefined {
        // Text outside a document's element can only be whitespace, kept when parsed with `keepWhitespaceText`
        return this.rootKey === undefined ? this.root.filter((child) => typeof child !== "string") : undefined;
    }

    /**
     * Prepares this element for XML serialization. A component of no element written by itself, rather than among a
     * parent's children, such as by the formatter or by an earlier copy of docx, is written as the one element in it.
     *
     * @param context - The serialization context
     * @returns The XML-serializable object
     */
    public prepForXml(context: IContext): IXmlableObject | undefined {
        const parts = this.writtenAs;
        return parts?.length === 1 ? parts[0].prepForXml(context) : super.prepForXml(context);
    }
}

/**
 * Represents attributes for imported root elements.
 *
 * This class is used internally to handle attributes on root elements
 * that are being imported from external XML. It passes through the
 * attributes without transformation.
 *
 * @example
 * ```typescript
 * const attrs = new ImportedRootElementAttributes({
 *   "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 * });
 * ```
 */
export class ImportedRootElementAttributes extends XmlComponent {
    /**
     * Creates an ImportedRootElementAttributes component.
     *
     * @param _attr - The attributes object to pass through
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public constructor(private readonly _attr: any) {
        super("");
    }

    /**
     * Prepares the attributes for XML serialization.
     *
     * @param _ - Context (unused)
     * @returns Object with _attr key containing the raw attributes
     */
    public prepForXml(_: IContext): IXmlableObject {
        return {
            _attr: this._attr,
        };
    }
}
