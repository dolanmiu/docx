import { TargetModeType } from "@file/relationships/relationship/relationship";
import { expect } from "chai";

import { appendRelationship, getNextRelationshipIndex } from "./relationship-manager";

describe("relationship-manager", () => {
    describe("getNextRelationshipIndex", () => {
        it("should get next relationship index", () => {
            const output = getNextRelationshipIndex({
                elements: [
                    {
                        type: "element",
                        name: "Relationships",
                        elements: [
                            { type: "element", attributes: { Id: "rId1" }, name: "Relationship" },
                            { type: "element", attributes: { Id: "rId1" }, name: "Relationship" },
                        ],
                    },
                ],
            });
            expect(output).to.deep.equal(2);
        });

        it("should work with an empty relationship Id", () => {
            const output = getNextRelationshipIndex({
                elements: [
                    {
                        type: "element",
                        name: "Relationships",
                        elements: [{ type: "element", name: "Relationship" }],
                    },
                ],
            });
            expect(output).to.deep.equal(1);
        });

        it("should work with no relationships", () => {
            const output = getNextRelationshipIndex({
                elements: [
                    {
                        type: "element",
                        name: "Relationships",
                        elements: [],
                    },
                ],
            });
            expect(output).to.deep.equal(1);
        });
    });

    describe("appendRelationship", () => {
        it("should append a relationship", () => {
            const output = appendRelationship(
                {
                    elements: [
                        {
                            type: "element",
                            name: "Relationships",
                            elements: [
                                { type: "element", attributes: { Id: "rId1" }, name: "Relationship" },
                                { type: "element", attributes: { Id: "rId1" }, name: "Relationship" },
                            ],
                        },
                    ],
                },
                1,
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                "test",
                TargetModeType.EXTERNAL,
            );
            expect(output).to.deep.equal([
                { type: "element", attributes: { Id: "rId1" }, name: "Relationship" },
                { type: "element", attributes: { Id: "rId1" }, name: "Relationship" },
                {
                    attributes: {
                        Id: "rId1",
                        Type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                        TargetMode: TargetModeType.EXTERNAL,
                        Target: "test",
                    },
                    name: "Relationship",
                    type: "element",
                },
            ]);
        });
    });
});
