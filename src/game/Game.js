/** @constructor */
GameTitle.Game = function( game )
{
  this.cursorKeys = null;
  this.spaceBar = null;
  this.enterKey = null;
  this.escapeKey = null;

  this.buttonList = [];
  this.exitButton = null;
  this.buttonGroup = null;

  this.modalYesButton = null;
  this.modalNoButton = null;
  this.modalGroup = null;

  this.gamepadList = GameTitle.gamepadList;
  this.gamepadCallbackList =
  {
    onDown: this.gamepadOnDown
  };

  this.circleSprite = null;
  this.targetPoint = new Phaser.Point();

  this.bell = null;
  this.soundList = [];
};

GameTitle.Game.stateKey = "Game";

GameTitle.Game.prototype.init = function()
{
  
};

GameTitle.Game.prototype.create = function()
{
  this.stage.backgroundColor = 0x171642; 

  this.setupInput();
  this.setupGraphics();
  this.setupSounds();
};

GameTitle.Game.prototype.setupInput = function()
{
  this.escapeKey = this.input.keyboard.addKey( Phaser.Keyboard.ESC );
  this.escapeKey.onDown.add( this.escapeKeyDown, this );

  GameTitle.backButtonCallback = this.escapeKeyDown;

  // Buttons.
  GameTitle.activeButton = null;

  this.exitButton = GameTitle.createTextButton( 0, 32,
                                                "Exit", this.escapeKeyDown, this );

  // Position button based on width.
  // NOTE: Using child label width, as parent button width member is not
  // reliable seemingly after newly created label is added after creating button.
  // Need to file issue with Phaser.
  this.exitButton.position.x = this.game.width - this.exitButton.children[0].width - 16;
  this.exitButton.input.priorityID = 1;

  var mute = GameTitle.getMute();
  var muteText = mute ? "Unmute" : "  Mute";
  var muteButtonStyle = mute ? GameTitle.buttonActiveStyle : GameTitle.buttonStyle;
  this.muteButton = GameTitle.createTextButton( 0, 32,
                                                muteText, this.toggleMute, this, muteButtonStyle );

  this.muteButton.position.x = this.exitButton.position.x - this.muteButton.children[0].width;
  this.muteButton.input.priorityID = 1;

  this.buttonGroup = this.game.add.group();
  this.buttonGroup.add( this.exitButton );
  this.buttonGroup.add( this.muteButton );

  // Modal dialog buttons.
  this.modalYesButton = GameTitle.createTextButton( 0, 0,
                                                    "Yes", this.returnToMainMenu, this );
  this.modalYesButton.position.setTo( this.game.world.centerX, this.game.world.centerY + 48 * 1 );
  this.modalYesButton.input.priorityID = 3;

  this.modalNoButton = GameTitle.createTextButton( 0, 0,
                                                   "No", this.toggleModal, this );
  this.modalNoButton.position.setTo( this.game.world.centerX, this.game.world.centerY + 48 * 2 );
  this.modalNoButton.input.priorityID = 3;

  // Gamepads.
  this.setupGamepads();
};

GameTitle.Game.prototype.setupGamepads = function()
{
  // First reset callbacks.
  this.game.input.gamepad.onDownCallback = null;
  this.game.input.gamepad.onAxisCallback = null;

  // Then set callbacks.
  this.game.input.gamepad.addCallbacks( this, this.gamepadCallbackList );
};

GameTitle.Game.prototype.setupGraphics = function()
{
  // All text.
  var allTextGroup = this.game.add.group();
  allTextGroup.add( this.buttonGroup );
  allTextGroup.alpha = 0.0;

  this.game.add.tween( allTextGroup ).to( { alpha: 1 }, 500, Phaser.Easing.Linear.None, true );

  this.circleSprite = this.createCircleSprite();

  this.game.world.bringToTop( allTextGroup );

  var background = this.game.add.sprite( 0, 0 );
  background.fixedToCamera = true;
  background.scale.setTo( this.game.width, this.game.height );
  background.inputEnabled = true;
  background.input.priorityID = 0;
  background.events.onInputDown.add( this.pointerDown, this );

  this.game.world.sendToBack( background );

  // Set up modal background.
  var bmd = this.game.add.bitmapData( this.game.width, this.game.height );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.5)";
  bmd.ctx.fillRect( 0, 0, this.game.width, 48 * 3 );
  bmd.ctx.fillRect( 0, 48 * 9, this.game.width, 48 * 3 );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.95)";
  bmd.ctx.fillRect( 0, 48 * 3, this.game.width, 48 * 6 );
  var modalBackground = this.game.add.sprite( 0, 0, bmd );
  modalBackground.fixedToCamera = true;
  modalBackground.inputEnabled = true;
  modalBackground.input.priorityID = 2;

  var modalPromptText = "Are you sure you want to exit?";
  var modalPrompt = this.game.add.text( 0, 0, modalPromptText, GameTitle.buttonStyle );
  modalPrompt.position.setTo( this.game.world.centerX, this.game.world.centerY - 48 * 1 );
  modalPrompt.anchor.setTo( 0.5, 0.5 );

  this.modalGroup = this.game.add.group();
  this.modalGroup.add( modalBackground );
  this.modalGroup.add( modalPrompt );
  this.modalGroup.add( this.modalYesButton );
  this.modalGroup.add( this.modalNoButton );
  this.modalGroup.visible = false;
};

GameTitle.Game.prototype.setupSounds = function()
{
  this.bell = this.game.add.audio( "bell2" );
  this.soundList.push( this.bell );
};

GameTitle.Game.prototype.update = function()
{
  this.gamepadUpdate();
};

GameTitle.Game.prototype.escapeKeyDown = function( button )
{
  GameTitle.setActiveButton( this.modalNoButton );

  this.toggleModal();
};

GameTitle.Game.prototype.pointerDown = function( sprite, pointer )
{
  this.targetPoint.copyFrom( pointer );

  var position = this.targetPoint;
  this.makeImpact( position.x, position.y );
};

GameTitle.Game.prototype.gamepadUpdate = function()
{
  /*if( this.game.input.gamepad.supported && this.game.input.gamepad.active )
  {
    for( var i = 0; i < this.gamepadList.length; i++ )
    {
      var gamepad = this.gamepadList[i];
      if( gamepad.connected )
      {
        if( gamepad.isDown( Phaser.Gamepad.XBOX360_DPAD_UP, 0 ) ||
            gamepad.axis( Phaser.Gamepad.XBOX360_STICK_LEFT_Y ) < -0.1 )
        {
          
        }
        else
        if( gamepad.isDown( Phaser.Gamepad.XBOX360_DPAD_DOWN, 0 ) ||
            gamepad.axis( Phaser.Gamepad.XBOX360_STICK_LEFT_Y ) > 0.1 )
        {
          
        }
      }
    }
  }*/
};

GameTitle.Game.prototype.gamepadOnDown = function( buttonIndex, buttonValue, gamepadIndex )
{
  this.makeImpact( ( this.game.width / 2 ) | 0, ( this.game.height / 2 ) | 0 );
};

GameTitle.Game.prototype.toggleModal = function()
{
  this.modalGroup.visible = !this.modalGroup.visible;

  this.buttonList.length = 0;

  if( this.modalGroup.visible )
  {
    GameTitle.setupButtonKeys( this );

    this.buttonList.push( this.modalYesButton );
    this.buttonList.push( this.modalNoButton );
  }
  else
  {
    GameTitle.clearButtonKeys( this );
  }
};

GameTitle.Game.prototype.returnToMainMenu = function()
{
  this.game.sound.stopAll();
  
  this.state.start( GameTitle.MainMenu.stateKey );
};

GameTitle.Game.prototype.makeImpact = function( x, y )
{
  if( !!this.bell._sound )
  {
    this.adjustBellPitch();
  }
  else
  {
    this.bell.onPlay.add( this.adjustBellPitch, this );
  }

  this.bell.play();

  this.resetCircleSprite( this.circleSprite, x, y );
};

GameTitle.Game.prototype.createCircleSprite = function()
{
  var bmd = this.game.add.bitmapData( 128, 128 );

  bmd.ctx.fillStyle = "#999999";
  bmd.ctx.beginPath();
  bmd.ctx.arc( 64, 64, 64, 0, Math.PI * 2, true ); 
  bmd.ctx.closePath();
  bmd.ctx.fill();

  var sprite = this.game.add.sprite( 0, 0, bmd );
  sprite.anchor.set( 0.5 );

  sprite.alpha = 0.0;

  return sprite;
};

GameTitle.Game.prototype.adjustBellPitch = function()
{
  var verticalScale = 4.0 * ( 1.0 - ( this.targetPoint.y / this.game.world.height ) );
  this.bell._sound.playbackRate.value = verticalScale;
};

GameTitle.Game.prototype.resetCircleSprite = function( circleSprite, x, y )
{
  circleSprite.position.set( x, y );

  circleSprite.scale.set( 0.5 );
  circleSprite.alpha = 1.0;

  var verticalScale = ( 1.0 - ( y / this.game.world.height ) );
  var colorAdjustment = ( verticalScale * 255 ) | 0;
  
  var r = 255 - colorAdjustment;
  var g = 63;
  var b = 0 + colorAdjustment;

  if( colorAdjustment < 128 )
  {
    g += b;
  }
  else
  {
    g += r;
  }

  circleSprite.tint = ( r << 16 ) + ( g << 8 ) + b;

  this.game.add.tween( circleSprite.scale ).to( { x: 4.0, y: 4.0 }, 500, Phaser.Easing.Sinusoidal.InOut, true );
  this.game.add.tween( circleSprite ).to( { alpha: 0.0 }, 500, Phaser.Easing.Sinusoidal.InOut, true );
};

GameTitle.Game.prototype.toggleMute = function()
{
  var mute = !GameTitle.getMute();

  GameTitle.setMute( mute );

  var muteText = mute ? "Unmute" : "  Mute";
  var muteButtonStyle = mute ? GameTitle.buttonActiveStyle : GameTitle.buttonStyle;

  var muteButtonText = this.muteButton.children[0];
  muteButtonText.text = muteText;
  muteButtonText.setStyle( muteButtonStyle );
};
