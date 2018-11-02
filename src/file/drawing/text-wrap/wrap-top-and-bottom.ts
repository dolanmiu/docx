// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { IDistance } from "../drawing";

interface IWrapTopAndBottomAttributes {
    readonly distT?: number;
    readonly distB?: number;
}

class WrapTopAndBottomAttributes extends XmlAttributeComponent<IWrapTopAndBottomAttributes> {
    protected readonly xmlKeys = {
        distT: "distT",
        distB: "distB",
    };
}

export class WrapTopAndBottom extends XmlComponent {
    constructor(
        distanceFromText: IDistance = {
            distT: 0,
            distB: 0,
        },
    ) {
        super("wp:wrapTopAndBottom");

        this.root.push(
            new WrapTopAndBottomAttributes({
                distT: distanceFromText.distT,
                distB: distanceFromText.distB,
            }),
        );
    }
}
