// http://officeopenxml.com/WPalignment.php
// http://officeopenxml.com/WPtableAlignment.php
// http://www.datypic.com/sc/ooxml/t-w_ST_Jc.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

// <xsd:simpleType name="ST_Jc">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="start"/>
//         <xsd:enumeration value="center"/>
//         <xsd:enumeration value="end"/>
//         <xsd:enumeration value="both"/>
//         <xsd:enumeration value="mediumKashida"/>
//         <xsd:enumeration value="distribute"/>
//         <xsd:enumeration value="numTab"/>
//         <xsd:enumeration value="highKashida"/>
//         <xsd:enumeration value="lowKashida"/>
//         <xsd:enumeration value="thaiDistribute"/>
//         <xsd:enumeration value="left"/>
//         <xsd:enumeration value="right"/>
//     </xsd:restriction>
// </xsd:simpleType>
export enum AlignmentType {
    /** Align Start */
    START = "start",
    /** Align Center */
    CENTER = "center",
    /** End */
    END = "end",
    /** Justified */
    BOTH = "both",
    /** Medium Kashida Length */
    MEDIUM_KASHIDA = "mediumKashida",
    /** Distribute All Characters Equally */
    DISTRIBUTE = "distribute",
    /** Align to List Tab */
    NUM_TAB = "numTab",
    /** Widest Kashida Length */
    HIGH_KASHIDA = "highKashida",
    /** Low Kashida Length */
    LOW_KASHIDA = "lowKashida",
    /** Thai Language Justification */
    THAI_DISTRIBUTE = "thaiDistribute",
    /** Align Left */
    LEFT = "left",
    /** Align Right */
    RIGHT = "right",
    /** Justified */
    JUSTIFIED = "both",
}

export class AlignmentAttributes extends XmlAttributeComponent<{ readonly val: AlignmentType }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class Alignment extends XmlComponent {
    public constructor(type: AlignmentType) {
        super("w:jc");
        this.root.push(new AlignmentAttributes({ val: type }));
    }
}
