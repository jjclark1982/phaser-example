var state = new Phaser.State();
var title;
var score = 0;
var scoreText;
var player;
var platforms;
var coins;
var ufo;
var cursors;
var jumpButton;
var sky;
var nearClouds;
var farClouds;
var fgClouds;

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
    game.load.image('ufo', 'sprites/ufo.png');
    game.load.image('sky', 'skies/deepblue.png');
    game.load.image('cloud', 'particles/cloud.png');
};

state.create = function(game) {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // place the background.
    // it's slightly bigger than 800x600 in case it lags behind the camera.
    sky = game.add.tileSprite(0,300, 850, 600, 'sky');
    sky.anchor.set(0.5);

    farClouds = game.add.tileSprite(0,180, 1100, 128, 'cloud');
    farClouds.anchor.set(0.5);
    farClouds.scale = new Phaser.Point(0.75, 0.75);

    nearClouds = game.add.tileSprite(0,100, 850, 128, 'cloud');
    nearClouds.anchor.set(0.5);
    
    // create the player
    player = game.add.sprite(100, 100, 'player');
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('stop', [4], 10, false);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    game.physics.arcade.enable(player);
    player.body.gravity.y = 600;
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
    ufos = game.add.physicsGroup();
    platforms.forEachAlive(function(platform){
        var coin = coins.create(platform.x + Math.random()*(platform.width-32), platform.y - 50, 'coin');
        coin.animations.add('spin', null, 10, true);
        coin.play('spin');
        coin.body.gravity.y = 500;

        var ufo = ufos.create(platform.x + Math.random()*(platform.width-32), platform.y - 100, 'ufo');
        ufo.body.gravity.y = 500;        
    });


    fgClouds = game.add.tileSprite(0,25, 850, 128, 'cloud');
    fgClouds.anchor.set(0.5);
    fgClouds.scale = new Phaser.Point(1.25, 1.25);
};

function gameOver() {
    if (player.alive) {
        player.kill();
        title.text = "Game Over";
        var emitter = game.add.emitter(player.x, player.y, 1, 1);
        emitter.makeParticles('player');
        emitter.start(true, 5000, null, 1);
        emitter.forEach(function(particle){
            particle.body.gravity.y = 500;
        });
    }
}

state.update = function(game) {
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(coins, platforms);
    game.physics.arcade.collide(ufos, platforms);

    // walk left and right
    if (cursors.left.isDown) {
        player.body.velocity.x = 0;
        player.play('stop');
    }
    else {
        if (player.body.velocity.x < 400) {
            player.body.velocity.x += 10;        
        }
        player.play('right');
    }

    // jump
    if (player.body.touching.down) {
        player.numberOfJumps = 0;
    }
    if (!jumpButton.isDown) {
        player.body.gravity.y = 600;
        jumpButton.wasUp = true;
    }
    if (jumpButton.wasUp && jumpButton.isDown && (player.numberOfJumps < 2)) {
        player.body.velocity.y = -400;
        player.numberOfJumps++;
        player.body.gravity.y = 300;
        jumpButton.wasUp = false;
    }

    // fall off the bottom
    if (player.alive && player.y > game.height) {
        gameOver();
    }

    // move ufos
    ufos.forEachAlive(function(ufo) {
        if (ufo.body.touching.down) {
            ufo.body.velocity.y = -300; // bounce
        }
        var boundsA = ufo.getBounds();
        var boundsB = player.getBounds();
        if (Phaser.Rectangle.intersects(boundsA, boundsB)) {
            if (player.alive && player.bottom < ufo.top+10) {
                ufo.kill();
                var emitter = game.add.emitter(ufo.x, ufo.y, 1, 1);
                emitter.makeParticles('ufo');
                emitter.start(true, 5000, null, 1);
                emitter.forEach(function(particle){
                    particle.body.gravity.y = 600;
                });
                player.body.velocity.y = -400;
                player.numberOfJumps = 1;
            }
            else {
                gameOver();            
            }
        }
    });

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
            var emitter = game.add.emitter(platform.right, platform.y, 5);
            emitter.makeParticles('platform');
            emitter.start(true, 5000, null, 5);
            emitter.forEach(function(particle){
                particle.scale = new Phaser.Point(.2,.5);
            });

            platform.x = platform.left + platform.width*2;
            platform.y = 200 + Math.random()*300;
            var coin = coins.create(platform.x + Math.random()*(platform.width-32), platform.y - 50, 'coin');
            coin.animations.add('spin', null, 10, true);
            coin.play('spin');        
            coin.body.gravity.y = 500;

            var ufo = ufos.create(platform.x + Math.random()*(platform.width-32), platform.y - 50, 'ufo');
            ufo.body.gravity.y = 500;
        }
    });
};

state.render = function(game) {
    sky.position = game.camera.position;

    nearClouds.position.x = game.camera.position.x;
    nearClouds.tilePosition.x = -game.camera.position.x/2;

    farClouds.position.x = game.camera.position.x;
    farClouds.tilePosition.x = -game.camera.position.x/2;

    fgClouds.position.x = game.camera.position.x;
    fgClouds.tilePosition.x = -game.camera.position.x/.98;
};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-game', state);
