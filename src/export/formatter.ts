/**
 * Formatter module for converting XML components to serializable objects.
 *
 * @module
 */
import type { BaseXmlComponent, IContext, IXmlableObject } from "@file/xml-components";

/**
 * Converts XML components into serializable objects ready for XML generation.
 *
 * The Formatter is responsible for preparing XML components for serialization by calling
 * their prepForXml method with the appropriate context. This is a critical step in the
 * export pipeline that transforms the declarative API objects into XML-compatible structures.
 *
 * @example
 * ```typescript
 * const formatter = new Formatter();
 * const paragraph = new Paragraph("Hello World");
 * const xmlObject = formatter.format(paragraph, context);
 * ```
 */
export class Formatter {
    /**
     * Formats an XML component into a serializable object.
     *
     * @param input - The XML component to format
     * @param context - The context containing file state and relationships
     * @returns A serializable XML object structure
     * @throws Error if the component cannot be formatted correctly
     */
    public format(input: BaseXmlComponent, context: IContext = { stack: [] } as unknown as IContext): IXmlableObject {
        const output = input.prepForXml(context);

        if (output) {
            return output;
        } else {
            throw Error("XMLComponent did not format correctly");
        }
    }
}
