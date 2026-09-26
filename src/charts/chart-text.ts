/**
 * Titles of charts and axes (`c:title`).
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createElement, createText, createValue } from "./chart-elements";
import { createBodyProperties, createNoShapeProperties, createParagraphProperties, createTextProperties } from "./chart-style";

type TitleOptions = {
    /** Size in points */
    readonly size: number;
    /** Rotation in 60,000ths of a degree */
    readonly rotation?: number;
    /** Letter spacing of 0, which Office writes on a chart's title */
    readonly spacing?: boolean;
};

/**
 * A title, as Office writes a chart's or an axis' title: its text, not over the plot, with no fill or line. Each line of
 * the text is a paragraph.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Title">
 *   <xsd:sequence>
 *     <xsd:element name="tx" type="CT_Tx" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="overlay" type="CT_Boolean" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="txPr" type="a:CT_TextBody" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createTitle = (text: string, options: TitleOptions): XmlComponent =>
    createElement("c:title", {}, [
        createElement("c:tx", {}, [
            createElement("c:rich", {}, [
                createBodyProperties({ rotation: options.rotation ?? 0 }),
                createElement("a:lstStyle"),
                ...text
                    .split("\n")
                    .map((line) =>
                        createElement("a:p", {}, [
                            createParagraphProperties(options),
                            createElement("a:r", {}, [createElement("a:rPr", { lang: "en-US" }), createText("a:t", line)]),
                        ]),
                    ),
            ]),
        ]),
        createValue("c:overlay", false),
        createNoShapeProperties(),
        createTextProperties({ ...options, rotation: options.rotation ?? 0 }),
    ]);

/**
 * A chart's title, in 14 point text above the plot.
 */
export const createChartTitle = (text: string): XmlComponent => createTitle(text, { size: 14, spacing: true });

/**
 * An axis' title, in 10 point text. A vertical axis' title reads from bottom to top.
 */
export const createAxisTitle = (text: string, vertical: boolean): XmlComponent =>
    createTitle(text, { size: 10, rotation: vertical ? -5400000 : 0 });
