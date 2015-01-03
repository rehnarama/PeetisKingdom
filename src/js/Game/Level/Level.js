(function() {
    'use strict';

    var specialCollision = {
        bottomRight: [
            129,
            136,
            132,
            67,
            45,
            15
        ],
        bottomLeft: [
            30,
            33,
            37,
            40,
            95,
            117
        ],
        bottomThird: [
            102
        ],
        topThird: [
        ],
        topHalf: [
        ],
        bottomHalf: [
        ],
        exclude: [
            93,
            118,
            143,
            65,
            90,
            155
        ]
    };

    Game.Level = function(game) {
        this.game = game;

        /**
         * An array containing criterias fulfilled
         * @type {Array#String}
         */
        this.criterias = this.game.criterias = [];
        this.game.onCriteriaAdd = new Phaser.Signal();
        this.game.onCriteriaRemove = new Phaser.Signal();

        this.debugMode = false;

        this.levelSize = {
            x: 0,
            y: 0,
            width: 3000,
            height: 3720
        };

        this.toggleFullScreen = function() {
            if (this.game.scale.isFullScreen) {
                this.game.scale.stopFullScreen();
            } else {
                this.game.scale.startFullScreen(false);
            }
        };

        this.toggleDebug = function() {
            if (this.debugMode) {
                this.fpsMeter.parent.remove(this.fpsMeter);
                this.level.debug = false;
            } else {
                this.game.add.existing(this.fpsMeter);
                this.level.debug = true;
            }

            this.level.dirty = true;
            this.debugMode = !this.debugMode;
        };

        this.toggleMusic = function() {
            if (this.music.isPlaying) {
                this.music.pause();
            } else {
                if (this.music.paused) {
                    this.music.resume();
                } else {
                    this.music.play();
                }
            }

            return !this.music.isPlaying;
        };
    };

    Game.Level.prototype = Object.create(self.Game.Utils.BaseState.prototype);
    Game.Level.prototype.constructor = Game.Level;
    /**
     * Load content here, e.g. this.load.image('myDude', '/assets/images/myDude.png')
     */
    Game.Level.prototype.preload = function() {
        var preloadBar = this.game.add.sprite(this.game.width / 2, this.game.height / 2, 'preloadBar');
        preloadBar.fixedToCamera = true;
        preloadBar.anchor.set(0.5);
        this.game.load.setPreloadSprite(preloadBar);

        this.game.load.spritesheet('player1', 'assets/player.png', 68, 84);
        this.game.load.spritesheet('spritesheet', 'assets/spritesheet.png', 64, 64);

        this.game.load.atlasXML('alienYellow', 'assets/alienYellow.png', 'assets/alienYellow.xml');
        this.game.load.atlasXML('UI', 'assets/UI.png', 'assets/UI.xml');
        this.game.load.atlasXML('p1', 'assets/p1_spritesheet.png', 'assets/p1_spritesheet.xml');

        this.game.load.audio('jump', 'assets/sfx/jump.ogg');
        this.game.load.audio('objectComplete', 'assets/sfx/object_complete.wav');
        this.game.load.audio('pickupCoin', 'assets/sfx/pickup_coin.wav');

        this.game.load.audio('solskenspromenad', 'assets/Solskenspromenad.mp3');

        this.game.load.image('dialoguePanel', 'assets/dialoguePanel.png');
        this.game.load.image('grasshopper', 'assets/characters/grasshopper256.png');

        this.game.load.tilemap('map', 'assets/map.json', null, Phaser.Tilemap.TILED_JSON);
    };

    /**
     * Generates any level related objects
     * @return {[type]} [description]
     */
    Game.Level.prototype.generateLevel = function() {
        this.map = this.game.add.tilemap('map');
        this.map.addTilesetImage('spritesheet');

        this.levelSize.width = this.map.width * this.map.tileWidth;
        this.levelSize.height = this.map.height * this.map.tileHeight;

        var bmd = this.game.make.bitmapData(this.game.width, this.game.height);
        this.bg = this.game.add.image(0, 0, bmd);
        this.bg.bmd = bmd;
        this.paintBG();
        this.bg.fixedToCamera = true;

        // The layer that the player does not interact with
        this.behind = this.map.createLayer('behind');
        this.behind.overlay = 'rgba(0,0,0,0.4)';

        this.level = this.map.createLayer('collision');
        // The layer containing platforms
        var firstID = this.map.tilesets[this.map.getTilesetIndex('spritesheet')].firstgid;
        var collisionTiles = [];
        _.forEach(this.level.layer.data, function(e) {
            _.forEach(e, function(t) {
                if (t.index > -1 && !_.contains(specialCollision.exclude, t.index - firstID) && !_.contains(collisionTiles, t.index)) {
                    collisionTiles.push(t.index);
                }

                if (_.contains(specialCollision.bottomRight, t.index - firstID)) {
                    t.slope = 'HALF_TRIANGLE_BOTTOM_RIGHT';
                }

                if (_.contains(specialCollision.bottomLeft, t.index - firstID)) {
                    t.slope = 'HALF_TRIANGLE_BOTTOM_LEFT';
                }

                if (_.contains(specialCollision.bottomThird, t.index - firstID)) {
                    t.worldY += 2 * t.height / 3;
                    t.height /= 3;
                }

                if (_.contains(specialCollision.topThird, t.index - firstID)) {
                    t.height /= 3;
                }

                if (_.contains(specialCollision.bottomHalf, t.index - firstID)) {
                    t.worldY += t.height * 0.5;
                    t.height *= 0.5;
                }

                if (_.contains(specialCollision.bottomHalf, t.index - firstID)) {
                    t.height *= 0.5;
                }
            });
        });
        this.front = this.map.createLayer('front');

        this.level.resizeWorld();

        var renderSettings = {
            enableScrollDelta: false
        };
        this.level.renderSettings = renderSettings;
        this.behind.renderSettings = renderSettings;
        this.front.renderSettings = renderSettings;

        this.map.setLayer(this.level);
        this.map.setCollision(collisionTiles);
    };

    Game.Level.prototype.setUtils = function() {
        this.fpsMeter = new Game.Utils.FpsMeter(this.game, 32, 32);

        this.f2 = this.game.input.keyboard.addKey(113);
        this.f2.onUp.add(function() {
            this.toggleDebug();
        }, this);

        this.f11 = this.game.input.keyboard.addKey(122);
        this.f11.onUp.add(function() {
            this.toggleFullScreen();
        }, this);

        this.f4 = this.game.input.keyboard.addKey(115);
        this.f4.onUp.add(function() {
            if (this.p1) {
                this.p1.godMode = !this.p1.godMode;

                if (this.p1.godMode) {
                    this.p1.body.allowGravity = false;
                } else {
                    this.p1.body.allowGravity = true;
                }
            }
        }, this);
    };

    Game.Level.prototype.generateDialogues = function() {
        this.dialogues = {
            'intro': new Game.Dialogue(this.game, [{
                text: 'Ouch... What happened? Where am I?'
            }], 'You:'),

            'instruction': new Game.Dialogue(this.game, [{
                text: 'Use arrow keys to walk, and the up key to interact with objects!'
            }, {
                text: 'To jump, press spacebar. Press it twice to double jump!'
            }], 'Instructions'),

            'welcome': new Game.Dialogue(this.game, [{
                title: 'Welcome!',
                text: 'Pro tip -- try the \'up\' arrow key!'
            }, {
                title: 'Controls',
                text: 'Use arrow keys to walk, up to interact, \nand spacebar to jump'
            }]),

            'doubleJump': new Game.Dialogue(this.game, [{
                title: 'A bit too high...',
                text: 'If I only could jump once more, \nwhile already in the air'
            }]),

            'direction': new Game.Dialogue(this.game, [{
                title: 'Road sign:',
                text: 'Right: Grasshopper\'s residential cave\nLeft: Princess Peeti\'s Mountain Castle'
            }]),

            'grasshopperQuest': new Game.Dialogue(this.game, [{
                text: 'Gosh darn it! I dropped my \npearl in the lake!'
            }, {
                title: 'You:',
                text: 'A grasshopper, and you can talk!?'
            }, {
                text: 'Of course I can talk you big dumdum!' 
            }, { 
                text: 'Anyways... You look like you can swim!\nMind diving in and getting my pearl?'
            }, {
                text: 'Pretty please! I\'ll reward you with \nthe power of leaping through the air!'
            }], 'Grasshopper:')
        };
    };

    Game.Level.prototype.generateCriteriaFunctions = function() {
        this.criteriaFunctions = {
            'activation': function() {
                return this.activateKey.downDuration(this.time.msMax);
            },
            'jump': function() {
                return this.p1.controller.jump.isDown;
            }
        };
    };

    Game.Level.prototype.generateTriggerFunctions = function() {
        this.triggerFunctions = {
            'enterWater': function() {
                this.p1.submerged = true;
            },

            'leaveWater': function() {
                this.p1.submerged = false;
            }
        };
    };

    Game.Level.prototype.generateSprites = function() {
        _.forEach(this.map.objects['sprites'], function(obj) {
            switch (obj.type) {
                case 'entity':

                    var key = obj.properties['key'];
                    var frame = obj.properties['frame'];
                    var sprite = this.game.add.sprite(obj.x, obj.y, key, frame, this.entitiesGroup);

                    break;
                default:
                    console.log('Did not recognize sprite type: ', obj.type);
            }
        }, this);
    };

    Game.Level.prototype.generateObjects = function() {
        _.forEach(this.map.objects['objects'], function(obj) {
            /* jshint shadow: true */
            switch (obj.type) {
                case 'spawn':
                    if (this.p1) {
                        var x = obj.x + obj.width / 2;
                        var y = obj.y + obj.height / 2;

                        this.p1.reset(x, y);
                        this.p1._cache[4] = 0;
                    }
                    break;
                case 'dialogue':
                    var dialogueKey = obj.properties.dialogue;
                    var dialogue = this.dialogues[dialogueKey];
                    var criteria = obj.properties.requireActivation ? this.criteriaFunctions['activation'] : undefined;
                    if (obj.properties['criteriaFunction'] && this.criteriaFunctions[obj.properties['criteriaFunction']]) {
                        criteria = this.criteriaFunctions[obj.properties['criteriaFunction']];
                    }

                    if (dialogue) {
                        var trigger = new Game.Trigger.ZoneTrigger(
                            this.game, 
                            true, 
                            new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height), 
                            this.p1,
                            criteria, 
                            undefined,
                            this);
                        this.triggerManager.addTrigger(trigger);

                        trigger.onActive.add(function() {
                            this.dialogueManager.setDialogue(dialogue);
                        }, this);

                        trigger.onInactive.add(function() {
                            this.dialogueManager.hidden = true;
                        }, this);

                    }

                    break;
                case 'criteria':

                    var criteriaFunction;
                    if (obj.properties['function'] && this.criteriaFunctions[obj.properties['function']]) {
                        criteriaFunction = this.criteriaFunctions[obj.properties['function']];
                    }
                    var trigger = new Game.Trigger.ZoneTrigger(this.game, true, new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height), this.p1, criteriaFunction, undefined, this);

                    this.triggerManager.addTrigger(trigger);

                    trigger.onActive.add(function(trigger) {
                        trigger.enabled = false;
                        this.game.criterias.push(obj.name);
                        this.game.onCriteriaAdd.dispatch(obj.name, this.game.criterias);
                    }, this);

                    if (obj.properties.inactivate) {
                        trigger.onInactive.add(function() {
                            trigger.enabled = true;
                            _.remove(this.game.criterias, obj.name);
                            this.game.onCriteriaRemove.dispatch(obj.name, this.game.criterias);
                        }, this);                        
                    }

                    break;

                case 'trigger':

                    var onEnter = obj.properties['enter'] || '';
                    var onLeave = obj.properties['leave'] || '';

                    onEnter = this.triggerFunctions[onEnter];
                    onLeave = this.triggerFunctions[onLeave];

                    if (typeof onEnter === 'undefined' && typeof onLeave === 'undefined') return;

                    var enterCriteria = obj.properties['enterCriteria'] || '';
                    var leaveCriteria = obj.properties['leaveCriteria'] || '';

                    enterCriteria = this.criteriaFunctions[enterCriteria];
                    leaveCriteria = this.criteriaFunctions[leaveCriteria];

                    var rectangles = [new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height)];


                    if (obj.properties['part']) {
                        var part = obj.properties['part'];

                        var parts = _.filter(this.map.objects['objects'], { type: 'part', name: part });

                        _.forEach(parts, function(partObj) {
                            rectangles.push(new Phaser.Rectangle(partObj.x, partObj.y, partObj.width, partObj.height));
                        });
                    }

                    var trigger = new Game.Trigger.ZoneTrigger(this.game, true, rectangles, this.p1, enterCriteria, leaveCriteria, this);

                    this.triggerManager.addTrigger(trigger);

                    trigger.onActive.add(function() {
                        if (onEnter) {
                            onEnter.call(this);
                        }
                    }, this);

                    trigger.onInactive.add(function() {
                        if (onLeave) {
                            onLeave.call(this);
                        }
                    }, this);

                    break;
            }
        }, this);
    };

    Game.Level.prototype.spawnPlayer = function(x, y) {
        this.p1 = new Game.Player(this.game, x || 0, y || 0);
        this.game.add.existing(this.p1);
        this.entitiesGroup.add(this.p1);
        this.game.camera.follow(this.p1);
        this.game.camera.deadzone = this.getCameraDeadzone();
        this.game.camera.roundPx = false;
    };

    /**
     * Initialization logic here
     */
    Game.Level.prototype.create = function() {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.arcade.gravity = Game.gravity;
        this.game.physics.arcade.TILE_BIAS = 70;

        this.activateKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);

        this.setUtils();
        this.generateLevel();
        this.generateDialogues();
        this.generateCriteriaFunctions();
        this.generateTriggerFunctions();

        this.entitiesGroup = this.game.add.group();
        this.entitiesGroup.enableBody = true;

        this.spawnPlayer();

        this.objectiveManager = new Game.ObjectiveManager(this.game, this.game.width - 50, this.game.height * 0.5);
        this.game.add.existing(this.objectiveManager);
        this.HUD = new Game.HUD(this.game);
        this.dialogueManager = this.game.dialogueManager = new Game.DialogueManager(this.game, this.HUD);
        this.triggerManager = this.game.triggerManager = new Game.Trigger.TriggerManager(this.game);

        this.generateObjects();
        this.generateSprites();

        this.objectiveManager.createObjectives(this.map, this.map.objects['objectives'], this.p1);

        this.alienYellow = new Game.Enemy(this.game, this.p1.position.x - this.game.width, this.p1.position.y);
        this.alienYellow.controller.hostile = false;
        this.game.add.existing(this.alienYellow);
        this.entitiesGroup.add(this.alienYellow);

        this.music = this.game.add.audio('solskenspromenad', 0.6, true, true);
        if (!this.game.musicMuted) {
            this.music.play();
        }

        this.activateKey.onDown.add(function() {
            this.dialogueManager.nextSlide();
        }, this);

        this.game.input.keyboard.addKey(Phaser.Keyboard.P).onUp.add(this.togglePause, this);

        this.game.world.bringToTop(this.objectiveManager);
        this.game.world.bringToTop(this.HUD);
    };

    Game.Level.prototype.update = function() {
        this.alienYellow.controller.update(this.p1);
        this.game.physics.arcade.collide(this.entitiesGroup, this.level);
    };

    Game.Level.prototype.render = function() {
        if (this.debugMode) {
            this.entitiesGroup.forEach(function(entity) {
                this.game.debug.body(entity);
            }, this);
        }

        this.paintBG();
    };

    Game.Level.prototype.pause = function() {
        this.paused = true;
        this.pauseScreen = new Game.GUI.PauseScreen(this.game, this.HUD);
    };

    Game.Level.prototype.resume = function() {
        this.paused = false;
        this.pauseScreen.destroy();
    };

    Game.Level.prototype.togglePause = function() {
        if (this.paused) {
            this.pauseScreen.resume();
        } else {
            this.pause();
        }
    };

    var lastUpdate = -20000;
    var offset = {
        value: -50
    };
    Game.Level.prototype.paintBG = function() {
        if (this.game.time.now - lastUpdate > 20000) {
            var to = 0;
            if (offset.value === 25) {
                to = -50;
            } else {
                to = 25;
            }
            this.game.add.tween(offset).to({value: to}, 10000).start();
            lastUpdate = this.game.time.now;
        }

        if (offset.value === -50 || offset.value === 25) return;

        var steps = 30;
        var pixelPerStep = this.game.height / steps;
        var bluePerStep = 200 / steps;
        var greenPerStep = 100 / steps;
        var redPerStep = 50 / steps;


        var red, green, blue, color, rnd;

        for (var y = 0; y * pixelPerStep <= this.game.height; y++) {
            red = Math.floor(redPerStep * y + offset.value);
            green = Math.floor(greenPerStep * y + offset.value * 1.5);
            blue = Math.floor(bluePerStep * y + offset.value * 2);
            color = 'rgb({0},{1},{2})'.format(red, green, blue);
            this.bg.bmd.rect(0, (steps - y) * pixelPerStep, this.game.width, pixelPerStep, color);
        }
    };
})();
