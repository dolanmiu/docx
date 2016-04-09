import {XmlComponent} from "../../docx/xml-components";

interface StyleAttributesProperties {
    type?: string;
    styleId?: string;
    default?: string;
    customStyle?: string;
}

export class StyleAttributes extends XmlComponent {
    private _attr: Object;

    xmlKeys = {
        type: "w:type",
        styleId: "w:styleId",
        default: "w:default",
        customStyle: "w:customStyle"
    };

    constructor(properties?: StyleAttributesProperties) {
        super("_attr");
        this._attr = properties

        if (!properties) {
            this._attr = {};
        }
        this._attr["xmlKeys"] = this.xmlKeys;
    }
}