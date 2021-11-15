import { XmlAttributeComponent, XmlComponent } from "../../../file/xml-components";
export declare class CompatibilitySettingAttributes extends XmlAttributeComponent<{
    readonly version: number;
    readonly name: string;
    readonly uri: string;
}> {
    protected readonly xmlKeys: {
        version: string;
        name: string;
        uri: string;
    };
}
export declare class CompatibilitySetting extends XmlComponent {
    constructor(version: number);
}
