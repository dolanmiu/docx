import { describe, expect, it } from "vitest";

import {
    AlignmentType,
    BorderStyle,
    HeightRule,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlignTable,
    WidthType,
} from "docx";
import { formatted } from "tests/html";

import { htmlToContent } from "./html-to-content";

const html = (source: string): string => formatted(htmlToContent(source));
const text = (value: string, options: Omit<ConstructorParameters<typeof TextRun>[0] & object, "children" | "text"> = {}): TextRun =>
    new TextRun({ ...options, children: [value] });
const cell = (value: string, options: Omit<ConstructorParameters<typeof TableCell>[0], "children"> = {}): TableCell =>
    new TableCell({ ...options, children: value === "" ? [] : [new Paragraph({ children: [text(value)] })] });
const row = (...cells: readonly TableCell[]): TableRow => new TableRow({ children: cells });
const NONE = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;
const SINGLE = { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 0 } as const;

/** The text of each cell of each row of the first table, as Word reads them, with merged cells' continuations as "^" */
const grid = (source: string): readonly (readonly string[])[] => {
    const written = html(source);
    return [...written.matchAll(/<w:tr>(.*?)<\/w:tr>/g)].map(([, cells]) =>
        [...cells.matchAll(/<w:tc>(.*?)<\/w:tc>/g)].map(([, content]) => {
            const span = /<w:gridSpan w:val="(\d+)"\/>/.exec(content)?.[1];
            const continued = content.includes('<w:vMerge w:val="continue"/>');
            const value = [...content.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(([, part]) => part).join("");
            return `${continued ? "^" : value}${span ? `*${span}` : ""}`;
        }),
    );
};

describe("htmlToContent: tables", () => {
    it("writes a table with its rows and cells, with Word's borders when the HTML gives it none", () => {
        expect(html("<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>")).toBe(
            formatted([new Table({ rows: [row(cell("a"), cell("b")), row(cell("c"), cell("d"))] })]),
        );
    });

    it("writes <th> bold and centred, as a browser does", () => {
        expect(html("<table><tr><th>a</th></tr></table>")).toBe(
            formatted([
                new Table({
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("a", { bold: true })] })],
                                }),
                            ],
                        }),
                    ],
                }),
            ]),
        );
    });

    it("places cells as HTML does, each in the first column cells above don't span", () => {
        expect(
            grid(
                '<table><tr><td rowspan="2">a</td><td colspan="2">b</td></tr><tr><td>c</td><td>d</td></tr><tr><td>e</td><td>f</td><td>g</td></tr></table>',
            ),
        ).toEqual([
            ["a", "b*2"],
            ["^", "c", "d"],
            ["e", "f", "g"],
        ]);
    });

    it("merges cells across rows and columns at once", () => {
        expect(grid('<table><tr><td rowspan="2" colspan="2">a</td><td>b</td></tr><tr><td>c</td></tr></table>')).toEqual([
            ["a*2", "b"],
            ["^*2", "c"],
        ]);
    });

    it("gives rows with fewer cells empty cells at their end, so each has as many columns as the table", () => {
        expect(
            grid("<table><tr><th>a</th><th>b</th><th>c</th></tr><tr><td>d</td><td>e</td></tr><tr></tr><tr><td>f</td></tr></table>"),
        ).toEqual([
            ["a", "b", "c"],
            ["d", "e", ""],
            ["", "", ""],
            ["f", "", ""],
        ]);
    });

    it("gives a row the cells it needs around those that cells above span", () => {
        expect(grid('<table><tr><td>a</td><td>b</td><td rowspan="2">c</td></tr><tr><td>d</td></tr></table>')).toEqual([
            ["a", "b", "c"],
            ["d", "", "^"],
        ]);
    });

    it("spans the rest of the rows' group with rowspan=0, and no further than the group with a bigger rowspan", () => {
        expect(
            grid(
                '<table><tbody><tr><td rowspan="0">a</td><td>b</td></tr><tr><td>c</td></tr></tbody><tbody><tr><td rowspan="9">d</td><td>e</td></tr></tbody></table>',
            ),
        ).toEqual([
            ["a", "b"],
            ["^", "c"],
            ["d", "e"],
        ]);
    });

    it("reads a colspan or rowspan that isn't a number, or is negative, as 1, and a colspan of more than a thousand as a thousand", () => {
        expect(grid('<table><tr><td colspan="x">a</td><td rowspan="-2">b</td><td colspan="0">c</td></tr></table>')).toEqual([
            ["a", "b", "c"],
        ]);
        expect(grid('<table><tr><td colspan="5000">a</td></tr></table>')[0]).toEqual(["a*1000"]);
    });

    it("writes rows in order: the head first, then the bodies, then the foot, wherever they are in the HTML", () => {
        expect(
            grid(
                "<table><tfoot><tr><td>foot</td></tr></tfoot><tbody><tr><td>body</td></tr></tbody><thead><tr><td>head</td></tr></thead></table>",
            ),
        ).toEqual([["head"], ["body"], ["foot"]]);
    });

    it("repeats the head's rows at the top of each page", () => {
        expect(html("<table><thead><tr><td>a</td></tr></thead><tbody><tr><td>b</td></tr></tbody></table>")).toBe(
            formatted([new Table({ rows: [new TableRow({ tableHeader: true, children: [cell("a")] }), row(cell("b"))] })]),
        );
    });

    it("repeats rows of only <th> at the top of a table with no head, as Markdown's tables have them", () => {
        const written = html("<table><tr><th>a</th></tr><tr><th>b</th></tr><tr><td>c</td></tr><tr><th>d</th></tr></table>");
        expect(written.match(/<w:tblHeader\/>/g)).toHaveLength(2);
    });

    it("writes nothing for a table with no cells, and its caption", () => {
        expect(html("<table></table>")).toBe("");
        expect(html("<table><tr></tr></table>")).toBe("");
        expect(html("<table><caption>a</caption></table>")).toBe(
            formatted([new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [text("a")] })]),
        );
    });

    it("writes a page break after a caption, before the table", () => {
        expect(html('<table><caption style="break-after: page">a</caption><tr><td>b</td></tr></table>')).toMatch(
            /<w:t xml:space="preserve">a<\/w:t>.*<w:tbl>.*<w:pageBreakBefore\/>.*<w:t xml:space="preserve">b<\/w:t>/,
        );
    });

    it("gives a table the Word style of its selector in styleMap", () => {
        expect(formatted(htmlToContent("<table><tr><td>a</td></tr></table>", { styleMap: { table: "GridTable4" } }))).toContain(
            '<w:tblStyle w:val="GridTable4"/>',
        );
    });

    it("writes a caption as a centred paragraph before the table, kept with it", () => {
        expect(html("<table><caption>Results</caption><tr><td>a</td></tr></table>")).toBe(
            formatted([
                new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [text("Results")] }),
                new Table({ rows: [row(cell("a"))] }),
            ]),
        );
    });

    it("writes each cell with at least one paragraph, as Word needs, however empty it is", () => {
        expect(html("<table><tr><td></td><td> </td></tr></table>")).toBe(formatted([new Table({ rows: [row(cell(""), cell(""))] })]));
    });

    it("writes a cell's blocks, lists and tables", () => {
        const written = html("<table><tr><td><p>a</p><p>b</p><ul><li>c</li></ul><table><tr><td>d</td></tr></table></td></tr></table>");
        expect(written.match(/<w:tbl>/g)).toHaveLength(2);
        expect(written).toMatch(
            /<w:t xml:space="preserve">a<\/w:t>.*<w:t xml:space="preserve">b<\/w:t>.*<w:numPr>.*<w:t xml:space="preserve">c<\/w:t>.*<w:tbl>.*d.*<\/w:tbl><w:p\/><\/w:tc>/,
        );
    });

    it("leaves out rows, cells and row groups that CSS hides", () => {
        expect(
            grid(
                '<table><thead style="display:none"><tr><td>h</td></tr></thead><tr><td>a</td><td style="display: none">b</td></tr><tr style="display: none"><td>c</td></tr></table>',
            ),
        ).toEqual([["a"]]);
    });

    describe("borders", () => {
        it("writes no borders for border=0 and border: none", () => {
            const none = formatted([
                new Table({
                    borders: { top: NONE, right: NONE, bottom: NONE, left: NONE, insideHorizontal: NONE, insideVertical: NONE },
                    rows: [row(cell("a"))],
                }),
            ]);
            expect(html('<table border="0"><tr><td>a</td></tr></table>')).toBe(none);
            expect(html('<table style="border: none"><tr><td style="border: none">a</td></tr></table>')).toBe(
                formatted([
                    new Table({
                        borders: { top: NONE, right: NONE, bottom: NONE, left: NONE, insideHorizontal: NONE, insideVertical: NONE },
                        rows: [row(cell("a"))],
                    }),
                ]),
            );
        });

        it("writes a table's border attribute around it and its cells", () => {
            const outer = { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 0 };
            expect(html('<table border="2"><tr><td>a</td></tr></table>')).toBe(
                formatted([
                    new Table({
                        borders: { top: outer, right: outer, bottom: outer, left: outer, insideHorizontal: NONE, insideVertical: NONE },
                        rows: [row(cell("a", { borders: { top: SINGLE, right: SINGLE, bottom: SINGLE, left: SINGLE } }))],
                    }),
                ]),
            );
        });

        it("writes a border attribute with no number as a border of one pixel", () => {
            const side = { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 0 };
            expect(html("<table border><tr><td>a</td></tr></table>")).toContain(
                '<w:top w:val="single" w:color="000000" w:sz="6" w:space="0"/>',
            );
            expect(side.size).toBe(6);
        });

        it("writes cells' CSS borders on the cells, with no borders inside the table but theirs", () => {
            const red = { style: BorderStyle.DASHED, size: 12, color: "FF0000", space: 0 };
            expect(html("<style>td { border: 2px dashed red }</style><table><tr><td>a</td></tr></table>")).toBe(
                formatted([
                    new Table({
                        borders: { top: NONE, right: NONE, bottom: NONE, left: NONE, insideHorizontal: NONE, insideVertical: NONE },
                        rows: [row(cell("a", { borders: { top: red, right: red, bottom: red, left: red } }))],
                    }),
                ]),
            );
        });

        it("writes a cell's border on one side, and none on the others", () => {
            expect(html('<table><tr><td style="border-bottom: 1px solid #000">a</td></tr></table>')).toBe(
                formatted([
                    new Table({
                        borders: { top: NONE, right: NONE, bottom: NONE, left: NONE, insideHorizontal: NONE, insideVertical: NONE },
                        rows: [row(cell("a", { borders: { top: NONE, right: NONE, bottom: SINGLE, left: NONE } }))],
                    }),
                ]),
            );
        });

        it("keeps a merged cell's borders on the rows it spans", () => {
            const written = html('<table border="1"><tr><td rowspan="2">a</td><td>b</td></tr><tr><td>c</td></tr></table>');
            const continuation = /<w:tc><w:tcPr><w:vMerge w:val="continue"\/><w:tcBorders><w:top w:val="single"/.exec(written);
            expect(continuation).not.toBeNull();
        });
    });

    describe("cells' formatting", () => {
        it("writes a cell's background, or its row's, or its table's", () => {
            const shading = (fill: string) => ({ type: ShadingType.CLEAR, fill, color: "auto" }) as const;
            expect(
                html(
                    '<table style="background: #eee"><tr style="background-color: #ddd"><td style="background-color: #ccc">a</td><td>b</td></tr><tr><td bgcolor="#bbbbbb">c</td><td>d</td></tr></table>',
                ),
            ).toBe(
                formatted([
                    new Table({
                        rows: [
                            row(cell("a", { shading: shading("CCCCCC") }), cell("b", { shading: shading("DDDDDD") })),
                            row(cell("c", { shading: shading("BBBBBB") }), cell("d", { shading: shading("EEEEEE") })),
                        ],
                    }),
                ]),
            );
        });

        it("writes a cell's vertical alignment, or its row's", () => {
            expect(
                html(
                    '<table><tr valign="bottom"><td style="vertical-align: middle">a</td><td>b</td><td valign="top">c</td><td style="vertical-align: baseline">d</td></tr></table>',
                ),
            ).toBe(
                formatted([
                    new Table({
                        rows: [
                            row(
                                cell("a", { verticalAlign: VerticalAlignTable.CENTER }),
                                cell("b", { verticalAlign: VerticalAlignTable.BOTTOM }),
                                cell("c", { verticalAlign: VerticalAlignTable.TOP }),
                                cell("d", { verticalAlign: VerticalAlignTable.BOTTOM }),
                            ),
                        ],
                    }),
                ]),
            );
        });

        it("writes a cell's padding as its margins, and its table's cellpadding", () => {
            expect(html('<table cellpadding="5"><tr><td>a</td><td style="padding: 2pt 4pt">b</td></tr></table>')).toBe(
                formatted([
                    new Table({
                        rows: [
                            row(
                                cell("a", { margins: { top: 75, right: 75, bottom: 75, left: 75 } }),
                                cell("b", { margins: { top: 40, right: 80, bottom: 40, left: 80 } }),
                            ),
                        ],
                    }),
                ]),
            );
        });

        it("writes cells' widths in twips and percentages", () => {
            expect(html('<table><tr><td width="100">a</td><td style="width: 50%">b</td><td style="width: 1in">c</td></tr></table>')).toBe(
                formatted([
                    new Table({
                        rows: [
                            row(
                                cell("a", { width: { size: 1500, type: WidthType.DXA } }),
                                cell("b", { width: { size: "50%", type: WidthType.PERCENTAGE } }),
                                cell("c", { width: { size: 1440, type: WidthType.DXA } }),
                            ),
                        ],
                    }),
                ]),
            );
        });

        it("writes a cell's text-align on its paragraphs, and its row's", () => {
            expect(html('<table><tr align="right"><td>a</td><td style="text-align: center">b</td></tr></table>')).toBe(
                formatted([
                    new Table({
                        rows: [
                            row(
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [text("a")] })] }),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [text("b")] })] }),
                            ),
                        ],
                    }),
                ]),
            );
        });

        it("writes a row's height, or its cells' greatest, as its least height", () => {
            expect(
                html(
                    '<table><tr style="height: 20pt"><td>a</td></tr><tr><td height="40">b</td><td style="height: 10pt">c</td></tr></table>',
                ),
            ).toBe(
                formatted([
                    new Table({
                        rows: [
                            new TableRow({ height: { value: 400, rule: HeightRule.ATLEAST }, children: [cell("a"), cell("")] }),
                            new TableRow({ height: { value: 600, rule: HeightRule.ATLEAST }, children: [cell("b"), cell("c")] }),
                        ],
                    }),
                ]),
            );
        });

        it("leaves a cell with nowrap unwrapped", () => {
            expect(html("<table><tr><td nowrap>a b</td></tr></table>")).toContain('<w:t xml:space="preserve">a b</w:t>');
        });

        it("keeps a row on one page with break-inside: avoid", () => {
            expect(html('<table><tr style="break-inside: avoid"><td>a</td></tr></table>')).toBe(
                formatted([new Table({ rows: [new TableRow({ cantSplit: true, children: [cell("a")] })] })]),
            );
        });

        it("doesn't indent a cell's paragraphs by its padding, which is its margins", () => {
            expect(html('<table><tr><td style="padding-left: 20pt"><p>a</p></td></tr></table>')).toBe(
                formatted([new Table({ rows: [row(cell("a", { margins: { top: 0, right: 0, bottom: 0, left: 400 } }))] })]),
            );
        });
    });

    describe("table formatting", () => {
        it("writes a table's width in twips or a percentage", () => {
            expect(html('<table width="100%"><tr><td>a</td></tr></table><table style="width: 300px"><tr><td>b</td></tr></table>')).toBe(
                formatted([
                    new Table({ width: { size: "100%", type: WidthType.PERCENTAGE }, rows: [row(cell("a"))] }),
                    new Table({ width: { size: 4500, type: WidthType.DXA }, rows: [row(cell("b"))] }),
                ]),
            );
        });

        it("centres a table with margin: auto or align=center, and puts it on the right with align=right", () => {
            expect(
                html(
                    '<table style="margin: 0 auto"><tr><td>a</td></tr></table><table align="center"><tr><td>b</td></tr></table><table align="right"><tr><td>c</td></tr></table>',
                ),
            ).toBe(
                formatted([
                    new Table({ alignment: AlignmentType.CENTER, rows: [row(cell("a"))] }),
                    new Table({ alignment: AlignmentType.CENTER, rows: [row(cell("b"))] }),
                    new Table({ alignment: AlignmentType.RIGHT, rows: [row(cell("c"))] }),
                ]),
            );
        });

        it("indents a table by its margin and the blocks it is in", () => {
            expect(html('<blockquote><table style="margin-left: 10pt"><tr><td>a</td></tr></table></blockquote>')).toBe(
                formatted([new Table({ indent: { size: 920, type: WidthType.DXA }, rows: [row(cell("a"))] })]),
            );
        });

        it("writes table-layout: fixed, a right-to-left table, and the column widths of its <col>s", () => {
            expect(
                html(
                    '<table style="table-layout: fixed" dir="rtl"><colgroup><col width="100"><col style="width: 200px"></colgroup><tr><td>a</td><td>b</td></tr></table>',
                ),
            ).toBe(
                formatted([
                    new Table({
                        layout: TableLayoutType.FIXED,
                        visuallyRightToLeft: true,
                        columnWidths: [1500, 3000],
                        rows: [
                            row(
                                new TableCell({
                                    children: [new Paragraph({ bidirectional: true, children: [text("a", { rightToLeft: true })] })],
                                }),
                                new TableCell({
                                    children: [new Paragraph({ bidirectional: true, children: [text("b", { rightToLeft: true })] })],
                                }),
                            ),
                        ],
                    }),
                ]),
            );
        });

        it("writes the widths of <col>s that span columns, and leaves out <col>s that don't give every column a width", () => {
            expect(html('<table><col span="2" width="50"><tr><td>a</td><td>b</td></tr></table>')).toContain(
                '<w:gridCol w:w="750"/><w:gridCol w:w="750"/>',
            );
            expect(html('<table><col span="x" width="50"><col width="60"><tr><td>a</td><td>b</td></tr></table>')).toContain(
                '<w:gridCol w:w="750"/><w:gridCol w:w="900"/>',
            );
            expect(html('<table><colgroup span="2" width="60"></colgroup><tr><td>a</td><td>b</td></tr></table>')).toContain(
                '<w:gridCol w:w="900"/><w:gridCol w:w="900"/>',
            );
            expect(html('<table><col width="50"><tr><td>a</td><td>b</td></tr></table>')).toBe(
                html("<table><tr><td>a</td><td>b</td></tr></table>"),
            );
            expect(html('<table><col width="50%"><col><tr><td>a</td><td>b</td></tr></table>')).toBe(
                html("<table><tr><td>a</td><td>b</td></tr></table>"),
            );
        });

        it("puts a page break before a table in its first cell, and one after it in the next paragraph", () => {
            expect(
                html('<p>a</p><table style="page-break-before: always; page-break-after: always"><tr><td>b</td></tr></table><p>c</p>'),
            ).toBe(
                formatted([
                    new Paragraph({ children: [text("a")] }),
                    new Table({
                        rows: [row(new TableCell({ children: [new Paragraph({ pageBreakBefore: true, children: [text("b")] })] }))],
                    }),
                    new Paragraph({ pageBreakBefore: true, children: [text("c")] }),
                ]),
            );
        });

        it("writes text the HTML has in a table but not in a cell before the table, as HTML parses it", () => {
            expect(grid("<table>stray<tr><td>a</td></tr></table>")).toEqual([["a"]]);
            expect(html("<table>stray<tr><td>a</td></tr></table>")).toMatch(
                /^<w:p><w:r><w:t xml:space="preserve">stray<\/w:t><\/w:r><\/w:p><w:tbl>/,
            );
        });
    });
});
