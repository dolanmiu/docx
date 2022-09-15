import { Paragraph } from "@file/paragraph";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { TextRun } from "./text-run";

export interface ICommentOptions {
    readonly id: number;
    readonly text: string;
    readonly initials?: string;
    readonly author?: string;
    readonly date?: Date;
}

export interface ICommentsOptions {
    readonly children: readonly ICommentOptions[];
}

class CommentAttributes extends XmlAttributeComponent<{
    readonly id: number;
    readonly initials?: string;
    readonly author?: string;
    readonly date?: string;
}> {
    protected readonly xmlKeys = { id: "w:id", initials: "w:initials", author: "w:author", date: "w:date" };
}

class CommentRangeAttributes extends XmlAttributeComponent<{ readonly id: number }> {
    protected readonly xmlKeys = { id: "w:id" };
}
class RootCommentsAttributes extends XmlAttributeComponent<{
    readonly "xmlns:cx"?: string;
    readonly "xmlns:cx1"?: string;
    readonly "xmlns:cx2"?: string;
    readonly "xmlns:cx3"?: string;
    readonly "xmlns:cx4"?: string;
    readonly "xmlns:cx5"?: string;
    readonly "xmlns:cx6"?: string;
    readonly "xmlns:cx7"?: string;
    readonly "xmlns:cx8"?: string;
    readonly "xmlns:mc"?: string;
    readonly "xmlns:aink"?: string;
    readonly "xmlns:am3d"?: string;
    readonly "xmlns:o"?: string;
    readonly "xmlns:r"?: string;
    readonly "xmlns:m"?: string;
    readonly "xmlns:v"?: string;
    readonly "xmlns:wp14"?: string;
    readonly "xmlns:wp"?: string;
    readonly "xmlns:w10"?: string;
    readonly "xmlns:w"?: string;
    readonly "xmlns:w14"?: string;
    readonly "xmlns:w15"?: string;
    readonly "xmlns:w16cex"?: string;
    readonly "xmlns:w16cid"?: string;
    readonly "xmlns:w16"?: string;
    readonly "xmlns:w16sdtdh"?: string;
    readonly "xmlns:w16se"?: string;
    readonly "xmlns:wpg": string;
    readonly "xmlns:wpi"?: string;
    readonly "xmlns:wne"?: string;
    readonly "xmlns:wps"?: string;
}> {
    protected readonly xmlKeys = {
        "xmlns:cx": "xmlns:cx",
        "xmlns:cx1": "xmlns:cx1",
        "xmlns:cx2": "xmlns:cx2",
        "xmlns:cx3": "xmlns:cx3",
        "xmlns:cx4": "xmlns:cx4",
        "xmlns:cx5": "xmlns:cx5",
        "xmlns:cx6": "xmlns:cx6",
        "xmlns:cx7": "xmlns:cx7",
        "xmlns:cx8": "xmlns:cx8",
        "xmlns:mc": "xmlns:mc",
        "xmlns:aink": "xmlns:aink",
        "xmlns:am3d": "xmlns:am3d",
        "xmlns:o": "xmlns:o",
        "xmlns:r": "xmlns:r",
        "xmlns:m": "xmlns:m",
        "xmlns:v": "xmlns:v",
        "xmlns:wp14": "xmlns:wp14",
        "xmlns:wp": "xmlns:wp",
        "xmlns:w10": "xmlns:w10",
        "xmlns:w": "xmlns:w",
        "xmlns:w14": "xmlns:w14",
        "xmlns:w15": "xmlns:w15",
        "xmlns:w16cex": "xmlns:w16cex",
        "xmlns:w16cid": "xmlns:w16cid",
        "xmlns:w16": "xmlns:w16",
        "xmlns:w16sdtdh": "xmlns:w16sdtdh",
        "xmlns:w16se": "xmlns:w16se",
        "xmlns:wpg": "xmlns:wpg",
        "xmlns:wpi": "xmlns:wpi",
        "xmlns:wne": "xmlns:wne",
        "xmlns:wps": "xmlns:wps",
    };
}

export class CommentRangeStart extends XmlComponent {
    public constructor(id: number) {
        super("w:commentRangeStart");

        this.root.push(new CommentRangeAttributes({ id }));
    }
}

export class CommentRangeEnd extends XmlComponent {
    public constructor(id: number) {
        super("w:commentRangeEnd");

        this.root.push(new CommentRangeAttributes({ id }));
    }
}

export class CommentReference extends XmlComponent {
    public constructor(id: number) {
        super("w:commentReference");

        this.root.push(new CommentRangeAttributes({ id }));
    }
}

export class Comment extends XmlComponent {
    public constructor({ id, initials, author, date = new Date(), text }: ICommentOptions) {
        super("w:comment");

        this.root.push(
            new CommentAttributes({
                id,
                initials,
                author,
                date: date.toISOString(),
            }),
        );

        this.root.push(new Paragraph({ children: [new TextRun(text)] }));
    }
}
export class Comments extends XmlComponent {
    public constructor({ children }: ICommentsOptions) {
        super("w:comments");

        this.root.push(
            new RootCommentsAttributes({
                "xmlns:cx": "http://schemas.microsoft.com/office/drawing/2014/chartex",
                "xmlns:cx1": "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
                "xmlns:cx2": "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
                "xmlns:cx3": "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
                "xmlns:cx4": "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
                "xmlns:cx5": "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
                "xmlns:cx6": "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
                "xmlns:cx7": "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
                "xmlns:cx8": "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
                "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                "xmlns:aink": "http://schemas.microsoft.com/office/drawing/2016/ink",
                "xmlns:am3d": "http://schemas.microsoft.com/office/drawing/2017/model3d",
                "xmlns:o": "urn:schemas-microsoft-com:office:office",
                "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                "xmlns:m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
                "xmlns:v": "urn:schemas-microsoft-com:vml",
                "xmlns:wp14": "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                "xmlns:w10": "urn:schemas-microsoft-com:office:word",
                "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                "xmlns:w14": "http://schemas.microsoft.com/office/word/2010/wordml",
                "xmlns:w15": "http://schemas.microsoft.com/office/word/2012/wordml",
                "xmlns:w16cex": "http://schemas.microsoft.com/office/word/2018/wordml/cex",
                "xmlns:w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
                "xmlns:w16": "http://schemas.microsoft.com/office/word/2018/wordml",
                "xmlns:w16sdtdh": "http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash",
                "xmlns:w16se": "http://schemas.microsoft.com/office/word/2015/wordml/symex",
                "xmlns:wpg": "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                "xmlns:wpi": "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                "xmlns:wne": "http://schemas.microsoft.com/office/word/2006/wordml",
                "xmlns:wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            }),
        );

        for (const child of children) {
            this.root.push(new Comment(child));
        }
    }
}
