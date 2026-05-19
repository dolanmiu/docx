/**
 * FileChild module for WordprocessingML documents.
 *
 * FileChild is the base class for block-level elements that can appear
 * in the document body, such as paragraphs and tables.
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

/**
 * Base class for document body children.
 *
 * FileChild represents a block-level element that can be added directly
 * to the document body. Examples include Paragraph and Table.
 */
export class FileChild extends XmlComponent {
    /** Marker property identifying this as a FileChild */
    public readonly fileChild = Symbol();
}
