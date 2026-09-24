/**
 * Drawings whose layout depends on the document's styles, such as a shape sized to fit its text.
 *
 * @module
 */
import { type IContext, type IXmlableObject, type Paragraph, XmlComponent } from "docx";

import { createTextParagraphs } from "../shape-text-size";
import { type TextStyles, WORD_DEFAULT_STYLES, getTextStyles, hasDefaultParagraphSpacing, readTextParagraphs } from "../shape-text-styles";

/**
 * Everything about a drawing's text that the document's styles can change: how its paragraphs, and those written for
 * `text`, are formatted, and whether `text` is written without paragraph spacing. Two styles with the same key lay
 * the drawing out the same way.
 */
const stylesKey = (paragraphs: readonly Paragraph[], styles: TextStyles): string =>
    JSON.stringify([hasDefaultParagraphSpacing(styles), readTextParagraphs([...createTextParagraphs("", styles), ...paragraphs], styles)]);

/**
 * A drawing that is laid out again, in the document's styles, when it is written. A shape doesn't know which document
 * it is in until then.
 *
 * It is also laid out in Word's default styles when it is created, so mistakes in its options throw straight away,
 * and that layout is written when the document's styles format its text the same way. The drawing ids are given
 * before either layout, so both have the same ids.
 */
class StyledDrawing extends XmlComponent {
    // The drawing laid out in each document's styles, so writing a document twice lays it out once
    private readonly drawings = new WeakMap<TextStyles, XmlComponent>();
    private readonly defaultKey: string;

    public constructor(
        private readonly create: (styles: TextStyles) => XmlComponent,
        private readonly paragraphs: readonly Paragraph[],
    ) {
        super("w:drawing");
        this.drawings.set(WORD_DEFAULT_STYLES, create(WORD_DEFAULT_STYLES));
        this.defaultKey = stylesKey(paragraphs, WORD_DEFAULT_STYLES);
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        const styles = getTextStyles(context);
        const drawing =
            this.drawings.get(styles) ??
            (stylesKey(this.paragraphs, styles) === this.defaultKey ? this.drawings.get(WORD_DEFAULT_STYLES)! : this.create(styles));
        this.drawings.set(styles, drawing);
        return drawing.prepForXml(context);
    }
}

/**
 * Creates a drawing, or a drawing that is laid out again in the document's styles when it is written if its layout
 * depends on them.
 *
 * @param create - Lays out and creates the drawing in the given styles
 * @param paragraphs - The paragraphs of text in the drawing, other than those written for `text`, or nothing if the
 * drawing's layout doesn't depend on the document's styles
 */
export const createStyledDrawing = (create: (styles: TextStyles) => XmlComponent, paragraphs?: readonly Paragraph[]): XmlComponent =>
    paragraphs ? new StyledDrawing(create, paragraphs) : create(WORD_DEFAULT_STYLES);
