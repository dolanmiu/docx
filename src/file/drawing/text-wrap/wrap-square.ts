// http://officeopenxml.com/drwPicFloating-textWrap.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { IDistance } from "../drawing";
import { IMargins } from "../floating";
import { ITextWrapping, TextWrappingSide } from "./text-wrapping";

type IWrapSquareAttributes = {
    readonly wrapText?: (typeof TextWrappingSide)[keyof typeof TextWrappingSide];
} & IDistance;

export const createWrapSquare = (
    textWrapping: ITextWrapping,
    margins: IMargins = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
): XmlComponent =>
    new BuilderElement<IWrapSquareAttributes>({
        name: "wp:wrapSquare",
        attributes: {
            wrapText: { key: "wrapText", value: textWrapping.side || TextWrappingSide.BOTH_SIDES },
            distT: { key: "distT", value: margins.top },
            distB: { key: "distB", value: margins.bottom },
            distL: { key: "distL", value: margins.left },
            distR: { key: "distR", value: margins.right },
        },
    });
