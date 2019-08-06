import { expect } from "chai";
import * as sinon from "sinon";

import { FooterWrapper } from "./footer-wrapper";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Table } from "./table";

describe("FooterWrapper", () => {
    describe("#add", () => {
        it("should call the underlying footer's addParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "add");
            file.add(new Paragraph({}));

            expect(spy.called).to.equal(true);
        });

        it("should call the underlying footer's addParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "add");
            file.add(
                new Table({
                    rows: 1,
                    columns: 1,
                }),
            );

            expect(spy.called).to.equal(true);
        });

        it("should call the underlying footer's addImage", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.Footer, "add");
            // tslint:disable-next-line:no-any
            file.addImage({} as any);

            expect(spy.called).to.equal(true);
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
