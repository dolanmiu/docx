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
import { createHyperlinkClick } from "@file/drawing/doc-properties/doc-properties-children";
import { ConcreteHyperlink } from "@file/paragraph";
import { IContext, IXmlableObject, XmlComponent } from "@file/xml-components";

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

            this.root.push(createHyperlinkClick(element.linkId, false));

            break;
        }

        return super.prepForXml(context);
    }
}
