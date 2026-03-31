import { Dimension, MolangVariableMap, Vector3 } from "@minecraft/server";
import { V3 } from "./math/vectorUtils";


export function spawnLine(dimension: Dimension, location: Vector3, direction: Vector3, length: number, thickness: number): void {
  	if (!dimension.isChunkLoaded(location)) return
	const variableMap = new MolangVariableMap();
	variableMap.setVector3("direction", direction);
	variableMap.setFloat("thickness", thickness);
	variableMap.setFloat("length", length);
	dimension.spawnParticle("whynot:line", location, variableMap);
}

export function drawLine(dimension: Dimension, locA: Vector3, locB: Vector3, thickness: number) {
	spawnLine(
		dimension, locA,
		V3.direction(locA, locB),
		V3.distance(locA, locB),
		thickness
	);
}