/**
 * Anchor attributes module for DrawingML floating elements.
 *
 * This module defines the attributes for anchored/floating drawings,
 * controlling positioning, z-order, and wrapping behavior.
 *
 * @module
 */
import { XmlAttributeComponent } from "@file/xml-components";

import { IDistance } from "../drawing";

/**
 * Attributes for an anchored drawing element.
 *
 * These attributes control the positioning and behavior of floating drawings.
 */
export type IAnchorAttributes = {
    /** Whether the drawing can overlap other content ("0" = false, "1" = true) */
    readonly allowOverlap?: "0" | "1";
    /** Whether the drawing is behind document text ("0" = false, "1" = true) */
    readonly behindDoc?: "0" | "1";
    /** Whether the drawing is contained within table cells ("0" = false, "1" = true) */
    readonly layoutInCell?: "0" | "1";
    /** Whether the anchor position is locked ("0" = false, "1" = true) */
    readonly locked?: "0" | "1";
    /** Z-order positioning (higher values appear in front) */
    readonly relativeHeight?: number;
    /** Whether to use simple positioning ("0" = false, "1" = true) */
    readonly simplePos?: "0" | "1";
} & IDistance;

/**
 * XML attributes component for anchored drawings.
 *
 * Maps the IAnchorAttributes to XML attribute names for the wp:anchor element.
 *
 * @internal
 */
export class AnchorAttributes extends XmlAttributeComponent<IAnchorAttributes> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
        allowOverlap: "allowOverlap",
        behindDoc: "behindDoc",
        layoutInCell: "layoutInCell",
        locked: "locked",
        relativeHeight: "relativeHeight",
        simplePos: "simplePos",
    };
}
