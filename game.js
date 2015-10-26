var state = new Phaser.State();
var title;
var score = 0;
var scoreText;
var player;
var platforms;
var coins;
var cursors;
var jumpButton;

state.preload = function(game) {
    if (Phaser.Plugin.Debug) {
        game.add.plugin(Phaser.Plugin.Debug);
    }

    // set up some things that don't need any data
    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    game.stage.backgroundColor = '#85b5e1';
    if (!title) {
        title = new Phaser.Text(game, game.width/2, game.height/2, '', {fill: "white"});
        title.anchor.set(0.5);
        game.stage.addChild(title);
    }
    title.text = '';
    if (!scoreText) {
        scoreText = new Phaser.Text(game, 5, 5, '', {fill: "white"});
        game.stage.addChild(scoreText);
    }
    score = 0;
    scoreText.text = 'Score: '+score;

    // load sprite images
    game.load.baseURL = 'http://examples.phaser.io/assets/';
    game.load.crossOrigin = 'anonymous';
    game.load.spritesheet('player', 'games/starstruck/dude.png', 32, 48);
    game.load.image('platform', 'sprites/platform.png');
    game.load.spritesheet('coin', 'sprites/coin.png', 32, 32);
};

state.create = function(game) {
    // create the player
    player = game.add.sprite(100, 200, 'player');
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('stop', [4], 10, false);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    game.physics.arcade.enable(player);
    player.body.gravity.y = 500;
    player.numberOfJumps = 0;

    // make the camera follow the player
    game.camera.follow(player, Phaser.Camera.FOLLOW_PLATFORMER)
    game.world.resize(Infinity, 600)

    // create some platforms
    platforms = game.add.physicsGroup();
    platforms.create(500, 150, 'platform');
    platforms.create(-200, 300, 'platform');
    platforms.create(400, 450, 'platform');
    platforms.setAll('body.immovable', true);

    // create one coin on each platform
    coins = game.add.physicsGroup();
    platforms.forEachAlive(function(platform){
        var coin = coins.create(platform.x + Math.random()*(platform.width-32), platform.y - 50, 'coin');
        coin.animations.add('spin', null, 10, true);
        coin.play('spin');
        coin.body.gravity.y = 500;
    });

};

state.update = function(game) {
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(coins, platforms);

    // walk left and right
    if (cursors.left.isDown) {
        player.body.velocity.x = -250;
        player.play('left');
    }
    else if (cursors.right.isDown) {
        player.body.velocity.x = 250;
        player.play('right');
    }
    else {
        player.body.velocity.x = 0;
        player.play('stop');
    }

    // jump
    if (player.body.touching.down) {
        player.numberOfJumps = 0;
    }
    if (!jumpButton.isDown) {
        jumpButton.wasUp = true;
    }
    if (jumpButton.wasUp && jumpButton.isDown && (player.numberOfJumps < 2)) {
        player.body.velocity.y = -400;
        player.numberOfJumps++;
        jumpButton.wasUp = false;
    }

    // fall off the bottom
    if (player.alive && player.y > game.height) {
        player.kill();
        title.text = "Game Over";
    }

    // collect coins
    coins.forEachAlive(function(coin){
        if (coin.body.touching.down) {
            coin.body.velocity.y = -100; // bounce
        }
        if (player.position.distance(coin.position) < 30) {
            coin.kill();
            score = score + 1;
            scoreText.text = "Score: " + score;
        }
    });

    // remove old platforms and coins
    platforms.forEachExists(function(platform){
        if (platform.right < player.left - 100) {
            var emitter = game.add.emitter(platform.right, platform.y, 200);
            emitter.makeParticles('platform');
            emitter.start(true, 5000, null, 5);
            emitter.forEach(function(particle){
                particle.scale = new Phaser.Point(.2,.5);
            });

            platform.x = platform.left + platform.width*2;
            platform.y = 300 + Math.random()*300;
            var coin = coins.create(platform.x + Math.random()*(platform.width-32), platform.y - 50, 'coin');
            coin.animations.add('spin', null, 10, true);
            coin.play('spin');        
            coin.body.gravity.y = 500;
        }
    });
};

state.render = function(game) {

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-game', state);
