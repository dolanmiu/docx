/**
 * Picture element module for WordprocessingML documents.
 *
 * Provides functionality for creating pict (picture) elements that contain VML content.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Options for creating a picture element.
 */
export type IPictOptions = {
    /** The VML elements (shape types and shapes) contained in the picture element. */
    readonly children: readonly XmlComponent[];
};

/**
 * Creates a picture element containing VML content.
 *
 * The picture element (w:pict) is the container for VML (Vector Markup Language) content
 * within WordprocessingML documents. It is used for text boxes, watermarks and other
 * legacy drawing objects. A picture element typically holds an optional `v:shapetype`
 * followed by one or more `v:shape` elements.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Picture">
 *   <xsd:sequence>
 *     <xsd:sequence maxOccurs="unbounded">
 *       <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:vml" minOccurs="0"
 *         maxOccurs="unbounded"/>
 *       <xsd:any processContents="lax" namespace="urn:schemas-microsoft-com:office:office"
 *         minOccurs="0" maxOccurs="unbounded"/>
 *     </xsd:sequence>
 *     <xsd:element name="movie" type="CT_Rel" minOccurs="0"/>
 *     <xsd:element name="control" type="CT_Control" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options containing the VML children
 * @returns An XmlComponent representing the w:pict element
 *
 * @example
 * ```typescript
 * const pict = createPict({
 *   children: [createWordArtShapeType(), createVmlShape({ id: "shape1", type: "#_x0000_t136" })],
 * });
 * ```
 */
export const createPict = ({ children }: IPictOptions): XmlComponent =>
    new BuilderElement({
        name: "w:pict",
        children,
    });
