// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlComponent, XmlAttributeComponent } from "file/xml-components";
import { Distance } from "../drawing";

interface IWrapTopAndBottomAttributes {
    distT?: number;
    distB?: number;
}

class WrapTopAndBottomAttributes extends XmlAttributeComponent<IWrapTopAndBottomAttributes> {
    protected xmlKeys = {
        distT: "distT",
        distB: "distB",
    };
}

export class WrapTopAndBottom extends XmlComponent {
    constructor(distanceFromText?: Distance) {
        super("wp:wrapTopAndBottom");

        distanceFromText = distanceFromText || {
            distT: 0,
            distB: 0,
        };

        this.root.push(
            new WrapTopAndBottomAttributes({
                distT: distanceFromText.distT,
                distB: distanceFromText.distB,
            }),
        );
    }
}
