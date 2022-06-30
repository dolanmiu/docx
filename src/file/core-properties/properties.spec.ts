import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { CoreProperties } from "./properties";

describe("Properties", () => {
    describe("#constructor()", () => {
        it("sets the appropriate attributes on the top-level", () => {
            const properties = new CoreProperties({});
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["cp:coreProperties"]);
            expect(tree["cp:coreProperties"]).to.be.an.instanceof(Array);
            expect(tree["cp:coreProperties"][0]).to.deep.equal({
                _attr: {
                    "xmlns:cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
                    "xmlns:dc": "http://purl.org/dc/elements/1.1/",
                    "xmlns:dcmitype": "http://purl.org/dc/dcmitype/",
                    "xmlns:dcterms": "http://purl.org/dc/terms/",
                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                },
            });
        });

        it("should create properties with a title", () => {
            const properties = new CoreProperties({ title: "test document" });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["cp:coreProperties"]);
            expect(tree["cp:coreProperties"]).to.be.an.instanceof(Array);
            expect(tree["cp:coreProperties"]).to.deep.include({ "dc:title": ["test document"] });
        });

        it("should create properties with all the attributes given", () => {
            const properties = new CoreProperties({
                title: "test document",
                subject: "test subject",
                creator: "me",
                keywords: "test docx",
                description: "testing document",
                lastModifiedBy: "the author",
                revision: 123,
            });
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["cp:coreProperties"]);
            expect(tree["cp:coreProperties"]).to.be.an.instanceof(Array);

            const key = (obj) => Object.keys(obj)[0];
            expect(tree["cp:coreProperties"].map(key)).to.include.members([
                "_attr",
                "cp:keywords",
                "cp:lastModifiedBy",
                "cp:revision",
                "dc:creator",
                "dc:description",
                "dc:subject",
                "dc:title",
                "dcterms:created",
                "dcterms:modified",
            ]);
            expect(tree["cp:coreProperties"]).to.deep.include.members([
                { "cp:keywords": ["test docx"] },
                { "cp:lastModifiedBy": ["the author"] },
                { "cp:revision": ["123"] },
                { "dc:creator": ["me"] },
                { "dc:description": ["testing document"] },
                { "dc:subject": ["test subject"] },
                { "dc:title": ["test document"] },
            ]);
        });
    });
});
