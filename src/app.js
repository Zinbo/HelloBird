
var ParallaxLayer = cc.Layer.extend({
    parallaxNode: null,
    next_hidden_pipe_index:0,
    flip: true,
    background_layer: null,
    bird_layer: null,
    pipe_layer: null,
    label: null,
    ctor:function (background_layer, pipe_layer, bird_layer, label) {
        this._super();

        this.background_layer = background_layer;
        this.pipe_layer = pipe_layer;
        this.bird_layer = bird_layer;
        this.label = label;
        this.label.setString(0);
        var background_sprites = background_layer.sprites;
        var pipe_lines = pipe_layer.pipe_lines;

        var size = cc.winSize;
        this.parallaxNode = cc.ParallaxNode.create();
        var parallaxNode = this.parallaxNode;
        this.addChild(parallaxNode, -1);

        parallaxNode.addChild(background_sprites[0], 0, cc.p(0.2, 0.2), cc.p(background_sprites[0].x, background_sprites[0].y));
        parallaxNode.addChild(background_sprites[1], 0, cc.p(0.2, 0.2), cc.p(background_sprites[1].x, background_sprites[1].y));

        pipe_lines.forEach(function(pipe_line) {
             parallaxNode.addChild(pipe_line.bot_pipe, 0, cc.p(0.2, 0.2), cc.p(pipe_line.bot_pipe.x, pipe_line.bot_pipe.y));
             parallaxNode.addChild(pipe_line.top_pipe, 0, cc.p(0.2, 0.2), cc.p(pipe_line.top_pipe.x, pipe_line.top_pipe.y));
        });

        this.scheduleUpdate();

        return true;
    },

    update:function(dt){
        var position = -1500;
        this.parallaxNode.x = this.parallaxNode.x + position * dt;

        this.update_background();
        this.update_pipes();
        this.check_for_collision();
    },

    update_background: function() {
        var size = cc.winSize;
        if(this.flip) {
            var backgroundNode = this.parallaxNode.getParallaxArray()[0];
            if(this.parallaxNode.convertToWorldSpace(this.background_layer.sprites[0].getPosition()).x < -(size.width/2)) {
                var node = new Object();
                node.x = backgroundNode.getOffset().x + (size.width + size.width);
                node.y = backgroundNode.getOffset().y;
                backgroundNode.setOffset(node);

                this.flip = false;
            }
        }
        else {
            var backgroundNode = this.parallaxNode.getParallaxArray()[1];
            if(this.parallaxNode.convertToWorldSpace(this.background_layer.sprites[1].getPosition()).x < -(size.width/2)) {
                var node = new Object();
                node.x = backgroundNode.getOffset().x + (size.width + size.width);
                node.y = backgroundNode.getOffset().y;
                backgroundNode.setOffset(node);

                this.flip = true;
            }
        }
    },

    update_pipes: function() {
        var size = cc.winSize;
        var possible_hidden_bot_pipe_parallax = this.parallaxNode.getParallaxArray()[(this.next_hidden_pipe_index*2) + 2];
        var possible_hidden_top_pipe_parallax = this.parallaxNode.getParallaxArray()[(this.next_hidden_pipe_index*2) + 3];
        var possible_hidden_bot_pipe_sprite = this.pipe_layer.pipe_lines[this.next_hidden_pipe_index].bot_pipe;
        var possible_hidden_top_pipe_sprite = this.pipe_layer.pipe_lines[this.next_hidden_pipe_index].top_pipe;
        if(this.parallaxNode.convertToWorldSpace(possible_hidden_bot_pipe_sprite.getPosition()).x < -(possible_hidden_bot_pipe_sprite.width/2)) {

            var x = possible_hidden_bot_pipe_parallax.getOffset().x + (size.width + (size.width/3));
            var y = possible_hidden_bot_pipe_parallax.getOffset().y;
            var defaultY = (possible_hidden_bot_pipe_sprite.height)/2;
            var min = -defaultY + 60;
            var max = defaultY;
            var bot_pipe_position = Math.floor(Math.random() * (max - min)) + min;
            var top_pipe_position = bot_pipe_position + 300 + defaultY*2;
            var y = 13.5;
            possible_hidden_bot_pipe_parallax.setOffset({x, y:bot_pipe_position});

            var x = possible_hidden_top_pipe_parallax.getOffset().x + (size.width + (size.width/3));
            var y = 682.5;
            possible_hidden_top_pipe_parallax.setOffset({x, y:top_pipe_position});

            this.next_hidden_pipe_index++;
            this.next_hidden_pipe_index = this.next_hidden_pipe_index % 4;

            this.label.setString(parseInt(this.label.getString())+1);
        }
    },

    check_for_collision: function() {
        var closest_bot_pipe_sprite = this.pipe_layer.pipe_lines[this.next_hidden_pipe_index].bot_pipe;
        var closest_top_pipe_sprite = this.pipe_layer.pipe_lines[this.next_hidden_pipe_index].top_pipe;
        var bird_sprite = this.bird_layer.bird;
        var top_pipe_coords_in_world_space = this.parallaxNode.convertToWorldSpace(closest_top_pipe_sprite.getPosition());
        var bot_pipe_coords_in_world_space = this.parallaxNode.convertToWorldSpace(closest_bot_pipe_sprite.getPosition());
        if((bird_sprite.y > (top_pipe_coords_in_world_space.y - (closest_top_pipe_sprite.height/2)) || bird_sprite.y < (bot_pipe_coords_in_world_space.y + (closest_top_pipe_sprite.height/2)))
         && top_pipe_coords_in_world_space.x < bird_sprite.width)  {
                this.runAction(cc.Sequence.create(
                    cc.CallFunc.create(function(node) {
                        var scene = new HelloWorldScene();
                        cc.Director.sharedDirector.runScene(scene);
                    }, this)
                ));
         }
    }
});

var BirdLayer = cc.Layer.extend({
    bird: null,
    velocity: 0,
    acceleration: -1500,
    ctor:function() {

        this._super();

        var size = cc.winSize;

        this.bird = new cc.Sprite.create(res.sprite_png);

        this.bird.attr({
            x: (this.bird.width)/2,
            y: size.height/2
        });

        this.addChild(this.bird);

        var self = this;

        if(cc.sys.capabilities.hasOwnProperty('keyboard')){
            cc.eventManager.addListener({
                event: cc.EventListener.KEYBOARD,
                onKeyPressed : function(key) {
                    self.velocity = 700;
                }
            }, this);
        }

        this.scheduleUpdate();

        return true;
    },

    update:function(dt){
        var v = this.velocity + this.acceleration*dt;
        var ds = v*dt + (0.5)*this.acceleration*Math.pow(dt, 2);
        this.bird.y = this.bird.y + ds;
        this.velocity = v;
    }

});

var PipeLine = function(offset, size) {
    this.top_pipe = new cc.Sprite.create(res.pipe_top_png);
    this.bot_pipe = new cc.Sprite.create(res.pipe_bot_png);

    this.bot_pipe.attr({
        x: offset,
        y: 0
    });

    this.top_pipe.attr({
        x: offset,
        y: size.height
    });
}

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var size = cc.winSize;
        var backgroundLayer = {
            sprites: [],
            init: function(size) {
                for(var i = 0; i < 2; i++) {
                    var background = new cc.Sprite.create(res.background_png);
                    this.sprites[i] = background;

                    background.attr({
                        x: (size.width / 2) + (size.width)*i,
                        y: size.height / 2
                    });
                }
            }
        }

        var pipeLayer = {
            pipe_lines: [],
            init: function(size) {
                for(var i = 0; i < 4; i++) {
                    var pipeline = new PipeLine((size.width/3*(i+1)), size);
                    this.pipe_lines[i] = pipeline;
                }
            }
        }

        var label = cc.LabelTTF.create(0, "Arial", 32);
        label.setPosition(30, 16);

        backgroundLayer.init(size);
        pipeLayer.init(size);
        var birdLayer = new BirdLayer();
        var parallaxLayer = new ParallaxLayer(backgroundLayer, pipeLayer, birdLayer, label);
        this.addChild(parallaxLayer);
        this.addChild(birdLayer);
        this.addChild(label);
    }
});

