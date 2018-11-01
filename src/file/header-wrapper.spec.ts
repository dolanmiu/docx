import { expect } from "chai";
import * as sinon from "sinon";

import { HeaderWrapper } from "./header-wrapper";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Table } from "./table";

describe("HeaderWrapper", () => {
    describe("#addParagraph", () => {
        it("should call the underlying header's addParagraph", () => {
            const file = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(file.Header, "addParagraph");
            file.addParagraph(new Paragraph());

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addTable", () => {
        it("should call the underlying header's addParagraph", () => {
            const file = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(file.Header, "addTable");
            file.addTable(new Table(1, 1));

            expect(spy.called).to.equal(true);
        });
    });
});
