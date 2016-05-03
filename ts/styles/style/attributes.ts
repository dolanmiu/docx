import {XmlComponent} from "../../docx/xml-components";
import {XmlAttributeComponent} from "../../docx/xml-components";

interface StyleAttributesProperties {
    type?: string;
    styleId?: string;
    default?: string;
    customStyle?: string;
    val?: string;
}

export class StyleAttributes extends XmlAttributeComponent {
    private _attr: Object;

    constructor(properties?: StyleAttributesProperties) {
        super({
            type: "w:type",
            styleId: "w:styleId",
            default: "w:default",
            customStyle: "w:customStyle",
            val: "w:val"
        });
        
        this.root = properties;

        if (!properties) {
            this.root = {};
        }
    }
}