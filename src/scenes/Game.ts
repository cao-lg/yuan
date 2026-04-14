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
	private fireButton?: Phaser.GameObjects.Image
	private weaponSwitchButton?: Phaser.GameObjects.Image

	private lizards!: Phaser.Physics.Arcade.Group
	private wallsLayer?: Phaser.Tilemaps.TilemapLayer

	private playerLizardsCollider?: Phaser.Physics.Arcade.Collider
	private weaponColliders: Phaser.Physics.Arcade.Collider[] = []

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

		this.faune = this.add.faune(128, 128, 'faune')

		this.wallsLayer = map.createLayer('Walls', tileset)

		this.wallsLayer.setCollisionByProperty({ collides: true })

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

		this.physics.add.collider(this.faune, this.wallsLayer)
		this.physics.add.collider(this.lizards, this.wallsLayer)

		this.physics.add.collider(this.faune, chests, this.handlePlayerChestCollision, undefined, this)

		this.playerLizardsCollider = this.physics.add.collider(this.lizards, this.faune, this.handlePlayerLizardCollision, undefined, this)

		// 添加武器碰撞检测
		this.updateWeaponCollisions()

		// 监听武器切换事件
		sceneEvents.on('player-weapon-changed', () => {
			this.updateWeaponCollisions()
		})

		// 创建虚拟摇杆
		this.joystick = new VirtualJoystick({
			scene: this,
			enableWithoutTouch: true // 允许在桌面使用鼠标测试
		})
		this.add.existing(this.joystick)

		// 监听虚拟摇杆事件
		this.joystick.on('move', (data) => {
			this.joystickInput = data
		})

		this.joystick.on('release', () => {
			this.joystickInput = { x: 0, y: 0 }
		})

		// 创建开火按钮
		this.createFireButton()

		// 创建武器切换按钮
		this.createWeaponSwitchButton()

		// 监听窗口大小变化
		this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
			this.resize(gameSize.width, gameSize.height)
		})
	}

	private createWeaponSwitchButton() {
		// 计算按钮位置，使用百分比而不是固定值
		const buttonSize = 45
		const margin = 20
		const fireButtonSize = 60
		
		// 创建武器切换按钮
		this.weaponSwitchButton = this.add.image(
			this.cameras.main.width - margin - buttonSize / 2,
			this.cameras.main.height - margin - fireButtonSize - buttonSize / 2,
			'knife'
		)
		.setScale(1.5)
		.setInteractive()
		.setScrollFactor(0)

		// 为按钮添加点击事件
		this.weaponSwitchButton.on('pointerdown', () => {
			this.faune.switchWeapon()
		})

		// 添加视觉反馈
		this.weaponSwitchButton.on('pointerover', () => {
			this.weaponSwitchButton?.setTint(0xaaaaaa)
		})

		this.weaponSwitchButton.on('pointerout', () => {
			this.weaponSwitchButton?.clearTint()
		})
	}

	private updateWeaponCollisions() {
		// 移除旧的碰撞检测
		this.weaponColliders.forEach(collider => {
			collider.destroy()
		})
		this.weaponColliders = []

		// 获取当前武器
		const weapon = this.faune.getWeapon()
		if (!weapon) {
			return
		}

		// 添加新的碰撞检测
		const bullets = weapon.getBullets()
		if (this.wallsLayer) {
			this.weaponColliders.push(
				this.physics.add.collider(bullets, this.wallsLayer, this.handleBulletWallCollision, undefined, this),
				this.physics.add.collider(bullets, this.lizards, this.handleBulletLizardCollision, undefined, this)
			)
		}
	}

	private handleBulletWallCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
		const bullet = obj1 as Phaser.Physics.Arcade.Image
		bullet.setActive(false)
		bullet.setVisible(false)
	}

	private handleBulletLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
		const bullet = obj1 as Phaser.Physics.Arcade.Image
		bullet.setActive(false)
		bullet.setVisible(false)
		this.lizards.killAndHide(obj2)
	}

	private createFireButton() {
		// 计算按钮位置，使用百分比而不是固定值
		const buttonSize = 60
		const margin = 20
		
		// 创建开火按钮精灵
		this.fireButton = this.add.image(
			this.cameras.main.width - margin - buttonSize / 2,
			this.cameras.main.height - margin - buttonSize / 2,
			'knife'
		)
		.setScale(2)
		.setInteractive()
		.setScrollFactor(0)

		// 为按钮添加点击事件
		this.fireButton.on('pointerdown', () => {
			this.faune.throwKnife()
		})

		// 添加视觉反馈
		this.fireButton.on('pointerover', () => {
			this.fireButton?.setTint(0xaaaaaa)
		})

		this.fireButton.on('pointerout', () => {
			this.fireButton?.clearTint()
		})
	}

	private handlePlayerChestCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject)
	{
		const chest = obj2 as Chest
		this.faune.setChest(chest)
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

	// 监听窗口大小变化，更新按钮位置
	resize(width: number, height: number) {
		if (this.fireButton) {
			const buttonSize = 60
			const margin = 20
			this.fireButton.setPosition(
				width - margin - buttonSize / 2,
				height - margin - buttonSize / 2
			)
		}

		if (this.weaponSwitchButton) {
			const buttonSize = 45
			const margin = 20
			const fireButtonSize = 60
			this.weaponSwitchButton.setPosition(
				width - margin - buttonSize / 2,
				height - margin - fireButtonSize - buttonSize / 2
			)
		}
	}
}
