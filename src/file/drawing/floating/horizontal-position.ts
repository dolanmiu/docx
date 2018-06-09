// http://officeopenxml.com/drwPicFloating-position.php
import { XmlComponent, XmlAttributeComponent } from "file/xml-components";
import { HorizontalPositionRelativeFrom, HorizontalPositionOptions } from "./floating-position";
import { Align } from "./align";
import { PositionOffset } from "./position-offset";

interface IHorizontalPositionAttributes {
    relativeFrom: HorizontalPositionRelativeFrom;
}

class HorizontalPositionAttributes extends XmlAttributeComponent<IHorizontalPositionAttributes> {
    protected xmlKeys = {
        relativeFrom: "relativeFrom",
    };
}

export class HorizontalPosition extends XmlComponent {
    constructor(horizontalPosition: HorizontalPositionOptions) {
        super("wp:positionH");

        this.root.push(
            new HorizontalPositionAttributes({
                relativeFrom: horizontalPosition.relative,
            }),
        );

        if (horizontalPosition.align) {
            this.root.push(new Align(horizontalPosition.align));
        } else if (horizontalPosition.offset !== undefined) {
            this.root.push(new PositionOffset(horizontalPosition.offset));
        } else {
            throw new Error("There is no configuration provided for floating position (Align or offset)");
        }
    }
}
