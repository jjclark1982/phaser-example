require('file?name=index.html!./index.html')

global.PIXI = require('pixi.js')
global.p2 = require('p2')
require('script!phaser')

game = new Phaser.Game(800, 800, Phaser.AUTO, 'phaser_game')

for el in document.querySelectorAll(".loading")
    el.remove()
