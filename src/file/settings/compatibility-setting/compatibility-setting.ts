import { BuilderElement, XmlComponent } from "@file/xml-components";

// Currently, this is hard-coded for Microsoft word compatSettings.
// Theoretically, we could add compatSettings for other programs, but
// currently there isn't a need.

// <xsd:complexType name="CT_CompatSetting">
//     <xsd:attribute name="name" type="s:ST_String"/>
//     <xsd:attribute name="uri" type="s:ST_String"/>
//     <xsd:attribute name="val" type="s:ST_String"/>
// </xsd:complexType>

type ICompatibilitySettingAttributes = {
    readonly version: number;
    readonly name: string;
    readonly uri: string;
};

// https://docs.microsoft.com/en-us/openspecs/office_standards/ms-docx/90138c4d-eb18-4edc-aa6c-dfb799cb1d0d

export const createCompatibilitySetting = (version: number): XmlComponent =>
    new BuilderElement<ICompatibilitySettingAttributes>({
        name: "w:compatSetting",
        attributes: {
            version: { key: "w:val", value: version },
            name: { key: "w:name", value: "compatibilityMode" },
            uri: { key: "w:uri", value: "http://schemas.microsoft.com/office/word" },
        },
    });
