import { NextAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_PTabAlignment">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="left" />
//         <xsd:enumeration value="center" />
//         <xsd:enumeration value="right" />
//     </xsd:restriction>
// </xsd:simpleType>
export enum PositionalTabAlignment {
    LEFT = "left",
    CENTER = "center",
    RIGHT = "right",
}

// <xsd:simpleType name="ST_PTabRelativeTo">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="margin" />
//         <xsd:enumeration value="indent" />
//     </xsd:restriction>
// </xsd:simpleType>
export enum PositionalTabRelativeTo {
    MARGIN = "margin",
    INDENT = "indent",
}

// <xsd:simpleType name="ST_PTabLeader">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="none" />
//         <xsd:enumeration value="dot" />
//         <xsd:enumeration value="hyphen" />
//         <xsd:enumeration value="underscore" />
//         <xsd:enumeration value="middleDot" />
//     </xsd:restriction>
// </xsd:simpleType>
export enum PositionalTabLeader {
    NONE = "none",
    DOT = "dot",
    HYPHEN = "hyphen",
    UNDERSCORE = "underscore",
    MIDDLE_DOT = "middleDot",
}

export interface PositionalTabOptions {
    readonly alignment: PositionalTabAlignment;
    readonly relativeTo: PositionalTabRelativeTo;
    readonly leader: PositionalTabLeader;
}

// <xsd:complexType name="CT_PTab">
//     <xsd:attribute name="alignment" type="ST_PTabAlignment" use="required" />
//     <xsd:attribute name="relativeTo" type="ST_PTabRelativeTo" use="required" />
//     <xsd:attribute name="leader" type="ST_PTabLeader" use="required" />
// </xsd:complexType>
export class PositionalTab extends XmlComponent {
    public constructor(options: PositionalTabOptions) {
        super("w:ptab");

        this.root.push(
            new NextAttributeComponent<{
                readonly alignment: PositionalTabAlignment;
                readonly relativeTo: PositionalTabRelativeTo;
                readonly leader: PositionalTabLeader;
            }>({
                alignment: {
                    key: "w:alignment",
                    value: options.alignment,
                },
                relativeTo: {
                    key: "w:relativeTo",
                    value: options.relativeTo,
                },
                leader: {
                    key: "w:leader",
                    value: options.leader,
                },
            }),
        );
    }
}
