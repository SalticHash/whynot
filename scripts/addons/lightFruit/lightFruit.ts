import { ButtonState, EffectTypes, EntityInventoryComponent, EquipmentSlot, InputButton, ItemLockMode, ItemStack, Player, StartupEvent, system, Vector3, world } from "@minecraft/server";
import { MinecraftEffectTypes } from "@minecraft/vanilla-data";
import { directionVector, entityGetSlot, entityHasSlotTag } from "../../utility";
import { V3 } from "../../math/vectorUtils";
import { deg2Rad } from "../../math/general";

let light: ItemStack
const fCooldownTime = 80
const flyTurnThreshold = Math.cos(deg2Rad(60));
enum States {
    NORMAL,
    FLYING
}
const flyTurnCooldownTime: number = 10
const flyTurnCooldown: Map<string, number> = new Map()
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
        if (!player.isOnGround && pressed && player.state == States.NORMAL && player.fCooldown <= 0) {
            player.state = States.FLYING
            flyingAngles.set(player.id, player.getViewDirection());
        }
        if (!pressed && player.state == States.FLYING) {
            player.state = States.NORMAL
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
        if (player.state == States.FLYING) {
            player.addEffect(MinecraftEffectTypes.Invisibility, 20000000, {showParticles: false})
            player.fCooldown = fCooldownTime
            const viewDir = player.getViewDirection();
            const addVel = V3.normalize(flyingAngles.get(player.id) ?? viewDir);
            if (V3.dot(viewDir, addVel) < flyTurnThreshold && (flyTurnCooldown.get(player.id) ?? 0) <= 0) {
                flyingAngles.set(player.id, viewDir);
            }
            player.clearVelocity();
            player.applyImpulse(addVel);

            const vel = player.getVelocity();
            const blockHit = player.dimension.getBlockFromRay(player.location, vel, {maxDistance: 1, includeLiquidBlocks:false, includePassableBlocks: false})
            if ((flyTurnCooldown.get(player.id) ?? 0) > 0) {
                flyTurnCooldown.set(player.id, (flyTurnCooldown.get(player.id) ?? 0) - 1)
            }
            if (blockHit && blockHit.block.isSolid) {
                const bounced = V3.reflect(vel, directionVector(blockHit.face));
                flyingAngles.set(player.id, bounced);
                flyTurnCooldown.set(player.id, flyTurnCooldownTime)
            }
        }
        if (player.zCooldown > 0) player.zCooldown--;
        if (player.xCooldown > 0) player.xCooldown--;
        if (player.cCooldown > 0) player.cCooldown--;
        if (player.vCooldown > 0) player.vCooldown--;
        if (player.fCooldown > 0) player.fCooldown--;
        
        if (!entityHasSlotTag(player, EquipmentSlot.Mainhand, "whynot:light")) return
        player.onScreenDisplay.setActionBar(`Z: ${player.zCooldown} X: ${player.xCooldown} C: ${player.cCooldown} V: ${player.vCooldown} F: ${player.fCooldown}`)
    })

}