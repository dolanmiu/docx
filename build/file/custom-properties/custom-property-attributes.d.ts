import { XmlAttributeComponent } from "../../file/xml-components";
export declare class CustomPropertyAttributes extends XmlAttributeComponent<{
    readonly fmtid: string;
    readonly pid: string;
    readonly name: string;
}> {
    protected readonly xmlKeys: {
        fmtid: string;
        pid: string;
        name: string;
    };
}
