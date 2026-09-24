/**
 * Effects for preset shapes: shadows, glow, soft edges and reflection.
 *
 * Reference: ECMA-376 Part 1, 20.1.8.26 effectLst (Effect Container)
 *
 * @module
 */
import type { EffectExtentAttributes } from "@file/drawing/effect-extent/effect-extent";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { createShapeColor } from "./shape-color";
import { percentageValue, pointsToEmus, positiveFixedAngle } from "./shape-units";

/**
 * A shadow cast by a shape, or thrown inside it.
 *
 * @publicApi
 */
export type ShapeShadow = {
    /** A 6-digit hex colour such as `"000000"`. Default is black */
    readonly color?: string;
    /** From 0 (opaque) to 100 (invisible). Default is 60 */
    readonly transparency?: number;
    /** How far the shadow's edge is blurred, in points. Default is 4 */
    readonly blur?: number;
    /** How far the shadow is from the shape, in points. Default is 3 */
    readonly distance?: number;
    /** The direction the shadow falls in, in degrees clockwise from 3 o'clock. Default is 45, down and to the right */
    readonly angle?: number;
};

/**
 * A coloured glow around the outside of a shape.
 *
 * @publicApi
 */
export type ShapeGlow = {
    /** A 6-digit hex colour such as `"FFC000"` */
    readonly color: string;
    /** How far the glow reaches past the shape, in points. Default is 5 */
    readonly size?: number;
    /** From 0 (opaque) to 100 (invisible). Default is 60 */
    readonly transparency?: number;
};

/**
 * A mirror image of a shape below it, fading away from the shape.
 *
 * @publicApi
 */
export type ShapeReflection = {
    /** Transparency where the reflection meets the shape, from 0 (opaque) to 100 (invisible). Default is 50 */
    readonly transparency?: number;
    /** How much of the shape is reflected before the reflection fades out, from 0 to 100 percent. Default is 50 */
    readonly size?: number;
    /** How far the reflection is below the shape, in points. Default is 0 */
    readonly distance?: number;
    /** How much the reflection is blurred, in points. Default is 0.5 */
    readonly blur?: number;
};

/**
 * Visual effects on a shape. Each one is optional, and they can be combined.
 *
 * @publicApi
 */
export type ShapeEffects = {
    /** A shadow behind the shape. `{}` gives Word's "Offset: Bottom Right" shadow */
    readonly shadow?: ShapeShadow;
    /** A shadow inside the shape, as if it were cut out of the page */
    readonly innerShadow?: ShapeShadow;
    /** A coloured glow around the shape */
    readonly glow?: ShapeGlow;
    /** Blurs the shape's edges inwards by this many points */
    readonly softEdges?: number;
    /** A reflection below the shape. `{}` gives a half reflection touching the shape */
    readonly reflection?: ShapeReflection;
};

type ResolvedShadow = {
    readonly color: string;
    readonly transparency: number;
    /** In EMUs */
    readonly blur: number;
    /** In EMUs */
    readonly distance: number;
    /** In degrees */
    readonly angle: number;
};

const resolveShadow = ({ color = "000000", transparency = 60, blur = 4, distance = 3, angle = 45 }: ShapeShadow): ResolvedShadow => ({
    color,
    transparency,
    blur: pointsToEmus(blur, "shadow blur"),
    distance: pointsToEmus(distance, "shadow distance"),
    angle,
});

type ResolvedReflection = {
    readonly transparency: number;
    readonly size: number;
    /** In EMUs */
    readonly distance: number;
    /** In EMUs */
    readonly blur: number;
};

const resolveReflection = ({ transparency = 50, size = 50, distance = 0, blur = 0.5 }: ShapeReflection): ResolvedReflection => ({
    transparency: percentageValue(transparency, "reflection transparency"),
    size: percentageValue(size, "reflection size"),
    distance: pointsToEmus(distance, "reflection distance"),
    blur: pointsToEmus(blur, "reflection blur"),
});

// <xsd:complexType name="CT_GlowEffect">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="rad" type="ST_PositiveCoordinate" use="optional" default="0"/>
// </xsd:complexType>
const createGlow = ({ color, size = 5, transparency = 60 }: ShapeGlow): XmlComponent =>
    new BuilderElement<{ readonly radius: number }>({
        name: "a:glow",
        attributes: {
            radius: { key: "rad", value: pointsToEmus(size, "glow size") },
        },
        children: [createShapeColor(color, transparency)],
    });

// <xsd:complexType name="CT_InnerShadowEffect">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="blurRad" type="ST_PositiveCoordinate" use="optional" default="0"/>
//     <xsd:attribute name="dist" type="ST_PositiveCoordinate" use="optional" default="0"/>
//     <xsd:attribute name="dir" type="ST_PositiveFixedAngle" use="optional" default="0"/>
// </xsd:complexType>
const createInnerShadow = (shadow: ShapeShadow): XmlComponent => {
    const { color, transparency, blur, distance, angle } = resolveShadow(shadow);
    return new BuilderElement<{ readonly blur: number; readonly distance: number; readonly direction: number }>({
        name: "a:innerShdw",
        attributes: {
            blur: { key: "blurRad", value: blur },
            distance: { key: "dist", value: distance },
            direction: { key: "dir", value: positiveFixedAngle(angle) },
        },
        children: [createShapeColor(color, transparency)],
    });
};

// <xsd:complexType name="CT_OuterShadowEffect">
//     <xsd:sequence>
//         <xsd:group ref="EG_ColorChoice" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="blurRad" type="ST_PositiveCoordinate" use="optional" default="0"/>
//     <xsd:attribute name="dist" type="ST_PositiveCoordinate" use="optional" default="0"/>
//     <xsd:attribute name="dir" type="ST_PositiveFixedAngle" use="optional" default="0"/>
//     ...
//     <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional" default="true"/>
// </xsd:complexType>
const createOuterShadow = (shadow: ShapeShadow): XmlComponent => {
    const { color, transparency, blur, distance, angle } = resolveShadow(shadow);
    return new BuilderElement<{
        readonly blur: number;
        readonly distance: number;
        readonly direction: number;
        readonly rotateWithShape: boolean;
    }>({
        name: "a:outerShdw",
        attributes: {
            blur: { key: "blurRad", value: blur },
            distance: { key: "dist", value: distance },
            direction: { key: "dir", value: positiveFixedAngle(angle) },
            // As in Word, the shadow falls the same way on the page when the shape is rotated
            rotateWithShape: { key: "rotWithShape", value: false },
        },
        children: [createShapeColor(color, transparency)],
    });
};

// <xsd:complexType name="CT_ReflectionEffect">
//     <xsd:attribute name="blurRad" type="ST_PositiveCoordinate" use="optional" default="0"/>
//     <xsd:attribute name="stA" type="ST_PositiveFixedPercentage" use="optional" default="100%"/>
//     <xsd:attribute name="stPos" type="ST_PositiveFixedPercentage" use="optional" default="0%"/>
//     <xsd:attribute name="endA" type="ST_PositiveFixedPercentage" use="optional" default="0%"/>
//     <xsd:attribute name="endPos" type="ST_PositiveFixedPercentage" use="optional" default="100%"/>
//     <xsd:attribute name="dist" type="ST_PositiveCoordinate" use="optional" default="0"/>
//     <xsd:attribute name="dir" type="ST_PositiveFixedAngle" use="optional" default="0"/>
//     <xsd:attribute name="fadeDir" type="ST_PositiveFixedAngle" use="optional" default="5400000"/>
//     <xsd:attribute name="sx" type="ST_Percentage" use="optional" default="100%"/>
//     <xsd:attribute name="sy" type="ST_Percentage" use="optional" default="100%"/>
//     ...
//     <xsd:attribute name="algn" type="ST_RectAlignment" use="optional" default="b"/>
//     <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional" default="true"/>
// </xsd:complexType>
const createReflection = (reflection: ShapeReflection): XmlComponent => {
    const { transparency, size, distance, blur } = resolveReflection(reflection);
    return new BuilderElement<{
        readonly blur: number;
        readonly startAlpha: number;
        readonly endAlpha: number;
        readonly endPosition: number;
        readonly distance: number;
        readonly direction: number;
        readonly scaleY: number;
        readonly alignment: string;
        readonly rotateWithShape: boolean;
    }>({
        name: "a:reflection",
        attributes: {
            blur: { key: "blurRad", value: blur },
            // Alpha is opacity in thousandths of a percent. The reflection fades to almost nothing, as Word's presets do
            startAlpha: { key: "stA", value: Math.round((100 - transparency) * 1000) },
            endAlpha: { key: "endA", value: 300 },
            endPosition: { key: "endPos", value: Math.round(size * 1000) },
            distance: { key: "dist", value: distance },
            // Below the shape, and flipped upside down about its bottom edge
            direction: { key: "dir", value: 5400000 },
            scaleY: { key: "sy", value: -100000 },
            alignment: { key: "algn", value: "bl" },
            rotateWithShape: { key: "rotWithShape", value: false },
        },
    });
};

// <xsd:complexType name="CT_SoftEdgesEffect">
//     <xsd:attribute name="rad" type="ST_PositiveCoordinate" use="required"/>
// </xsd:complexType>
const createSoftEdges = (radius: number): XmlComponent =>
    new BuilderElement<{ readonly radius: number }>({
        name: "a:softEdge",
        attributes: {
            radius: { key: "rad", value: pointsToEmus(radius, "soft edges radius") },
        },
    });

/**
 * Creates the `a:effectLst` element for a shape, with its effects in the order the schema requires.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_EffectList">
 *   <xsd:sequence>
 *     <xsd:element name="blur" type="CT_BlurEffect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="fillOverlay" type="CT_FillOverlayEffect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="glow" type="CT_GlowEffect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="innerShdw" type="CT_InnerShadowEffect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="outerShdw" type="CT_OuterShadowEffect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="prstShdw" type="CT_PresetShadowEffect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="reflection" type="CT_ReflectionEffect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="softEdge" type="CT_SoftEdgesEffect" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @throws If a colour, transparency, size or distance is invalid
 */
export const createShapeEffects = ({ shadow, innerShadow, glow, softEdges, reflection }: ShapeEffects): XmlComponent =>
    new BuilderElement({
        name: "a:effectLst",
        children: [
            ...(glow ? [createGlow(glow)] : []),
            ...(innerShadow ? [createInnerShadow(innerShadow)] : []),
            ...(shadow ? [createOuterShadow(shadow)] : []),
            ...(reflection ? [createReflection(reflection)] : []),
            ...(softEdges === undefined ? [] : [createSoftEdges(softEdges)]),
        ],
    });

// A shadow is the shape's outline, moved and blurred
const getShadowOverhang = (shadow: ShapeShadow): EffectExtentAttributes => {
    const { blur, distance, angle } = resolveShadow(shadow);
    const radians = (angle * Math.PI) / 180;
    const dx = distance * Math.cos(radians);
    const dy = distance * Math.sin(radians);
    return {
        top: Math.max(0, blur - dy),
        right: Math.max(0, blur + dx),
        bottom: Math.max(0, blur + dy),
        left: Math.max(0, blur - dx),
    };
};

const getGlowOverhang = ({ size = 5 }: ShapeGlow): EffectExtentAttributes => {
    const radius = pointsToEmus(size, "glow size");
    return { top: radius, right: radius, bottom: radius, left: radius };
};

// A reflection hangs below the shape, as tall as the part of the shape it reflects
const getReflectionOverhang = (reflection: ShapeReflection, height: number): EffectExtentAttributes => {
    const { size, distance, blur } = resolveReflection(reflection);
    return { top: 0, right: 0, bottom: distance + (height * size) / 100 + blur, left: 0 };
};

/**
 * How far, in EMUs, a shape's effects reach past each side of its box.
 * Used for the drawing's `wp:effectExtent` so shadows, glows and reflections are not clipped.
 *
 * Inner shadows and soft edges stay inside the shape, so they don't reach past it.
 *
 * @param width - The shape's width in EMUs
 * @param height - The shape's height in EMUs
 * @param rotation - The shape's clockwise rotation in degrees. A rotated shape's effects are allowed for on every side
 */
export const getShapeEffectsOverhang = (
    { shadow, glow, reflection }: ShapeEffects = {},
    height: number,
    rotation = 0,
): EffectExtentAttributes => {
    const extents: readonly EffectExtentAttributes[] = [
        { top: 0, right: 0, bottom: 0, left: 0 },
        ...(shadow ? [getShadowOverhang(shadow)] : []),
        ...(glow ? [getGlowOverhang(glow)] : []),
        ...(reflection ? [getReflectionOverhang(reflection, height)] : []),
    ];
    const furthest = (side: keyof EffectExtentAttributes): number => Math.ceil(Math.max(...extents.map((extent) => extent[side])));
    const sides = { top: furthest("top"), right: furthest("right"), bottom: furthest("bottom"), left: furthest("left") };
    if (rotation % 360 === 0) {
        return sides;
    }

    const all = Math.max(sides.top, sides.right, sides.bottom, sides.left);
    return { top: all, right: all, bottom: all, left: all };
};
