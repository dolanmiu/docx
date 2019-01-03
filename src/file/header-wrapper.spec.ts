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
        it("should call the underlying header's addParagraph", () => {
            const wrapper = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Header, "addTable");
            wrapper.addTable(new Table(1, 1));

            expect(spy.called).to.equal(true);
        });
    });
});
