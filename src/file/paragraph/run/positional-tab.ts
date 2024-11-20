import { NextAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_PTabAlignment">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="left" />
//         <xsd:enumeration value="center" />
//         <xsd:enumeration value="right" />
//     </xsd:restriction>
// </xsd:simpleType>
export const PositionalTabAlignment = {
    LEFT: "left",
    CENTER: "center",
    RIGHT: "right",
} as const;

// <xsd:simpleType name="ST_PTabRelativeTo">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="margin" />
//         <xsd:enumeration value="indent" />
//     </xsd:restriction>
// </xsd:simpleType>
export const PositionalTabRelativeTo = {
    MARGIN: "margin",
    INDENT: "indent",
} as const;

// <xsd:simpleType name="ST_PTabLeader">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="none" />
//         <xsd:enumeration value="dot" />
//         <xsd:enumeration value="hyphen" />
//         <xsd:enumeration value="underscore" />
//         <xsd:enumeration value="middleDot" />
//     </xsd:restriction>
// </xsd:simpleType>
export const PositionalTabLeader = {
    NONE: "none",
    DOT: "dot",
    HYPHEN: "hyphen",
    UNDERSCORE: "underscore",
    MIDDLE_DOT: "middleDot",
} as const;

export type PositionalTabOptions = {
    readonly alignment: (typeof PositionalTabAlignment)[keyof typeof PositionalTabAlignment];
    readonly relativeTo: (typeof PositionalTabRelativeTo)[keyof typeof PositionalTabRelativeTo];
    readonly leader: (typeof PositionalTabLeader)[keyof typeof PositionalTabLeader];
};

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
                readonly alignment: (typeof PositionalTabAlignment)[keyof typeof PositionalTabAlignment];
                readonly relativeTo: (typeof PositionalTabRelativeTo)[keyof typeof PositionalTabRelativeTo];
                readonly leader: (typeof PositionalTabLeader)[keyof typeof PositionalTabLeader];
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
