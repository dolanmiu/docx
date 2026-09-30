import { describe, expect, it } from "vitest";
import { js2xml } from "xml-js";

import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import { Paragraph, TextRun } from "@file/paragraph";

import type { IPatch, TableRowsPatch } from "./from-docx";
import { PatchType } from "./patch-type";
import { replacer } from "./replacer";
import { patchTableRows } from "./table-rows";
import { traverse } from "./traverser";
import { toJson } from "./util";

const context = { file: {} as unknown as File, viewWrapper: { Relationships: {} } as unknown as IViewWrapper, stack: [] };

const text = (value: string): IPatch => ({ type: PatchType.PARAGRAPH, children: [new TextRun(value)] });

const cell = (value: string): string => `<w:tc><w:p><w:r><w:t>${value}</w:t></w:r></w:p></w:tc>`;
const row = (...values: readonly string[]): string => `<w:tr>${values.map(cell).join("")}</w:tr>`;
const table = (...rows: readonly string[]): string => `<w:tbl><w:tblPr/><w:tblGrid/>${rows.join("")}</w:tbl>`;

// Patches the body, as patchDocument patches a part, and returns it
const patchBody = (
    body: string,
    patches: Readonly<Record<string, TableRowsPatch>>,
    delimiters: { readonly start: string; readonly end: string } = { start: "{{", end: "}}" },
): ReturnType<typeof toJson> => {
    const json = toJson(`<w:body>${body}</w:body>`);
    const patchPlaceholder = (element: ReturnType<typeof toJson>, key: string, patch: IPatch | TableRowsPatch): void => {
        if (patch.type === PatchType.TABLE_ROWS) {
            patchTableRows({ json: element, key, patch, delimiters, patchPlaceholder });
        } else {
            replacer({ json: element, patch, patchText: `${delimiters.start}${key}${delimiters.end}`, context });
        }
    };
    for (const [key, patch] of Object.entries(patches)) {
        patchPlaceholder(json, key, patch);
    }
    return json;
};

// The text of each cell of each row of each table in the body, not counting the tables in cells
const tablesOf = (json: ReturnType<typeof toJson>): readonly (readonly (readonly string[])[])[] =>
    json
        .elements![0].elements!.filter((e) => e.name === "w:tbl")
        .map((t) =>
            t.elements!.filter((e) => e.name === "w:tr").map((r) => r.elements!.map((c) => traverse({ elements: [c] })[0]?.text ?? "")),
        );

const xmlOf = (json: ReturnType<typeof toJson>): string => js2xml(json);

const ITEMS: TableRowsPatch = {
    type: PatchType.TABLE_ROWS,
    rows: [
        { name: text("Apples"), price: text("1.20") },
        { name: text("Pears"), price: text("0.90") },
    ],
};

describe("patchTableRows", () => {
    it("should repeat the row that holds the fields once for each row, keeping the rows around it", () => {
        const json = patchBody(table(row("Name", "Price"), row("{{items.name}}", "{{items.price}}"), row("Total", "2.10")), {
            items: ITEMS,
        });

        expect(tablesOf(json)).to.deep.equal([
            [
                ["Name", "Price"],
                ["Apples", "1.20"],
                ["Pears", "0.90"],
                ["Total", "2.10"],
            ],
        ]);
    });

    it("should keep the text around a field, and patch a field that is more than once in a row", () => {
        const json = patchBody(table(row("{{items.name}} ({{items.name}})", "£{{items.price}}")), { items: ITEMS });

        expect(tablesOf(json)).to.deep.equal([
            [
                ["Apples (Apples)", "£1.20"],
                ["Pears (Pears)", "£0.90"],
            ],
        ]);
    });

    it("should find a field that is split across runs, as Word often writes it", () => {
        const json = patchBody(
            table(`<w:tr><w:tc><w:p><w:r><w:t>{{items.</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>name}}</w:t></w:r></w:p></w:tc></w:tr>`),
            { items: ITEMS },
        );

        expect(tablesOf(json)).to.deep.equal([[["Apples"], ["Pears"]]]);
    });

    it("should patch a field with a document patch, such as with more than one paragraph", () => {
        const json = patchBody(table(row("{{items.notes}}")), {
            items: {
                type: PatchType.TABLE_ROWS,
                rows: [{ notes: { type: PatchType.DOCUMENT, children: [new Paragraph("First"), new Paragraph("Second")] } }],
            },
        });

        const cellElement = json.elements![0].elements![0].elements!.find((e) => e.name === "w:tr")!.elements![0];
        expect(traverse({ elements: [cellElement] }).map((p) => p.text)).to.deep.equal(["First", "Second"]);
    });

    it("should leave a field empty when a row has no patch for it, or one that is undefined", () => {
        const json = patchBody(table(row("{{items.name}}", "{{items.price}}")), {
            items: { type: PatchType.TABLE_ROWS, rows: [{ name: text("Apples") }, { name: text("Pears"), price: undefined }] },
        });

        expect(tablesOf(json)).to.deep.equal([
            [
                ["Apples", ""],
                ["Pears", ""],
            ],
        ]);
    });

    it("should not treat a field named as a property of every object, such as constructor, as given", () => {
        const json = patchBody(table(row("{{items.constructor}}")), { items: { type: PatchType.TABLE_ROWS, rows: [{}] } });

        expect(tablesOf(json)).to.deep.equal([[[""]]]);
    });

    it("should remove the rows when there are none, keeping the table's other rows", () => {
        const json = patchBody(table(row("Name"), row("{{items.name}}")), { items: { type: PatchType.TABLE_ROWS, rows: [] } });

        expect(tablesOf(json)).to.deep.equal([[["Name"]]]);
    });

    it("should remove a table that is left with no rows, as Word won't open it", () => {
        const json = patchBody(`<w:p/>${table(row("{{items.name}}"))}<w:p/>`, { items: { type: PatchType.TABLE_ROWS, rows: [] } });

        expect(json.elements![0].elements!.map((e) => e.name)).to.deep.equal(["w:p", "w:p"]);
    });

    it("should repeat rows next to each other together, such as a row for an item and a row for its notes", () => {
        const json = patchBody(table(row("Name", "Price"), row("{{items.name}}", "{{items.price}}"), row("{{items.notes}}", "")), {
            items: {
                type: PatchType.TABLE_ROWS,
                rows: [
                    { name: text("Apples"), price: text("1.20"), notes: text("Crisp") },
                    { name: text("Pears"), price: text("0.90"), notes: text("Ripe") },
                ],
            },
        });

        expect(tablesOf(json)).to.deep.equal([
            [
                ["Name", "Price"],
                ["Apples", "1.20"],
                ["Crisp", ""],
                ["Pears", "0.90"],
                ["Ripe", ""],
            ],
        ]);
    });

    it("should copy what is between rows repeated together, and a bookmark's end there only once", () => {
        const json = patchBody(
            `<w:tbl><w:tblPr/><w:tblGrid/>${row("{{items.name}}")}<w:proofErr w:type="spellStart"/><w:bookmarkEnd w:id="1"/>` +
                `${row("{{items.price}}")}${row("End")}</w:tbl>`,
            { items: ITEMS },
        );

        const names = json.elements![0].elements![0].elements!.map((e) => e.name);
        expect(names).to.deep.equal([
            "w:tblPr",
            "w:tblGrid",
            "w:tr",
            "w:proofErr",
            "w:bookmarkEnd",
            "w:tr",
            "w:tr",
            "w:proofErr",
            "w:tr",
            "w:tr",
        ]);
    });

    it("should repeat rows apart from each other in a table separately", () => {
        const json = patchBody(table(row("{{items.name}}"), row("Between"), row("{{items.price}}")), { items: ITEMS });

        expect(tablesOf(json)).to.deep.equal([[["Apples"], ["Pears"], ["Between"], ["1.20"], ["0.90"]]]);
    });

    it("should repeat the rows in each table that holds the fields", () => {
        const json = patchBody(`${table(row("{{items.name}}"))}<w:p/>${table(row("{{items.price}}"))}`, { items: ITEMS });

        expect(tablesOf(json)).to.deep.equal([
            [["Apples"], ["Pears"]],
            [["1.20"], ["0.90"]],
        ]);
    });

    it("should repeat rows in a content control, in it", () => {
        const json = patchBody(
            `<w:tbl><w:tblPr/><w:tblGrid/><w:sdt><w:sdtPr/><w:sdtContent>${row("{{items.name}}")}</w:sdtContent></w:sdt></w:tbl>`,
            {
                items: ITEMS,
            },
        );

        const content = json.elements![0].elements![0].elements![2].elements![1];
        expect(content.elements!.map((r) => traverse({ elements: [r] })[0].text)).to.deep.equal(["Apples", "Pears"]);
    });

    it("should keep what must be unique in the document, such as bookmarks and Word's paragraph ids, in the first copy only", () => {
        const json = patchBody(
            table(
                `<w:tr w14:paraId="00000001" w14:textId="00000002"><w:tc>` +
                    `<w:sdt><w:sdtPr><w:id w:val="7"/><w:tag w:val="name"/></w:sdtPr><w:sdtContent>` +
                    `<w:p w14:paraId="00000003" w14:textId="00000004"><w:bookmarkStart w:id="5" w:name="item"/>` +
                    `<w:r><w:t>{{items.name}}</w:t></w:r><w:bookmarkEnd w:id="5"/></w:p>` +
                    `</w:sdtContent></w:sdt></w:tc></w:tr>`,
            ),
            { items: ITEMS },
        );

        const [first, second] = json
            .elements![0].elements![0].elements!.filter((e) => e.name === "w:tr")
            .map((r) => js2xml({ elements: [r] }));
        expect(first).to.contain('w14:paraId="00000001"').and.contain('w14:paraId="00000003"').and.contain('<w:id w:val="7"/>');
        expect(first).to.contain('<w:bookmarkStart w:id="5" w:name="item"/>').and.contain('<w:bookmarkEnd w:id="5"/>');
        expect(second).not.to.match(/paraId|textId|w:id|bookmark/);
        // What doesn't need to be unique is kept
        expect(second).to.contain('<w:tag w:val="name"/>');
        expect(traverse({ elements: [toJson(second)] })[0].text).to.equal("Pears");
    });

    it("should copy a row in a table in a repeated row with it, and repeat its rows with a table rows patch for its field", () => {
        const json = patchBody(
            table(`<w:tr>${cell("{{orders.customer}}")}<w:tc>${table(row("Item"), row("{{orders.items.name}}"))}<w:p/></w:tc></w:tr>`),
            {
                orders: {
                    type: PatchType.TABLE_ROWS,
                    rows: [
                        {
                            customer: text("Ada"),
                            items: { type: PatchType.TABLE_ROWS, rows: [{ name: text("Apples") }, { name: text("Pears") }] },
                        },
                        { customer: text("Grace"), items: { type: PatchType.TABLE_ROWS, rows: [{ name: text("Figs") }] } },
                    ],
                },
            },
        );

        const outerRows = json.elements![0].elements![0].elements!.filter((e) => e.name === "w:tr");
        // Breadth first: the cells' paragraphs, then those of the table in the second cell
        expect(outerRows.map((r) => traverse({ elements: [r] }).map((p) => p.text))).to.deep.equal([
            ["Ada", "", "Item", "Apples", "Pears"],
            ["Grace", "", "Item", "Figs"],
        ]);
    });

    it("should leave text that starts a field without a name, or without an end, as it is", () => {
        const json = patchBody(table(row("{{items.name}}", "{{items.}} {{items.price")), { items: ITEMS });

        expect(tablesOf(json)).to.deep.equal([
            [
                ["Apples", "{{items.}} {{items.price"],
                ["Pears", "{{items.}} {{items.price"],
            ],
        ]);
    });

    it("should leave a field that isn't in a table as it is", () => {
        const json = patchBody(`<w:p><w:r><w:t>{{items.name}}</w:t></w:r></w:p>`, { items: ITEMS });

        expect(traverse(json).map((p) => p.text)).to.deep.equal(["{{items.name}}"]);
    });

    it("should leave the rows of another patch as they are", () => {
        const json = patchBody(table(row("{{other.name}}"), row("{{items_extra.name}}")), { items: ITEMS });

        expect(tablesOf(json)).to.deep.equal([[["{{other.name}}"], ["{{items_extra.name}}"]]]);
    });

    it("should find fields with the placeholders' delimiters", () => {
        const json = patchBody(table(row("&lt;&lt;items.name&gt;&gt;", "{{items.price}}")), { items: ITEMS }, { start: "<<", end: ">>" });

        expect(tablesOf(json)).to.deep.equal([
            [
                ["Apples", "{{items.price}}"],
                ["Pears", "{{items.price}}"],
            ],
        ]);
    });

    it("should not change the template's rows in a patch's content", () => {
        const json = patchBody(table(row("{{items.name}}")), {
            items: { type: PatchType.TABLE_ROWS, rows: [{ name: text("{{items.name}}") }, { name: text("B") }] },
        });

        expect(xmlOf(json).match(/<w:tr>/g)).to.have.length(2);
        expect(tablesOf(json)).to.deep.equal([[["{{items.name}}"], ["B"]]]);
    });
});
