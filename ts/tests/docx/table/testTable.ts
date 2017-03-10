import { expect } from "chai";
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
            table.getRow(0).getCell(0).content.createTextRun("A1");
            table.getRow(0).getCell(1).content.createTextRun("B1");
            table.getRow(1).getCell(0).content.createTextRun("A2");
            table.getRow(1).getCell(1).content.createTextRun("B2");
            const tree = new Formatter().format(table);
            const cell = (c) => ({"w:tc": [
                {"w:tcPr": []},
                {"w:p": [
                    {"w:pPr": []},
                    {"w:r": [{"w:rPr": []}, {"w:t": [c]}]},
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
            table.getCell(0, 0).content.createTextRun("A1");
            table.getCell(0, 1).content.createTextRun("B1");
            table.getCell(1, 0).content.createTextRun("A2");
            table.getCell(1, 1).content.createTextRun("B2");
            const tree = new Formatter().format(table);
            const cell = (c) => ({"w:tc": [
                {"w:tcPr": []},
                {"w:p": [
                    {"w:pPr": []},
                    {"w:r": [{"w:rPr": []}, {"w:t": [c]}]},
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
            const table = new Table(2, 2).setWidth("pct", 1000)
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    {"w:tblW": [{_attr: {"w:type": "pct", "w:w": 1000}}]},
                ],
            });
        });
    });
});
