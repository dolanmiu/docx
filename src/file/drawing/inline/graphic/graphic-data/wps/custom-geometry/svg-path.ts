/**
 * Reads SVG path data, such as `"M 0 0 L 100 0 L 50 80 Z"`, into absolute segments, and finds the box around them.
 *
 * Supports the commands M, L, H, V, C, S, Q, T, A and Z, in upper case (absolute) and lower case (relative).
 *
 * Reference: https://www.w3.org/TR/SVG11/paths.html#PathData
 *
 * @module
 */

/**
 * A point in the path's own units.
 */
export type PathPoint = {
    readonly x: number;
    readonly y: number;
};

/**
 * An elliptical arc in centre form: the ellipse it is part of, and the angles along it.
 */
export type EllipticalArc = {
    readonly centre: PathPoint;
    readonly radiusX: number;
    readonly radiusY: number;
    /** The ellipse's rotation, in radians clockwise */
    readonly rotation: number;
    /** Where the arc starts on the ellipse, in radians before the ellipse is rotated or stretched */
    readonly startAngle: number;
    /** How far the arc goes round the ellipse, in radians. Positive is clockwise */
    readonly sweepAngle: number;
};

/**
 * A segment of a path, with absolute coordinates.
 */
export type PathSegment =
    | { readonly type: "move"; readonly to: PathPoint }
    | { readonly type: "line"; readonly to: PathPoint }
    | { readonly type: "cubic"; readonly control1: PathPoint; readonly control2: PathPoint; readonly to: PathPoint }
    | { readonly type: "quadratic"; readonly control: PathPoint; readonly to: PathPoint }
    | { readonly type: "arc"; readonly from: PathPoint; readonly to: PathPoint; readonly arc: EllipticalArc }
    | { readonly type: "close" };

/**
 * The box around a path.
 */
export type PathBounds = {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
};

type Command = {
    readonly letter: string;
    readonly args: readonly number[];
};

// The number of arguments each command takes. Arcs take seven, two of which are flags
const ARGUMENT_COUNTS: Readonly<Record<string, number>> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

/**
 * Splits SVG path data into commands and their arguments.
 *
 * @throws If the path doesn't start with a move, has an unknown command, or a command has the wrong number of arguments
 */
const tokenize = (path: string): readonly Command[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const commands: Command[] = [];
    let index = 0;
    let letter: string | undefined;

    const skipSeparators = (): void => {
        while (index < path.length && /[\s,]/.test(path[index])) {
            index++;
        }
    };

    const readNumber = (): number => {
        skipSeparators();
        const match = NUMBER.exec(path.slice(index));
        if (!match) {
            throw new Error(`Invalid path "${path}". Expected a number at position ${index}`);
        }
        index += match[0].length;
        return Number(match[0]);
    };

    // Arc flags are a single 0 or 1, and need no separator before the next number, as in "a10 10 0 0110 10"
    const readFlag = (): number => {
        skipSeparators();
        const flag = path[index];
        if (flag !== "0" && flag !== "1") {
            throw new Error(`Invalid path "${path}". Expected an arc flag of 0 or 1 at position ${index}`);
        }
        index++;
        return Number(flag);
    };

    skipSeparators();
    while (index < path.length) {
        const character = path[index];
        if (/[a-z]/i.test(character)) {
            if (ARGUMENT_COUNTS[character.toLowerCase()] === undefined) {
                throw new Error(`Invalid path "${path}". Unsupported command "${character}"`);
            }
            if (letter === undefined && character.toLowerCase() !== "m") {
                throw new Error(`Invalid path "${path}". A path must start with a move (M)`);
            }
            letter = character;
            index++;
        } else if (letter === undefined) {
            throw new Error(`Invalid path "${path}". A path must start with a move (M)`);
        } else if (letter.toLowerCase() === "z") {
            throw new Error(`Invalid path "${path}". Expected a command at position ${index}`);
        }

        const command = letter.toLowerCase();
        const args =
            command === "a"
                ? [readNumber(), readNumber(), readNumber(), readFlag(), readFlag(), readNumber(), readNumber()]
                : Array.from({ length: ARGUMENT_COUNTS[command] }, readNumber);
        // eslint-disable-next-line functional/immutable-data
        commands.push({ letter, args });

        // Numbers after a move are lines
        if (command === "m") {
            letter = letter === "m" ? "l" : "L";
        }
        skipSeparators();
    }

    return commands;
};

// The signed angle from one vector to another, in radians
const angleBetween = (ux: number, uy: number, vx: number, vy: number): number => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);

/**
 * Converts an SVG arc, given by its end points, to centre form.
 *
 * Reference: https://www.w3.org/TR/SVG11/implnote.html#ArcConversionEndpointToCenter
 *
 * @returns Nothing when the arc is a straight line (a radius is 0) or has no length
 */
const toEllipticalArc = (
    from: PathPoint,
    to: PathPoint,
    radiusX: number,
    radiusY: number,
    rotationDegrees: number,
    largeArc: boolean,
    sweep: boolean,
): EllipticalArc | undefined => {
    if (radiusX === 0 || radiusY === 0 || (from.x === to.x && from.y === to.y)) {
        return undefined;
    }

    const rotation = (rotationDegrees * Math.PI) / 180;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const dx = (from.x - to.x) / 2;
    const dy = (from.y - to.y) / 2;
    const x1 = cos * dx + sin * dy;
    const y1 = -sin * dx + cos * dy;

    // Scale the radii up if they are too small to reach from one end to the other
    const lambda = (x1 * x1) / (radiusX * radiusX) + (y1 * y1) / (radiusY * radiusY);
    const scale = lambda > 1 ? Math.sqrt(lambda) : 1;
    const rx = Math.abs(radiusX) * scale;
    const ry = Math.abs(radiusY) * scale;

    const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
    const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
    const coefficient = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
    const cx1 = (coefficient * rx * y1) / ry;
    const cy1 = (-coefficient * ry * x1) / rx;

    const startAngle = angleBetween(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
    const turn = angleBetween((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
    const sweepAngle = sweep && turn < 0 ? turn + 2 * Math.PI : !sweep && turn > 0 ? turn - 2 * Math.PI : turn;

    return {
        centre: { x: cos * cx1 - sin * cy1 + (from.x + to.x) / 2, y: sin * cx1 + cos * cy1 + (from.y + to.y) / 2 },
        radiusX: rx,
        radiusY: ry,
        rotation,
        startAngle,
        sweepAngle,
    };
};

/**
 * The point on an arc's ellipse at an angle along it, measured as for `startAngle`.
 */
export const pointOnArc = ({ centre, radiusX, radiusY, rotation }: EllipticalArc, angle: number): PathPoint => ({
    x: centre.x + radiusX * Math.cos(angle) * Math.cos(rotation) - radiusY * Math.sin(angle) * Math.sin(rotation),
    y: centre.y + radiusX * Math.cos(angle) * Math.sin(rotation) + radiusY * Math.sin(angle) * Math.cos(rotation),
});

type ParserState = {
    readonly segments: readonly PathSegment[];
    readonly current: PathPoint;
    /** Where the path goes back to when it is closed */
    readonly subpathStart: PathPoint;
    /** The second control point of the last cubic curve, which a smooth cubic curve (S) reflects */
    readonly lastCubicControl?: PathPoint;
    /** The control point of the last quadratic curve, which a smooth quadratic curve (T) reflects */
    readonly lastQuadraticControl?: PathPoint;
};

const readCommand = (state: ParserState, { letter, args }: Command): ParserState => {
    const { current } = state;
    const relative = letter === letter.toLowerCase();
    const point = (x: number, y: number): PathPoint => (relative ? { x: current.x + x, y: current.y + y } : { x, y });
    const reflect = (control: PathPoint | undefined): PathPoint =>
        control ? { x: 2 * current.x - control.x, y: 2 * current.y - control.y } : current;
    const add = (
        segment: PathSegment,
        to: PathPoint,
        controls: Pick<ParserState, "lastCubicControl" | "lastQuadraticControl"> = {},
    ): ParserState => ({
        segments: [...state.segments, segment],
        current: to,
        subpathStart: state.subpathStart,
        ...controls,
    });

    switch (letter.toLowerCase()) {
        case "m": {
            const to = point(args[0], args[1]);
            return { ...add({ type: "move", to }, to), subpathStart: to };
        }
        case "l": {
            const to = point(args[0], args[1]);
            return add({ type: "line", to }, to);
        }
        case "h": {
            const to = { x: relative ? current.x + args[0] : args[0], y: current.y };
            return add({ type: "line", to }, to);
        }
        case "v": {
            const to = { x: current.x, y: relative ? current.y + args[0] : args[0] };
            return add({ type: "line", to }, to);
        }
        case "c":
        case "s": {
            const smooth = letter.toLowerCase() === "s";
            const control1 = smooth ? reflect(state.lastCubicControl) : point(args[0], args[1]);
            const [x2, y2, x, y] = smooth ? args : args.slice(2);
            const control2 = point(x2, y2);
            const to = point(x, y);
            return add({ type: "cubic", control1, control2, to }, to, { lastCubicControl: control2 });
        }
        case "q":
        case "t": {
            const smooth = letter.toLowerCase() === "t";
            const control = smooth ? reflect(state.lastQuadraticControl) : point(args[0], args[1]);
            const to = smooth ? point(args[0], args[1]) : point(args[2], args[3]);
            return add({ type: "quadratic", control, to }, to, { lastQuadraticControl: control });
        }
        case "a": {
            const to = point(args[5], args[6]);
            const arc = toEllipticalArc(current, to, args[0], args[1], args[2], args[3] === 1, args[4] === 1);
            return add(arc ? { type: "arc", from: current, to, arc } : { type: "line", to }, to);
        }
        default:
            return add({ type: "close" }, state.subpathStart);
    }
};

/**
 * Reads SVG path data into segments with absolute coordinates. Horizontal and vertical lines become lines,
 * smooth curves become curves with both control points, and arcs are given in centre form.
 *
 * @throws If the path is empty or not valid path data
 */
export const parseSvgPath = (path: string): readonly PathSegment[] => {
    const commands = tokenize(path);
    if (commands.length === 0) {
        throw new Error("Invalid path. Expected at least a move (M)");
    }

    const origin = { x: 0, y: 0 };
    return commands.reduce(readCommand, { segments: [], current: origin, subpathStart: origin }).segments;
};

// The parameters (0 to 1) where a cubic or quadratic Bézier curve along one axis turns back
const bezierTurningPoints = (coefficients: readonly [number, number, number]): readonly number[] => {
    const [a, b, c] = coefficients;
    if (Math.abs(a) < 1e-12) {
        return Math.abs(b) < 1e-12 ? [] : [-c / b];
    }
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return [];
    }
    const root = Math.sqrt(discriminant);
    return [(-b + root) / (2 * a), (-b - root) / (2 * a)];
};

const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number): number =>
    (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3;

const quadraticAt = (p0: number, p1: number, p2: number, t: number): number => (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

const isWithin = (t: number): boolean => t > 0 && t < 1;

// Whether an angle is on an arc
const isOnArc = ({ startAngle, sweepAngle }: EllipticalArc, angle: number): boolean => {
    const fullTurn = 2 * Math.PI;
    const along = (((sweepAngle >= 0 ? angle - startAngle : startAngle - angle) % fullTurn) + fullTurn) % fullTurn;
    return along <= Math.abs(sweepAngle);
};

/**
 * The points on a segment furthest left, right, up and down, other than where it starts.
 */
const extremePoints = (segment: PathSegment, from: PathPoint): readonly PathPoint[] => {
    switch (segment.type) {
        case "cubic": {
            const { control1: c1, control2: c2, to } = segment;
            // The derivative of a cubic Bézier curve along one axis is a quadratic in t
            const turning = (p0: number, p1: number, p2: number, p3: number): readonly number[] =>
                bezierTurningPoints([3 * (-p0 + 3 * p1 - 3 * p2 + p3), 6 * (p0 - 2 * p1 + p2), 3 * (p1 - p0)]);
            return [...turning(from.x, c1.x, c2.x, to.x), ...turning(from.y, c1.y, c2.y, to.y)]
                .filter(isWithin)
                .map((t) => ({ x: cubicAt(from.x, c1.x, c2.x, to.x, t), y: cubicAt(from.y, c1.y, c2.y, to.y, t) }))
                .concat([to]);
        }
        case "quadratic": {
            const { control, to } = segment;
            const turning = (p0: number, p1: number, p2: number): readonly number[] =>
                bezierTurningPoints([0, 2 * (p0 - 2 * p1 + p2), 2 * (p1 - p0)]);
            return [...turning(from.x, control.x, to.x), ...turning(from.y, control.y, to.y)]
                .filter(isWithin)
                .map((t) => ({ x: quadraticAt(from.x, control.x, to.x, t), y: quadraticAt(from.y, control.y, to.y, t) }))
                .concat([to]);
        }
        case "arc": {
            const { arc, to } = segment;
            const { radiusX, radiusY, rotation } = arc;
            // Where the ellipse is furthest left or right, and furthest up or down
            const xAngle = Math.atan2(-radiusY * Math.sin(rotation), radiusX * Math.cos(rotation));
            const yAngle = Math.atan2(radiusY * Math.cos(rotation), radiusX * Math.sin(rotation));
            return [xAngle, xAngle + Math.PI, yAngle, yAngle + Math.PI]
                .filter((angle) => isOnArc(arc, angle))
                .map((angle) => pointOnArc(arc, angle))
                .concat([to]);
        }
        case "close":
            return [];
        default:
            return [segment.to];
    }
};

/**
 * The box around a path, reaching the furthest points of its curves rather than their control points.
 */
export const getPathBounds = (segments: readonly PathSegment[]): PathBounds => {
    let current: PathPoint = { x: 0, y: 0 };
    let subpathStart = current;
    const points = segments.flatMap((segment) => {
        const extremes = extremePoints(segment, current);
        if (segment.type === "close") {
            current = subpathStart;
        } else {
            current = segment.to;
            if (segment.type === "move") {
                subpathStart = current;
            }
        }
        return extremes;
    });

    return {
        left: Math.min(...points.map(({ x }) => x)),
        top: Math.min(...points.map(({ y }) => y)),
        right: Math.max(...points.map(({ x }) => x)),
        bottom: Math.max(...points.map(({ y }) => y)),
    };
};
