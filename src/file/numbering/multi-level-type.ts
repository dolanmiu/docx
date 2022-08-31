import { Attributes, XmlComponent } from "@file/xml-components";

// <xsd:complexType name="CT_AbstractNum">
//     ...
//     <xsd:element name="multiLevelType" type="CT_MultiLevelType" minOccurs="0"/>

//         <xsd:complexType name="CT_MultiLevelType">
//             <xsd:attribute name="val" type="ST_MultiLevelType" use="required"/>
//         </xsd:complexType>
//             <xsd:simpleType name="ST_MultiLevelType">
//                 <xsd:restriction base="xsd:string">
//                     <xsd:enumeration value="singleLevel"/>
//                     <xsd:enumeration value="multilevel"/>
//                     <xsd:enumeration value="hybridMultilevel"/>
//                 </xsd:restriction>
//             </xsd:simpleType>
export class MultiLevelType extends XmlComponent {
    public constructor(value: string) {
        super("w:multiLevelType");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}
