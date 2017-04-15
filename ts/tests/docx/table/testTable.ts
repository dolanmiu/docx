/* tslint:disable:no-unused-expression */
import { expect } from "chai";
import { Paragraph } from "../../../docx/paragraph";
import { Table } from "../../../docx/table";
import { Formatter } from "../../../export/formatter";

describe("Table", () => {
    describe("#constructor", () => {
        it("creates a table with the correct number of rows and columns", () => {
            const table = new Table(3, 2);
            const tree = new Formatter().format(table);
            const cell = {"w:tc": [{"w:tcPr": []}, {"w:p": [{"w:pPr": []}]}]};
            expect(tree).to.deep.equal({
                "w:tbl": [
                    {"w:tblPr": []},
                    {"w:tblGrid": [
                        {"w:gridCol": [{_attr: {"w:w": 1}}]},
                        {"w:gridCol": [{_attr: {"w:w": 1}}]},
                    ]},
                    {"w:tr": [{"w:trPr": []}, cell, cell]},
                    {"w:tr": [{"w:trPr": []}, cell, cell]},
                    {"w:tr": [{"w:trPr": []}, cell, cell]},
                ],
            });
        });
    });

    describe("#getRow and Row#getCell", () => {
        it("returns the correct row", () => {
            const table = new Table(2, 2);
            table.getRow(0).getCell(0).addContent(new Paragraph("A1"));
            table.getRow(0).getCell(1).addContent(new Paragraph("B1"));
            table.getRow(1).getCell(0).addContent(new Paragraph("A2"));
            table.getRow(1).getCell(1).addContent(new Paragraph("B2"));
            const tree = new Formatter().format(table);
            const cell = (c) => ({"w:tc": [
                {"w:tcPr": []},
                {"w:p": [
                    {"w:pPr": []},
                    {"w:r": [{"w:rPr": []}, {"w:t": [{_attr: {"xml:space": "preserve"}}, c]}]},
                ]},
            ]});
            expect(tree).to.deep.equal({
                "w:tbl": [
                    {"w:tblPr": []},
                    {"w:tblGrid": [
                        {"w:gridCol": [{_attr: {"w:w": 1}}]},
                        {"w:gridCol": [{_attr: {"w:w": 1}}]},
                    ]},
                    {"w:tr": [{"w:trPr": []}, cell("A1"), cell("B1")]},
                    {"w:tr": [{"w:trPr": []}, cell("A2"), cell("B2")]},
                ],
            });
        });
    });

    describe("#getCell", () => {
        it("returns the correct cell", () => {
            const table = new Table(2, 2);
            table.getCell(0, 0).addContent(new Paragraph("A1"));
            table.getCell(0, 1).addContent(new Paragraph("B1"));
            table.getCell(1, 0).addContent(new Paragraph("A2"));
            table.getCell(1, 1).addContent(new Paragraph("B2"));
            const tree = new Formatter().format(table);
            const cell = (c) => ({"w:tc": [
                {"w:tcPr": []},
                {"w:p": [
                    {"w:pPr": []},
                    {"w:r": [{"w:rPr": []}, {"w:t": [{_attr: {"xml:space": "preserve"}}, c]}]},
                ]},
            ]});
            expect(tree).to.deep.equal({
                "w:tbl": [
                    {"w:tblPr": []},
                    {"w:tblGrid": [
                        {"w:gridCol": [{_attr: {"w:w": 1}}]},
                        {"w:gridCol": [{_attr: {"w:w": 1}}]},
                    ]},
                    {"w:tr": [{"w:trPr": []}, cell("A1"), cell("B1")]},
                    {"w:tr": [{"w:trPr": []}, cell("A2"), cell("B2")]},
                ],
            });
        });
    });

    describe("#setWidth", () => {
        it("sets the preferred width on the table", () => {
            const table = new Table(2, 2).setWidth("pct", 1000);
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    {"w:tblW": [{_attr: {"w:type": "pct", "w:w": 1000}}]},
                ],
            });
        });
    });

    describe("#fixedWidthLayout", () => {
        it("sets the table to fixed width layout", () => {
            const table = new Table(2, 2).fixedWidthLayout();
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    {"w:tblLayout": [{_attr: {"w:type": "fixed"}}]},
                ],
            });
        });
    });

    describe("Cell", () => {
        describe("#prepForXml", () => {
            it("inserts a paragraph at the end of the cell if it is empty", () => {
                const table = new Table(1, 1);
                const tree = new Formatter().format(table);
                expect(tree).to.have.property("w:tbl").which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"]).to.be.an("array").which.has.length.at.least(1);
                expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
                    "w:tc": [
                        {"w:tcPr": []},
                        {"w:p": [{"w:pPr": []}]},
                    ],
                });
            });

            it("inserts a paragraph at the end of the cell even if it has a child table", () => {
                const parentTable = new Table(1, 1);
                parentTable.getCell(0, 0).addContent(new Table(1, 1));
                const tree = new Formatter().format(parentTable);
                expect(tree).to.have.property("w:tbl").which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"]).to.be.an("array").which.has.length.at.least(1);
                const cell = row["w:tr"].find((x) => x["w:tc"]);
                expect(cell).not.to.be.undefined;
                expect(cell["w:tc"][cell["w:tc"].length - 1]).to.deep.equal({
                    "w:p": [{"w:pPr": []}],
                });
            });

            it("does not insert a paragraph if it already ends with one", () => {
                const parentTable = new Table(1, 1);
                parentTable.getCell(0, 0).addContent(new Paragraph("Hello"));
                const tree = new Formatter().format(parentTable);
                expect(tree).to.have.property("w:tbl").which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"]).to.be.an("array").which.has.length.at.least(1);
                expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
                    "w:tc": [
                        {"w:tcPr": []},
                        {"w:p": [
                            {"w:pPr": []},
                            {"w:r": [{"w:rPr": []}, {"w:t": [{_attr: {"xml:space": "preserve"}}, "Hello"]}]},
                        ]},
                    ],
                });
            });
        });

        describe("#createParagraph", () => {
            it("inserts a new paragraph in the cell", () => {
                const table = new Table(1, 1);
                const para = table.getCell(0, 0).createParagraph("Test paragraph");
                expect(para).to.be.an.instanceof(Paragraph);
                const tree = new Formatter().format(table);
                expect(tree).to.have.property("w:tbl").which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"]).to.be.an("array").which.has.length.at.least(1);
                expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
                    "w:tc": [
                        {"w:tcPr": []},
                        {"w:p": [
                            {"w:pPr": []},
                            {"w:r": [
                                {"w:rPr": []},
                                {"w:t": [{_attr: {"xml:space": "preserve"}}, "Test paragraph"]},
                            ]},
                        ]},
                    ],
                });
            });
        });
    });
});
