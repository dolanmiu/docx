import { XmlAttributeComponent } from "../../../file/xml-components";
export declare class ExtentAttributes extends XmlAttributeComponent<{
    readonly cx?: number;
    readonly cy?: number;
}> {
    protected readonly xmlKeys: {
        cx: string;
        cy: string;
    };
}
