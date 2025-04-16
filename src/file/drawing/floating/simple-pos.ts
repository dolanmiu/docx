// http://officeopenxml.com/drwPicFloating-position.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * # Simple Positioning Coordinates
 *
 * This element specifies the coordinates at which a DrawingML object shall be positioned relative to the top-left edge of its page, when the `simplePos` attribute is specified on the <anchor> element (§5.5.2.3).
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_simplePos_topic_ID0E5K6OB.html
 * - http://officeopenxml.com/drwPicFloating-position.php
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:complexType name="CT_Point2D">
 *   <xsd:attribute name="x" type="ST_Coordinate" use="required"/>
 *   <xsd:attribute name="y" type="ST_Coordinate" use="required"/>
 * </xsd:complexType>
 * ```
 */
export const createSimplePos = (): XmlComponent =>
    new BuilderElement<{
        /**
         * ## X-Axis Coordinate
         *
         * Specifies a coordinate on the x-axis. The origin point for this coordinate shall be specified by the parent XML element.
         *
         * ### Example
         *
         * ```xml
         * <wp:... x="0" y="100" />
         * ```
         *
         * The `x` attribute defines an x-coordinate of 0.
         *
         * The possible values for this attribute are defined by the `ST_Coordinate` simple type (§5.1.12.16).
         */
        readonly x: number;
        /**
         * ## Y-Axis Coordinate
         *
         * Specifies a coordinate on the x-axis. The origin point for this coordinate shall be specified by the parent XML element.
         *
         * ### Example
         * ```xml
         * <wp:... x="0" y="100" />
         * ```
         *
         * The `y` attribute defines a y-coordinate of 100.
         *
         * The possible values for this attribute are defined by the `ST_Coordinate` simple type (§5.1.12.16).
         */
        readonly y: number;
    }>({
        name: "wp:simplePos",
        // NOTE: It's not fully supported in Microsoft Word, but this element is needed anyway
        attributes: {
            x: { key: "x", value: 0 },
            y: { key: "y", value: 0 },
        },
    });
