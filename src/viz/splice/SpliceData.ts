import { CatmullRomCurve3 } from 'three';

export class SpliceData {
    static splineCurve: CatmullRomCurve3;
    static trackDuration = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static tracks: any[] = [];
}
