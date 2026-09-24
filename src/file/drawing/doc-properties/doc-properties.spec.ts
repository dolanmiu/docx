import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import type { IViewWrapper } from "@file/document-wrapper";
import { ConcreteHyperlink } from "@file/paragraph";
import type { IContext } from "@file/xml-components";

import { DocProperties } from "./doc-properties";

describe("DocProperties", () => {
    it("should create with name, description, and title", () => {
        const dp = new DocProperties({ name: "test", description: "desc", title: "ttl", id: "1" });
        const tree = new Formatter().format(dp);
        expect(tree).to.deep.equal({
            "wp:docPr": {
                _attr: {
                    id: "1",
                    name: "test",
                    descr: "desc",
                    title: "ttl",
                },
            },
        });
    });

    it("should omit description attribute when description is undefined", () => {
        const dp = new DocProperties({ name: "test", title: "ttl", id: "1" });
        const tree = new Formatter().format(dp);
        expect(tree["wp:docPr"]._attr).not.to.have.property("descr");
        expect(tree["wp:docPr"]._attr).to.have.property("title", "ttl");
    });

    it("should omit title attribute when title is undefined", () => {
        const dp = new DocProperties({ name: "test", description: "desc", id: "1" });
        const tree = new Formatter().format(dp);
        expect(tree["wp:docPr"]._attr).to.have.property("descr", "desc");
        expect(tree["wp:docPr"]._attr).not.to.have.property("title");
    });

    it("should omit both description and title when neither is provided", () => {
        const dp = new DocProperties({ name: "test", id: "1" });
        const tree = new Formatter().format(dp);
        expect(tree["wp:docPr"]._attr).not.to.have.property("descr");
        expect(tree["wp:docPr"]._attr).not.to.have.property("title");
    });

    it("should give each drawing its own id when none is supplied", () => {
        const first = new Formatter().format(new DocProperties({ name: "first" }));
        const second = new Formatter().format(new DocProperties({ name: "second" }));
        expect(second["wp:docPr"]._attr.id).to.equal(first["wp:docPr"]._attr.id + 1);
    });
});

describe("DocProperties links and decorative drawings", () => {
    const createContext = (addRelationship = vi.fn(), stack: readonly unknown[] = []): IContext =>
        ({ stack, viewWrapper: { Relationships: { addRelationship } } as unknown as IViewWrapper }) as unknown as IContext;

    it("should link the drawing to a web address", () => {
        const addRelationship = vi.fn();
        const tree = new Formatter().format(
            new DocProperties({ name: "Logo", id: "1" }, { link: "https://example.com" }),
            createContext(addRelationship),
        );

        const [linkId, , target] = addRelationship.mock.calls[0];
        expect(target).to.equal("https://example.com");
        expect(tree).to.deep.equal({
            "wp:docPr": [
                { _attr: { id: "1", name: "Logo" } },
                {
                    "a:hlinkClick": {
                        _attr: { "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main", "r:id": `rId${linkId}` },
                    },
                },
            ],
        });
    });

    it("should mark the drawing as decorative, after its link", () => {
        const tree = new Formatter().format(
            new DocProperties({ name: "Rule", id: "1" }, { link: "https://example.com", decorative: true }),
            createContext(),
        );
        expect(tree["wp:docPr"].map((child: object) => Object.keys(child)[0])).to.deep.equal(["_attr", "a:hlinkClick", "a:extLst"]);
        expect(tree["wp:docPr"][2]["a:extLst"][0]).to.deep.equal({
            _attr: { "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main" },
        });
    });

    it("should write the same element each time it is written", () => {
        const properties = new DocProperties({ name: "Rule", id: "1" }, { decorative: true });
        const first = new Formatter().format(properties, createContext());
        const second = new Formatter().format(properties, createContext());
        expect(second).to.deep.equal(first);
    });

    it("should prefer its own link to the hyperlink it is in", () => {
        const hyperlink = new ConcreteHyperlink([], "outer");
        const tree = new Formatter().format(
            new DocProperties({ name: "Logo", id: "1" }, { link: "https://example.com" }),
            createContext(vi.fn(), [hyperlink]),
        );
        expect(tree["wp:docPr"][1]["a:hlinkClick"]._attr["r:id"]).to.not.equal("rIdouter");
    });
});
