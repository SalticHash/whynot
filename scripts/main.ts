import { world } from "@minecraft/server";
import { main as camino_recorra_tu_pasado } from "./addons/camino_recorra_tu_pasado";
import { main as light_fruit } from "./addons/light_fruit";

world.afterEvents.worldLoad.subscribe(ev => {
    camino_recorra_tu_pasado();
    light_fruit();
})