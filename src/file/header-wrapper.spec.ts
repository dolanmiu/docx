import { expect } from "chai";
import * as sinon from "sinon";

import { HeaderWrapper } from "./header-wrapper";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Table } from "./table";

describe("HeaderWrapper", () => {
    describe("#add", () => {
        it("should call the underlying header's addChildElement for Paragraph", () => {
            const wrapper = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Header, "add");
            wrapper.add(new Paragraph({}));

            expect(spy.called).to.equal(true);
        });

        it("should call the underlying header's addChildElement for Table", () => {
            const wrapper = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(wrapper.Header, "add");
            wrapper.add(
                new Table({
                    rows: 1,
                    columns: 1,
                }),
            );

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addImage", () => {
        it("should call the underlying header's addImage", () => {
            const file = new HeaderWrapper(new Media(), 1);
            const spy = sinon.spy(file.Header, "add");
            // tslint:disable-next-line:no-any
            file.addImage({} as any);

            expect(spy.called).to.equal(true);
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
