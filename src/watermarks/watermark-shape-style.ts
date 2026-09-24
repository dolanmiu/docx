/**
 * Shared shape styling for watermarks.
 *
 * Both text and picture watermarks are VML shapes anchored to the centre of the
 * page margins and layered behind the document text. This module builds that
 * common style so the two watermark kinds stay consistent with each other and
 * with the markup Word writes.
 *
 * @module
 */
import type { VmlShapeStyle } from "docx";

/**
 * Z-order used by Word for watermarks. Negative values place the shape behind the text.
 */
export const WATERMARK_Z_INDEX = -251657216;

/**
 * Options for building the shape style of a watermark.
 */
export type IWatermarkShapeStyleOptions = {
    /** Width of the shape in points. */
    readonly width: number;
    /** Height of the shape in points. */
    readonly height: number;
    /** Clockwise rotation in degrees. Omitted from the output when zero. */
    readonly rotation?: number;
};

/**
 * Builds the VML shape style shared by watermarks.
 *
 * The shape is absolutely positioned, centred horizontally and vertically
 * relative to the page margins, and placed behind the document text.
 *
 * @param options - Size and rotation of the watermark
 * @returns The VML shape style
 *
 * @example
 * ```typescript
 * createWatermarkShapeStyle({ width: 527.85, height: 131.95, rotation: 315 });
 * ```
 */
export const createWatermarkShapeStyle = ({ width, height, rotation }: IWatermarkShapeStyleOptions): VmlShapeStyle => ({
    position: "absolute",
    marginLeft: 0,
    marginTop: 0,
    width: `${width}pt`,
    height: `${height}pt`,
    rotation: rotation || undefined,
    zIndex: WATERMARK_Z_INDEX,
    positionHorizontal: "center",
    positionHorizontalRelative: "margin",
    positionVertical: "center",
    positionVerticalRelative: "margin",
});
