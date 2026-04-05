import { ButtonState, EntityDamageCause, EntityHealthComponent, EntityInventoryComponent, EquipmentSlot, InputButton, InputPermissionCategory, ItemLockMode, ItemStack, MolangVariableMap, Player, StartupEvent, system, Vector3, world } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { directionVector, drawLine, EFFECT_INFINITE, entityCenter, entityHasSlotTag, playSoundFrom } from "../../utility";
import { V3 } from "../../math/vectorUtils";
import { deg2Rad, PI, remap, TAU } from "../../math/general";
import { VECTOR3_ZERO } from "@minecraft/math";

enum States {
    NORMAL,
    FLYING,
    MOON_JUMP,
    DASH
}

let light: ItemStack
const maxAirJumps: number = 10
const lightTrailThickness: number = 0.15
const lightSpinTrailThickness: number = 0.075
const fCooldownTime = 80
const flyTurnThreshold = Math.cos(deg2Rad(60));
const flyTurnCooldownTime: number = 10
const airborneAirtime = 3

const moonJumpForce = 0.75
const moonJumpSize1 = 0.5
const moonJumpSize2 = 1.3 / 2
const moonJumpSize3 = 1.5 / 2
const moonJumpPos1 = -0.0
const moonJumpPos2 = -0.2
const moonJumpPos3 = -0.4

const dashCooldownTime = 5
const dashForce = 1.0
const dashLift = 0.1
const dashSlowFallTime = 5

const flightSpeedMin = 0.1
const flightSpeedMax = 1.0
const flightStarSize = 2.0
const flightStarFrames = 5
const spinTrailTurnsPerSecond = 1.5
const spinTrailRadius = 0.5
const flySoundDuration = 7 //8.58

class LightFlightVisual {
    lastSpin1: Vector3 | undefined
    lastSpin2: Vector3 | undefined
    lastTrail: Vector3 | undefined
    angle: number = 0.0
}
const flyTurnCooldown: Map<string, number> = new Map()
const flySoundCooldown: Map<string, number> = new Map()
const airTime: Map<string, number> = new Map()
const ignoreFall: Map<string, boolean> = new Map()
const dashCooldown: Map<string, number> = new Map()
const flyingAngles: Map<string, Vector3> = new Map()
const lightFlightVisuals: Map<string, LightFlightVisual> = new Map()

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
    flyTurnCooldown: {
        get() {return flyTurnCooldown.get(this.id) ?? 0},
        set(v: number) {flyTurnCooldown.set(this.id, v)}
    },
    center: {
        get() {return entityCenter(this) ?? this.location}
    },
    flySoundCooldown: {
        get() {return flySoundCooldown.get(this.id) ?? 0},
        set(v: number) {flySoundCooldown.set(this.id, v)}
    },
    airTime: {
        get() {return airTime.get(this.id) ?? 0},
        set(v: number) {airTime.set(this.id, v)}
    },
    ignoreFall: {
        get() {return ignoreFall.get(this.id) ?? false},
        set(v: boolean) {ignoreFall.set(this.id, v)}
    },
    airJumps: {
        get() {return this.getDynamicProperty("whynot:air_jumps") ?? 10},
        set(v: number) {this.setDynamicProperty("whynot:air_jumps", v)},
    },
    flyingAngles: {
        get() {return flyingAngles.get(this.id) ?? VECTOR3_ZERO},
        set(v: Vector3) {flyingAngles.set(this.id, v)}
    },
    lightFlightVisuals: {
        get() {return lightFlightVisuals.get(this.id) ?? new LightFlightVisual()},
        set(v: LightFlightVisual) {lightFlightVisuals.set(this.id, v)}
    },
    dashCooldown: {
        get() {return dashCooldown.get(this.id) ?? 0},
        set(v: number) {dashCooldown.set(this.id, v)}
    }
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

function changeState(player: Player, state: States) {
    const oldState = player.state
    player.state = state

    switch (player.state) {
        case States.FLYING:
            player.triggerEvent("whynot:add_static_player");
            player.addEffect(MinecraftEffectTypes.Invisibility, EFFECT_INFINITE, {showParticles: false})
            
            playSoundFrom(player, "light_dash")
            playSoundFrom(player, "light_beam_start")
            player.flyingAngles = player.getViewDirection()
            player.lightFlightVisuals = new LightFlightVisual()
            player.flySoundCooldown = 0
            player.flyTurnCooldown = 0
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false)
        break;

        case States.MOON_JUMP:
            player.airJumps--
            player.ignoreFall = true
            player.applyImpulse(V3.make(0, -player.getVelocity().y + moonJumpForce, 0))
            playSoundFrom(player, "moon_jump")

            // Particles
            let molangSize1 = new MolangVariableMap(); molangSize1.setFloat("size", moonJumpSize1)
            let molangSize2 = new MolangVariableMap(); molangSize2.setFloat("size", moonJumpSize2)
            let molangSize3 = new MolangVariableMap(); molangSize3.setFloat("size", moonJumpSize3)
            const pos = player.location
            player.spawnParticle("whynot:moon_jump", V3.make(pos.x, pos.y + moonJumpPos1, pos.z), molangSize1)
            player.spawnParticle("whynot:moon_jump", V3.make(pos.x, pos.y + moonJumpPos2, pos.z), molangSize2)
            player.spawnParticle("whynot:moon_jump", V3.make(pos.x, pos.y + moonJumpPos3, pos.z), molangSize3)

            changeState(player, States.NORMAL)
        break;

        case States.DASH:
            const dir = player.getViewDirection()
            const vel = V3.normalize(V3.make(dir.x, 0, dir.z))
            const dirMap = new MolangVariableMap();
            dirMap.setVector3("direction", V3.scale(vel, -1))
            player.spawnParticle("whynot:dash", player.center, dirMap)
            player.addEffect(MinecraftEffectTypes.SlowFalling, dashSlowFallTime, {showParticles: false})
            playSoundFrom(player, "dash")

            player.dashCooldown = dashCooldownTime
            player.clearVelocity()
            player.applyImpulse(V3.make(vel.x * dashForce, dashLift, vel.z * dashForce))
            
            changeState(player, States.NORMAL)
        break;

    }

    switch (oldState) {
        case States.FLYING:
            player.triggerEvent("whynot:remove_static_player");
            
            player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true)

            player.removeEffect(MinecraftEffectTypes.Invisibility)
        break;
    }
}
export function main() {
    light = new ItemStack("whynot:light", 1);
    light.lockMode = ItemLockMode.inventory;
    light.keepOnDeath = true;

    world.getAllPlayers().forEach(player => changeState(player, States.NORMAL))
    world.beforeEvents.entityHurt.subscribe(ev => {
        if (ev.damageSource.cause != EntityDamageCause.fall) return

        const player = ev.hurtEntity as Player
        if (!player.isValid || player.typeId != "minecraft:player") return
        if (!player.ignoreFall) return

        ev.cancel = true
    })
    world.afterEvents.playerButtonInput.subscribe(({button, newButtonState, player}) => {
        const pressed = newButtonState == ButtonState.Pressed
        if (!entityHasSlotTag(player, EquipmentSlot.Mainhand, "whynot:light")) return;

        if (button == InputButton.Sneak && newButtonState == ButtonState.Pressed &&
            player.state == States.NORMAL && player.dashCooldown <= 0) {
            changeState(player, States.DASH)
        }
        if (button != InputButton.Jump) return
        if (player.airTime >= airborneAirtime && pressed && player.state == States.NORMAL) {
            // Activate fly
            if (player.fCooldown <= 0 && player.isSneaking) {
                changeState(player, States.FLYING)
            }
            // Moon jump
            else if (player.airJumps > 0) {
                changeState(player, States.MOON_JUMP)
            }
        }
        // Deactivate fly
        if (!pressed && player.state == States.FLYING) {
            changeState(player, States.NORMAL)
        }
    })
    world.afterEvents.playerHotbarSelectedSlotChange.subscribe(({itemStack, player}) => {
        if (itemStack?.hasTag("whynot:light")) return
        changeState(player, States.NORMAL)
    })

    system.runInterval(mainTick)
}

function mainTick() {
    world.getAllPlayers().forEach(player => {
        // Set Airtime
        if (player.isOnGround) {
            if (player.state != States.FLYING) {
                player.airJumps = maxAirJumps
                player.ignoreFall = false
            }
            player.airTime = 0
        }
        else player.airTime++

        if (player.state == States.FLYING) {
            player.ignoreFall = true
            player.fCooldown = fCooldownTime

            // get move dir
            const viewDir = player.getViewDirection();
            const addVel = V3.normalize(player.flyingAngles);

            // Scale speed from health
            const health = player.getComponent(EntityHealthComponent.componentId) as EntityHealthComponent;
            const speed = remap(health.currentValue, health.effectiveMin, health.effectiveMax, flightSpeedMin, flightSpeedMax);
            const vel = V3.scale(addVel, speed)
            player.clearVelocity();
            player.applyImpulse(vel);

            // Particles
            const starMap = new MolangVariableMap()
            const center = player.center
            starMap.setFloat("size", flightStarSize)
            starMap.setFloat("frame", system.currentTick % flightStarFrames)
            player.spawnParticle(
                "whynot:light_star",
                center,
                starMap
            )

            // Visuals
            const playerVisuals = player.lightFlightVisuals
            if (playerVisuals) {
                const matrix = V3.getBasisMatrix(addVel)
                playerVisuals.angle += (1 / 20.0) * TAU * spinTrailTurnsPerSecond * speed

                let angle = playerVisuals.angle
                const spin1 = V3.make(Math.cos(angle) * spinTrailRadius, Math.sin(angle) * spinTrailRadius, 0)
                const spin2 = V3.make(Math.cos(angle + PI) * spinTrailRadius, Math.sin(angle + PI) * spinTrailRadius, 0)
    
                const add1 = V3.add(V3.multiplyVectorByMatrix(spin1, matrix), center)
                const add2 = V3.add(V3.multiplyVectorByMatrix(spin2, matrix), center)
                if (playerVisuals.lastSpin1 && playerVisuals.lastSpin2) {
                    drawLine("whynot:light_trail", player.dimension, add1, playerVisuals.lastSpin1, lightSpinTrailThickness)
                    drawLine("whynot:light_trail", player.dimension, add2, playerVisuals.lastSpin2, lightSpinTrailThickness)
                }
                if (playerVisuals.lastTrail)
                    drawLine("whynot:light_trail", player.dimension, center, playerVisuals.lastTrail, lightTrailThickness)
                playerVisuals.lastSpin1 = add1
                playerVisuals.lastSpin2 = add2
                playerVisuals.lastTrail = center
            }
            
            // Get block in path and bounce if needed
            const blockHit = player.dimension.getBlockFromRay(player.location, addVel, {maxDistance: 4, includeLiquidBlocks:false, includePassableBlocks: false})
            if (blockHit && blockHit.block.isSolid) {
                const bounced = V3.reflect(vel, directionVector(blockHit.face));
                player.flyingAngles = bounced
                player.flyTurnCooldown = flyTurnCooldownTime
                playSoundFrom(player, "light_dash")
            }

            // If viewing angle change is significant change direction and did not bounce
            else if (V3.dot(viewDir, addVel) < flyTurnThreshold && player.flyTurnCooldown <= 0) {
                player.flyingAngles = viewDir;
                playSoundFrom(player, "light_dash")
            }

            // Reduce fly turn cooldown
            if (player.flyTurnCooldown > 0) player.flyTurnCooldown--;
            if (player.flySoundCooldown > 0) player.flySoundCooldown--;
            else {
                playSoundFrom(player, "light_beam_loop")
                flySoundCooldown.set(player.id, flySoundDuration) 
            }
        }

        // Reduce all cooldowns
        if (player.zCooldown > 0) player.zCooldown--;
        if (player.xCooldown > 0) player.xCooldown--;
        if (player.cCooldown > 0) player.cCooldown--;
        if (player.vCooldown > 0) player.vCooldown--;
        if (player.fCooldown > 0) player.fCooldown--;
        if (player.dashCooldown > 0) player.dashCooldown--;
        
        // If player is holding light display cooldowns
        if (!entityHasSlotTag(player, EquipmentSlot.Mainhand, "whynot:light")) {
            player.camera.clear()
            return
        }
        player.camera.setCamera("whynot:follow_orbit")
        player.dimension.runCommand(`/ability ${player.name} mayfly false`)
        player.onScreenDisplay.setActionBar(`Z: ${player.zCooldown} X: ${player.xCooldown} C: ${player.cCooldown} V: ${player.vCooldown} F: ${player.fCooldown}`)
    })

}