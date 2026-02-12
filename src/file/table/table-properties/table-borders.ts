// http://officeopenxml.com/WPtableBorders.php
import { BorderStyle, IBorderOptions, createBorderElement } from "@file/border";
import { BuilderElement, XmlComponent } from "@file/xml-components";

export type ITableBordersOptions = {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
    readonly insideHorizontal?: IBorderOptions;
    readonly insideVertical?: IBorderOptions;
};

const NONE_BORDER: IBorderOptions = {
    style: BorderStyle.NONE,
    size: 0,
    color: "auto",
};

const DEFAULT_BORDER: IBorderOptions = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "auto",
};

export const TABLE_BORDERS_NONE: ITableBordersOptions = {
    top: NONE_BORDER,
    bottom: NONE_BORDER,
    left: NONE_BORDER,
    right: NONE_BORDER,
    insideHorizontal: NONE_BORDER,
    insideVertical: NONE_BORDER,
};

export const createTableBorders = (options: ITableBordersOptions): XmlComponent =>
    new BuilderElement({
        name: "w:tblBorders",
        children: [
            createBorderElement("w:top", options.top ?? DEFAULT_BORDER),
            createBorderElement("w:left", options.left ?? DEFAULT_BORDER),
            createBorderElement("w:bottom", options.bottom ?? DEFAULT_BORDER),
            createBorderElement("w:right", options.right ?? DEFAULT_BORDER),
            createBorderElement("w:insideH", options.insideHorizontal ?? DEFAULT_BORDER),
            createBorderElement("w:insideV", options.insideVertical ?? DEFAULT_BORDER),
        ],
    });
