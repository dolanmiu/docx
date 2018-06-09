// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { ITextWrapping, WrapTextOption } from ".";
import { IDistance } from "../drawing";

interface IWrapSquareAttributes extends IDistance {
    wrapText?: WrapTextOption;
}

class WrapSquareAttributes extends XmlAttributeComponent<IWrapSquareAttributes> {
    protected xmlKeys = {
        distT: "distT",
        distB: "distB",
        distL: "distL",
        distR: "distR",
        wrapText: "wrapText",
    };
}

export class WrapSquare extends XmlComponent {
    constructor(textWrapping: ITextWrapping) {
        super("wp:wrapSquare");

        this.root.push(
            new WrapSquareAttributes({
                wrapText: textWrapping.wrapTextOption || WrapTextOption.BOTH_SIDES,
                ...textWrapping.distanceFromText,
            }),
        );
    }
}
