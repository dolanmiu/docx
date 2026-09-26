/**
 * Error bars (`c:errBars`): a line from each point of a series, showing how far its value might be off.
 *
 * @module
 */
// cspell:ignore cust
import type { XmlComponent } from "docx";

import type { ChartErrorData } from "../chart-data";
import { createElement, createValue } from "../chart-elements";
import type { ChartErrorBars } from "../chart-options";
import { createErrorBarsProperties } from "../chart-style";
import { createDataSource, formatNumber } from "./series";

// Each type mapped to its OOXML name (`ST_ErrValType`)
const VALUE_TYPES: Readonly<Record<ChartErrorBars["type"], string>> = {
    fixed: "fixedVal",
    percentage: "percentage",
    standardDeviation: "stdDev",
    standardError: "stdErr",
    custom: "cust",
};

/**
 * Which way custom error bars go: the ways their amounts are given.
 */
const customDirectionOf = ({ plus, minus }: ChartErrorData): "both" | "plus" | "minus" => {
    if (plus !== undefined && minus !== undefined) {
        return "both";
    }
    return plus === undefined ? "minus" : "plus";
};

/**
 * Error bars, as Office writes them: in a direction, which is `y` for a chart with categories, whichever way its bars
 * go, as Excel has it, with end caps unless asked not to. A custom one's amounts are references to its cells.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ErrBars">
 *   <xsd:sequence>
 *     <xsd:element name="errDir" type="CT_ErrDir" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="errBarType" type="CT_ErrBarType" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="errValType" type="CT_ErrValType" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="noEndCap" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="plus" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="minus" type="CT_NumDataSource" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="val" type="CT_Double" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param direction - The axis the bars go along
 * @param data - Where custom error bars' amounts are in the sheet
 */
export const createErrorBars = (
    errorBars: ChartErrorBars | undefined,
    direction: "x" | "y",
    data: ChartErrorData | undefined,
): readonly XmlComponent[] => {
    if (errorBars === undefined) {
        return [];
    }
    // A custom one's amounts are always in the sheet
    const custom = errorBars.type === "custom" ? data! : undefined;
    const value = errorBars.type === "standardDeviation" ? (errorBars.value ?? 1) : "value" in errorBars ? errorBars.value : undefined;
    return [
        createElement("c:errBars", {}, [
            createValue("c:errDir", direction),
            createValue("c:errBarType", errorBars.type === "custom" ? customDirectionOf(custom!) : (errorBars.direction ?? "both")),
            createValue("c:errValType", VALUE_TYPES[errorBars.type]),
            createValue("c:noEndCap", !(errorBars.endCaps ?? true)),
            ...(custom?.plus ? [createDataSource("c:plus", custom.plus)] : []),
            ...(custom?.minus ? [createDataSource("c:minus", custom.minus)] : []),
            ...(value === undefined ? [] : [createValue("c:val", formatNumber(value))]),
            createErrorBarsProperties(errorBars.line),
        ]),
    ];
};
