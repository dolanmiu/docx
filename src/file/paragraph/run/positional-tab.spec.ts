import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { PositionalTabAlignment, PositionalTabLeader, PositionalTabRelativeTo, createPositionalTab } from "./positional-tab";

describe("createPositionalTab", () => {
    it("should create a PositionalTab with correct root key", () => {
        const tree = new Formatter().format(
            createPositionalTab({
                alignment: PositionalTabAlignment.CENTER,
                relativeTo: PositionalTabRelativeTo.MARGIN,
                leader: PositionalTabLeader.DOT,
            }),
        );

        expect(tree).to.deep.equal({
            "w:ptab": {
                _attr: {
                    "w:alignment": "center",
                    "w:relativeTo": "margin",
                    "w:leader": "dot",
                },
            },
        });
    });
});
