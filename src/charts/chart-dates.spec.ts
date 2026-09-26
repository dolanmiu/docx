import { describe, expect, it } from "vitest";

import { checkDate, serialDate, timeUnitOf } from "./chart-dates";

describe("serialDate", () => {
    it("should count days from 30 December 1899 in UTC, as Excel does, with the time of day as a fraction", () => {
        expect(serialDate(new Date("1900-03-01"))).to.equal(61);
        expect(serialDate(new Date("2025-01-01"))).to.equal(45658);
        expect(serialDate(new Date("2025-01-01T18:00:00Z"))).to.equal(45658.75);
    });
});

describe("timeUnitOf", () => {
    it("should space dates by years, months or days, as Excel chooses", () => {
        expect(timeUnitOf([new Date("2024-01-01"), new Date("2025-01-01")])).to.equal("years");
        expect(timeUnitOf([new Date("2025-01-01"), new Date("2025-03-01")])).to.equal("months");
        expect(timeUnitOf([new Date("2025-01-01"), new Date("2025-01-02")])).to.equal("days");
        // A time of day is days
        expect(timeUnitOf([new Date("2025-01-01T12:00:00Z")])).to.equal("days");
        expect(timeUnitOf([new Date("1960-06-01")])).to.equal("months");
    });
});

describe("checkDate", () => {
    it("should accept dates Excel can hold, from 1 March 1900 to 31 December 9999", () => {
        expect(() => checkDate(new Date("1900-03-01"))).to.not.throw();
        expect(() => checkDate(new Date("9999-12-31T23:59:59.999Z"))).to.not.throw();
        expect(() => checkDate(new Date("10000-01-01"))).to.throw("Invalid category date");
    });
});
