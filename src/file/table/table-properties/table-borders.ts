/**
 * Table borders module for WordprocessingML documents.
 *
 * This module provides border options for tables.
 *
 * Reference: http://officeopenxml.com/WPtableBorders.php
 *
 * @module
 */
import { BorderStyle, type IBorderOptions, createBorderElement } from "@file/border";
import { IgnoreIfEmptyXmlComponent } from "@file/xml-components";

/**
 * Options for configuring table borders.
 *
 * Borders can be applied to the outside edges (top, bottom, left, right)
 * and inside lines (insideHorizontal, insideVertical) of the table.
 */
export type ITableBordersOptions = {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
    readonly insideHorizontal?: IBorderOptions;
    readonly insideVertical?: IBorderOptions;
};

/**
 * A border with a hex color, as borders had before they took colors of the document's theme.
 *
 * @inline
 */
type HexColorBorderOptions = Omit<IBorderOptions, "color"> & { readonly color?: string };

const NONE_BORDER: HexColorBorderOptions = {
    style: BorderStyle.NONE,
    size: 0,
    color: "auto",
};

const DEFAULT_BORDER: IBorderOptions = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "auto",
};

/**
 * Options for how {@link TableBorders} writes the sides it isn't given.
 */
export type ITableBordersWriteOptions = {
    /**
     * Whether a side that isn't given gets a thin single line. Defaults to true. When false, the sides that aren't given
     * are left out, so the table takes them from its table style.
     */
    readonly fillMissingSides?: boolean;
};

/**
 * Represents table borders in a WordprocessingML document.
 *
 * The tblBorders element specifies the borders for all cells in the table. Each side that isn't given is a thin single
 * line, unless `fillMissingSides` is false, when it is left to the table's style.
 *
 * Reference: http://officeopenxml.com/WPtableBorders.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new TableBorders({
 *   top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 *   bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
 * });
 *
 * // To remove all borders
 * new TableBorders(TableBorders.NONE);
 * ```
 */
export class TableBorders extends IgnoreIfEmptyXmlComponent {
    /**
     * No borders. Its borders are declared with hex colors, as they were before borders took colors of the document's
     * theme, so that code reading them still compiles.
     */
    public static readonly NONE: { readonly [Side in keyof ITableBordersOptions]: HexColorBorderOptions } = {
        top: NONE_BORDER,
        bottom: NONE_BORDER,
        left: NONE_BORDER,
        right: NONE_BORDER,
        insideHorizontal: NONE_BORDER,
        insideVertical: NONE_BORDER,
    };

    public constructor(options: ITableBordersOptions, { fillMissingSides = true }: ITableBordersWriteOptions = {}) {
        super("w:tblBorders");

        const sides = [
            ["w:top", options.top],
            ["w:left", options.left],
            ["w:bottom", options.bottom],
            ["w:right", options.right],
            ["w:insideH", options.insideHorizontal],
            ["w:insideV", options.insideVertical],
        ] as const;

        for (const [elementName, border] of sides) {
            const resolved = border ?? (fillMissingSides ? DEFAULT_BORDER : undefined);
            if (resolved) {
                this.root.push(createBorderElement(elementName, resolved));
            }
        }
    }
}
