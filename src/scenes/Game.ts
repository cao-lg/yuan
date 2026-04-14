import Phaser from 'phaser'
import { VirtualJoystick } from 'phaser-virtual-joystick'

import { debugDraw } from '../utils/debug'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import { createChestAnims } from '../anims/TreasureAnims'

import Lizard from '../enemies/Lizard'

import '../characters/Faune'
import Faune from '../characters/Faune'

import { sceneEvents } from '../events/EventsCenter'
import Chest from '../items/Chest'

export default class Game extends Phaser.Scene
{
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
	private faune!: Faune
	private joystick?: VirtualJoystick
	private joystickInput: { x: number; y: number } = { x: 0, y: 0 }

	private knives!: Phaser.Physics.Arcade.Group
	private lizards!: Phaser.Physics.Arcade.Group

	private playerLizardsCollider?: Phaser.Physics.Arcade.Collider

	constructor()
	{
		super('game')
	}

	preload()
    {
		this.cursors = this.input.keyboard.createCursorKeys()
    }

    create()
    {
		this.scene.run('game-ui')

		createCharacterAnims(this.anims)
		createLizardAnims(this.anims)
		createChestAnims(this.anims)

		const map = this.make.tilemap({ key: 'dungeon' })
		const tileset = map.addTilesetImage('dungeon', 'tiles', 16, 16, 1, 2)

		map.createLayer('Ground', tileset)

		this.knives = this.physics.add.group({
			classType: Phaser.Physics.Arcade.Image,
			maxSize: 3
		})

		this.faune = this.add.faune(128, 128, 'faune')
		this.faune.setKnives(this.knives)

		const wallsLayer = map.createLayer('Walls', tileset)

		wallsLayer.setCollisionByProperty({ collides: true })

		const chests = this.physics.add.staticGroup({
			classType: Chest
		})
		const chestsLayer = map.getObjectLayer('Chests')
		chestsLayer.objects.forEach(chestObj => {
			chests.get(chestObj.x! + chestObj.width! * 0.5, chestObj.y! - chestObj.height! * 0.5, 'treasure')
		})

		this.cameras.main.startFollow(this.faune, true)

		this.lizards = this.physics.add.group({
			classType: Lizard,
			createCallback: (go) => {
				const lizGo = go as Lizard
				lizGo.body.onCollide = true
			}
		})

		const lizardsLayer = map.getObjectLayer('Lizards')
		lizardsLayer.objects.forEach(lizObj => {
			this.lizards.get(lizObj.x! + lizObj.width! * 0.5, lizObj.y! - lizObj.height! * 0.5, 'lizard')
		})

		this.physics.add.collider(this.faune, wallsLayer)
		this.physics.add.collider(this.lizards, wallsLayer)

		this.physics.add.collider(this.faune, chests, this.handlePlayerChestCollision, undefined, this)

		this.physics.add.collider(this.knives, wallsLayer, this.handleKnifeWallCollision, undefined, this)
		this.physics.add.collider(this.knives, this.lizards, this.handleKnifeLizardCollision, undefined, this)

		this.playerLizardsCollider = this.physics.add.collider(this.lizards, this.faune, this.handlePlayerLizardCollision, undefined, this)

		// 创建虚拟摇杆
		this.joystick = new VirtualJoystick({
			scene: this
		})
		this.add.existing(this.joystick)

		// 监听虚拟摇杆事件
		this.joystick.on('move', (data) => {
			this.joystickInput = data
		})

		this.joystick.on('release', () => {
			this.joystickInput = { x: 0, y: 0 }
		})
	}

	private handlePlayerChestCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject)
	{
		const chest = obj2 as Chest
		this.faune.setChest(chest)
	}

	private handleKnifeWallCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject)
	{
		this.knives.killAndHide(obj1)
	}

	private handleKnifeLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject)
	{
		this.knives.killAndHide(obj1)
		this.lizards.killAndHide(obj2)
	}

	private handlePlayerLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject)
	{
		const lizard = obj2 as Lizard
		
		const dx = this.faune.x - lizard.x
		const dy = this.faune.y - lizard.y

		const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200)

		this.faune.handleDamage(dir)

		sceneEvents.emit('player-health-changed', this.faune.health)

		if (this.faune.health <= 0)
		{
			this.playerLizardsCollider?.destroy()
		}
	}
	
	update(t: number, dt: number)
	{
		// 更新虚拟摇杆
		this.joystick?.update()

		if (this.faune)
		{
			// 检查虚拟摇杆输入
			if (this.joystickInput.x !== 0 || this.joystickInput.y !== 0) {
				const speed = 100;
				this.faune.setVelocity(this.joystickInput.x * speed, this.joystickInput.y * speed);
				
				// 根据虚拟摇杆的输入更新角色动画
				if (Math.abs(this.joystickInput.x) > Math.abs(this.joystickInput.y)) {
					// 水平移动
					this.faune.anims.play('faune-run-side', true);
					this.faune.scaleX = this.joystickInput.x > 0 ? 1 : -1;
					this.faune.body.offset.x = this.joystickInput.x > 0 ? 8 : 24;
				} else {
					// 垂直移动
					if (this.joystickInput.y > 0) {
						this.faune.anims.play('faune-run-down', true);
					} else if (this.joystickInput.y < 0) {
						this.faune.anims.play('faune-run-up', true);
					}
				}
			} else {
				// 虚拟摇杆没有输入，使用键盘控制
				this.faune.update(this.cursors);
			}
		}
	}
}
