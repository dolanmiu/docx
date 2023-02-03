// https://c-rex.net/projects/samples/ooxml/e1/Part4/OOXML_P4_DOCX_docPr_topic_ID0ES32OB.html
import { IContext, IXmlableObject, NextAttributeComponent, XmlComponent } from "@file/xml-components";
import { ConcreteHyperlink } from "@file/paragraph";

import { uniqueNumericId } from "@util/convenience-functions";

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

export interface DocPropertiesOptions {
    readonly name: string;
    readonly description: string;
    readonly title: string;
}

export class DocProperties extends XmlComponent {
    public constructor({ name, description, title }: DocPropertiesOptions = { name: "", description: "", title: "" }) {
        super("wp:docPr");

        this.root.push(
            new NextAttributeComponent({
                id: {
                    key: "id",
                    value: uniqueNumericId(),
                },
                name: {
                    key: "name",
                    value: name,
                },
                description: {
                    key: "descr",
                    value: description,
                },
                title: {
                    key: "title",
                    value: title,
                },
            }),
        );
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
