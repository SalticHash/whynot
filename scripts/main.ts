import { ActionFormData, uiManager } from "@minecraft/server-ui";
import { world, system, Player, Entity } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";


const blocks = [
    "chest",
    "barrel",
    "shulker_box"
]
const entities = [
    "villager_v2"
]
world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    if (Math.random() > 0.125) return;

    if (!ev.isFirstEvent) return;
    let is_interactable = false;
    for (let block of blocks) {
        if (!ev.block.typeId.endsWith(block)) continue;
        is_interactable = true;
        break;
    }
    if (!is_interactable) return;

    ev.cancel = true;
    system.run(() => open_jumpscare(ev.player));
});
world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
    if (Math.random() > 0.125) return;

    let is_interactable = false;
    for (let entity of entities) {
        if (!ev.target.typeId.endsWith(entity)) continue;
        is_interactable = true;
        break;
    }
    if (!is_interactable) return;

    ev.cancel = true;
    system.run(() => open_jumpscare(ev.player));
});

function open_jumpscare(player: Player | undefined) {
    if (player == undefined) return;
    if (player.typeId != "minecraft:player") return;
    const form = new ActionFormData();
    form.title("camino_recorra_tu_pasado");
    let runId = system.runTimeout(() => uiManager.closeAllForms(player), 3140);


    player.playMusic("camino_recorra_tu_pasado")
    form.show(player)
        .finally(() => {
            system.run(() => {
                player.stopMusic()
            });
            system.clearRun(runId);
        });
}
