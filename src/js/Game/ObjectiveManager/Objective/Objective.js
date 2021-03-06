(function() {
    'use strict';

    Game.ObjectiveManager.Objective = function(game, objectiveManager, trigger, tilemap, object, player, dependencies) {
        Phaser.Group.call(this, game, objectiveManager, object.name);
        this.alpha = 0;

        /**
         * Game instance
         * @type {Phaser.Game}
         */
        this.game = game;

        /**
         * The player who are to complete the objective
         * @type {Phaser.Sprite}
         */
        this.player = player;

        /**
         * Instance of objectiveManager
         * @type {Game.ObjectiveManager.Objective}
         */
        this.objectiveManager = objectiveManager;

        /**
         * The object that this objective belongs to in the tilemap
         * @type {Object}
         */
        this.object = object;

        /**
         * The objects properties from the tilemap
         * @type {Object}
         */
        this.properties = this.object.properties;

        /**
         * The tilemap of which this objectives objective layer belongs to
         * @type {Phaser.Tilemap}
         */
        this.tilemap = tilemap;

        /**
         * Name of the objective
         * @type {String}
         */
        this.name = this.object.name;

        /**
         * Is the objective completed or not
         * @type {Boolean}
         */
        this.completed = false;

        /**
         * List of objective name in strings that has to be completed before this objective can be activated
         * @type {Array#String}
         */
        this.dependencies = dependencies;

        /**
         * The trigger that will trigger this objective
         * @type {Game.Trigger}
         */
        this.trigger = trigger;
        this.trigger.onActive.add(this.activate, this);
        this.trigger.onInactive.add(this.inactivate, this);

        /**
         * Whether or not to remove objective on inactive
         * @type {Boolean}
         */
        this.removeOnInactive = false;

        /**
         * Signal that fires upon completion of objective
         * @type {Phaser.Signal}
         */
        this.onCompletion = new Phaser.Signal();
        this.onCompletion.add(this._onCompletionHandler, this);

        /**
         * An array containing arguments to call onComplete functions with
         * @type {[type]}
         */
        this.onCompleteArgs = this.properties['onCompleteArgs'] ? this.properties['onCompleteArgs'].split(',') : [];
        // Trigger functions expect the object to be argument number one
        this.onCompleteArgs.splice(0, 0, this.object);

        /**
         * Signal that fires upon failure of objective
         * @type {Phaser.Signal}
         */
        this.onFailure = new Phaser.Signal();
        this.onFailure.add(this._onFailureHandler, this);

        /**
         * An object containing style information for _titleText
         * @type {Object}
         */
        this._titleTextStyle = {
            font: '17pt serif'
        };

        /**
         * The Phaser.Text instance of the title
         * @type {Phaser.Text}
         */
        // this._titleText = this.game.add.text(0, 0, this.name, this._titleTextStyle);
        this._titleText = this.game.add.bitmapText(0, 0, 'font', this.name, 28);
        this._titleText.tint = 0x010101;
        this.add(this._titleText);

        this._statusTextStyle = { 
            font: '14pt serif' 
        };

        /**
         * An internal list of trigger functions to call on completion
         * @type {Array#String}
         */
        this._onComplete = (this.properties['onComplete'] || '').split(',');

        /**
         * The status template to be used for this objective. Formatting is to be implemented by children inheriting the Game.ObjectiveManager.Objective class
         * @type {String}
         */
        this._statusTemplate = (this.object.properties.status || this.name).replace('\\n', '\n');

        /**
         * The Phaser.Text instance of the status
         * @type {Phaser.Text}
         */
        // this._statusText = this.game.add.text(0, 0, this._statusTemplate, this._statusTextStyle);
        this._statusText = this.game.add.bitmapText(20, 0, 'font', this._statusTemplate, 23);
        this._statusText.tint = 0x010101;
        this._statusText.y = this._titleText.height;
        this.add(this._statusText);
    };

    Game.ObjectiveManager.Objective.prototype = Object.create(Phaser.Group.prototype);
    Game.ObjectiveManager.Objective.prototype.constructor = Game.ObjectiveManager.Objective;

    Game.ObjectiveManager.Objective.prototype.update = function() {
        Phaser.Group.prototype.update.call(this);
    };
    
    Game.ObjectiveManager.Objective.prototype.updateStatusText = function() {
    };

    Game.ObjectiveManager.Objective.prototype.activate = function() {
        if (!this.isActive && !this.completed && this.objectiveManager.isCompleted(this.dependencies)) {
            this.objectiveManager.addObjective(this);
        }
    };

    Game.ObjectiveManager.Objective.prototype.inactivate = function() {
        if (this.removeOnInactive && this.isActive) {
            this.objectiveManager._removeObjective(this);
        }
    };

    Object.defineProperty(Game.ObjectiveManager.Objective.prototype, 'statusTemplate', {

        get: function() {
            return this._statusTemplate;
        },

        set: function(value) {
            this._statusTemplate = value;
            this.updateStatusText();
        }

    });

    Game.ObjectiveManager.Objective.prototype._onCompletionHandler = function() {
        this.completed = true;
        this._statusTextStyle.fill = '#01C611';
        this._statusText.setStyle(this._statusTextStyle);
        this.objectiveManager.onObjectiveComplete.dispatch(this);
        this._callOnCompletionTriggers();
    };

    Game.ObjectiveManager.Objective.prototype._callOnCompletionTriggers = function() {
        var state = this.game.state.getCurrentState();
        var triggerFunctions = state.triggerFunctions;
        var key;

        for (var i = 0; i < this._onComplete.length; i++) {
            key = this._onComplete[i];
            if (triggerFunctions[key]) {
                console.log(triggerFunctions[key]);
                triggerFunctions[key].apply(state, this.onCompleteArgs);
            }
        }

    };

    Game.ObjectiveManager.Objective.prototype._onFailureHandler = function() {
        this._statusTextStyle.fill = '#ff0000';
        this._statusText.setStyle(this._statusTextStyle);
    };

    Game.ObjectiveManager.Objective.prototype.toString = function() {
        return this.name;
    };

    Object.defineProperty(Game.ObjectiveManager.Objective.prototype, 'statusText', {

        get: function() {
            if (this._statusText) {
                return this._statusText.text;
            }
            return this.name + ' status';
        },

        set: function(value) {
            this._statusText.text = value.replace('\\n', '\n');
        }

    });  

    Object.defineProperty(Game.ObjectiveManager.Objective.prototype, 'isActive', {

        get: function() {
            return this.objectiveManager.isActive(this);
        }

    });

})();
