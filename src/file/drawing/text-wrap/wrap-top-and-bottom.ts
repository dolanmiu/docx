// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { IMargins } from "../floating";

class WrapTopAndBottomAttributes extends XmlAttributeComponent<{
    readonly distT?: number;
    readonly distB?: number;
}> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
    };
}

export class WrapTopAndBottom extends XmlComponent {
    public constructor(
        margins: IMargins = {
            top: 0,
            bottom: 0,
        },
    ) {
        super("wp:wrapTopAndBottom");

        this.root.push(
            new WrapTopAndBottomAttributes({
                distT: margins.top,
                distB: margins.bottom,
            }),
        );
    }
}
