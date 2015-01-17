(function() {
    'use strict';

    var torchCache = {};

    Game.Shadow = function(game) {
        this.shadowTexture = game.add.bitmapData(game.width, game.height);
        Phaser.Image.call(this, game, 0, 0, this.shadowTexture);
        this.fixedToCamera = true;

        this.blendMode = Phaser.blendModes.LUMINOSITY;

        this.shadowTexture.fill(0, 0, 0, 0.1);
    };

    Game.Shadow.prototype = Object.create(Phaser.Image.prototype);
    Game.Shadow.prototype.constructor = Game.Shadow;


    Game.Torch = function(game, x, y, radius, fade) {
        this.torchTexture = torchCache[radius + '' + fade] ? torchCache[radius] : Game.Torch.createRadial(game, radius, fade);
        Phaser.Image.call(this, game, x, y, this.torchTexture);

        this.anchor.setTo(0.5);

        this.blendMode = Phaser.blendModes.ADD;
        this.alpha = 0.5;
    };

    Game.Torch.prototype = Object.create(Phaser.Image.prototype);
    Game.Torch.prototype.constructor = Game.Torch;

    Game.Torch.createRadial = function(game, radius, fade) {
        radius = radius || 200;
        fade = fade || 0.1;

        var bitmapData = new Phaser.BitmapData(game, 'radial' + radius, radius * 2, radius * 2);

        var gradient = bitmapData.context.createRadialGradient(
            radius, radius, radius * fade,
            radius, radius, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        bitmapData.context.beginPath();
        bitmapData.context.fillStyle = gradient;
        // bitmapData.context.arc(this.game.input.activePointer.x, this.game.input.activePointer.y,
        //     this.LIGHT_RADIUS, 0, Math.PI*2);
        bitmapData.context.fillRect(0, 0, bitmapData.width, bitmapData.height);

        torchCache[radius + '' + fade] = bitmapData;

        return bitmapData;
    };

})();