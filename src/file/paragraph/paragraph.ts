// http://officeopenxml.com/WPparagraph.php
import { FootnoteReferenceRun } from "file/footnotes/footnote/run/reference-run";
import { Image } from "file/media";
import { Num } from "file/numbering/num";
import { XmlComponent } from "file/xml-components";

import { Alignment, AlignmentOptions } from "./formatting/alignment";
import { Bidirectional } from "./formatting/bidirectional";
import { Border, ThematicBreak } from "./formatting/border";
import { IIndentAttributesProperties, Indent } from "./formatting/indent";
import { KeepLines, KeepNext } from "./formatting/keep";
import { PageBreak, PageBreakBefore } from "./formatting/page-break";
import { ContextualSpacing, ISpacingProperties, Spacing } from "./formatting/spacing";
import { Style } from "./formatting/style";
import { CenterTabStop, LeaderType, LeftTabStop, MaxRightTabStop, RightTabStop } from "./formatting/tab-stop";
import { NumberProperties } from "./formatting/unordered-list";
import { Bookmark, Hyperlink } from "./links";
import { ParagraphProperties } from "./properties";
import { PictureRun, Run, SequentialIdentifier, TextRun } from "./run";

export class Paragraph extends XmlComponent {
    private readonly properties: ParagraphProperties;

    constructor(text?: string) {
        super("w:p");
        this.properties = new ParagraphProperties();
        this.root.push(this.properties);
        if (text !== undefined) {
            this.root.push(new TextRun(text));
        }
    }

    public get paragraphProperties(): ParagraphProperties {
        return this.properties;
    }

    public get Borders(): Border {
        return this.properties.paragraphBorder;
    }

    public createBorder(): Paragraph {
        this.properties.createBorder();
        return this;
    }

    public addRun(run: Run): Paragraph {
        this.root.push(run);
        return this;
    }

    public addHyperLink(hyperlink: Hyperlink): Paragraph {
        this.root.push(hyperlink);
        return this;
    }

    public addBookmark(bookmark: Bookmark): Paragraph {
        // Bookmarks by spec have three components, a start, text, and end
        this.root.push(bookmark.start);
        this.root.push(bookmark.text);
        this.root.push(bookmark.end);
        return this;
    }

    public createTextRun(text: string): TextRun {
        const run = new TextRun(text);
        this.addRun(run);
        return run;
    }

    public addImage(image: Image): PictureRun {
        const run = image.Run;
        this.addRun(run);

        return run;
    }

    public heading1(): Paragraph {
        this.properties.push(new Style("Heading1"));
        return this;
    }

    public heading2(): Paragraph {
        this.properties.push(new Style("Heading2"));
        return this;
    }

    public heading3(): Paragraph {
        this.properties.push(new Style("Heading3"));
        return this;
    }

    public heading4(): Paragraph {
        this.properties.push(new Style("Heading4"));
        return this;
    }

    public heading5(): Paragraph {
        this.properties.push(new Style("Heading5"));
        return this;
    }

    public heading6(): Paragraph {
        this.properties.push(new Style("Heading6"));
        return this;
    }

    public title(): Paragraph {
        this.properties.push(new Style("Title"));
        return this;
    }

    public center(): Paragraph {
        this.properties.push(new Alignment(AlignmentOptions.CENTER));
        return this;
    }

    public left(): Paragraph {
        this.properties.push(new Alignment(AlignmentOptions.LEFT));
        return this;
    }

    public right(): Paragraph {
        this.properties.push(new Alignment(AlignmentOptions.RIGHT));
        return this;
    }

    public start(): Paragraph {
        this.properties.push(new Alignment(AlignmentOptions.START));
        return this;
    }

    public end(): Paragraph {
        this.properties.push(new Alignment(AlignmentOptions.END));
        return this;
    }

    public distribute(): Paragraph {
        this.properties.push(new Alignment(AlignmentOptions.DISTRIBUTE));
        return this;
    }

    public justified(): Paragraph {
        this.properties.push(new Alignment(AlignmentOptions.BOTH));
        return this;
    }

    public thematicBreak(): Paragraph {
        this.properties.push(new ThematicBreak());
        return this;
    }

    public pageBreak(): Paragraph {
        this.root.push(new PageBreak());
        return this;
    }

    public pageBreakBefore(): Paragraph {
        this.properties.push(new PageBreakBefore());
        return this;
    }

    public maxRightTabStop(leader?: LeaderType): Paragraph {
        this.properties.push(new MaxRightTabStop(leader));
        return this;
    }

    public leftTabStop(position: number, leader?: LeaderType): Paragraph {
        this.properties.push(new LeftTabStop(position, leader));
        return this;
    }

    public rightTabStop(position: number, leader?: LeaderType): Paragraph {
        this.properties.push(new RightTabStop(position, leader));
        return this;
    }

    public centerTabStop(position: number, leader?: LeaderType): Paragraph {
        this.properties.push(new CenterTabStop(position, leader));
        return this;
    }

    public bullet(indentLevel: number = 0): Paragraph {
        this.properties.push(new Style("ListParagraph"));
        this.properties.push(new NumberProperties(1, indentLevel));
        return this;
    }

    public setNumbering(numbering: Num, indentLevel: number): Paragraph {
        this.properties.push(new Style("ListParagraph"));
        this.properties.push(new NumberProperties(numbering.id, indentLevel));
        return this;
    }

    public setCustomNumbering(numberId: number, indentLevel: number): Paragraph {
        this.properties.push(new NumberProperties(numberId, indentLevel));
        return this;
    }

    public style(styleId: string): Paragraph {
        this.properties.push(new Style(styleId));
        return this;
    }

    public indent(attrs: IIndentAttributesProperties): Paragraph {
        this.properties.push(new Indent(attrs));
        return this;
    }

    public spacing(params: ISpacingProperties): Paragraph {
        this.properties.push(new Spacing(params));
        return this;
    }

    public contextualSpacing(value: boolean): Paragraph {
        this.properties.push(new ContextualSpacing(value));
        return this;
    }

    public keepNext(): Paragraph {
        this.properties.push(new KeepNext());
        return this;
    }

    public keepLines(): Paragraph {
        this.properties.push(new KeepLines());
        return this;
    }

    public referenceFootnote(id: number): Paragraph {
        this.root.push(new FootnoteReferenceRun(id));
        return this;
    }

    public addRunToFront(run: Run): Paragraph {
        this.root.splice(1, 0, run);
        return this;
    }

    public bidirectional(): Paragraph {
        this.properties.push(new Bidirectional());
        return this;
    }

    public addTabStop(run: Run): Paragraph {
        this.root.splice(1, 0, run);
        return this;
    }

    public addSequentialIdentifier(identifier: string): Paragraph {
        this.root.push(new SequentialIdentifier(identifier));
        return this;
    }
}
