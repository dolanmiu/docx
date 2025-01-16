import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * This simple type specifies the possible types of headers and footers which may be specified for a given header or footer reference in a document. This value determines the page(s) on which the current header or footer shall be displayed.
 *
 * Reference: https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_ST_HdrFtr_topic_ID0E2UW2.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_HdrFtr">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="even"/>
 *     <xsd:enumeration value="default"/>
 *     <xsd:enumeration value="first"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export const HeaderFooterReferenceType = {
    /** Specifies that this header or footer shall appear on every page in this section which is not overridden with a specific `even` or `first` page header/footer. In a section with all three types specified, this type shall be used on all odd numbered pages (counting from the `first` page in the section, not the section numbering). */
    DEFAULT: "default",
    /** Specifies that this header or footer shall appear on the first page in this section. The appearance of this header or footer is contingent on the setting of the `titlePg` element (§2.10.6). */
    FIRST: "first",
    /** Specifies that this header or footer shall appear on all even numbered pages in this section (counting from the first page in the section, not the section numbering). The appearance of this header or footer is contingent on the setting of the `evenAndOddHeaders` element (§2.10.1). */
    EVEN: "even",
} as const;

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

export type IHeaderFooterOptions = {
    readonly type?: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType];
    readonly id?: number;
};

class FooterReferenceAttributes extends XmlAttributeComponent<{
    readonly type: (typeof HeaderFooterReferenceType)[keyof typeof HeaderFooterReferenceType];
    readonly id: string;
}> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "r:id",
    };
}

export const HeaderFooterType = {
    HEADER: "w:headerReference",
    FOOTER: "w:footerReference",
} as const;

export class HeaderFooterReference extends XmlComponent {
    public constructor(type: (typeof HeaderFooterType)[keyof typeof HeaderFooterType], options: IHeaderFooterOptions) {
        super(type);

        this.root.push(
            new FooterReferenceAttributes({
                type: options.type || HeaderFooterReferenceType.DEFAULT,
                id: `rId${options.id}`,
            }),
        );
    }
}
