// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { IMargins } from "../floating";

interface IWrapTightAttributes {
    readonly distT?: number;
    readonly distB?: number;
}

class WrapTightAttributes extends XmlAttributeComponent<IWrapTightAttributes> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
    };
}

export class WrapTight extends XmlComponent {
    constructor(
        margins: IMargins = {
            top: 0,
            bottom: 0,
        },
    ) {
        super("wp:wrapTight");

        this.root.push(
            new WrapTightAttributes({
                distT: margins.top,
                distB: margins.bottom,
            }),
        );
    }
}
