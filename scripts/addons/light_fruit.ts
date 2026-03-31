import { EntityInventoryComponent, ItemLockMode, ItemStack, Player, StartupEvent, system, world } from "@minecraft/server";

export function startup(ev: StartupEvent) {
    ev.itemComponentRegistry.registerCustomComponent("whynot:light_fruit", {
        onConsume(ev) {
            const player = ev.source as Player
            if (!player || player.typeId != "minecraft:player" || !player.isValid) return
            system.run(() => {
                const container = player.getComponent(EntityInventoryComponent.componentId)?.container
                if (!container) return

                const light = new ItemStack("whynot:light", 1);
                light.lockMode = ItemLockMode.inventory;
                light.keepOnDeath = true;
                if (container.contains(light)) return

                player.addItem(light);
            })
        }
    })
}
export function main() {

}