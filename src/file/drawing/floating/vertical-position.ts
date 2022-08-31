// http://officeopenxml.com/drwPicFloating-position.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { Align } from "./align";
import { IVerticalPositionOptions, VerticalPositionRelativeFrom } from "./floating-position";
import { PositionOffset } from "./position-offset";

class VerticalPositionAttributes extends XmlAttributeComponent<{
    readonly relativeFrom: VerticalPositionRelativeFrom;
}> {
    protected readonly xmlKeys = {
        relativeFrom: "relativeFrom",
    };
}

export class VerticalPosition extends XmlComponent {
    public constructor(verticalPosition: IVerticalPositionOptions) {
        super("wp:positionV");

        this.root.push(
            new VerticalPositionAttributes({
                relativeFrom: verticalPosition.relative || VerticalPositionRelativeFrom.PAGE,
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
