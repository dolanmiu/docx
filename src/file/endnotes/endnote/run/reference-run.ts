import type { NoteContent } from "@file/footnotes/footnote/run/reference-run";
import { Run } from "@file/paragraph/run";
import { type IContext, type IXmlableObject, XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export class EndnoteReferenceRunAttributes extends XmlAttributeComponent<{
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        id: "w:id",
    };
}

export class EndnoteIdReference extends XmlComponent {
    public constructor(id: number) {
        super("w:endnoteReference");

        this.root.push(
            new EndnoteReferenceRunAttributes({
                id: id,
            }),
        );
    }
}

/**
 * A run with an endnote's reference mark, its number, in the document's text.
 *
 * It refers to one of the document's `endnotes` by its id, or is given its endnote's content, for an endnote of its
 * own, which is added to the document's endnotes when the run is written.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [new TextRun("A claim"), new EndnoteReferenceRun({ children: [new Paragraph("Its source.")] })],
 * });
 * ```
 */
export class EndnoteReferenceRun extends Run {
    private readonly endnote?: NoteContent;

    /**
     * @param endnote - The id of one of the document's `endnotes`, or the endnote's content, for an endnote of the run's
     * own. Word has endnotes only in a document's body, so a run with its endnote's content is left out of headers,
     * footers, comments and notes
     */
    public constructor(endnote: number | NoteContent) {
        super({ style: "EndnoteReference" });

        if (typeof endnote === "number") {
            this.root.push(new EndnoteIdReference(endnote));
        } else {
            this.endnote = endnote;
        }
    }

    /**
     * Formats the run, with its own endnote added to the document's endnotes, and referred to by the id it has there.
     */
    public override prepForXml(context: IContext): IXmlableObject | undefined {
        if (this.endnote === undefined) {
            return super.prepForXml(context);
        }
        const id = context.file?.Endnotes.View.idOf(this, this.endnote, context);
        if (id === undefined) {
            return undefined;
        }
        // The reference is only in the run while it is written, as the id is the endnote's in the document it is in
        this.root.push(new EndnoteIdReference(id));
        try {
            return super.prepForXml(context);
        } finally {
            this.root.pop();
        }
    }
}
