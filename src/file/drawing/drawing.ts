import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Anchor } from "./anchor";
import { IFloating } from "./floating";
import { Inline } from "./inline";

export interface IDistance {
    readonly distT?: number;
    readonly distB?: number;
    readonly distL?: number;
    readonly distR?: number;
}

export interface IDrawingOptions {
    readonly floating?: IFloating;
}

export class Drawing extends XmlComponent {
    private readonly inline: Inline;

    constructor(imageData: IMediaData, drawingOptions: IDrawingOptions = {}) {
        super("w:drawing");

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        if (!drawingOptions.floating) {
            this.inline = new Inline(imageData.referenceId, imageData.dimensions);
            this.root.push(this.inline);
        } else {
            this.root.push(new Anchor(imageData.referenceId, imageData.dimensions, drawingOptions));
        }
    }

    public scale(factorX: number, factorY: number): void {
        this.inline.scale(factorX, factorY);
    }
}
