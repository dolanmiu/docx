import { BaseXmlComponent, XmlComponent } from "file/xml-components";
import { DocumentDefaults } from "./defaults";
import { ParagraphStyle } from "./style";
export declare class Styles extends XmlComponent {
    constructor(initialStyles?: BaseXmlComponent);
    push(style: XmlComponent): Styles;
    createDocumentDefaults(): DocumentDefaults;
    createParagraphStyle(styleId: string, name?: string): ParagraphStyle;
}
