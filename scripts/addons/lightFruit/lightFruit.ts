import { ButtonState, EffectTypes, EntityHealthComponent, EntityInventoryComponent, EquipmentSlot, InputButton, InputPermissionCategory, ItemLockMode, ItemStack, MolangVariableMap, Player, StartupEvent, system, Vector3, world } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { directionVector, entityGetSlot, entityHasSlotTag } from "../../utility";
import { V3 } from "../../math/vectorUtils";
import { deg2Rad, remap } from "../../math/general";

let light: ItemStack
const fCooldownTime = 80
const flyTurnThreshold = Math.cos(deg2Rad(60));
enum States {
    NORMAL,
    FLYING
}
const flyTurnCooldownTime: number = 10
const flyTurnCooldown: Map<string, number> = new Map()
const flySoundCooldown: Map<string, number> = new Map()
const airTime: Map<string, number> = new Map()
const airJumps: Map<string, number> = new Map()
const flyingAngles: Map<string, Vector3> = new Map()
// Defining setters for ability cooldowns
Object.defineProperties(Player.prototype, {
    zCooldown: {
        get() {return this.getDynamicProperty("whynot:light_z_cooldown") ?? 0.0},
        set(cooldown: number) {this.setDynamicProperty("whynot:light_z_cooldown", cooldown)},
    },
    xCooldown: {
        get() {return this.getDynamicProperty("whynot:light_x_cooldown") ?? 0.0},
        set(cooldown: number) {this.setDynamicProperty("whynot:light_x_cooldown", cooldown)},
    },
    cCooldown: {
        get() {return this.getDynamicProperty("whynot:light_c_cooldown") ?? 0.0},
        set(cooldown: number) {this.setDynamicProperty("whynot:light_c_cooldown", cooldown)},
    },
    vCooldown: {
        get() {return this.getDynamicProperty("whynot:light_v_cooldown") ?? 0.0},
        set(cooldown: number) {this.setDynamicProperty("whynot:light_v_cooldown", cooldown)},
    },
    fCooldown: {
        get() {return this.getDynamicProperty("whynot:light_f_cooldown") ?? 0.0},
        set(cooldown: number) {this.setDynamicProperty("whynot:light_f_cooldown", cooldown)},
    },
    state: {
        get() {return this.getDynamicProperty("whynot:light_state") ?? States.NORMAL},
        set(state: number) {this.setDynamicProperty("whynot:light_state", state)},
    },
});

// Eat fruit component
export function startup(ev: StartupEvent) {
    ev.itemComponentRegistry.registerCustomComponent("whynot:light_fruit", {
        onConsume({source}) {
            const player = source as Player
            if (!player || player.typeId != "minecraft:player" || !player.isValid) return
            system.run(() => {
                const container = player.getComponent(EntityInventoryComponent.componentId)?.container
                if (!container) return

                if (container.contains(light)) return

                player.addItem(light);
            })
        }
    })
}

export function main() {
    light = new ItemStack("whynot:light", 1);
    light.lockMode = ItemLockMode.inventory;
    light.keepOnDeath = true;

    world.getAllPlayers().forEach(player => player.state = States.NORMAL)
    world.afterEvents.playerButtonInput.subscribe(({button, newButtonState, player}) => {
        const pressed = newButtonState == ButtonState.Pressed
        if (!entityHasSlotTag(player, EquipmentSlot.Mainhand, "whynot:light")) return;

        if (button != InputButton.Jump) return
        // Activate fly
        if (((airTime.get(player.id) ?? 0) > 2) && pressed && player.state == States.NORMAL) {
            if (player.fCooldown <= 0 && player.isSneaking) {
                player.state = States.FLYING
                flyingAngles.set(player.id, player.getViewDirection());
                player.addEffect(MinecraftEffectTypes.SlowFalling, 20000000, {showParticles: false})
                player.playSound("light_dash")
                player.playSound("light_beam_start")
                
                flySoundCooldown.set(player.id, 0)
                flyTurnCooldown.set(player.id, 0)
                player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false)
            } else if ((airJumps.get(player.id) ?? 0) > 0) {
                player.applyImpulse(V3.make(0, -player.getVelocity().y + 0.75, 0))
                let molangSize1 = new MolangVariableMap(); molangSize1.setFloat("size", 1.0 / 2.0)
                let molangSize2 = new MolangVariableMap(); molangSize2.setFloat("size", 1.3 / 2.0)
                let molangSize3 = new MolangVariableMap(); molangSize3.setFloat("size", 1.5 / 2.0)
                player.spawnParticle("whynot:moon_jump", V3.add(player.location, V3.make(0, 0, 0)), molangSize1)
                player.spawnParticle("whynot:moon_jump", V3.add(player.location, V3.make(0, -0.2, 0)), molangSize2)
                player.spawnParticle("whynot:moon_jump", V3.add(player.location, V3.make(0, -0.4, 0)), molangSize3)
                player.playSound("moon_jump")
                airJumps.set(player.id, (airJumps.get(player.id) ?? 0) - 1)
            }
        }
        // Deactivate fly
        if (!pressed && player.state == States.FLYING) {
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true)
            player.state = States.NORMAL
            player.removeEffect(MinecraftEffectTypes.SlowFalling);
            player.addEffect(MinecraftEffectTypes.SlowFalling, 25, {showParticles: false})

            player.removeEffect(MinecraftEffectTypes.Invisibility)
        }
    })
    world.afterEvents.playerHotbarSelectedSlotChange.subscribe(({itemStack, player}) => {
        if (itemStack?.hasTag("whynot:light")) return
        player.state = States.NORMAL
    })

    system.runInterval(mainTick)
}


function mainTick() {
    world.getAllPlayers().forEach(player => {
        // Set Airtime
        if (player.isOnGround) {
            if (player.state != States.FLYING) {
                player.removeEffect(MinecraftEffectTypes.SlowFalling);
                airJumps.set(player.id, 10)


            }
            airTime.set(player.id, 0)
        }
        else airTime.set(player.id, (airTime.get(player.id) ?? 0) + 1)

        if (player.state == States.FLYING) {

            player.addEffect(MinecraftEffectTypes.Invisibility, 20000000, {showParticles: false})
            player.fCooldown = fCooldownTime

            // If viewing angle change is significant change direction
            const viewDir = player.getViewDirection();
            const addVel = V3.normalize(flyingAngles.get(player.id) ?? viewDir);
            if (V3.dot(viewDir, addVel) < flyTurnThreshold && (flyTurnCooldown.get(player.id) ?? 0) <= 0) {
                flyingAngles.set(player.id, viewDir);
                player.playSound("light_dash")
            }

            // Scale speed from health
            const health = player.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
            const speed = remap(health.currentValue, health.effectiveMin, health.effectiveMax, 0.1, 1.0);
            const vel = V3.scale(addVel, speed)
            player.clearVelocity();
            player.applyImpulse(vel);

            // Get block in path and bounce if needed
            const blockHit = player.dimension.getBlockFromRay(player.location, vel, {maxDistance: 2, includeLiquidBlocks:false, includePassableBlocks: false})
            if (blockHit && blockHit.block.isSolid) {
                const bounced = V3.reflect(vel, directionVector(blockHit.face));
                flyingAngles.set(player.id, bounced);
                flyTurnCooldown.set(player.id, flyTurnCooldownTime)
                player.playSound("light_dash")
            }

            // Reduce fly turn cooldown
            let currFlyTurnCooldown = flyTurnCooldown.get(player.id) ?? 0;
            if (currFlyTurnCooldown > 0) flyTurnCooldown.set(player.id, currFlyTurnCooldown - 1);

            let currSoundCooldon = flySoundCooldown.get(player.id) ?? 0;
            if (currSoundCooldon > 0) flySoundCooldown.set(player.id, currSoundCooldon - 1);
            else {
                player.playSound("light_beam_loop", {volume: 10})
                // player.playSound("light_beam_loop", {volume: 10})
                flySoundCooldown.set(player.id, 7) //8.58
            }
        }

        // Reduce all cooldowns
        if (player.zCooldown > 0) player.zCooldown--;
        if (player.xCooldown > 0) player.xCooldown--;
        if (player.cCooldown > 0) player.cCooldown--;
        if (player.vCooldown > 0) player.vCooldown--;
        if (player.fCooldown > 0) player.fCooldown--;
        
        // If player is holding light display cooldowns
        if (!entityHasSlotTag(player, EquipmentSlot.Mainhand, "whynot:light")) return
        player.onScreenDisplay.setActionBar(`Z: ${player.zCooldown} X: ${player.xCooldown} C: ${player.cCooldown} V: ${player.vCooldown} F: ${player.fCooldown}`)
    })

}