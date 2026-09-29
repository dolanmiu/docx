import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { Relationships } from "./relationships";

describe("Relationships", () => {
    describe("#constructor()", () => {
        it("should create section properties with options", () => {
            const properties = new Relationships();
            const tree = new Formatter().format(properties);
            expect(Object.keys(tree)).to.deep.equal(["Relationships"]);
            expect(tree["Relationships"]).to.deep.equal({
                _attr: { xmlns: "http://schemas.openxmlformats.org/package/2006/relationships" },
            });
        });
    });

    describe("#copy()", () => {
        it("should copy the relationships, and add the ones added to the copy only to the copy", () => {
            const relationships = new Relationships();
            relationships.addRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles", "styles.xml");

            const copy = relationships.copy();
            copy.addRelationship(2, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", "media/image.png");

            expect(new Formatter().format(relationships)).to.deep.equal({
                Relationships: [
                    { _attr: { xmlns: "http://schemas.openxmlformats.org/package/2006/relationships" } },
                    {
                        Relationship: {
                            _attr: {
                                Id: "rId1",
                                Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
                                Target: "styles.xml",
                            },
                        },
                    },
                ],
            });
            expect(new Formatter().format(copy)).to.deep.equal({
                Relationships: [
                    { _attr: { xmlns: "http://schemas.openxmlformats.org/package/2006/relationships" } },
                    {
                        Relationship: {
                            _attr: {
                                Id: "rId1",
                                Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
                                Target: "styles.xml",
                            },
                        },
                    },
                    {
                        Relationship: {
                            _attr: {
                                Id: "rId2",
                                Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                                Target: "media/image.png",
                            },
                        },
                    },
                ],
            });
            expect(relationships.RelationshipCount).to.equal(1);
            expect(copy.RelationshipCount).to.equal(2);
        });
    });
});
