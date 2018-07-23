import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { IFloating } from "./floating";
import { ITextWrapping } from "./text-wrap";
export declare enum PlacementPosition {
    INLINE = 0,
    FLOATING = 1
}
export interface IDistance {
    distT?: number;
    distB?: number;
    distL?: number;
    distR?: number;
}
export interface IDrawingOptions {
    position?: PlacementPosition;
    textWrapping?: ITextWrapping;
    floating?: IFloating;
}
export declare class Drawing extends XmlComponent {
    private inline;
    constructor(imageData: IMediaData, drawingOptions?: IDrawingOptions);
    scale(factorX: number, factorY: number): void;
}
