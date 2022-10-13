// http://officeopenxml.com/drwPicFloating-position.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { Align } from "./align";
import { HorizontalPositionRelativeFrom, IHorizontalPositionOptions } from "./floating-position";
import { PositionOffset } from "./position-offset";

class HorizontalPositionAttributes extends XmlAttributeComponent<{
    readonly relativeFrom: HorizontalPositionRelativeFrom;
}> {
    protected readonly xmlKeys = {
        relativeFrom: "relativeFrom",
    };
}

export class HorizontalPosition extends XmlComponent {
    public constructor(horizontalPosition: IHorizontalPositionOptions) {
        super("wp:positionH");

        this.root.push(
            new HorizontalPositionAttributes({
                relativeFrom: horizontalPosition.relative || HorizontalPositionRelativeFrom.PAGE,
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
