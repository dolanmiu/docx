import { SpaceType } from "file/space-type";
import { XmlComponent, XmlAttributeComponent } from "file/xml-components";
import { TextRun } from "../index";

export interface ITrackRevisionAttributesProperties {
    readonly id: number;
    readonly author: string;
    readonly date: string;
}

export class TrackRevisionAttributes extends XmlAttributeComponent<ITrackRevisionAttributesProperties> {
    protected readonly xmlKeys = {
        id: "w:id",
        author: "w:author",
        date: "w:date",
    };
}

export interface IInsertedTextRunOptions extends ITrackRevisionAttributesProperties {
    readonly child: TextRun;
}

export interface IDeletedTextRunOptions extends ITrackRevisionAttributesProperties {
    readonly text: string;
}

export class InsertedTextRun extends XmlComponent {
    constructor(options: IInsertedTextRunOptions) {
        super("w:ins");
        this.root.push(
            new TrackRevisionAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.addChildElement(options.child);
    }
}

export class DeletedTextRunWrapper extends XmlComponent {
    constructor(text: string) {
        super("w:r");
        this.root.push(new DeletedText(text));
    }
}

class TextAttributes extends XmlAttributeComponent<{ readonly space: SpaceType }> {
    protected readonly xmlKeys = { space: "xml:space" };
}

export class DeletedText extends XmlComponent {
    constructor(text: string) {
        super("w:delText");
        this.root.push(new TextAttributes({ space: SpaceType.PRESERVE }));
        this.root.push(text);
    }
}

export class DeletedTextRun extends XmlComponent {
    constructor(options: IDeletedTextRunOptions) {
        super("w:del");
        this.root.push(
            new TrackRevisionAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.addChildElement(new DeletedTextRunWrapper(options.text));
    }
}
