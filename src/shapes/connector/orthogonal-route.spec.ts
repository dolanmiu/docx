import { describe, expect, it } from "vitest";

import type { Bounds, Point } from "./connector-route";
import { findOrthogonalRoute } from "./orthogonal-route";

const MARGIN = 20;

const box = (left: number, top: number, right: number, bottom: number): Bounds => ({ left, top, right, bottom });

const crosses = (route: readonly Point[], obstacle: Bounds): boolean =>
    route.slice(1).some((to, index) => {
        const from = route[index];
        const inside = (a: number, b: number, low: number, high: number): boolean =>
            Math.max(Math.min(a, b), low + 1) < Math.min(Math.max(a, b), high - 1) || (a === b && a > low + 1 && a < high - 1);
        return inside(from.x, to.x, obstacle.left, obstacle.right) && inside(from.y, to.y, obstacle.top, obstacle.bottom);
    });

describe("findOrthogonalRoute", () => {
    it("should go around obstacles with right-angled bends, leaving and arriving at right angles to the shapes", () => {
        const obstacles = [box(80, -30, 120, 50)];
        const route = findOrthogonalRoute({ point: { x: 0, y: 0 }, angle: 0 }, { point: { x: 200, y: 0 }, angle: 180 }, MARGIN, obstacles)!;
        expect(route[0]).to.deep.equal({ x: 0, y: 0 });
        expect(route[route.length - 1]).to.deep.equal({ x: 200, y: 0 });
        expect(route[1].y).to.equal(0);
        expect(route[1].x).to.be.at.least(MARGIN);
        expect(route.slice(1).every((point, index) => point.x === route[index].x || point.y === route[index].y)).to.equal(true);
        expect(crosses(route, obstacles[0])).to.equal(false);
        // Right, over the obstacle, then down and in from the left: four bends, the shorter way round
        expect(route).to.have.length(6);
        expect(route[2].y).to.equal(-50);
    });

    it("should arrive going into the end, turning round beside it if it has to", () => {
        // The end faces up, so the route comes down into it, from above
        const route = findOrthogonalRoute({ point: { x: 0, y: 0 }, angle: 0 }, { point: { x: 200, y: 100 }, angle: 270 }, MARGIN, [
            box(180, 100, 220, 140),
        ])!;
        const [before, last] = route.slice(-2);
        expect(before.x).to.equal(last.x);
        expect(before.y).to.be.lessThan(last.y);
    });

    it("should find nothing when the end is walled in", () => {
        const walls = [box(150, -100, 160, 100), box(240, -100, 250, 100), box(150, -110, 250, -100), box(150, 100, 250, 110)];
        expect(findOrthogonalRoute({ point: { x: 0, y: 0 }, angle: 0 }, { point: { x: 200, y: 0 }, angle: 180 }, MARGIN, walls)).to.equal(
            undefined,
        );
    });
});
