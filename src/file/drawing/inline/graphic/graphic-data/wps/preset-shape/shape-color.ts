/**
 * Colours for shape fills and lines.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { hexColorValue } from "@util/values";

/**
 * Checks that a percentage option is between 0 and 100 and returns it.
 *
 * @throws If the value is outside 0 to 100
 */
export const percentageValue = (value: number, option: string): number => {
    if (!(value >= 0 && value <= 100)) {
        throw new Error(`Invalid ${option} ${value}. Expected a number from 0 to 100`);
    }
    return value;
};

/**
 * Creates an `a:srgbClr` element from a hex colour, with an optional transparency.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_SRgbColor">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_ColorTransform" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="val" type="s:ST_HexColorRGB" use="required"/>
 * </xsd:complexType>
 * ```
 *
 * @param color - A 6-digit hex colour such as `"FF0000"` or `"#FF0000"`
 * @param transparency - From 0 (opaque) to 100 (invisible)
 * @throws If the colour is not a 6-digit hex value or the transparency is outside 0 to 100
 *
 * @example
 * ```typescript
 * createShapeColor("1F4E79", 25); // <a:srgbClr val="1F4E79"><a:alpha val="75000"/></a:srgbClr>
 * ```
 */
export const createShapeColor = (color: string, transparency?: number): XmlComponent => {
    if (color === "auto") {
        throw new Error(`Invalid shape color 'auto'. Expected 6 digit hex value`);
    }

    return new BuilderElement<{ readonly value: string }>({
        name: "a:srgbClr",
        attributes: {
            value: { key: "val", value: hexColorValue(color) },
        },
        children: transparency
            ? [
                  new BuilderElement<{ readonly value: number }>({
                      name: "a:alpha",
                      attributes: {
                          // Alpha is opacity in thousandths of a percent
                          value: { key: "val", value: Math.round((100 - percentageValue(transparency, "transparency")) * 1000) },
                      },
                  }),
              ]
            : [],
    });
};
