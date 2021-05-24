// Runtime checks and cleanup for value types in the spec that aren't easily expressed through our type system.
// These will help us to prevent silent failures and corrupted documents.

// <xsd:simpleType name="ST_DecimalNumber">
//     <xsd:restriction base="xsd:integer"/>
// </xsd:simpleType>
export function decimalNumber(val: number): number {
    if (isNaN(val)) {
        throw new Error(`Invalid value '${val}' specified. Must be an integer.`);
    }
    return Math.floor(val);
}

// <xsd:simpleType name="ST_UnsignedDecimalNumber">
//     <xsd:restriction base="xsd:unsignedLong"/>
// </xsd:simpleType>
export function unsignedDecimalNumber(val: number): number {
    const value = decimalNumber(val);
    if (value < 0) {
        throw new Error(`Invalid value '${val}' specified. Must be a positive integer.`);
    }
    return value;
}

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
    return `${Number(amount)}${unit}`;
}
const universalMeasureUnits = ["mm", "cm", "in", "pt", "pc", "pi"];

// <xsd:simpleType name="ST_PositiveUniversalMeasure">
//     <xsd:restriction base="ST_UniversalMeasure">
//         <xsd:pattern value="[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)"/>
//     </xsd:restriction>
// </xsd:simpleType>
export function positiveUniversalMeasureValue(val: string): string {
    const value = universalMeasureValue(val);
    if (parseFloat(value) < 0) {
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

// <xsd:simpleType name="ST_SignedTwipsMeasure">
//     <xsd:union memberTypes="xsd:integer s:ST_UniversalMeasure"/>
// </xsd:simpleType>
export function signedTwipsMeasureValue(val: string | number): string | number {
    return typeof val === "string" ? universalMeasureValue(val) : decimalNumber(val);
}

// <xsd:simpleType name="ST_HpsMeasure">
//     <xsd:union memberTypes="s:ST_UnsignedDecimalNumber s:ST_PositiveUniversalMeasure"/>
// </xsd:simpleType>
export function hpsMeasureValue(val: string | number): string | number {
    return typeof val === "string" ? positiveUniversalMeasureValue(val) : unsignedDecimalNumber(val);
}

// <xsd:simpleType name="ST_TwipsMeasure">
//     <xsd:union memberTypes="ST_UnsignedDecimalNumber ST_PositiveUniversalMeasure"/>
// </xsd:simpleType>
export function twipsMeasureValue(val: string | number): string | number {
    return typeof val === "string" ? positiveUniversalMeasureValue(val) : unsignedDecimalNumber(val);
}

// <xsd:simpleType name="ST_Percentage">
//     <xsd:restriction base="xsd:string">
//         <xsd:pattern value="-?[0-9]+(\.[0-9]+)?%"/>
//     </xsd:restriction>
// </xsd:simpleType>
export function percentageValue(val: string): string {
    if (val.slice(-1) !== "%") {
        throw new Error(`Invalid value '${val}'. Expected percentage value (eg '55%')`);
    }
    const percent = val.substring(0, val.length - 1);
    if (isNaN(Number(percent))) {
        throw new Error(`Invalid value '${percent}' specified. Expected a valid number.`);
    }
    return `${Number(percent)}%`;
}

// <xsd:simpleType name="ST_MeasurementOrPercent">
//     <xsd:union memberTypes="ST_DecimalNumberOrPercent s:ST_UniversalMeasure"/>
// </xsd:simpleType>

// <xsd:simpleType name="ST_DecimalNumberOrPercent">
//     <xsd:union memberTypes="ST_UnqualifiedPercentage s:ST_Percentage"/>
// </xsd:simpleType>

// <xsd:simpleType name="ST_UnqualifiedPercentage">
//     <xsd:restriction base="xsd:integer"/>
// </xsd:simpleType>

export function measurementOrPercentValue(val: number | string): number | string {
    return typeof val === "number" ? decimalNumber(val) : percentageValue(val);
}

// <xsd:simpleType name="ST_EighthPointMeasure">
//     <xsd:restriction base="s:ST_UnsignedDecimalNumber"/>
// </xsd:simpleType>
export const eighthPointMeasureValue = unsignedDecimalNumber;

// <xsd:simpleType name="ST_PointMeasure">
//     <xsd:restriction base="s:ST_UnsignedDecimalNumber"/>
// </xsd:simpleType>
export const pointMeasureValue = unsignedDecimalNumber;
