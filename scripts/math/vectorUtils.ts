// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Dimension, DimensionLocation, Vector2, Vector3 } from "@minecraft/server";
import { clamp, rad2Deg } from "./general";

/**
 * Utilities operating on Vector3 objects. All methods are static and do not modify the input objects.
 *
 * @public
 */
export class V3 {
    static dimension(v: Vector3, dim: Dimension): DimensionLocation {
        return {x:v.x, y:v.y, z:v.z, dimension:dim}
    }
    static set(v: Vector3, axis: string, value: number = 0) {
        switch(axis) {
            case "x": return V3.make(value, v.y, v.z);
            case "y": return V3.make(v.x, value, v.z);
            case "z": return V3.make(v.x, v.y, value);
        }
        return v
    }
    static copy(vector: Vector3) {
        return { x: vector.x, y: vector.y, z: vector.z };
    }
    static make(x?: number, y?: number, z?: number) {
        if (x === undefined) return { x: 0.0, y: 0.0, z: 0.0 };
        if (y === undefined) return { x: x, y: x, z: x };
        if (z === undefined) return { x: x, y: y, z: 0.0 };
        return { x: x, y: y, z: z };
    }
    /** = undefined
     * equals
     *
     * Check the equality of two vectors
     */
    static equals(v1: Vector3, v2: Vector3) {
        return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
    }

    /**
     * add
     *
     * Add two vectors to produce a new vector
     */
    static add(v1: Vector3, v2: Vector3) {
        return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z };
    }
    

    /**
     * increment
     *
     * Increment a vector by a number to produce a new vector
     */
    static increment(v1: Vector3, n: number) {
        return { x: v1.x + n, y: v1.y + n, z: v1.z + n };
    }

    /**
     * subtract
     *
     * Subtract two vectors to produce a new vector (v1-v2)
     */
    static subtract(v1: Vector3, v2: Vector3) {
        return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
    }

    static multiply(v1: Vector3, v2: Vector3) {
        return { x: v1.x * v2.x, y: v1.y * v2.y, z: v1.z * v2.z };
    }

    /** scale
     *
     * Multiple all entries in a vector by a single scalar value producing a new vector
     */
    static scale(v1: Vector3, scale: number) {
        return { x: v1.x * scale, y: v1.y * scale, z: v1.z * scale };
    }

    /** shrink
     *
     * Divides all entries in a vector by a single scalar value producing a new vector
     */
    static shrink(v1: Vector3, scale: number) {
        return { x: v1.x / scale, y: v1.y / scale, z: v1.z / scale };
    }

    /**
     * dot
     *
     * Calculate the dot product of two vectors
     */
    static dot(a: Vector3, b: Vector3) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    /**
     * cross
     *
     * Calculate the cross product of two vectors. Returns a new vector.
     */
    static cross(a: Vector3, b: Vector3) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        };
    }

    /**
     * magnitude
     *
     * The magnitude of a vector
     */
    static magnitude(v: Vector3) {
        return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    }

    /**
     * magnitude
     *
     * The magnitude of a vector
     */
    static magnitudeXZ(v: Vector3) {
        return Math.sqrt(v.x ** 2 + v.z ** 2);
    }

    /**
     * distance
     *
     * Calculate the distance between two vectors
     */
    static distance(a: Vector3, b: Vector3) {
        return V3.magnitude(V3.subtract(a, b));
    }

    /**
     * normalize
     *
     * Takes a vector 3 and normalizes it to a unit vector
     */
    static normalize(v: Vector3) {
        const mag = V3.magnitude(v);
        if (mag === 0) return VECTOR3_ZERO;
        return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
    }

    /**
     * normalizeXZ
     *
     * Takes a vector 3 and normalizes using the horizontal magnitude
     */
    static normalizeXZ(v: Vector3) {
        const mag = V3.magnitudeXZ(v);
        if (mag === 0) return VECTOR3_ZERO;
        return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
    }

    /**
     * floor
     *
     * Floor the components of a vector to produce a new vector
     */
    static floor(v: Vector3) {
        return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
    }

    /**
     * round
     *
     * Round the components of a vector to produce a new vector
     */
    static round(v: Vector3) {
        return { x: Math.round(v.x), y: Math.round(v.y), z: Math.round(v.z) };
    }

    /**
     * toString
     *
     * Create a string representation of a vector3
     * options?: { decimals?; delimiter? }
     */
    static toString(v: Vector3, options: {decimals: number, delimiter: string} | undefined) {
        const decimals = options?.decimals ?? 2;
        const str = [v.x.toFixed(decimals), v.y.toFixed(decimals), v.z.toFixed(decimals)];
        return str.join(options?.delimiter ?? ", ");
    }

    /**
     * clamp
     *
     * Clamps the components of a vector to limits to produce a new vector
     * limits?: {
     *    min?: Partial<Vector3>;
     *    max?: Partial<Vector3>;
     * }
     */
    static clamp(v: Vector3, limits: {min: Vector3, max: Vector3}) {
        return {
            x: clamp(v.x, limits?.min?.x ?? Number.MIN_SAFE_INTEGER, limits?.max?.x ?? Number.MAX_SAFE_INTEGER),
            y: clamp(v.y, limits?.min?.y ?? Number.MIN_SAFE_INTEGER, limits?.max?.y ?? Number.MAX_SAFE_INTEGER),
            z: clamp(v.z, limits?.min?.z ?? Number.MIN_SAFE_INTEGER, limits?.max?.z ?? Number.MAX_SAFE_INTEGER),
        };
    }

    /**
     * lerp
     *
     * Constructs a new vector using linear interpolation on each component from two vectors.
     */
    static lerp(a: Vector3, b: Vector3, t: number) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t,
        };
    }

    /**
     * slerp
     *
     * Constructs a new vector using spherical linear interpolation on each component from two vectors.
     */
    static slerp(a: Vector3, b: Vector3, t: number) {
        const theta = Math.acos(V3.dot(a, b));
        const sinTheta = Math.sin(theta);
        const ta = Math.sin((1.0 - t) * theta) / sinTheta;
        const tb = Math.sin(t * theta) / sinTheta;
        return V3.add(V3.scale(a, ta), V3.scale(b, tb));
    }

    static lerpArray(a: Vector3, b: Vector3, n: number) {
        const array = [];

        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const interpolatedVector = V3.lerp(a, b, t);
            array.push(interpolatedVector);
        }

        return array;
    }

    /**
     * direction
     *
     * Constructs a new vector using the direction from two vectors.
     */
    static direction(v1: Vector3, v2: Vector3) {
        const dVec = V3.subtract(v2, v1);
        return V3.normalize(dVec);
    }

    static center(v: Vector3) {
        return V3.increment(v, 0.5);
    }

    static rotateOffset(offsetVector: Vector3, center: Vector3, angle: number) {
        // Convert angle
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Rotate in the XZ plane around the Y-axis
        const rotated_x = offsetVector.x * cos - offsetVector.z * sin;
        const rotated_z = offsetVector.x * sin + offsetVector.z * cos;

        // Translate back to the original center
        const new_x = rotated_x + center.x;
        const new_y = center.y; // Y remains unchanged
        const new_z = rotated_z + center.z;

        // Return new position as a Vector3 (assuming y-axis is not rotated)
        return { x: new_x, y: new_y, z: new_z };
    }

    static directionToRotation(direction: Vector3) {
        const yaw = -Math.atan2(direction.x, direction.z); // Calculate yaw from x and z
        const pitch = -Math.asin(direction.y); // Calculate pitch from y

        return V2.make(rad2Deg(pitch), rad2Deg(yaw));
    }

    // USES RADIANS
    static rotationToDirection(rotation: Vector2) {
        const pitch = rotation.x;
        const yaw = rotation.y;

        const x = Math.cos(pitch) * Math.sin(yaw);
        const y = Math.sin(pitch);
        const z = Math.cos(pitch) * Math.cos(yaw);

        return V3.make(x, y, z);
    }


    // Function to calculate forward vector from look direction
    static calculateForwardVector(lookDirection: Vector3) {
        return V3.normalize(lookDirection);
    }

    // Function to calculate right vector from forward vector and world up vector
    static calculateRightVector(forwardVector: Vector3) {
        return V3.normalize(V3.cross(VECTOR3_UP, forwardVector));
    }

    // Function to calculate up vector from forward and right vectors
    static calculateUpVector(forwardVector: Vector3, rightVector: Vector3) {
        return V3.normalize(V3.cross(forwardVector, rightVector));
    }

    // Function to calculate basis matrix from look direction
    static getBasisMatrix(lookDirection: Vector3) {
        let forwardVector = V3.calculateForwardVector(lookDirection);
        let rightVector = V3.calculateRightVector(forwardVector);
        let upVector = V3.calculateUpVector(forwardVector, rightVector);
        return [rightVector, upVector, forwardVector];
    }

    // Function to multiply a vector by a 3x3 matrix
    static multiplyVectorByMatrix(vector: Vector3, matrix: Array<Vector3>) {
        return {
            x: vector.x * matrix[0].x + vector.y * matrix[1].x + vector.z * matrix[2].x,
            y: vector.x * matrix[0].y + vector.y * matrix[1].y + vector.z * matrix[2].y,
            z: vector.x * matrix[0].z + vector.y * matrix[1].z + vector.z * matrix[2].z,
        };
    }

    static getCardinalDirection(dir: Vector3): string {
        const isXDir = Math.abs(dir.x) > Math.abs(dir.z);

        const cardinalX = isXDir ? Math.sign(dir.x) : 0
        const cardinalZ = !isXDir ? Math.sign(dir.z) : 0

        switch (`${cardinalX},${cardinalZ}`) {
            case "0,-1":
                return "north";
            case "1,0":
                return "east";
            case "0,1":
                return "south";
            case "-1,0":
                return "west";
            default:
                return "unknown";
        }
    }

    static reflect(v: Vector3, n: Vector3) {
        const dot = V3.dot(v, n);
        return V3.subtract(v, V3.scale(n, 2 * dot));
    }



}

/**
 * Utilities operating on Vector2 objects. All methods are static and do not modify the input objects.
 *
 * @public
 */
export class V2 {
    static make(x: number, y: number) {
        if (x == undefined) return { x: 0.0, y: 0.0 };
        if (y == undefined) return { x: x, y: x };
        return { x: x, y: y };
    }
    /**
     * toString
     *
     * Create a string representation of a vector2
     * options?: { decimals?; delimiter? }
     */
    static toString(v: Vector2, options: {decimals: number, delimiter: string} | undefined) {
        const decimals = options?.decimals ?? 2;
        const str = [v.x.toFixed(decimals), v.y.toFixed(decimals)];
        return str.join(options?.delimiter ?? ", ");
    }
}

/**
 * up
 *
 * A unit vector representing the world UP direction (0,1,0)
 *
 * @public
 */
export const VECTOR3_UP = { x: 0, y: 1, z: 0 };
/**
 * down
 *
 * A unit vector representing the world DOWN direction (0,-1,0)
 *
 * @public
 */
export const VECTOR3_DOWN = { x: 0, y: -1, z: 0 };
/**
 * left
 *
 * A unit vector representing the world LEFT direction (-1,0,0)
 *
 * @public
 */
export const VECTOR3_LEFT = { x: -1, y: 0, z: 0 };
/**
 * right
 *
 * A unit vector representing the world RIGHT direction (1,0,0)
 *
 * @public
 */
export const VECTOR3_RIGHT = { x: 1, y: 0, z: 0 };
/**
 * forward
 *
 * A unit vector representing the world FORWARD direction (0,0,1)
 *
 * @public
 */
export const VECTOR3_FORWARD = { x: 0, y: 0, z: 1 };
/**
 * back
 *
 * A unit vector representing the world BACK direction (0,0,-1)
 *
 * @public
 */
export const VECTOR3_BACK = { x: 0, y: 0, z: -1 };
/**
 * one
 *
 * A unit vector representing the value of 1 in all directions (1,1,1)
 *
 * @public
 */
export const VECTOR3_ONE = { x: 1, y: 1, z: 1 };
/**
 * zero
 *
 * A unit vector representing the value of 0 in all directions (0,0,0)
 *
 * @public
 */
export const VECTOR3_ZERO = { x: 0, y: 0, z: 0 };
/**
 * west
 *
 * A unit vector representing the world WEST direction (-1,0,0)
 *   (same as LEFT)
 *
 * @public
 */
export const VECTOR3_WEST = { x: -1, y: 0, z: 0 };
/**
 * east
 *
 * A unit vector representing the world EAST direction (-1,0,0)
 *   (same as RIGHT)
 *
 * @public
 */
export const VECTOR3_EAST = { x: 1, y: 0, z: 0 };
/**
 * north
 *
 * A unit vector representing the world NORTH direction (-1,0,0)
 *   (same as FORWARD)
 *
 * @public
 */
export const VECTOR3_NORTH = { x: 0, y: 0, z: 1 };
/**
 * south
 *
 * A unit vector representing the world SOUTH direction (-1,0,0)
 *   (same as BACK)
 *
 * @public
 */
export const VECTOR3_SOUTH = { x: 0, y: 0, z: -1 };

