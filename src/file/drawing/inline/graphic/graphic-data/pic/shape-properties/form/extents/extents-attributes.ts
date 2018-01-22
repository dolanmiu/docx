import { XmlAttributeComponent } from "file/xml-components";

export interface IExtentsAttributes {
    cx?: number;
    cy?: number;
}

export class ExtentsAttributes extends XmlAttributeComponent<IExtentsAttributes> {
    protected xmlKeys = {
        cx: "cx",
        cy: "cy",
    };
}
