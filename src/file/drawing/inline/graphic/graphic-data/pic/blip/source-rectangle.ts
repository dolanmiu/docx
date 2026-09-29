/**
 * Source rectangle module for blip fills.
 *
 * This module defines the portion of an image to use when filling a shape.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Options for cropping an image.
 *
 * Each value is a percentage (0-100) of the image dimension to crop away
 * from the given edge. For example, `{ left: 10 }` crops 10% off the left
 * side of the image.
 */
export type ICropOptions = {
    /** Percentage (0-100) of the image width to crop from the left edge. */
    readonly left?: number;
    /** Percentage (0-100) of the image height to crop from the top edge. */
    readonly top?: number;
    /** Percentage (0-100) of the image width to crop from the right edge. */
    readonly right?: number;
    /** Percentage (0-100) of the image height to crop from the bottom edge. */
    readonly bottom?: number;
};

/**
 * Attributes for the source rectangle element.
 *
 * Percentages are stored in thousandths of a percent, as required by the
 * `ST_Percentage` schema type (for example `10000` represents `10%`).
 *
 * @internal
 */
class SourceRectangleAttributes extends XmlAttributeComponent<{
    readonly left?: number;
    readonly top?: number;
    readonly right?: number;
    readonly bottom?: number;
}> {
    protected readonly xmlKeys = {
        left: "l",
        top: "t",
        right: "r",
        bottom: "b",
    };
}

/**
 * Converts a crop percentage to thousandths of a percent.
 *
 * @throws If the percentage isn't a number from 0 to 100
 */
const cropValue = (value: number | undefined, edge: keyof ICropOptions): number | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (!(value >= 0 && value <= 100)) {
        throw new Error(`Invalid crop ${edge} ${value}. Expected a number from 0 to 100`);
    }
    return Math.round(value * 1000);
};

/**
 * Represents a source rectangle for blip fills.
 *
 * This element specifies a portion of the blip (image) to use as the fill.
 * When not specified with attributes, it indicates the entire blip should be used.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_RelativeRect">
 *   <xsd:attribute name="l" type="ST_Percentage" use="optional" default="0"/>
 *   <xsd:attribute name="t" type="ST_Percentage" use="optional" default="0"/>
 *   <xsd:attribute name="r" type="ST_Percentage" use="optional" default="0"/>
 *   <xsd:attribute name="b" type="ST_Percentage" use="optional" default="0"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const srcRect = new SourceRectangle({ left: 10, top: 10, right: 10, bottom: 10 });
 * ```
 */
export class SourceRectangle extends XmlComponent {
    public constructor(crop?: ICropOptions) {
        super("a:srcRect");

        if (crop) {
            this.root.push(
                new SourceRectangleAttributes({
                    left: cropValue(crop.left, "left"),
                    top: cropValue(crop.top, "top"),
                    right: cropValue(crop.right, "right"),
                    bottom: cropValue(crop.bottom, "bottom"),
                }),
            );
        }
    }
}
