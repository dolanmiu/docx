// http://officeopenxml.com/drwPicFloating-position.php
import { XmlComponent, XmlAttributeComponent } from "file/xml-components";
import { VerticalPositionRelativeFrom, VerticalPositionOptions } from "./floating-position";
import { Align } from "./align";
import { PositionOffset } from "./position-offset";

interface IVerticalPositionAttributes {
    relativeFrom: VerticalPositionRelativeFrom;
}

class VerticalPositionAttributes extends XmlAttributeComponent<IVerticalPositionAttributes> {
    protected xmlKeys = {
        relativeFrom: "relativeFrom",
    };
}

export class VerticalPosition extends XmlComponent {
    constructor(verticalPosition: VerticalPositionOptions) {
        super("wp:positionV");

        this.root.push(
            new VerticalPositionAttributes({
                relativeFrom: verticalPosition.relative,
            }),
        );

        if (verticalPosition.align) {
            this.root.push(new Align(verticalPosition.align));
        } else if (verticalPosition.offset !== undefined) {
            this.root.push(new PositionOffset(verticalPosition.offset));
        } else {
            throw new Error("There is no configuration provided for floating position (Align or offset)");
        }
    }
}
