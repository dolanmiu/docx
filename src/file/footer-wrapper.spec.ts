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
            file.addParagraph(new Paragraph());

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

    describe("#createTable", () => {
        it("should call the underlying footer's createTable", () => {
            const wrapper = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Footer, "createTable");
            wrapper.createTable(1, 1);

            expect(spy.called).to.equal(true);
        });
    });

    describe("#createParagraph", () => {
        it("should call the underlying footer's createParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "addParagraph");
            file.createParagraph();

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
            const spy = sinon.spy(file.Media, "addMedia");
            const fileSpy = sinon.spy(file, "addImage");
            file.createImage("");

            expect(spy.called).to.equal(true);
            expect(fileSpy.called).to.equal(true);
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
