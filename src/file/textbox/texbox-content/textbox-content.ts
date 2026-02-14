/**
 * Textbox content module for WordprocessingML documents.
 *
 * Provides functionality for creating textbox content elements that contain block-level content.
 *
 * @module
 */
import { ParagraphChild } from "@file/paragraph";
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates a textbox content element containing block-level content.
 *
 * The textbox content element (w:txbxContent) represents the content container within a VML textbox.
 * It can contain block-level elements such as paragraphs and tables.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TxbxContent">
 *   <xsd:group ref="EG_BlockLevelElts" minOccurs="1" maxOccurs="unbounded"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options
 * @param options.children - Array of paragraph children to include in the textbox content
 * @returns An XmlComponent representing the w:txbxContent element
 *
 * @example
 * ```typescript
 * const content = createTextboxContent({
 *   children: [new TextRun("Hello World")]
 * });
 * ```
 */
export const createTextboxContent = ({ children = [] }: { readonly children?: readonly ParagraphChild[] }): XmlComponent =>
    new BuilderElement<{ readonly style?: string }>({
        name: "w:txbxContent",
        children: children as readonly XmlComponent[],
    });
