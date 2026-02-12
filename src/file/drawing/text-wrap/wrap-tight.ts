// http://officeopenxml.com/drwPicFloating-textWrap.php
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { IMargins } from "../floating";

type IWrapTightAttributes = {
    readonly distT?: number;
    readonly distB?: number;
};

export const createWrapTight = (
    margins: IMargins = {
        top: 0,
        bottom: 0,
    },
): XmlComponent =>
    new BuilderElement<IWrapTightAttributes>({
        name: "wp:wrapTight",
        attributes: {
            distT: { key: "distT", value: margins.top },
            distB: { key: "distB", value: margins.bottom },
        },
    });
