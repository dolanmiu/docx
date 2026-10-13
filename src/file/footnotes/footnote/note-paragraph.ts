/**
 * The first paragraph of a footnote or endnote, which starts with the note's number.
 *
 * @module
 */
import type { Paragraph } from "@file/paragraph";
import type { Run } from "@file/paragraph/run";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

/**
 * The first paragraph of a footnote or endnote, written with the run that shows the note's number before its content.
 *
 * The run is added to what the paragraph is written as, rather than to the paragraph, so a paragraph in more than one
 * note, such as the notes of two documents, or two notes with the same content, has one number in each.
 *
 * @internal
 */
export class FirstNoteParagraph extends XmlComponent {
    public constructor(
        private readonly paragraph: Paragraph,
        private readonly mark: Run,
    ) {
        super("w:p");
    }

    public override prepForXml(context: IContext): IXmlableObject | undefined {
        const content: unknown = this.paragraph.prepForXml(context)!["w:p"];
        // A paragraph is written as its properties and content, or, with neither, as an empty object
        const children: readonly IXmlableObject[] = Array.isArray(content) ? content : [];
        // The number goes after the paragraph's properties, as its first run
        const index = children.length > 0 && "w:pPr" in children[0] ? 1 : 0;
        return { "w:p": [...children.slice(0, index), this.mark.prepForXml(context)!, ...children.slice(index)] };
    }
}
