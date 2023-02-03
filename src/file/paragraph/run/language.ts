import { BuilderElement, XmlComponent } from "@file/xml-components";

// <xsd:complexType name="CT_Language">
//   <xsd:attribute name="val" type="s:ST_Lang" use="optional"/>
//   <xsd:attribute name="eastAsia" type="s:ST_Lang" use="optional"/>
//   <xsd:attribute name="bidi" type="s:ST_Lang" use="optional"/>
// </xsd:complexType>
export interface ILanguageOptions {
    readonly value?: string;
    readonly eastAsia?: string;
    readonly bidirectional?: string;
}

export const createLanguageComponent = (options: ILanguageOptions): XmlComponent =>
    new BuilderElement<{
        readonly value?: string;
        readonly eastAsia?: string;
        readonly bidirectional?: string;
    }>({
        name: "w:lang",
        attributes: {
            value: {
                key: "w:val",
                value: options.value,
            },
            eastAsia: {
                key: "w:eastAsia",
                value: options.eastAsia,
            },
            bidirectional: {
                key: "w:bidi",
                value: options.bidirectional,
            },
        },
    });
