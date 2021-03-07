// Twip - twentieths of a point
export const convertMillimetersToTwip = (millimeters: number): number => {
    return Math.floor((millimeters / 25.4) * 72 * 20);
};

export const convertInchesToTwip = (inches: number): number => {
    return Math.floor(inches * 72 * 20);
};
