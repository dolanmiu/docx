import { XmlAttributeComponent } from "../../file/xml-components";
export declare class CustomPropertiesAttributes extends XmlAttributeComponent<{
    readonly xmlns: string;
    readonly vt: string;
}> {
    protected readonly xmlKeys: {
        xmlns: string;
        vt: string;
    };
}
