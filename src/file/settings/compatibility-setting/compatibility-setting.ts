import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

// Currently, this is hard-coded for Microsoft word compatSettings.
// Theoretically, we could add compatSettings for other programs, but
// currently there isn't a need.

// <xsd:complexType name="CT_CompatSetting">
//     <xsd:attribute name="name" type="s:ST_String"/>
//     <xsd:attribute name="uri" type="s:ST_String"/>
//     <xsd:attribute name="val" type="s:ST_String"/>
// </xsd:complexType>

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

// https://docs.microsoft.com/en-us/openspecs/office_standards/ms-docx/90138c4d-eb18-4edc-aa6c-dfb799cb1d0d

export class CompatibilitySetting extends XmlComponent {
    public constructor(version: number) {
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
