import Phaser from 'phaser'
import Weapon from './Weapon'

export default class Pistol extends Weapon {
    constructor(scene: Phaser.Scene, owner: Phaser.GameObjects.GameObject) {
        super(scene, owner, 300, 12) // 300ms fire rate, 12 ammo
    }

    fire(x: number, y: number, direction: Phaser.Math.Vector2): void {
        if (!this.canFire()) {
            return
        }

        const bullet = this.bullets.get(x, y, 'knife') as Phaser.Physics.Arcade.Image
        if (!bullet) {
            return
        }

        bullet.setActive(true)
        bullet.setVisible(true)

        const angle = direction.angle()
        bullet.setRotation(angle)

        bullet.x += direction.x * 16
        bullet.y += direction.y * 16

        bullet.setVelocity(direction.x * 400, direction.y * 400)

        this.ammo--
        this.lastFired = this.scene.time.now
    }
}