import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

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
