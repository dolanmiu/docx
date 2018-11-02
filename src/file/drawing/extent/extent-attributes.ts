import { XmlAttributeComponent } from "file/xml-components";

export interface IExtentAttributes {
    readonly cx?: number;
    readonly cy?: number;
}

export class ExtentAttributes extends XmlAttributeComponent<IExtentAttributes> {
    protected readonly xmlKeys = {
        cx: "cx",
        cy: "cy",
    };
}
