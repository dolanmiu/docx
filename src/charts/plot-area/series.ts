/**
 * The parts every series has (`EG_SerShared`), and the references to its data in the sheet, with their caches.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import type { ChartNumberData, ChartSeriesData, ChartTextData } from "../chart-data";
import { createElement, createText, createValue } from "../chart-elements";

/**
 * A number as the chart's caches and the sheet's cells write it: JavaScript's shortest form that reads back as the same
 * number.
 */
export const formatNumber = (value: number): string => String(value);

/**
 * A reference to text (`c:strRef`) with its cache (`c:strCache`), from which applications draw the chart without
 * opening the workbook.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_StrRef">
 *   <xsd:sequence>
 *     <xsd:element name="f" type="xsd:string" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="strCache" type="CT_StrData" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createTextReference = ({ formula, points }: ChartTextData): XmlComponent =>
    createElement("c:strRef", {}, [
        createText("c:f", formula),
        createElement("c:strCache", {}, [
            createValue("c:ptCount", points.length),
            ...points.map((point, index) => createElement("c:pt", { idx: index }, [createText("c:v", point)])),
        ]),
    ]);

/**
 * A reference to numbers (`c:numRef`) with its cache (`c:numCache`). The cache leaves out empty cells, so they are gaps,
 * and counts every cell.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_NumRef">
 *   <xsd:sequence>
 *     <xsd:element name="f" type="xsd:string" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="numCache" type="CT_NumData" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
const createNumberReference = ({ formula, points }: ChartNumberData): XmlComponent =>
    createElement("c:numRef", {}, [
        createText("c:f", formula),
        createElement("c:numCache", {}, [
            createText("c:formatCode", "General"),
            createValue("c:ptCount", points.length),
            ...points.flatMap((point, index) =>
                point === undefined ? [] : [createElement("c:pt", { idx: index }, [createText("c:v", formatNumber(point))])],
            ),
        ]),
    ]);

/**
 * A series' data (`c:cat`, `c:val`, `c:xVal` or `c:yVal`): a reference to text or numbers.
 */
export const createDataSource = (name: string, data: ChartTextData | ChartNumberData): XmlComponent =>
    createElement(name, {}, [data.type === "text" ? createTextReference(data) : createNumberReference(data)]);

/**
 * The start of a series (`c:ser`): its index and order, both unique in the chart, and its name (`c:tx`).
 *
 * ## XSD Schema
 * ```xml
 * <xsd:group name="EG_SerShared">
 *   <xsd:sequence>
 *     <xsd:element name="idx" type="CT_UnsignedInt" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="order" type="CT_UnsignedInt" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="tx" type="CT_SerTx" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:group>
 * ```
 */
export const createSeriesStart = (index: number, data: ChartSeriesData): readonly XmlComponent[] => [
    createValue("c:idx", index),
    createValue("c:order", index),
    createElement("c:tx", {}, [createTextReference(data.name)]),
];

/**
 * A series' categories and values (`c:cat` and `c:val`).
 */
export const createCategoriesAndValues = (data: ChartSeriesData): readonly XmlComponent[] => [
    createDataSource("c:cat", data.categories),
    createDataSource("c:val", data.values),
];
