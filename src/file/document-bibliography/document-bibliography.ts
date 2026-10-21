/**
 * Document bibliography module: the sources that a document's citations and bibliographies refer to.
 *
 * Word keeps a document's sources in a custom XML part, customXml/item1.xml, whose root is a `b:Sources` element, and
 * lists them in its Source Manager. The part's properties, customXml/itemProps1.xml, give it an id and name the schema
 * of its XML, the bibliography's.
 *
 * Reference: ooxml-schemas/ISO-IEC29500-4_2016/shared-bibliography.xsd and shared-customXmlDataProperties.xsd
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * A document's bibliography, for the document's `bibliography`: the sources its citations and bibliographies refer to.
 * `createBibliography` from `docx/bibliography` writes it.
 *
 * @publicApi
 */
export type DocumentBibliography = {
    /**
     * The document's sources, as Word keeps them: a `b:Sources` element in the bibliography's namespace, with the style
     * the citations and bibliographies are written in. It is written after the document's body
     */
    readonly sources: XmlComponent;
};

/**
 * The properties of the part that a document's sources are in (customXml/itemProps1.xml): its id, and the schema of its
 * XML, the bibliography's.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_DatastoreItem">
 *   <xsd:sequence>
 *     <xsd:element name="schemaRefs" type="CT_DatastoreSchemaRefs" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="itemID" type="s:ST_Guid" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @param itemId - The part's id, a GUID in braces, such as "{6E3A1B2C-4D5E-4F60-8A7B-9C0D1E2F3A4B}"
 */
export const createSourcesProperties = (itemId: string): XmlComponent =>
    new BuilderElement<{ readonly itemId: string; readonly namespace: string }>({
        name: "ds:datastoreItem",
        attributes: {
            itemId: { key: "ds:itemID", value: itemId },
            namespace: { key: "xmlns:ds", value: "http://schemas.openxmlformats.org/officeDocument/2006/customXml" },
        },
        children: [
            new BuilderElement({
                name: "ds:schemaRefs",
                children: [
                    new BuilderElement<{ readonly uri: string }>({
                        name: "ds:schemaRef",
                        attributes: { uri: { key: "ds:uri", value: "http://schemas.openxmlformats.org/officeDocument/2006/bibliography" } },
                    }),
                ],
            }),
        ],
    });
