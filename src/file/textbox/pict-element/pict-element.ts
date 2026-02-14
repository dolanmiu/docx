/**
 * Picture element module for WordprocessingML documents.
 *
 * Provides functionality for creating pict (picture) elements that contain VML shapes.
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Options for creating a picture element.
 *
 * @property shape - The VML shape to be contained within the picture element
 */
export type IPictElement = {
    /** The VML shape to be contained within the picture element */
    readonly shape: XmlComponent;
};

/**
 * Creates a picture element containing a VML shape.
 *
 * The picture element (w:pict) is a container for VML (Vector Markup Language) content
 * within WordprocessingML documents, commonly used for textboxes and other drawing objects.
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
 * @param options - Configuration options containing the VML shape
 * @returns An XmlComponent representing the w:pict element
 *
 * @example
 * ```typescript
 * const pictElement = createPictElement({
 *   shape: createShape({
 *     id: "shape1",
 *     children: [new TextRun("Hello")]
 *   })
 * });
 * ```
 */
export const createPictElement = ({ shape }: IPictElement): XmlComponent =>
    new BuilderElement<{ readonly style?: string }>({
        name: "w:pict",
        children: [shape],
    });
