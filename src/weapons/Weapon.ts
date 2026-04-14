import Phaser from 'phaser'

export default abstract class Weapon {
    protected scene: Phaser.Scene
    protected owner: Phaser.GameObjects.GameObject
    protected bullets: Phaser.Physics.Arcade.Group
    protected fireRate: number
    protected lastFired: number = 0
    protected ammo: number
    protected maxAmmo: number

    constructor(scene: Phaser.Scene, owner: Phaser.GameObjects.GameObject, fireRate: number, ammo: number) {
        this.scene = scene
        this.owner = owner
        this.fireRate = fireRate
        this.ammo = ammo
        this.maxAmmo = ammo

        this.bullets = this.scene.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 20
        })
    }

    abstract fire(x: number, y: number, direction: Phaser.Math.Vector2): void

    getBullets(): Phaser.Physics.Arcade.Group {
        return this.bullets
    }

    getAmmo(): number {
        return this.ammo
    }

    getMaxAmmo(): number {
        return this.maxAmmo
    }

    reload(): void {
        this.ammo = this.maxAmmo
    }

    canFire(): boolean {
        return this.ammo > 0 && this.scene.time.now > this.lastFired + this.fireRate
    }

    update(): void {
        // 可以在子类中实现更新逻辑
    }
}