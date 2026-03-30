import { CustomForm, Observable, ModalFormData, ActionFormData } from "@minecraft/server-ui";
import { world, system, Player, Entity } from "@minecraft/server";

world.afterEvents.blockContainerOpened.subscribe((ev) => open_jumpscare(ev.openSource.entity as Player));
world.afterEvents.entityContainerOpened.subscribe((ev) => open_jumpscare(ev.openSource.entity as Player));

function open_jumpscare(player: Player | undefined) {
  if (player == undefined) return;
  if (player.typeId != "minecraft:player") return;
  const form = new ActionFormData();
  form.title("wiki_form:");

  form.show(player);
  player.playMusic("camino_recorra_tu_pasado");
  // player.addTag("camino_recorra_tu_pasado");
  // system.runTimeout(() => player.removeTag("camino_recorra_tu_pasado"), 200)
}
