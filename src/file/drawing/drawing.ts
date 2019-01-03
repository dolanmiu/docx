import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Anchor } from "./anchor";
import { IFloating } from "./floating";
import { Inline } from "./inline";
import { ITextWrapping } from "./text-wrap";

export enum PlacementPosition {
    INLINE,
    FLOATING,
}

export interface IDistance {
    readonly distT?: number;
    readonly distB?: number;
    readonly distL?: number;
    readonly distR?: number;
}

export interface IDrawingOptions {
    readonly position?: PlacementPosition;
    readonly textWrapping?: ITextWrapping;
    readonly floating?: IFloating;
}

const defaultDrawingOptions: IDrawingOptions = {
    position: PlacementPosition.INLINE,
};

export class Drawing extends XmlComponent {
    private readonly inline: Inline;

    constructor(imageData: IMediaData, drawingOptions?: IDrawingOptions) {
        super("w:drawing");

        const mergedOptions = {
            ...defaultDrawingOptions,
            ...drawingOptions,
        };

        if (mergedOptions.position === PlacementPosition.INLINE) {
            this.inline = new Inline(imageData, imageData.dimensions);
            this.root.push(this.inline);
        } else if (mergedOptions.position === PlacementPosition.FLOATING) {
            this.root.push(new Anchor(imageData, imageData.dimensions, mergedOptions));
        }
    }

    public scale(factorX: number, factorY: number): void {
        this.inline.scale(factorX, factorY);
    }
}
