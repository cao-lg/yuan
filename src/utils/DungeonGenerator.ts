import Phaser from 'phaser'
import Dungeon from '@mikewesthad/dungeon'

export default class DungeonGenerator {
	private dungeon: any

	constructor() {
	}

	generateDungeon(width: number = 50, height: number = 50) {
		this.dungeon = new Dungeon({
			width: width,
			height: height,
			doorPadding: 1,
			randomSeed: Math.random().toString(),
			rooms: {
				width: {
					min: 6,
					max: 12,
					onlyOdd: true
				},
				height: {
					min: 6,
					max: 12,
					onlyOdd: true
				},
				maxArea: 144,
				maxRooms: 15
			}
		})

		return this.dungeon
	}

	getDungeon() {
		return this.dungeon
	}

	getMappedTiles() {
		if (!this.dungeon) {
			return null
		}

		return this.dungeon.getMappedTiles({
			empty: 0,
			floor: 20,
			door: 20,
			wall: 55
		})
	}

	getWallsTiles() {
		if (!this.dungeon) {
			return null
		}

		const wallsTiles = this.dungeon.getMappedTiles({
			empty: 0,
			floor: 0,
			door: 0,
			wall: 55
		})

		return wallsTiles
	}

	getRooms() {
		return this.dungeon ? this.dungeon.rooms : []
	}

	getStartRoom() {
		const rooms = this.getRooms()
		return rooms.length > 0 ? rooms[0] : null
	}
}
