import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { twipsMeasureValue } from "@util/values";

// <xsd:complexType name="CT_Height">
//     <xsd:attribute name="val" type="s:ST_TwipsMeasure"/>
//     <xsd:attribute name="hRule" type="ST_HeightRule"/>
// </xsd:complexType>

// <xsd:simpleType name="ST_HeightRule">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="auto"/>
//         <xsd:enumeration value="exact"/>
//         <xsd:enumeration value="atLeast"/>
//     </xsd:restriction>
// </xsd:simpleType>
export enum HeightRule {
    /** Height is determined based on the content, so value is ignored. */
    AUTO = "auto",
    /** At least the value specified */
    ATLEAST = "atLeast",
    /** Exactly the value specified */
    EXACT = "exact",
}

export class TableRowHeightAttributes extends XmlAttributeComponent<{
    readonly value: number | string;
    readonly rule: HeightRule;
}> {
    protected readonly xmlKeys = { value: "w:val", rule: "w:hRule" };
}

export class TableRowHeight extends XmlComponent {
    public constructor(value: number | string, rule: HeightRule) {
        super("w:trHeight");

        this.root.push(
            new TableRowHeightAttributes({
                value: twipsMeasureValue(value),
                rule: rule,
            }),
        );
    }
}
