import { ContainerSlot, Dimension, Direction, Entity, EntityEquippableComponent, EquipmentSlot, MolangVariableMap, RGBA, Vector3 } from "@minecraft/server";
import { V3 } from "./math/vectorUtils";
import { VECTOR3_DOWN, VECTOR3_EAST, VECTOR3_NORTH, VECTOR3_SOUTH, VECTOR3_UP, VECTOR3_WEST } from "@minecraft/math";


export function spawnLine(dimension: Dimension, location: Vector3, direction: Vector3, length: number, thickness: number, color: RGBA): void {
  	if (!dimension.isChunkLoaded(location)) return
	const variableMap = new MolangVariableMap();
	variableMap.setVector3("direction", direction);
    variableMap.setColorRGBA("color", color);
	variableMap.setFloat("thickness", thickness);
	variableMap.setFloat("length", length);
	dimension.spawnParticle("whynot:line", location, variableMap);
}

export function drawLine(dimension: Dimension, locA: Vector3, locB: Vector3, thickness: number, color: RGBA) {
	spawnLine(
		dimension, locA,
		V3.direction(locA, locB),
		V3.distance(locA, locB),
		thickness,
        color
	);
}


export function entityGetSlot(entity: Entity | undefined, slot: EquipmentSlot): ContainerSlot | undefined {
    if (!entity || !entity.isValid) return;

    let equipment = entity.getComponent(EntityEquippableComponent.componentId) as EntityEquippableComponent;
    if (!equipment || !equipment.isValid) return;
    
    let containerSlot = equipment.getEquipmentSlot(slot);
    return containerSlot;
}

export function entityHasSlotTag(entity: Entity | undefined, slot: EquipmentSlot, tag: string): boolean {
    const containerSlot = entityGetSlot(entity, slot);
    if (!containerSlot?.isValid || !containerSlot.hasItem()) return false;
    return containerSlot.hasTag(tag);
}

export function directionVector(face: Direction): Vector3 {
    switch (face) {
        case Direction.Up: return VECTOR3_UP;
        case Direction.Down: return VECTOR3_DOWN;
        case Direction.North: return VECTOR3_NORTH;
        case Direction.South: return VECTOR3_SOUTH;
        case Direction.East: return VECTOR3_EAST;
        case Direction.West: return VECTOR3_WEST;
    }
}