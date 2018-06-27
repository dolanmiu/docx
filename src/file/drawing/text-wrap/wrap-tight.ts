// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { IDistance } from "../drawing";

interface IWrapTightAttributes {
    distT?: number;
    distB?: number;
}

class WrapTightAttributes extends XmlAttributeComponent<IWrapTightAttributes> {
    protected xmlKeys = {
        distT: "distT",
        distB: "distB",
    };
}

export class WrapTight extends XmlComponent {
    constructor(distanceFromText?: IDistance) {
        super("wp:wrapTight");

        distanceFromText = distanceFromText || {
            distT: 0,
            distB: 0,
        };

        this.root.push(
            new WrapTightAttributes({
                distT: distanceFromText.distT,
                distB: distanceFromText.distB,
            }),
        );
    }
}
