import { describe, expect, it } from "vitest";

import { isConnectorShapeType } from "./preset-shape-type";

describe("isConnectorShapeType", () => {
    it("should treat lines and connectors as connectors", () => {
        expect(isConnectorShapeType("line")).to.equal(true);
        expect(isConnectorShapeType("straightConnector1")).to.equal(true);
        expect(isConnectorShapeType("bentConnector3")).to.equal(true);
        expect(isConnectorShapeType("curvedConnector5")).to.equal(true);
    });

    it("should not treat other shapes as connectors", () => {
        expect(isConnectorShapeType("rect")).to.equal(false);
        expect(isConnectorShapeType("rightArrow")).to.equal(false);
        expect(isConnectorShapeType("flowChartConnector")).to.equal(false);
    });
});
