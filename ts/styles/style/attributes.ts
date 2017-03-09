import { XmlAttributeComponent, XmlComponent } from "../../docx/xml-components";

interface IStyleAttributesProperties {
    type?: string;
    styleId?: string;
    default?: string;
    customStyle?: string;
    val?: string;
}

export class StyleAttributes extends XmlAttributeComponent {
    private _attr: IStyleAttributesProperties;

    constructor(properties: IStyleAttributesProperties) {
        super({
            type: "w:type",
            styleId: "w:styleId",
            default: "w:default",
            customStyle: "w:customStyle",
            val: "w:val",
        }, properties);
    }
}
