import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Inline } from "./inline";
import { Anchor } from "./anchor";
import { TextWrapping } from "./text-wrap";
import { Floating } from "./floating";

export enum PlacementPosition {
    INLINE,
    FLOATING,
}

export interface Distance {
    distT?: number;
    distB?: number;
    distL?: number;
    distR?: number;
}

export interface DrawingOptions {
    position?: PlacementPosition;
    textWrapping?: TextWrapping;
    floating?: Floating;
}

const defaultDrawingOptions: DrawingOptions = {
    position: PlacementPosition.INLINE,
};

export class Drawing extends XmlComponent {
    private inline: Inline;

    constructor(imageData: IMediaData, drawingOptions?: DrawingOptions) {
        super("w:drawing");

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        const mergedOptions = {
            ...defaultDrawingOptions,
            ...drawingOptions,
        };


        if (mergedOptions.position === PlacementPosition.INLINE) {
            this.inline = new Inline(imageData.referenceId, imageData.dimensions);
            this.root.push(this.inline);
        } else if (mergedOptions.position === PlacementPosition.FLOATING) {
            this.root.push(new Anchor(imageData.referenceId, imageData.dimensions, mergedOptions));
        }
    }

    public scale(factorX: number, factorY: number): void {
        this.inline.scale(factorX, factorY);
    }
}
