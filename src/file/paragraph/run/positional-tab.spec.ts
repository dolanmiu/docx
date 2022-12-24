import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { PositionalTab, PositionalTabAlignment, PositionalTabLeader, PositionalTabRelativeTo } from "./positional-tab";

describe("PositionalTab", () => {
    it("should create a PositionalTab with correct root key", () => {
        const tree = new Formatter().format(
            new PositionalTab({
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
