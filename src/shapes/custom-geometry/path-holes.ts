/**
 * Holes in custom shapes: a closed part of a path inside another part is a hole in it, and a part inside a hole is
 * filled again.
 *
 * Applications fill a path by one of two rules. By the even-odd rule, as LibreOffice fills, a part inside another is
 * always a hole. By the non-zero rule, it is a hole only if it goes round the other way. So each closed part is turned
 * round, where it needs to be, to go the other way to the part it is in, and the rules agree.
 *
 * @module
 */
import { type PathPoint, type PathSegment, cubicAt, pointOnArc, quadraticAt } from "./svg-path";

// How many straight steps a curve is measured with
const CURVE_STEPS = 8;

type DrawnSegment = Exclude<PathSegment, { readonly type: "close" }>;

/**
 * A part of a path: where its move goes to, and the segments after it, up to the next move.
 */
type Part = {
    readonly start: PathPoint;
    readonly segments: readonly PathSegment[];
};

type MeasuredPart = Part & {
    /** The part's outline, with curves as straight steps */
    readonly outline: readonly PathPoint[];
    /** Positive if the part goes clockwise on the page, negative if anticlockwise, and 0 if it encloses nothing */
    readonly turn: number;
    /** Whether the part can be turned round: it is closed once, at its end */
    readonly closed: boolean;
};

const steps = (point: (t: number) => PathPoint): readonly PathPoint[] =>
    Array.from({ length: CURVE_STEPS }, (_, index) => point((index + 1) / CURVE_STEPS));

/**
 * The points a segment passes through, after where it starts. A close goes back to the start of the part.
 */
const outlineOf = (segment: PathSegment, from: PathPoint, start: PathPoint): readonly PathPoint[] => {
    switch (segment.type) {
        case "cubic": {
            const { control1: c1, control2: c2, to } = segment;
            return steps((t) => ({ x: cubicAt(from.x, c1.x, c2.x, to.x, t), y: cubicAt(from.y, c1.y, c2.y, to.y, t) }));
        }
        case "quadratic": {
            const { control, to } = segment;
            return steps((t) => ({ x: quadraticAt(from.x, control.x, to.x, t), y: quadraticAt(from.y, control.y, to.y, t) }));
        }
        case "arc": {
            const { arc } = segment;
            return steps((t) => pointOnArc(arc, arc.startAngle + arc.sweepAngle * t));
        }
        case "close":
            return [start];
        default:
            return [segment.to];
    }
};

// Twice the area a closed outline encloses, positive when it goes clockwise on the page (y down)
const signedArea = (outline: readonly PathPoint[]): number =>
    outline.reduce((total, point, index) => {
        const next = outline[(index + 1) % outline.length];
        return total + point.x * next.y - next.x * point.y;
    }, 0);

const measurePart = (part: Part): MeasuredPart => {
    const { start, segments } = part;
    const outline = segments.reduce<readonly PathPoint[]>(
        (points, segment) => [...points, ...outlineOf(segment, points[points.length - 1], start)],
        [start],
    );
    const area = signedArea(outline);
    return {
        ...part,
        outline,
        turn: Math.abs(area) < 1e-9 ? 0 : Math.sign(area),
        closed: segments.filter(({ type }) => type === "close").length === 1 && segments[segments.length - 1].type === "close",
    };
};

/**
 * Splits a path into its parts. A path starts with a move, and each move starts a part.
 */
const splitParts = (segments: readonly PathSegment[]): readonly Part[] =>
    segments.reduce<readonly Part[]>((parts, segment) => {
        if (segment.type === "move") {
            return [...parts, { start: segment.to, segments: [] }];
        }
        const last = parts[parts.length - 1];
        return [...parts.slice(0, -1), { ...last, segments: [...last.segments, segment] }];
    }, []);

// Whether a point is inside an outline: a line from the point to the right crosses its sides an odd number of times
const isPointInside = ({ x, y }: PathPoint, outline: readonly PathPoint[]): boolean =>
    outline.reduce((inside, point, index) => {
        const previous = outline[(index + outline.length - 1) % outline.length];
        const crosses = point.y > y !== previous.y > y && x < ((previous.x - point.x) * (y - point.y)) / (previous.y - point.y) + point.x;
        return crosses ? !inside : inside;
    }, false);

// A part is inside another when most of its outline is. Points on the other part's outline can count either way
const isInside = (part: MeasuredPart, other: MeasuredPart): boolean =>
    part.outline.filter((point) => isPointInside(point, other.outline)).length > part.outline.length / 2;

const hasEnd = (segment: PathSegment): segment is DrawnSegment => segment.type !== "close";

const reverseSegment = (segment: DrawnSegment, from: PathPoint): PathSegment => {
    switch (segment.type) {
        case "cubic":
            return { type: "cubic", control1: segment.control2, control2: segment.control1, to: from };
        case "quadratic":
            return { type: "quadratic", control: segment.control, to: from };
        case "arc": {
            const { arc } = segment;
            return {
                type: "arc",
                from: segment.to,
                to: from,
                arc: { ...arc, startAngle: arc.startAngle + arc.sweepAngle, sweepAngle: -arc.sweepAngle },
            };
        }
        default:
            return { type: "line", to: from };
    }
};

/**
 * A closed part drawn the other way round. It starts where it did, and each segment is drawn backwards.
 */
const reversePart = ({ start, segments }: Part): readonly PathSegment[] => {
    const drawn = segments.filter(hasEnd);
    // Where each segment starts, and last, where the part ends before it is closed
    const starts = [start, ...drawn.map(({ to }) => to)];
    const end = starts[starts.length - 1];
    // The line that closed the part, from its end back to its start, is drawn first
    const closing: readonly PathSegment[] = end.x === start.x && end.y === start.y ? [] : [{ type: "line", to: end }];
    const backwards = drawn.reduceRight<readonly PathSegment[]>(
        (result, segment, index) => [...result, reverseSegment(segment, starts[index])],
        [],
    );
    // The first segment, drawn backwards, ends the part. When it is a line, the close draws it
    const ending = drawn[0].type === "line" ? backwards.slice(0, -1) : backwards;
    return [{ type: "move", to: start }, ...closing, ...ending, { type: "close" }];
};

/**
 * Turns round the closed parts of a path that go the same way as the part they are directly inside, so that a part
 * inside another is a hole in it whichever rule an application fills paths by. Parts that aren't inside another, and
 * parts that aren't closed, are left as they are.
 *
 * @param segments - A path, starting with a move
 */
export const orientParts = (segments: readonly PathSegment[]): readonly PathSegment[] => {
    const parts = splitParts(segments).map(measurePart);
    const containers = parts.map((part, index) =>
        parts.flatMap((other, otherIndex) => (otherIndex !== index && other.turn !== 0 && isInside(part, other) ? [otherIndex] : [])),
    );
    const depths = containers.map(({ length }) => length);

    // The way a part goes once turned round: the other way to the part it is directly inside, the deepest one it is in
    const turnOf = (index: number): number => {
        const parent = containers[index]
            .filter((container) => depths[container] < depths[index])
            .reduce<number | undefined>(
                (deepest, container) => (deepest === undefined || depths[container] > depths[deepest] ? container : deepest),
                undefined,
            );
        return parent === undefined || !parts[index].closed ? parts[index].turn : -turnOf(parent);
    };

    return parts.flatMap((part, index) =>
        part.turn !== 0 && turnOf(index) !== part.turn ? reversePart(part) : [{ type: "move", to: part.start } as const, ...part.segments],
    );
};
