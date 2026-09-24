/**
 * Wrap Tight and Wrap Through modules for DrawingML text wrapping.
 *
 * These provide tight and through text wrapping for floating drawings,
 * where text wraps closely around the outline of the drawing.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import type { IMargins } from "../floating";
import { type ITextWrapping, TextWrappingSide } from "./text-wrapping";

type IWrapPolygonAttributes = {
    readonly wrapText: (typeof TextWrappingSide)[keyof typeof TextWrappingSide];
    readonly distL?: number;
    readonly distR?: number;
};

type Point = {
    readonly x: number;
    readonly y: number;
};

// Wrap polygons are measured in 21600ths of the drawing's width and height
const WRAP_POLYGON_SIZE = 21600;

const createPoint = (name: "wp:start" | "wp:lineTo", { x, y }: Point): XmlComponent =>
    new BuilderElement<Point>({
        name,
        attributes: {
            x: { key: "x", value: x },
            y: { key: "y", value: y },
        },
    });

/**
 * Creates a wrap polygon around the drawing's box.
 *
 * Word works out the outline to wrap text around when it lays out the page, so the polygon
 * is marked as not edited, and Word replaces it with the drawing's real outline.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapPath">
 *   <xsd:sequence>
 *     <xsd:element name="start" type="a:CT_Point2D" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="lineTo" type="a:CT_Point2D" minOccurs="2" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="edited" type="xsd:boolean" use="optional"/>
 * </xsd:complexType>
 * ```
 */
const createWrapPolygon = (): XmlComponent =>
    new BuilderElement<{ readonly edited: boolean }>({
        name: "wp:wrapPolygon",
        attributes: {
            edited: { key: "edited", value: false },
        },
        children: [
            createPoint("wp:start", { x: 0, y: 0 }),
            createPoint("wp:lineTo", { x: 0, y: WRAP_POLYGON_SIZE }),
            createPoint("wp:lineTo", { x: WRAP_POLYGON_SIZE, y: WRAP_POLYGON_SIZE }),
            createPoint("wp:lineTo", { x: WRAP_POLYGON_SIZE, y: 0 }),
            createPoint("wp:lineTo", { x: 0, y: 0 }),
        ],
    });

const createPolygonWrap = (
    name: "wp:wrapTight" | "wp:wrapThrough",
    margins: IMargins = {},
    textWrapping?: Pick<ITextWrapping, "side">,
): XmlComponent =>
    new BuilderElement<IWrapPolygonAttributes>({
        name,
        attributes: {
            wrapText: { key: "wrapText", value: textWrapping?.side ?? TextWrappingSide.BOTH_SIDES },
            distL: { key: "distL", value: margins.left },
            distR: { key: "distR", value: margins.right },
        },
        children: [createWrapPolygon()],
    });

/**
 * Creates tight text wrapping for a floating drawing.
 *
 * WrapTight causes text to wrap closely around the contours
 * of the drawing rather than its rectangular bounding box.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapTight">
 *   <xsd:sequence>
 *     <xsd:element name="wrapPolygon" type="CT_WrapPath"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="wrapText" type="ST_WrapText" use="required"/>
 *   <xsd:attribute name="distL" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distR" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 *
 * @param margins - The distances from the text on the left and right. The top and bottom aren't written for tight wrapping
 * @param textWrapping - Which sides the text wraps on. Defaults to both
 */
export const createWrapTight = (margins?: IMargins, textWrapping?: Pick<ITextWrapping, "side">): XmlComponent =>
    createPolygonWrap("wp:wrapTight", margins, textWrapping);

/**
 * Creates through text wrapping for a floating drawing.
 *
 * WrapThrough wraps text around the contours of the drawing like WrapTight, and also
 * fills any open space inside the drawing, such as the middle of a ring.
 *
 * Reference: http://officeopenxml.com/drwPicFloating-textWrap.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WrapThrough">
 *   <xsd:sequence>
 *     <xsd:element name="wrapPolygon" type="CT_WrapPath"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="wrapText" type="ST_WrapText" use="required"/>
 *   <xsd:attribute name="distL" type="ST_WrapDistance"/>
 *   <xsd:attribute name="distR" type="ST_WrapDistance"/>
 * </xsd:complexType>
 * ```
 *
 * @param margins - The distances from the text on the left and right. The top and bottom aren't written for through wrapping
 * @param textWrapping - Which sides the text wraps on. Defaults to both
 */
export const createWrapThrough = (margins?: IMargins, textWrapping?: Pick<ITextWrapping, "side">): XmlComponent =>
    createPolygonWrap("wp:wrapThrough", margins, textWrapping);
