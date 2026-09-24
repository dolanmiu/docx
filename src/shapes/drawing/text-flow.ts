/**
 * Text that flows from one shape to the next (`wps:txbx` with an `id`, and `wps:linkedTxbx`), as in a newsletter whose
 * article continues in another text box.
 *
 * Reference: ECMA-376 Part 1, 20.4.2.37 txbx (Textual Contents of Shape) and 20.4.2.18 linkedTxbx (Linked Textbox)
 *
 * @module
 */
// cspell:ignore txbx Txbx
import { BuilderElement, type IContext, type IXmlableObject, type Paragraph, XmlComponent } from "docx";

// A stand-in for the document when a shape is written without one
const NO_DOCUMENT = {};

// The shapes of each document's text flows, by name, in the order they were first written
const flows = new WeakMap<object, ReadonlyMap<string, readonly object[]>>();

/**
 * The text box of a shape in a text flow. The first shape of the flow written in a document has the text, and the
 * shapes after it continue it, in the order they are written. A document numbers its flows from 1, in the order they
 * are first written, so writing a document twice writes the same flows.
 */
class TextFlowBox extends XmlComponent {
    public constructor(
        private readonly flow: string,
        private readonly children: readonly Paragraph[],
    ) {
        super("wps:txbx");
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        const document = (context as Partial<IContext>).file ?? NO_DOCUMENT;
        const byName = flows.get(document) ?? new Map<string, readonly object[]>();
        const shapes = byName.get(this.flow) ?? [];
        const written = shapes.includes(this) ? byName : new Map([...byName, [this.flow, [...shapes, this]]]);
        flows.set(document, written);

        const id = [...written.keys()].indexOf(this.flow) + 1;
        const sequence = written.get(this.flow)!.indexOf(this);
        return (
            sequence === 0
                ? new BuilderElement<{ readonly id: number }>({
                      name: "wps:txbx",
                      attributes: { id: { key: "id", value: id } },
                      children: [new BuilderElement({ name: "w:txbxContent", children: [...this.children] })],
                  })
                : new BuilderElement<{ readonly id: number; readonly sequence: number }>({
                      name: "wps:linkedTxbx",
                      attributes: { id: { key: "id", value: id }, sequence: { key: "seq", value: sequence } },
                  })
        ).prepForXml(context);
    }
}

/**
 * Creates the text box of a shape in a text flow: the flow's text in the first shape of the flow in the document, and
 * a link to it in the shapes after it.
 *
 * @param flow - The flow's name
 * @param children - The flow's paragraphs, which the first shape of the flow writes
 */
export const createTextFlowBox = (flow: string, children: readonly Paragraph[]): XmlComponent => new TextFlowBox(flow, children);
