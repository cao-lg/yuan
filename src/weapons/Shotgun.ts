import Phaser from 'phaser'
import Weapon from './Weapon'

export default class Shotgun extends Weapon {
    constructor(scene: Phaser.Scene, owner: Phaser.GameObjects.GameObject) {
        super(scene, owner, 800, 6) // 800ms fire rate, 6 ammo
    }

    fire(x: number, y: number, direction: Phaser.Math.Vector2): void {
        if (!this.canFire()) {
            return
        }

        // 霰弹枪发射3颗子弹，形成扇形
        const bulletCount = 3
        const spreadAngle = Math.PI / 6 // 30度 spread

        for (let i = 0; i < bulletCount; i++) {
            const bullet = this.bullets.get(x, y, 'knife') as Phaser.Physics.Arcade.Image
            if (!bullet) {
                continue
            }

            bullet.setActive(true)
            bullet.setVisible(true)

            // 计算每颗子弹的方向
            const angleOffset = (i - (bulletCount - 1) / 2) * spreadAngle
            const bulletDirection = new Phaser.Math.Vector2(
                Math.cos(direction.angle() + angleOffset),
                Math.sin(direction.angle() + angleOffset)
            ).normalize()

            const angle = bulletDirection.angle()
            bullet.setRotation(angle)

            bullet.x += bulletDirection.x * 16
            bullet.y += bulletDirection.y * 16

            bullet.setVelocity(bulletDirection.x * 350, bulletDirection.y * 350)
        }

        this.ammo--
        this.lastFired = this.scene.time.now
    }
}