/**
 * Fit text module for WordprocessingML run properties.
 *
 * This module provides Word's Fit Text, which squeezes or spreads a run's text so that it takes up a width given for it.
 *
 * Reference: ISO/IEC 29500-1, 17.3.2.14 fitText
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import { fitTextUniqueNumericId } from "@util/convenience-functions";
import { type PositiveUniversalMeasure, decimalNumber, twipsMeasureValue, universalMeasureToTwips } from "@util/values";

/**
 * Options for fitting a run's text to a width.
 *
 * @publicApi
 */
export type IFitTextOptions = {
    /** The width the text is squeezed or spread to fill, in twips (1440 is an inch) or as a measure such as `"1in"` (`w:val`) */
    readonly width: number | PositiveUniversalMeasure;
    /**
     * Runs next to each other with the same group are fitted to the width together, as one piece of text, so it can be
     * made of runs formatted differently (`w:id`). Word fits them to the first one's width. Without a group, the run is
     * fitted to its width on its own.
     */
    readonly group?: number;
};

type IFitTextAttributes = {
    readonly val: number;
    readonly id: number;
};

/**
 * Creates the fitting of a run's text to a width (`w:fitText`).
 *
 * Word writes an ID for each piece of fitted text, and fits runs without one unreliably: two of them next to each other
 * together, and some not at all. So a run without a group is given an ID of its own.
 *
 * A width given as a measure is written in twips, as Office's schemas allow only a whole number of them, though the
 * standard's allow a measure.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_FitText">
 *   <xsd:attribute name="val" type="s:ST_TwipsMeasure" use="required"/>
 *   <xsd:attribute name="id" type="ST_DecimalNumber" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * createFitText({ width: 1440, group: 1 });
 * ```
 */
export const createFitText = ({ width, group }: IFitTextOptions): XmlComponent =>
    new BuilderElement<IFitTextAttributes>({
        name: "w:fitText",
        attributes: {
            val: { key: "w:val", value: Math.round(universalMeasureToTwips(twipsMeasureValue(width))) },
            id: { key: "w:id", value: group === undefined ? fitTextUniqueNumericId() : decimalNumber(group) },
        },
    });
