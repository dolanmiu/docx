import { XmlAttributeComponent } from "file/xml-components";

export interface IExtentsAttributes {
    readonly cx?: number;
    readonly cy?: number;
}

export class ExtentsAttributes extends XmlAttributeComponent<IExtentsAttributes> {
    protected readonly xmlKeys = {
        cx: "cx",
        cy: "cy",
    };
}
