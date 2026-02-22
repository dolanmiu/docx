import type { OutlineOptions } from "@file/drawing/inline/graphic/graphic-data/pic/shape-properties/outline/outline";
import type { SolidFillOptions } from "@file/drawing/inline/graphic/graphic-data/pic/shape-properties/outline/solid-fill";
import type { WpsShapeCoreOptions } from "@file/drawing/inline/graphic/graphic-data/wps";

export type IMediaDataTransformation = {
    readonly offset?: {
        readonly pixels: {
            readonly x: number;
            readonly y: number;
        };
        readonly emus?: {
            readonly x: number;
            readonly y: number;
        };
    };
    readonly pixels: {
        /** Width in pixels */
        readonly x: number;
        /** Height in pixels */
        readonly y: number;
    };
    /** Display dimensions in EMUs (English Metric Units) */
    readonly emus: {
        /** Width in EMUs (1 inch = 914400 EMUs) */
        readonly x: number;
        /** Height in EMUs (1 inch = 914400 EMUs) */
        readonly y: number;
    };
    /** Optional flip transformations */
    readonly flip?: {
        /** Whether to flip the image vertically */
        readonly vertical?: boolean;
        /** Whether to flip the image horizontally */
        readonly horizontal?: boolean;
    };
    /** Optional rotation angle in degrees */
    readonly rotation?: number;
};

/**
 * Core properties shared by all media data types.
 */
type CoreMediaData = {
    /** File name for the media in the package */
    readonly fileName: string;
    /** Transformation settings for display */
    readonly transformation: IMediaDataTransformation;
    /** Raw image data as Buffer, Uint8Array, or ArrayBuffer */
    readonly data: Buffer | Uint8Array | ArrayBuffer;
};

/**
 * Regular raster image formats.
 */
type RegularMediaData = {
    /** Image format type */
    readonly type: "jpg" | "png" | "gif" | "bmp";
};

/**
 * SVG image format with fallback support.
 */
type SvgMediaData = {
    /** SVG image type */
    readonly type: "svg";
    /**
     * Fallback image for Word processors that do not support SVG.
     * This ensures the document displays correctly in all viewers.
     */
    readonly fallback: RegularMediaData & CoreMediaData;
};

export type WpsMediaData = {
    readonly type: "wps";
    readonly transformation: IMediaDataTransformation;
    readonly data: WpsShapeCoreOptions;
};

export type WpgCommonMediaData = {
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
};

export type IGroupChildMediaData = (WpsMediaData | IMediaData) & WpgCommonMediaData;

export type WpgMediaData = {
    readonly type: "wpg";
    readonly transformation: IMediaDataTransformation;
    readonly children: readonly IGroupChildMediaData[];
};

export type IExtendedMediaData = IMediaData | WpsMediaData | WpgMediaData;

export type IMediaData = (RegularMediaData | SvgMediaData) & CoreMediaData;

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND2 = "";
