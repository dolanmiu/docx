import { XmlAttributeComponent } from "file/xml-components";

export class ColumnsAttributes extends XmlAttributeComponent<{
    readonly space?: number;
    readonly num?: number;
    readonly separate?: boolean;
}> {
    protected readonly xmlKeys = {
        space: "w:space",
        num: "w:num",
        separate: "w:sep",
    };
}
