import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Inline } from "./inline";

export class Drawing extends XmlComponent {
    private inline: Inline;

    constructor(imageData: IMediaData) {
        super("w:drawing");

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        this.inline = new Inline(imageData.referenceId, imageData.dimensions);

        this.root.push(this.inline);
    }

    public scale(factorX: number, factorY: number): void {
        this.inline.scale(factorX, factorY);
    }
}
