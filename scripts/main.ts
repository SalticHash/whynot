import { system, world } from "@minecraft/server";
import { main as camino_recorra_tu_pasado } from "./addons/camino_recorra_tu_pasado";
import { main as light_fruit, startup as light_fruit_startup } from "./addons/light_fruit";

world.afterEvents.worldLoad.subscribe(ev => {
    camino_recorra_tu_pasado();
    light_fruit();
})
system.beforeEvents.startup.subscribe(ev => {
    light_fruit_startup(ev);
})