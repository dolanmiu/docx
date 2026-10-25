import { EventEmitter } from "events";
import { describe, expect, it, vi } from "vitest";

import { Stream } from "./stream";

class Destination extends EventEmitter {
    public readonly writable: boolean = true;
    public readonly write = vi.fn(() => true);
    public readonly end = vi.fn((): Destination => this);
    public readonly destroy = vi.fn();
}

describe("Packer's legacy Stream", () => {
    it("returns the destination, announces the pipe, and forwards data", () => {
        const source = new Stream();
        const dest = new Destination();
        const pipe = vi.fn();
        dest.on("pipe", pipe);

        expect(source.pipe(dest)).toBe(dest);
        const bytes = Uint8Array.of(1, 2);
        source.emit("data", bytes);

        expect(pipe).toHaveBeenCalledWith(source);
        expect(dest.write).toHaveBeenCalledWith(bytes);
    });

    it("ignores data when the destination is not writable", () => {
        const source = new Stream();
        const dest = Object.assign(new Destination(), { writable: false });
        source.pipe(dest);
        source.emit("data", Uint8Array.of(1));
        expect(dest.write).not.toHaveBeenCalled();
    });

    it("pauses on backpressure and resumes on drain when the source supports it", () => {
        const source = Object.assign(new Stream(), { readable: true, pause: vi.fn(), resume: vi.fn() });
        const dest = new Destination();
        dest.write.mockReturnValue(false);
        source.pipe(dest);
        source.emit("data", Uint8Array.of(1));
        dest.emit("drain");
        expect(source.pause).toHaveBeenCalledOnce();
        expect(source.resume).toHaveBeenCalledOnce();
    });

    it("tolerates backpressure and drain without pause or resume methods", () => {
        const source = Object.assign(new Stream(), { readable: true });
        const dest = new Destination();
        dest.write.mockReturnValue(false);
        source.pipe(dest);
        expect(() => source.emit("data", Uint8Array.of(1))).not.toThrow();
        expect(() => dest.emit("drain")).not.toThrow();
    });

    it("does not resume an unreadable source", () => {
        const source = Object.assign(new Stream(), { readable: false, resume: vi.fn() });
        const dest = new Destination();
        source.pipe(dest);
        dest.emit("drain");
        expect(source.resume).not.toHaveBeenCalled();
    });

    it("ends the destination and cleans up only the pipe's listeners", () => {
        const source = new Stream();
        const dest = new Destination();
        const data = vi.fn();
        source.on("data", data);
        source.pipe(dest);
        source.emit("end");
        source.emit("close");

        expect(dest.end).toHaveBeenCalledOnce();
        expect(dest.destroy).not.toHaveBeenCalled();
        expect(source.listeners("data")).toEqual([data]);
        expect(source.eventNames()).toEqual(["data"]);
        expect(dest.eventNames()).toEqual([]);
    });

    it("does not end the destination twice if end is emitted recursively", () => {
        const source = new Stream();
        const dest = new Destination();
        dest.end.mockImplementation(() => {
            source.emit("end");
            return dest;
        });
        source.pipe(dest);
        source.emit("end");
        expect(dest.end).toHaveBeenCalledOnce();
    });

    it("destroys the destination once if close is emitted recursively", () => {
        const source = new Stream();
        const dest = new Destination();
        dest.destroy.mockImplementation(() => source.emit("close"));
        source.pipe(dest);
        source.emit("close");
        expect(dest.destroy).toHaveBeenCalledOnce();
        expect(dest.end).not.toHaveBeenCalled();
        expect(source.eventNames()).toEqual([]);
        expect(dest.eventNames()).toEqual([]);
    });

    it("tolerates a destination without destroy", () => {
        const source = new Stream();
        const dest = new Destination();
        const { destroy, ...methods } = dest;
        const withoutDestroy = Object.assign(new EventEmitter(), methods);
        source.pipe(withoutDestroy);
        expect(() => source.emit("close")).not.toThrow();
        expect(destroy).not.toHaveBeenCalled();
    });

    it.each([false, true])("leaves destinations open with stdio=%s", (stdio) => {
        const source = new Stream();
        const dest = Object.assign(new Destination(), { _isStdio: stdio });
        source.pipe(dest, { end: stdio });
        source.emit("end");
        source.emit("close");
        expect(dest.end).not.toHaveBeenCalled();
        expect(dest.destroy).not.toHaveBeenCalled();
        expect(source.eventNames()).toEqual([]);
        expect(dest.eventNames()).toEqual([]);
    });

    it("ends the destination with an explicit default option", () => {
        const source = new Stream();
        const dest = new Destination();
        source.pipe(dest, { end: true });
        source.emit("end");
        expect(dest.end).toHaveBeenCalledOnce();
    });

    it("cleans up when the destination closes", () => {
        const source = new Stream();
        const dest = new Destination();
        source.pipe(dest);
        dest.emit("close");
        source.emit("data", Uint8Array.of(1));
        expect(dest.write).not.toHaveBeenCalled();
        expect(source.eventNames()).toEqual([]);
        expect(dest.eventNames()).toEqual([]);
    });

    it.each(["source", "destination"])("cleans up and rethrows an unhandled %s error", (side) => {
        const source = new Stream();
        const dest = new Destination();
        source.pipe(dest);
        const error = new Error("pipe failure");
        expect(() => (side === "source" ? source : dest).emit("error", error)).toThrow(error);
        expect(source.eventNames()).toEqual([]);
        expect(dest.eventNames()).toEqual([]);
    });

    it.each(["source", "destination"])("preserves an attached %s error handler", (side) => {
        const source = new Stream();
        const dest = new Destination();
        const emitter = side === "source" ? source : dest;
        const listener = vi.fn();
        source.pipe(dest);
        emitter.on("error", listener);
        const error = new Error("handled failure");
        expect(() => emitter.emit("error", error)).not.toThrow();
        expect(listener).toHaveBeenCalledWith(error);
        expect(emitter.listeners("error")).toEqual([listener]);
        expect(source.listenerCount("data")).toBe(0);
        expect(dest.listenerCount("drain")).toBe(0);
    });
});
