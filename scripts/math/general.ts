// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RGB } from "@minecraft/server";

export const PI = Math.PI
export const TAU = PI * 2.0

export function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

export function rad2Deg(rad: number): number {
    return rad * (180.0 / Math.PI);
}

export function deg2Rad(deg: number): number {
    return deg * (Math.PI / 180.0);
}


export function HSVtoRGB(h: number, s: number, v: number): RGB {
    let r: number = 0;
    let g: number = 0;
    let b: number = 0;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        red: Math.floor(r * 255),
        green: Math.floor(g * 255),
        blue: Math.floor(b * 255)
    };
}

export function calculateNotePitch(useCount: number): number {
    return 2 ** ((useCount - 12) / 12)
}


export function randfRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function randiRange(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function reclamp(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return clamp(remap(value, inMin, inMax, outMin, outMax), outMin, outMax)
}

export function titleCase(text: string): string {
    let str: string[] = text.toLowerCase().split(' ');
    for (let i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
}



