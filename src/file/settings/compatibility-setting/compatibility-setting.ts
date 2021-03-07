import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class CompatibilitySettingAttributes extends XmlAttributeComponent<{
    readonly version: number;
    readonly name: string;
    readonly uri: string;
}> {
    protected readonly xmlKeys = {
        version: "w:val",
        name: "w:name",
        uri: "w:uri",
    };
}

export class CompatibilitySetting extends XmlComponent {
    constructor(version: number) {
        super("w:compatSetting");

        this.root.push(
            new CompatibilitySettingAttributes({
                version,
                uri: "http://schemas.microsoft.com/office/word",
                name: "compatibilityMode",
            }),
        );
    }
}
