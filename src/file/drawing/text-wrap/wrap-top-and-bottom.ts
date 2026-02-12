// http://officeopenxml.com/drwPicFloating-textWrap.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { IMargins } from "../floating";

type IWrapTopAndBottomAttributes = {
    readonly distT?: number;
    readonly distB?: number;
};

export const createWrapTopAndBottom = (
    margins: IMargins = {
        top: 0,
        bottom: 0,
    },
): XmlComponent =>
    new BuilderElement<IWrapTopAndBottomAttributes>({
        name: "wp:wrapTopAndBottom",
        attributes: {
            distT: { key: "distT", value: margins.top },
            distB: { key: "distB", value: margins.bottom },
        },
    });
