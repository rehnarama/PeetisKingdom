(function() {
    'use strict';

    /**
     * Reference file: https://github.com/photonstorm/phaser-examples/blob/master/projects/rox/src/Player.js
     */

    var textureKey = 'player1';
    var maxSpeed = 500;
    var fullJumpMeter = 500;
    var acc = 2000;
    var maxJumps = 2;

    Game.Player = function(game, x, y) {

        Phaser.Sprite.call(this, game, x, y, textureKey);

        this.anchor.set(0.5);
        this.game.physics.enable(this, Phaser.Physics.ARCADE);

        this.body.collideWorldBounds = true;

        this.controller = new Game.Controller(this.game);

        this.animations.add('running', [5, 6, 7, 8, 9, 10, 11, 12], 10, true);
        this.animations.add('jump', [3], 20, true);
        this.animations.add('falling', [2], 20, true);
        this.animations.add('still', [1], 20, true);

        this.currAnim = '';

        var point = new Phaser.Point();
        point.x = 500;
        point.y = 1000;
        this.body.maxVelocity = point;
        this.jumpMeter = fullJumpMeter;
        this.currentJumps = 0;

        this.ctrlKey = this.game.input.keyboard.addKey(17);

        return this;
    };

    // Clone the Phaser.Sprite prototype, and use it as our own. 
    // This is how inheritance works in JavaScript btw
    Game.Player.prototype = Object.create(Phaser.Sprite.prototype);
    Game.Player.prototype.constructor = Game.Player;

    Game.Player.prototype.resetJump = function() {
        this.currentJumps = 0;
        this.jumpMeter = fullJumpMeter;
    };

    Game.Player.prototype.jump = function() {
        if (this.controller.jump.isDown) {
            if (!this.jumpWasDown) {
                this.currentJumps += 1;

                if (this.currentJumps < maxJumps && this.body.velocity.y > 0) {
                    this.body.velocity.y = 0;
                }
            }

            if (this.jumpMeter > 0 && this.currentJumps < maxJumps) {
                this.body.velocity.y -= this.jumpMeter;
                this.jumpMeter *= 0.5;

                this.animations.play('jump');
            }
        } else {
            if (this.jumpWasDown) {
                if (maxJumps !== this.currentJumps) {
                    this.jumpMeter = fullJumpMeter;
                } else {
                    this.jumpMeter = 0;
                }
            }
        }


        // if (this.controller.jump.isDown && this.jumpMeter > 0 && this.currentJumps !== maxJumps) {
        //     this.jumpMeter += jumpAcc;
        //     this.body.velocity.y += jumpAcc;
        //     this.currentJumps += 1;

        //     this.animations.play('jump');
        // } else if (!this.controller.jump.isDown && !(this.body.onFloor() || this.body.touching.down)) {
        //     if (maxJumps !== this.currentJumps) {
        //         this.jumpMeter = fullJumpMeter;
        //     } else {
        //         this.jumpMeter = 0;
        //     }
        // }

        this.jumpWasDown = this.controller.jump.isDown;
    };

    Game.Player.prototype.animate = function() {
        if (this.controller.right.isDown || this.controller.left.isDown) {
            this.animations.play('running');
        }

        if (this.body.velocity.y > 0 && !this.body.onFloor()) {
            this.animations.play('falling');
        }

        if ((this.body.touching.down || this.body.onFloor()) && Math.abs(this.body.velocity.x) < 40) {
            this.animations.play('still');
        }
    };

    Game.Player.prototype.update = function() {

        if (this.controller.right.isDown) {
            this.body.acceleration.x = acc;

            this.animations.play('running');

            this.scale.x = 1;
        } else if (this.controller.left.isDown) {
            this.body.acceleration.x = -acc;

            this.animations.play('running');

            this.scale.x = -1;
        } else {
            this.body.acceleration.x = this.body.velocity.x * -5;
        }

        if (this.game.physics.arcade.gravity === Game.gravity) {
            this.jump();
        } else {
            if (this.controller.jump.isDown) {
                this.body.velocity.y -= acc * 0.01;
            } else if (this.controller.down.isDown) {
                this.body.velocity.y += acc * 0.01;
            } else {
                this.body.velocity.y *= 0.2;
            }
        }

        if (this.ctrlKey.isDown) {
            this.body.maxVelocity.x = 0;
            this.body.maxVelocity.y = 0;
            this.body.acceleration.y *= 2;
            this.body.acceleration.x *= 2;
        } else {
            this.body.maxVelocity.x = 500;
            this.body.maxVelocity.y = 1000;
        }

        if (this.body.onFloor() || this.body.touching.down) {
            this.resetJump();
        }

        this.animate();
    };

})();