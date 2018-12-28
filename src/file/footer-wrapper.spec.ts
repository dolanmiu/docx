import { expect } from "chai";
import * as sinon from "sinon";

import { FooterWrapper } from "./footer-wrapper";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Table } from "./table";

describe("FooterWrapper", () => {
    describe("#addParagraph", () => {
        it("should call the underlying header's addParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "addParagraph");
            file.addParagraph(new Paragraph());

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addTable", () => {
        it("should call the underlying header's addParagraph", () => {
            const wrapper = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Footer, "addTable");
            wrapper.addTable(new Table(1, 1));

            expect(spy.called).to.equal(true);
        });
    });
});
