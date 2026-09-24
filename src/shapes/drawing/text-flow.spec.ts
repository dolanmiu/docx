import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { type IContext, type IXmlableObject, Paragraph } from "docx";

import { ShapeRun } from "../shape-run";

// The text box of a shape in its drawing, and its text properties
const textOf = (tree: IXmlableObject): readonly IXmlableObject[] => {
    const shape = tree["w:r"][0]["w:drawing"][0]["wp:inline"].find((child: object) => "a:graphic" in child)["a:graphic"][1][
        "a:graphicData"
    ][1]["wps:wsp"] as readonly IXmlableObject[];
    return shape.slice(2);
};

const flowing = (flow: string, text?: string): ShapeRun =>
    new ShapeRun({ type: "rectangle", transformation: { width: 100, height: 50 }, text, textFlow: flow });

describe("text flows", () => {
    it("should put the text in the first shape of a flow, and link the shapes after it to it, in the order they are written", () => {
        const context = { file: new File({ sections: [] }), stack: [] } as unknown as IContext;
        const first = flowing("article", "A long article");
        const second = flowing("article");
        const sidebar = flowing("sidebar", "A sidebar");
        const third = flowing("article");

        const [box, properties] = textOf(new Formatter().format(first, context));
        expect(box["wps:txbx"][0]).to.deep.equal({ _attr: { id: 1 } });
        expect(box["wps:txbx"][1]["w:txbxContent"]).to.have.length(1);
        // Text starts at the top of the first shape, and flows on from its bottom
        expect(properties).to.deep.equal({ "wps:bodyPr": { _attr: {} } });

        expect(textOf(new Formatter().format(second, context))[0]).to.deep.equal({ "wps:linkedTxbx": { _attr: { id: 1, seq: 1 } } });
        expect(textOf(new Formatter().format(sidebar, context))[0]["wps:txbx"][0]).to.deep.equal({ _attr: { id: 2 } });
        expect(textOf(new Formatter().format(third, context))[0]).to.deep.equal({ "wps:linkedTxbx": { _attr: { id: 1, seq: 2 } } });

        // Writing the document again writes the same flows
        expect(textOf(new Formatter().format(second, context))[0]).to.deep.equal({ "wps:linkedTxbx": { _attr: { id: 1, seq: 1 } } });
        expect(textOf(new Formatter().format(first, context))[0]["wps:txbx"][0]).to.deep.equal({ _attr: { id: 1 } });

        // In another document, the flows start again
        const other = { file: new File({ sections: [] }), stack: [] } as unknown as IContext;
        expect(textOf(new Formatter().format(third, other))[0]["wps:txbx"][0]).to.deep.equal({ _attr: { id: 1 } });
    });

    it("should write a flow without a document, and give the first shape of a flow its paragraphs", () => {
        const shape = new ShapeRun({
            type: "rectangle",
            transformation: { width: 100, height: 50 },
            children: [new Paragraph("One"), new Paragraph("Two")],
            textFlow: "notes",
        });
        const [box] = textOf(new Formatter().format(shape));
        expect(box["wps:txbx"][1]["w:txbxContent"]).to.have.length(2);
    });
});
