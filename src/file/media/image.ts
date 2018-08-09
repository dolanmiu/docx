import { ImageParagraph, PictureRun } from "../paragraph";

export class Image {
    constructor(private readonly paragraph: ImageParagraph) {}

    public get Paragraph(): ImageParagraph {
        return this.paragraph;
    }

    public get Run(): PictureRun {
        return this.paragraph.Run;
    }

    public scale(factorX: number, factorY?: number): void {
        this.paragraph.Run.scale(factorX, factorY);
    }
}
