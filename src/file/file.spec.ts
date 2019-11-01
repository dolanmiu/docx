import { expect } from "chai";
import * as sinon from "sinon";

import { Formatter } from "export/formatter";

import { File } from "./file";
import { Footer, Header } from "./header";
import { Paragraph } from "./paragraph";
import { Table, TableCell, TableRow } from "./table";
import { TableOfContents } from "./table-of-contents";

describe("File", () => {
    describe("#constructor", () => {
        it("should create with correct headers and footers by default", () => {
            const doc = new File();

            doc.addSection({
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][1]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][1]["w:sectPr"][5]["w:footerReference"]._attr["w:type"]).to.equal("default");
        });

        it("should create with correct headers and footers", () => {
            const doc = new File();

            doc.addSection({
                headers: {
                    default: new Header(),
                },
                footers: {
                    default: new Footer(),
                },
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][1]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][1]["w:sectPr"][5]["w:footerReference"]._attr["w:type"]).to.equal("default");
        });

        it("should create with first headers and footers", () => {
            const doc = new File();

            doc.addSection({
                headers: {
                    first: new Header(),
                },
                footers: {
                    first: new Footer(),
                },
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][1]["w:sectPr"][5]["w:headerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][1]["w:sectPr"][7]["w:footerReference"]._attr["w:type"]).to.equal("first");
        });

        it("should create with correct headers", () => {
            const doc = new File();

            doc.addSection({
                headers: {
                    default: new Header(),
                    first: new Header(),
                    even: new Header(),
                },
                footers: {
                    default: new Footer(),
                    first: new Footer(),
                    even: new Footer(),
                },
                children: [],
            });

            const tree = new Formatter().format(doc.Document.Body);

            expect(tree["w:body"][1]["w:sectPr"][4]["w:headerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][1]["w:sectPr"][5]["w:headerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][1]["w:sectPr"][6]["w:headerReference"]._attr["w:type"]).to.equal("even");

            expect(tree["w:body"][1]["w:sectPr"][7]["w:footerReference"]._attr["w:type"]).to.equal("default");
            expect(tree["w:body"][1]["w:sectPr"][8]["w:footerReference"]._attr["w:type"]).to.equal("first");
            expect(tree["w:body"][1]["w:sectPr"][9]["w:footerReference"]._attr["w:type"]).to.equal("even");
        });
    });

    describe("#addSection", () => {
        it("should call the underlying document's add a Paragraph", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            file.addSection({
                children: [new Paragraph({})],
            });

            expect(spy.called).to.equal(true);
        });

        it("should call the underlying document's add when adding a Table", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            file.addSection({
                children: [
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph("hello")],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            });

            expect(spy.called).to.equal(true);
        });

        it("should call the underlying document's add when adding an Image (paragraph)", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            // tslint:disable-next-line:no-any
            file.addSection({
                children: [new Paragraph("")],
            });

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addSection", () => {
        it("should call the underlying document's add", () => {
            const file = new File();
            const spy = sinon.spy(file.Document, "add");
            file.addSection({
                children: [new TableOfContents()],
            });

            expect(spy.called).to.equal(true);
        });
    });

    describe("#createFootnote", () => {
        it("should call the underlying document's createFootnote", () => {
            const wrapper = new File();
            const spy = sinon.spy(wrapper.FootNotes, "createFootNote");
            wrapper.createFootnote(new Paragraph(""));

            expect(spy.called).to.equal(true);
        });
    });
});
