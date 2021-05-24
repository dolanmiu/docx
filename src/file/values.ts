// Runtime checks and cleanup for value types in the spec that aren't easily expressed through our type system.
// These will help us to prevent silent failures and corrupted documents.

// <xsd:simpleType name="ST_UniversalMeasure">
//     <xsd:restriction base="xsd:string">
//         <xsd:pattern value="-?[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)"/>
//     </xsd:restriction>
// </xsd:simpleType>
export function universalMeasureValue(val: string): string {
    const unit = val.slice(-2);
    if (!universalMeasureUnits.includes(unit)) {
        throw new Error(`Invalid unit '${unit}' specified. Valid units are ${universalMeasureUnits.join(", ")}`);
    }
    const amount = val.substring(0, val.length - 2);
    if (isNaN(Number(amount))) {
        throw new Error(`Invalid value '${amount}' specified. Expected a valid number.`);
    }
    return val;
}
const universalMeasureUnits = ["mm", "cm", "in", "pt", "pc", "pi"];

// <xsd:simpleType name="ST_PositiveUniversalMeasure">
//     <xsd:restriction base="ST_UniversalMeasure">
//         <xsd:pattern value="[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)"/>
//     </xsd:restriction>
// </xsd:simpleType>
export function positiveUniversalMeasureValue(val: string): string {
    const value = universalMeasureValue(val);
    if (parseInt(value, 10) < 0) {
        throw new Error(`Invalid value '${value}' specified. Expected a positive number.`);
    }
    return value;
}

// <xsd:simpleType name="ST_HexColor">
//     <xsd:union memberTypes="ST_HexColorAuto s:ST_HexColorRGB"/>
// </xsd:simpleType>
//     <xsd:simpleType name="ST_HexColorAuto">
//         <xsd:restriction base="xsd:string">
//             <xsd:enumeration value="auto"/>
//         </xsd:restriction>
//     </xsd:simpleType>

//     The xsd:hexBinary type represents binary data as a sequence of binary octets.
//     It uses hexadecimal encoding, where each binary octet is a two-character hexadecimal number.
//     Lowercase and uppercase letters A through F are permitted. For example, 0FB8 and 0fb8 are two
//     equal xsd:hexBinary representations consisting of two octets.
//     <xsd:simpleType name="ST_HexColorRGB">
//         <xsd:restriction base="xsd:hexBinary">
//             <xsd:length value="3" fixed="true"/>
//         </xsd:restriction>
//     </xsd:simpleType>
export function hexColorValue(val: string): string {
    if (val === "auto") {
        return val;
    }
    // It's super common to see colors prefixed with a pound, but technically invalid here.
    // Most clients work with it, but strip it off anyway for strict compliance.
    const color = val.charAt(0) === "#" ? val.substring(1) : val;
    if (color.length !== 6 || isNaN(Number("0x" + color))) {
        throw new Error(`Invalid color value '${color}'. Expected six digit hex value (eg FF9900)`);
    }
    return color;
}

// <xsd:simpleType name="ST_UnsignedDecimalNumber">
//     <xsd:restriction base="xsd:unsignedLong"/>
// </xsd:simpleType>
export function unsignedDecimalNumber(val: number): number {
    if (isNaN(val) || val < 0) {
        throw new Error(`Invalid value '${val}' specified. Must be a positive base10 integer.`);
    }
    return Math.floor(val);
}

// <xsd:simpleType name="ST_SignedTwipsMeasure">
//     <xsd:union memberTypes="xsd:integer s:ST_UniversalMeasure"/>
// </xsd:simpleType>
export function signedTwipsMeasureValue(val: string | number): string | number {
    if (typeof val === "string") {
        return universalMeasureValue(val);
    }
    if (isNaN(val)) {
        throw new Error(`Invalid value '${val}' specified. Expected a valid number.`);
    }
    return Math.floor(val);
}

// <xsd:simpleType name="ST_HpsMeasure">
//     <xsd:union memberTypes="s:ST_UnsignedDecimalNumber s:ST_PositiveUniversalMeasure"/>
// </xsd:simpleType>
export function hpsMeasureValue(val: string | number): string | number {
    return typeof val === "string" ? positiveUniversalMeasureValue(val) : unsignedDecimalNumber(val);
}
