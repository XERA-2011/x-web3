
export class ATUtil {
    static randomInt(min: number, max: number): number {
        return Math.floor(min + Math.random() * (max - min + 1));
    }

    static randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    static clamp(val: number, min: number, max: number): number {
        return Math.min(Math.max(val, min), max);
    }

    static lerp(start: number, end: number, amt: number): number {
        return start + (end - start) * amt;
    }

    static shuffle<T>(array: T[]): T[] {
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    static map(value: number, low1: number, high1: number, low2: number, high2: number): number {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }
}
