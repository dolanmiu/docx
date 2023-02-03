// Runtime checks and cleanup for value types in the spec that aren't easily expressed through our type system.
// These will help us to prevent silent failures and corrupted documents.
//
// Most of the rest of the types not defined here are either aliases of existing types or enumerations.
// Enumerations should probably just be implemented as enums, with instructions to end-users, without a runtime check.

// <xsd:simpleType name="ST_DecimalNumber">
//     <xsd:restriction base="xsd:integer"/>
// </xsd:simpleType>
export const decimalNumber = (val: number): number => {
    if (isNaN(val)) {
        throw new Error(`Invalid value '${val}' specified. Must be an integer.`);
    }
    return Math.floor(val);
};

// <xsd:simpleType name="ST_UnsignedDecimalNumber">
//     <xsd:restriction base="xsd:unsignedLong"/>
// </xsd:simpleType>
export const unsignedDecimalNumber = (val: number): number => {
    const value = decimalNumber(val);
    if (value < 0) {
        throw new Error(`Invalid value '${val}' specified. Must be a positive integer.`);
    }
    return value;
};

// The xsd:hexBinary type represents binary data as a sequence of binary octets.
// It uses hexadecimal encoding, where each binary octet is a two-character hexadecimal number.
// Lowercase and uppercase letters A through F are permitted. For example, 0FB8 and 0fb8 are two
// equal xsd:hexBinary representations consisting of two octets.
// http://www.datypic.com/sc/xsd/t-xsd_hexBinary.html
const hexBinary = (val: string, length: number): string => {
    const expectedLength = length * 2;
    if (val.length !== expectedLength || isNaN(Number(`0x${val}`))) {
        throw new Error(`Invalid hex value '${val}'. Expected ${expectedLength} digit hex value`);
    }
    return val;
};

// <xsd:simpleType name="ST_LongHexNumber">
//     <xsd:restriction base="xsd:hexBinary">
//         <xsd:length value="4"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const longHexNumber = (val: string): string => hexBinary(val, 4);

// <xsd:simpleType name="ST_ShortHexNumber">
//     <xsd:restriction base="xsd:hexBinary">
//         <xsd:length value="2"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const shortHexNumber = (val: string): string => hexBinary(val, 2);

// <xsd:simpleType name="ST_UcharHexNumber">
//     <xsd:restriction base="xsd:hexBinary">
//         <xsd:length value="1"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const uCharHexNumber = (val: string): string => hexBinary(val, 1);

// <xsd:simpleType name="ST_LongHexNumber">
// <xsd:restriction base="xsd:hexBinary">
//   <xsd:length value="4"/>
// </xsd:restriction>
// </xsd:simpleType>

// <xsd:simpleType name="ST_UniversalMeasure">
//     <xsd:restriction base="xsd:string">
//         <xsd:pattern value="-?[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const universalMeasureValue = (val: string): string => {
    const unit = val.slice(-2);
    if (!universalMeasureUnits.includes(unit)) {
        throw new Error(`Invalid unit '${unit}' specified. Valid units are ${universalMeasureUnits.join(", ")}`);
    }
    const amount = val.substring(0, val.length - 2);
    if (isNaN(Number(amount))) {
        throw new Error(`Invalid value '${amount}' specified. Expected a valid number.`);
    }
    return `${Number(amount)}${unit}`;
};
const universalMeasureUnits = ["mm", "cm", "in", "pt", "pc", "pi"];

// <xsd:simpleType name="ST_PositiveUniversalMeasure">
//     <xsd:restriction base="ST_UniversalMeasure">
//         <xsd:pattern value="[0-9]+(\.[0-9]+)?(mm|cm|in|pt|pc|pi)"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const positiveUniversalMeasureValue = (val: string): string => {
    const value = universalMeasureValue(val);
    if (parseFloat(value) < 0) {
        throw new Error(`Invalid value '${value}' specified. Expected a positive number.`);
    }
    return value;
};

// <xsd:simpleType name="ST_HexColor">
//     <xsd:union memberTypes="ST_HexColorAuto s:ST_HexColorRGB"/>
// </xsd:simpleType>
//     <xsd:simpleType name="ST_HexColorAuto">
//         <xsd:restriction base="xsd:string">
//             <xsd:enumeration value="auto"/>
//         </xsd:restriction>
//     </xsd:simpleType>

//     <xsd:simpleType name="ST_HexColorRGB">
//         <xsd:restriction base="xsd:hexBinary">
//             <xsd:length value="3" fixed="true"/>
//         </xsd:restriction>
//     </xsd:simpleType>
export const hexColorValue = (val: string): string => {
    if (val === "auto") {
        return val;
    }
    // It's super common to see colors prefixed with a pound, but technically invalid here.
    // Most clients work with it, but strip it off anyway for strict compliance.
    const color = val.charAt(0) === "#" ? val.substring(1) : val;
    return hexBinary(color, 3);
};

// <xsd:simpleType name="ST_SignedTwipsMeasure">
//     <xsd:union memberTypes="xsd:integer s:ST_UniversalMeasure"/>
// </xsd:simpleType>
export const signedTwipsMeasureValue = (val: string | number): string | number =>
    typeof val === "string" ? universalMeasureValue(val) : decimalNumber(val);

// <xsd:simpleType name="ST_HpsMeasure">
//     <xsd:union memberTypes="s:ST_UnsignedDecimalNumber s:ST_PositiveUniversalMeasure"/>
// </xsd:simpleType>
export const hpsMeasureValue = (val: string | number): string | number =>
    typeof val === "string" ? positiveUniversalMeasureValue(val) : unsignedDecimalNumber(val);

// <xsd:simpleType name="ST_SignedHpsMeasure">
//     <xsd:union memberTypes="xsd:integer s:ST_UniversalMeasure"/>
// </xsd:simpleType>
export const signedHpsMeasureValue = (val: string | number): string | number =>
    typeof val === "string" ? universalMeasureValue(val) : decimalNumber(val);

// <xsd:simpleType name="ST_TwipsMeasure">
//     <xsd:union memberTypes="ST_UnsignedDecimalNumber ST_PositiveUniversalMeasure"/>
// </xsd:simpleType>
export const twipsMeasureValue = (val: string | number): string | number =>
    typeof val === "string" ? positiveUniversalMeasureValue(val) : unsignedDecimalNumber(val);

// <xsd:simpleType name="ST_Percentage">
//     <xsd:restriction base="xsd:string">
//         <xsd:pattern value="-?[0-9]+(\.[0-9]+)?%"/>
//     </xsd:restriction>
// </xsd:simpleType>
export const percentageValue = (val: string): string => {
    if (val.slice(-1) !== "%") {
        throw new Error(`Invalid value '${val}'. Expected percentage value (eg '55%')`);
    }
    const percent = val.substring(0, val.length - 1);
    if (isNaN(Number(percent))) {
        throw new Error(`Invalid value '${percent}' specified. Expected a valid number.`);
    }
    return `${Number(percent)}%`;
};

// <xsd:simpleType name="ST_MeasurementOrPercent">
//     <xsd:union memberTypes="ST_DecimalNumberOrPercent s:ST_UniversalMeasure"/>
// </xsd:simpleType>

// <xsd:simpleType name="ST_DecimalNumberOrPercent">
//     <xsd:union memberTypes="ST_UnqualifiedPercentage s:ST_Percentage"/>
// </xsd:simpleType>

// <xsd:simpleType name="ST_UnqualifiedPercentage">
//     <xsd:restriction base="xsd:integer"/>
// </xsd:simpleType>

export const measurementOrPercentValue = (val: number | string): number | string => {
    if (typeof val === "number") {
        return decimalNumber(val);
    }
    if (val.slice(-1) === "%") {
        return percentageValue(val);
    }
    return universalMeasureValue(val);
};

// <xsd:simpleType name="ST_EighthPointMeasure">
//     <xsd:restriction base="s:ST_UnsignedDecimalNumber"/>
// </xsd:simpleType>
export const eighthPointMeasureValue = unsignedDecimalNumber;

// <xsd:simpleType name="ST_PointMeasure">
//     <xsd:restriction base="s:ST_UnsignedDecimalNumber"/>
// </xsd:simpleType>
export const pointMeasureValue = unsignedDecimalNumber;

// <xsd:simpleType name="ST_DateTime">
//     <xsd:restriction base="xsd:dateTime"/>
// </xsd:simpleType>
//
// http://www.datypic.com/sc/xsd/t-xsd_dateTime.html
// The type xsd:dateTime represents a specific date and time in the format
/* cspell:disable-next-line */
// CCYY-MM-DDThh:mm:ss.sss, which is a concatenation of the date and time forms,
// separated by a literal letter "T". All of the same rules that apply to the date
// and time types are applicable to xsd:dateTime as well.
//
// An optional time zone expression may be added at the end of the value.
// The letter Z is used to indicate Coordinated Universal Time (UTC). All other time
// zones are represented by their difference from Coordinated Universal Time in the
// format +hh:mm, or -hh:mm. These values may range from -14:00 to 14:00. For example,
// US Eastern Standard Time, which is five hours behind UTC, is represented as -05:00.
// If no time zone value is present, it is considered unknown; it is not assumed to be UTC.
//
// Luckily, js has this format built in already. See:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
export const dateTimeValue = (val: Date): string => val.toISOString();
