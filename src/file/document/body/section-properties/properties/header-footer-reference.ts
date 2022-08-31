import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_HdrFtr">
// <xsd:restriction base="xsd:string">
//   <xsd:enumeration value="even"/>
//   <xsd:enumeration value="default"/>
//   <xsd:enumeration value="first"/>
// </xsd:restriction>
// </xsd:simpleType>
export enum HeaderFooterReferenceType {
    DEFAULT = "default",
    FIRST = "first",
    EVEN = "even",
}

// </xsd:complexType>
// <xsd:group name="EG_HdrFtrReferences">
// <xsd:choice>
//   <xsd:element name="headerReference" type="CT_HdrFtrRef" minOccurs="0"/>
//   <xsd:element name="footerReference" type="CT_HdrFtrRef" minOccurs="0"/>
// </xsd:choice>
// </xsd:group>

// <xsd:complexType name="CT_HdrFtrRef">
// <xsd:complexContent>
//   <xsd:extension base="CT_Rel">
//     <xsd:attribute name="type" type="ST_HdrFtr" use="required"/>
//   </xsd:extension>
// </xsd:complexContent>

// <xsd:complexType name="CT_Rel">
//   <xsd:attribute ref="r:id" use="required"/>
// </xsd:complexType>

export interface IHeaderFooterOptions {
    readonly type?: HeaderFooterReferenceType;
    readonly id?: number;
}

class FooterReferenceAttributes extends XmlAttributeComponent<{
    readonly type: HeaderFooterReferenceType;
    readonly id: string;
}> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}

export enum HeaderFooterType {
    HEADER = "w:headerReference",
    FOOTER = "w:footerReference",
}
export class HeaderFooterReference extends XmlComponent {
    public constructor(type: HeaderFooterType, options: IHeaderFooterOptions) {
        super(type);

        this.root.push(
            new FooterReferenceAttributes({
                type: options.type || HeaderFooterReferenceType.DEFAULT,
                id: `rId${options.id}`,
            }),
        );
    }
}
