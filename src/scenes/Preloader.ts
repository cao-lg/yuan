import Phaser from 'phaser'
import DungeonGenerator from '../utils/DungeonGenerator'

export default class Preloader extends Phaser.Scene
{
	private dungeonGenerator!: DungeonGenerator

	constructor()
	{
		super('preloader')
	}

	preload()
	{
		// 添加加载进度文本
		const progressText = this.add.text(200, 125, 'Generating Dungeon...', { fontSize: '16px', fill: '#fff' })
		progressText.setOrigin(0.5)

		// 加载资源
		this.load.image('tiles', 'tiles/dungeon_tiles_extruded.png')
		this.load.atlas('faune', 'character/fauna.png', 'character/fauna.json')
		this.load.atlas('lizard', 'enemies/lizard.png', 'enemies/lizard.json')
		this.load.atlas('treasure', 'items/treasure.png', 'items/treasure.json')
		this.load.image('ui-heart-empty', 'ui/ui_heart_empty.png')
		this.load.image('ui-heart-full', 'ui/ui_heart_full.png')
		this.load.image('knife', 'weapons/weapon_knife.png')
	}

	create()
	{
		// 初始化地牢生成器
		this.dungeonGenerator = new DungeonGenerator()
		
		// 生成地牢
		this.dungeonGenerator.generateDungeon(40, 40)
		
		// 存储地牢数据到注册表
		this.registry.set('dungeonGenerator', this.dungeonGenerator)
		
		// 进入游戏场景
		this.scene.start('game')
	}
}