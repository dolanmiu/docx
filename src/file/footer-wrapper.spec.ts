import { expect } from "chai";
import * as sinon from "sinon";

import { FooterWrapper } from "./footer-wrapper";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Table } from "./table";

describe("FooterWrapper", () => {
    describe("#addParagraph", () => {
        it("should call the underlying footer's addParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "addParagraph");
            file.addParagraph(new Paragraph({}));

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addTable", () => {
        it("should call the underlying footer's addParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "addTable");
            file.addTable(
                new Table({
                    rows: 1,
                    columns: 1,
                }),
            );

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addImage", () => {
        it("should call the underlying footer's addImage", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "addParagraph");
            // tslint:disable-next-line:no-any
            file.addImage({} as any);

            expect(spy.called).to.equal(true);
        });
    });

    describe("#createImage", () => {
        it("should call the underlying footer's createImage", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(Media, "addImage");
            file.createImage("");

            expect(spy.called).to.equal(true);
            spy.restore();
        });
    });

    describe("#addChildElement", () => {
        it("should call the underlying footer's addChildElement", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "addChildElement");
            // tslint:disable-next-line:no-any
            file.addChildElement({} as any);

            expect(spy.called).to.equal(true);
        });
    });
});
