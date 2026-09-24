/**
 * Format scheme module for DrawingML themes.
 *
 * The fills, lines and effects that shapes styled by the theme use, as Office's theme has them.
 *
 * Reference: http://officeopenxml.com/drwTheme.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

// Changes to a color, such as `lumMod`, each in thousandths of a percent
type ColorChanges = readonly (readonly [string, number])[];

/**
 * The color a style is used with (`phClr`), changed by each of `changes` in turn.
 */
const createStyleColor = (changes: ColorChanges = []): XmlComponent =>
    new BuilderElement<{ readonly value: string }>({
        name: "a:schemeClr",
        attributes: { value: { key: "val", value: "phClr" } },
        children: changes.map(
            ([name, value]) =>
                new BuilderElement<{ readonly value: number }>({ name: `a:${name}`, attributes: { value: { key: "val", value } } }),
        ),
    });

const createSolidFill = (changes?: ColorChanges): XmlComponent =>
    new BuilderElement({ name: "a:solidFill", children: [createStyleColor(changes)] });

/**
 * A gradient from top to bottom, with a stop at the start, the middle and the end.
 */
const createGradientFill = (stops: readonly [ColorChanges, ColorChanges, ColorChanges]): XmlComponent =>
    new BuilderElement<{ readonly rotateWithShape: boolean }>({
        name: "a:gradFill",
        attributes: { rotateWithShape: { key: "rotWithShape", value: true } },
        children: [
            new BuilderElement({
                name: "a:gsLst",
                children: stops.map(
                    (changes, index) =>
                        new BuilderElement<{ readonly position: number }>({
                            name: "a:gs",
                            attributes: { position: { key: "pos", value: index * 50000 } },
                            children: [createStyleColor(changes)],
                        }),
                ),
            }),
            new BuilderElement<{ readonly angle: number; readonly scaled: boolean }>({
                name: "a:lin",
                attributes: { angle: { key: "ang", value: 5400000 }, scaled: { key: "scaled", value: false } },
            }),
        ],
    });

/**
 * A solid line of the given width in EMUs.
 */
const createLine = (width: number): XmlComponent =>
    new BuilderElement<{ readonly width: number; readonly cap: string; readonly compound: string; readonly alignment: string }>({
        name: "a:ln",
        attributes: {
            width: { key: "w", value: width },
            cap: { key: "cap", value: "flat" },
            compound: { key: "cmpd", value: "sng" },
            alignment: { key: "algn", value: "ctr" },
        },
        children: [
            createSolidFill(),
            new BuilderElement<{ readonly value: string }>({ name: "a:prstDash", attributes: { value: { key: "val", value: "solid" } } }),
            new BuilderElement<{ readonly limit: number }>({ name: "a:miter", attributes: { limit: { key: "lim", value: 800000 } } }),
        ],
    });

const createEffectStyle = (effects: readonly XmlComponent[]): XmlComponent =>
    new BuilderElement({ name: "a:effectStyle", children: [new BuilderElement({ name: "a:effectLst", children: effects })] });

// A soft shadow below the shape
const createShadow = (): XmlComponent =>
    new BuilderElement<{
        readonly blurRadius: number;
        readonly distance: number;
        readonly direction: number;
        readonly alignment: string;
        readonly rotateWithShape: boolean;
    }>({
        name: "a:outerShdw",
        attributes: {
            blurRadius: { key: "blurRad", value: 57150 },
            distance: { key: "dist", value: 19050 },
            direction: { key: "dir", value: 5400000 },
            alignment: { key: "algn", value: "ctr" },
            rotateWithShape: { key: "rotWithShape", value: false },
        },
        children: [
            new BuilderElement<{ readonly value: string }>({
                name: "a:srgbClr",
                attributes: { value: { key: "val", value: "000000" } },
                children: [
                    new BuilderElement<{ readonly value: number }>({
                        name: "a:alpha",
                        attributes: { value: { key: "val", value: 63000 } },
                    }),
                ],
            }),
        ],
    });

/**
 * Creates Office's format scheme: from Office 2016 to 2021, the three fills, lines, effects and backgrounds that
 * shapes styled by the theme use, from subtle to intense.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_StyleMatrix">
 *   <xsd:sequence>
 *     <xsd:element name="fillStyleLst" type="CT_FillStyleList" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="lnStyleLst" type="CT_LineStyleList" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="effectStyleLst" type="CT_EffectStyleList" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="bgFillStyleLst" type="CT_BackgroundFillStyleList" minOccurs="1" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="name" type="xsd:string" use="optional" default=""/>
 * </xsd:complexType>
 * ```
 */
/* cspell:disable */
export const createFormatScheme = (): XmlComponent =>
    new BuilderElement<{ readonly name: string }>({
        name: "a:fmtScheme",
        attributes: { name: { key: "name", value: "Office" } },
        children: [
            new BuilderElement({
                name: "a:fillStyleLst",
                children: [
                    createSolidFill(),
                    createGradientFill([
                        [
                            ["lumMod", 110000],
                            ["satMod", 105000],
                            ["tint", 67000],
                        ],
                        [
                            ["lumMod", 105000],
                            ["satMod", 103000],
                            ["tint", 73000],
                        ],
                        [
                            ["lumMod", 105000],
                            ["satMod", 109000],
                            ["tint", 81000],
                        ],
                    ]),
                    createGradientFill([
                        [
                            ["satMod", 103000],
                            ["lumMod", 102000],
                            ["tint", 94000],
                        ],
                        [
                            ["satMod", 110000],
                            ["lumMod", 100000],
                            ["shade", 100000],
                        ],
                        [
                            ["lumMod", 99000],
                            ["satMod", 120000],
                            ["shade", 78000],
                        ],
                    ]),
                ],
            }),
            new BuilderElement({ name: "a:lnStyleLst", children: [createLine(6350), createLine(12700), createLine(19050)] }),
            new BuilderElement({
                name: "a:effectStyleLst",
                children: [createEffectStyle([]), createEffectStyle([]), createEffectStyle([createShadow()])],
            }),
            new BuilderElement({
                name: "a:bgFillStyleLst",
                children: [
                    createSolidFill(),
                    createSolidFill([
                        ["tint", 95000],
                        ["satMod", 170000],
                    ]),
                    createGradientFill([
                        [
                            ["tint", 93000],
                            ["satMod", 150000],
                            ["shade", 98000],
                            ["lumMod", 102000],
                        ],
                        [
                            ["tint", 98000],
                            ["satMod", 130000],
                            ["shade", 90000],
                            ["lumMod", 103000],
                        ],
                        [
                            ["shade", 63000],
                            ["satMod", 120000],
                        ],
                    ]),
                ],
            }),
        ],
    });
/* cspell:enable */
