import { XmlAttributeComponent } from "@file/xml-components";

export class CustomPropertyAttributes extends XmlAttributeComponent<{
    readonly fmtid: string;
    readonly pid: string;
    readonly name: string;
}> {
    protected readonly xmlKeys = {
        fmtid: "fmtid",
        pid: "pid",
        name: "name",
    };
}
