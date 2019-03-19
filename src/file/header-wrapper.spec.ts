import { expect } from "chai";
import * as sinon from "sinon";

import { HeaderWrapper } from "./header-wrapper";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Table } from "./table";

describe("HeaderWrapper", () => {
    describe("#addParagraph", () => {
        it("should call the underlying header's addParagraph", () => {
            const wrapper = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Header, "addParagraph");
            wrapper.addParagraph(new Paragraph());

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addTable", () => {
        it("should call the underlying header's addTable", () => {
            const wrapper = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Header, "addTable");
            wrapper.addTable(
                new Table({
                    rows: 1,
                    columns: 1,
                }),
            );

            expect(spy.called).to.equal(true);
        });
    });

    describe("#createTable", () => {
        it("should call the underlying header's createTable", () => {
            const wrapper = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Header, "createTable");
            wrapper.createTable(1, 1);

            expect(spy.called).to.equal(true);
        });
    });

    describe("#createParagraph", () => {
        it("should call the underlying header's createParagraph", () => {
            const file = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(file.Header, "addParagraph");
            file.createParagraph();

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addImage", () => {
        it("should call the underlying header's addImage", () => {
            const file = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(file.Header, "addParagraph");
            // tslint:disable-next-line:no-any
            file.addImage({} as any);

            expect(spy.called).to.equal(true);
        });
    });

    describe("#createImage", () => {
        it("should call the underlying header's createImage", () => {
            const file = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(file.Media, "addMedia");
            const fileSpy = sinon.spy(file, "addImage");
            file.createImage("");

            expect(spy.called).to.equal(true);
            expect(fileSpy.called).to.equal(true);
        });
    });

    describe("#addChildElement", () => {
        it("should call the underlying header's addChildElement", () => {
            const file = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(file.Header, "addChildElement");
            // tslint:disable-next-line:no-any
            file.addChildElement({} as any);

            expect(spy.called).to.equal(true);
        });
    });
});
