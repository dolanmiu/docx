import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph, TextRun } from "@file/paragraph";

import { Endnotes } from "./endnotes";

describe("Endnotes", () => {
    describe("#constructor", () => {
        it("should create with default separator endnotes", () => {
            const endnotes = new Endnotes();
            const tree = new Formatter().format(endnotes);

            expect(tree["w:endnotes"]).to.be.an("array");
            // Should have attributes and two default endnotes (separator and continuation separator)
            expect(tree["w:endnotes"].length).to.be.greaterThanOrEqual(3);
        });
    });

    describe("#createEndnote", () => {
        it("should add an endnote to the collection", () => {
            const endnotes = new Endnotes();
            endnotes.createEndnote(1, [
                new Paragraph({
                    children: [new TextRun("Test endnote content")],
                }),
            ]);

            const tree = new Formatter().format(endnotes);

            expect(tree["w:endnotes"]).to.be.an("array");
            // Should have attributes, two default endnotes, plus one created endnote
            expect(tree["w:endnotes"].length).to.be.greaterThanOrEqual(4);
        });

        it("should create endnote with specified id", () => {
            const endnotes = new Endnotes();
            endnotes.createEndnote(42, [
                new Paragraph({
                    children: [new TextRun("Endnote with id 42")],
                }),
            ]);

            const tree = new Formatter().format(endnotes);
            const endnoteElements = tree["w:endnotes"];

            // Find the endnote with id 42
            const createdEndnote = endnoteElements.find(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (el: any) => el["w:endnote"]?.[0]?.["_attr"]?.["w:id"] === 42,
            );
            expect(createdEndnote).to.not.be.undefined;
        });
    });
});
