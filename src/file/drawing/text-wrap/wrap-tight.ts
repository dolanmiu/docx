// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { IDistance } from "../drawing";

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
        distanceFromText: IDistance = {
            distT: 0,
            distB: 0,
        },
    ) {
        super("wp:wrapTight");

        this.root.push(
            new WrapTightAttributes({
                distT: distanceFromText.distT,
                distB: distanceFromText.distB,
            }),
        );
    }
}
