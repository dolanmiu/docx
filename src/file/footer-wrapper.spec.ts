import { expect } from "chai";
import * as sinon from "sinon";

import { FooterWrapper } from "./footer-wrapper";
import { Media } from "./media";
import { Paragraph } from "./paragraph";
import { Table, TableCell, TableRow } from "./table";

describe("FooterWrapper", () => {
    describe("#add", () => {
        it("should call the underlying footer's addParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.View, "add");
            file.add(new Paragraph({}));

            expect(spy.called).to.equal(true);
        });

        it("should call the underlying footer's addParagraph", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.View, "add");
            file.add(
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
            );

            expect(spy.called).to.equal(true);
        });
    });

    describe("#addChildElement", () => {
        it("should call the underlying footer's addChildElement", () => {
            const file = new FooterWrapper(new Media(), 1);
            const spy = sinon.spy(file.View, "addChildElement");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            file.addChildElement({} as any);

            expect(spy.called).to.equal(true);
        });
    });

    describe("#Media", () => {
        it("should get Media", () => {
            const media = new Media();
            const file = new FooterWrapper(media, 1);
            expect(file.Media).to.equal(media);
        });
    });
});
