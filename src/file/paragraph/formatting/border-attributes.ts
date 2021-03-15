import { XmlAttributeComponent } from "file/xml-components";

export class BorderAttributes extends XmlAttributeComponent<{
    readonly color: string;
    readonly space: number;
    readonly val: string;
    readonly sz: number;
}> {
    protected readonly xmlKeys = {
        val: "w:val",
        color: "w:color",
        space: "w:space",
        sz: "w:sz",
    };
}
