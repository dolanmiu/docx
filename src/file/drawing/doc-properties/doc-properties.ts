/**
 * Document Properties module for DrawingML elements.
 *
 * This module provides non-visual properties for drawing elements,
 * including name, description, and accessibility information.
 *
 * Reference: https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_docPr_topic_ID0ES32OB.html
 *
 * @module
 */
import { ConcreteHyperlink } from "@file/paragraph";
import { IContext, IXmlableObject, NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { docPropertiesUniqueNumericIdGen } from "@util/convenience-functions";

import { createHyperlinkClick } from "./doc-properties-children";

// <complexType name="CT_NonVisualDrawingProps">
//     <sequence>
//         <element name="hlinkClick" type="CT_Hyperlink" minOccurs="0" maxOccurs="1" />
//         <element name="hlinkHover" type="CT_Hyperlink" minOccurs="0" maxOccurs="1" />
//         <element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1" />
//     </sequence>
//     <attribute name="id" type="ST_DrawingElementId" use="required" />
//     <attribute name="name" type="xsd:string" use="required" />
//     <attribute name="descr" type="xsd:string" use="optional" default="" />
//     <attribute name="hidden" type="xsd:boolean" use="optional" default="false" />
// </complexType>

/**
 * Options for configuring document properties of a drawing.
 *
 * @see {@link DocProperties}
 */
export type DocPropertiesOptions = {
    /** Name of the drawing element (used for identification) */
    readonly name: string;
    /** Description/alt text for accessibility */
    readonly description?: string;
    /** Title of the drawing element */
    readonly title?: string;
    readonly id?: string;
};

/**
 * Represents non-visual drawing properties in a WordprocessingML document.
 *
 * DocProperties contains metadata about a drawing element such as
 * its name, description (alt text), and title for accessibility.
 *
 * Reference: https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_docPr_topic_ID0ES32OB.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NonVisualDrawingProps">
 *   <xsd:sequence>
 *     <xsd:element name="hlinkClick" type="CT_Hyperlink" minOccurs="0"/>
 *     <xsd:element name="hlinkHover" type="CT_Hyperlink" minOccurs="0"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="id" type="ST_DrawingElementId" use="required"/>
 *   <xsd:attribute name="name" type="xsd:string" use="required"/>
 *   <xsd:attribute name="descr" type="xsd:string"/>
 *   <xsd:attribute name="hidden" type="xsd:boolean"/>
 * </xsd:complexType>
 * ```
 */
export class DocProperties extends XmlComponent {
    private readonly docPropertiesUniqueNumericId = docPropertiesUniqueNumericIdGen();

    public constructor({ name, description, title, id }: DocPropertiesOptions = { name: "", description: "", title: "" }) {
        super("wp:docPr");

        const attributes: Record<string, { readonly key: string; readonly value: string | number }> = {
            id: {
                key: "id",
                value: id ?? this.docPropertiesUniqueNumericId(),
            },
            name: {
                key: "name",
                value: name,
            },
        };

        if (description !== null && description !== undefined) {
            attributes.description = {
                key: "descr",
                value: description,
            };
        }

        if (title !== null && title !== undefined) {
            attributes.title = {
                key: "title",
                value: title,
            };
        }

        this.root.push(new NextAttributeComponent(attributes));
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        for (let i = context.stack.length - 1; i >= 0; i--) {
            const element = context.stack[i];
            if (!(element instanceof ConcreteHyperlink)) {
                continue;
            }

            this.root.push(createHyperlinkClick(element.linkId, true));
            break;
        }

        return super.prepForXml(context);
    }
}
