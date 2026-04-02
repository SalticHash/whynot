import { Player } from "@minecraft/server";
declare module "@minecraft/server" {
    interface Player {
        zCooldown: number;
        xCooldown: number;
        cCooldown: number;
        vCooldown: number;
        fCooldown: number;
        state: number;
    }
}