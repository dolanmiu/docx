import { XmlAttributeComponent } from "file/xml-components";

export interface IExtentAttributes {
    cx?: number;
    cy?: number;
}

export class ExtentAttributes extends XmlAttributeComponent<IExtentAttributes> {
    protected xmlKeys = {
        cx: "cx",
        cy: "cy",
    };
}
