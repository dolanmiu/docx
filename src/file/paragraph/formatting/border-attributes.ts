import { XmlAttributeComponent } from "file/xml-components";

export interface IBorderAttributesProperties {
    readonly color: string;
    readonly space: number;
    readonly val: string;
    readonly sz: number;
}

export class BorderAttributes extends XmlAttributeComponent<IBorderAttributesProperties> {
    protected readonly xmlKeys = {
        val: "w:val",
        color: "w:color",
        space: "w:space",
        sz: "w:sz",
    };
}
