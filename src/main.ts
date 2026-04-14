import Phaser from 'phaser'

console.log('Phaser imported:', Phaser);

// 简单的 Phaser 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        create: function() {
            console.log('Scene create function called!');
            // 设置背景颜色
            this.cameras.main.setBackgroundColor('#ff0000');
            console.log('Background color set');
            
            // 添加一个简单的文本
            const text = this.add.text(100, 100, 'Hello Phaser!', { fontSize: '32px', fill: '#fff' });
            console.log('Text added:', text);
            
            // 添加一个蓝色的方块
            const rect = this.add.rectangle(400, 300, 100, 100, 0x0000ff);
            console.log('Rectangle added:', rect);
        }
    }
};

console.log('Creating game instance with config:', config);

// 创建游戏实例
const game = new Phaser.Game(config);

console.log('Game created:', game);

// 导出游戏实例
export default game;
