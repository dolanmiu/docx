import { hexColorValue, signedTwipsMeasureValue } from "file/values";
import { Attributes, XmlComponent } from "file/xml-components";

export { Underline } from "./underline";
export { EmphasisMark } from "./emphasis-mark";
export { SubScript, SuperScript } from "./script";
export { RunFonts, IFontAttributesProperties } from "./run-fonts";

export class Bold extends XmlComponent {
    constructor() {
        super("w:b");
        this.root.push(
            new Attributes({
                val: true,
            }),
        );
    }
}

export class BoldWithExactValue extends XmlComponent {
    constructor(value: string) {
        super("w:b");
        this.root.push(
            new Attributes({
                val: value,
            }),
        );
    }
}

export class BoldComplexScript extends XmlComponent {
    constructor() {
        super("w:bCs");
        this.root.push(
            new Attributes({
                val: true,
            }),
        );
    }
}

export class CharacterSpacing extends XmlComponent {
    constructor(value: number | string) {
        super("w:spacing");
        this.root.push(
            new Attributes({
                val: signedTwipsMeasureValue(value),
            }),
        );
    }
}

// <xsd:complexType name="CT_Color">
//     <xsd:attribute name="val" type="ST_HexColor" use="required"/>
//     <xsd:attribute name="themeColor" type="ST_ThemeColor" use="optional"/>
//     <xsd:attribute name="themeTint" type="ST_UcharHexNumber" use="optional"/>
//     <xsd:attribute name="themeShade" type="ST_UcharHexNumber" use="optional"/>
// </xsd:complexType>
export class Color extends XmlComponent {
    constructor(color: string) {
        super("w:color");
        this.root.push(
            new Attributes({
                val: hexColorValue(color),
            }),
        );
    }
}

// <xsd:simpleType name="ST_HighlightColor">
//     <xsd:restriction base="xsd:string">
//         <xsd:enumeration value="black"/>
//         <xsd:enumeration value="blue"/>
//         <xsd:enumeration value="cyan"/>
//         <xsd:enumeration value="green"/>
//         <xsd:enumeration value="magenta"/>
//         <xsd:enumeration value="red"/>
//         <xsd:enumeration value="yellow"/>
//         <xsd:enumeration value="white"/>
//         <xsd:enumeration value="darkBlue"/>
//         <xsd:enumeration value="darkCyan"/>
//         <xsd:enumeration value="darkGreen"/>
//         <xsd:enumeration value="darkMagenta"/>
//         <xsd:enumeration value="darkRed"/>
//         <xsd:enumeration value="darkYellow"/>
//         <xsd:enumeration value="darkGray"/>
//         <xsd:enumeration value="lightGray"/>
//         <xsd:enumeration value="none"/>
//     </xsd:restriction>
// </xsd:simpleType>
export class Highlight extends XmlComponent {
    constructor(color: string) {
        super("w:highlight");
        this.root.push(
            new Attributes({
                val: color,
            }),
        );
    }
}

export class HighlightComplexScript extends XmlComponent {
    constructor(color: string) {
        super("w:highlightCs");
        this.root.push(
            new Attributes({
                val: color,
            }),
        );
    }
}
