import { Player, Vector3 } from "@minecraft/server";

class LightFlightVisual {
    lastSpin1: Vector3 | undefined
    lastSpin2: Vector3 | undefined
    lastTrail: Vector3 | undefined
    angle: number
}

declare module "@minecraft/server" {
    interface Player {
        zCooldown: number;
        xCooldown: number;
        cCooldown: number;
        vCooldown: number;
        fCooldown: number;
        state: number;

        flyTurnCooldown: number;
        center: Vector3;
        flySoundCooldown: number;
        airTime: number;
        ignoreFall: boolean;
        airJumps: number;
        dashCooldown: number;
        holdZTime: number;
        ZChargeAmount: number;
        holdXTime: number;
        alarmSoundCooldown: number;
        flyingAngles: Vector3;
        lightFlightVisuals: LightFlightVisual;
    }
}