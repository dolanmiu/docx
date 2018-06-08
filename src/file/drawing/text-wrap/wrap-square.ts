// http://officeopenxml.com/drwPicFloating-textWrap.php
import { XmlComponent, XmlAttributeComponent } from "file/xml-components";
import { TextWrapping, WrapTextOption } from ".";
import { Distance } from "../drawing";

interface IWrapSquareAttributes extends Distance {
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
    constructor(textWrapping: TextWrapping) {
        super("wp:wrapSquare");

        this.root.push(
            new WrapSquareAttributes({
                wrapText: textWrapping.wrapTextOption || WrapTextOption.BOTH_SIDES,
                ...textWrapping.distanceFromText,
            }),
        );
    }
}
