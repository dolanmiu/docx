/**
 * Non-visual drawing properties module.
 *
 * This module provides basic metadata for drawing elements including
 * ID, name, description, and hyperlink support.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { ConcreteHyperlink } from "@file/paragraph";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { NonVisualPropertiesAttributes } from "./non-visual-properties-attributes";

/**
 * Represents non-visual drawing properties for pictures.
 *
 * This element specifies non-visual properties for a DrawingML object.
 * These include identification, naming, description, and hyperlink properties.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NonVisualDrawingProps">
 *   <xsd:sequence>
 *     <xsd:element name="hlinkClick" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="hlinkHover" type="CT_Hyperlink" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="id" type="ST_DrawingElementId" use="required"/>
 *   <xsd:attribute name="name" type="xsd:string" use="required"/>
 *   <xsd:attribute name="descr" type="xsd:string" use="optional" default=""/>
 *   <xsd:attribute name="hidden" type="xsd:boolean" use="optional" default="false"/>
 *   <xsd:attribute name="title" type="xsd:string" use="optional" default=""/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const cNvPr = new NonVisualProperties();
 * ```
 */
export class NonVisualProperties extends XmlComponent {
    public constructor() {
        super("pic:cNvPr");

        this.root.push(
            new NonVisualPropertiesAttributes({
                id: 0,
                name: "",
                descr: "",
            }),
        );
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        for (let i = context.stack.length - 1; i >= 0; i--) {
            const element = context.stack[i];
            if (!(element instanceof ConcreteHyperlink)) {
                continue;
            }

            // The hyperlink picks the relationship, as its own may be missing the fragment it moved to its anchor
            this.root.push(element.createDrawingClick(context, false));

            break;
        }

        const result = super.prepForXml(context);
        // Keep only the attributes, so the element is the same if the document is written again
        this.root.splice(1);
        return result;
    }
}
