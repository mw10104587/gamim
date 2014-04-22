/* Configuration parameters :
 - canvasid
 - width
 - height
 - battleField.width
 - battleField.height
 - maxSpeed
 - maxBubbles
*/ 

// General variables
world = Physics();
bubblesWorld = 0;
resx = 640;
resy = 480;
pxmin = 0;
pymin = 0;
pxmax = 0;
pymax = 0;
baseRadius = 4;
bubleSizeMultiplierStep =  1.25;
bubleSizeMultiplierLimit = 2.5;
pBattleX = 320;
pBattleY = 20;
newBubblesColor = 'rgba(105, 44, 44, 0.7)';
bubblesToCreate = 0;
behavior = 0;
iNumberOfPushRightBubbles = 0;
iNumberOfPushLeftBubbles = 0;
balance = 0.1;
fAngleStep = 2 * 3.1415;
fCurrentAngle = 0;
fLastPosVSNegBalance = 0;
fGlowIsAppearing = false;
fGlowAppearSpeed = 0.0001;
fGlowDisappearSpeed = 0.000001;
fGlowVisibility = 0;
bIsGlowEnabled = false;

function Bubbles(config)
{
	// world declaration
	// creation of the renderer which will draw the world
	renderer = Physics.renderer( config.rendererName,{
		el: config.canvasid,    // canvas element id
		debug: config.debug,
		width: config.width,        // canvas width
		height: config.height,        // canvas height
		meta: false        // setting it to "true" will display FPS
	});

	bubblesWorld = this;

	baseRadius = baseRadius * config.width / 640;

	// adding the renderer to the world
	world.add(renderer);

	this.inverseLeftRight = config.inverseLeftRight;

	resx = config.width;
	resy = config.height;

	this.battleLine = Physics.body( "convex-polygon", {
		x: config.battleField.width / 2,
		y: config.battleField.height - 500 / 2,
		vertices: [
			{ x: -1, y: 0 },
			{ x: 1, y: 0 },
			{ x: 1, y: 500 },
			{ x: -1, y: 500 }
		],
		hidden: true,
		fixed: true,
		mass: 5000000000
	} );
	world.add( this.battleLine );

	this.battleLine.battleField = { width: config.battleField.width, height: config.battleField.height };

	behavior = Physics.behavior('battle-behavior', { world: world, battleLine: this.battleLine,
		maxSpeed:config.maxSpeed, maxBubbles:config.maxBubbles, width: config.width, height: config.height });
	world.add( behavior );

	// what happens at every iteration step? We render (show the world)
	world.subscribe("step",this.render);

	world.subscribe("step",this.step);
	
	// this is the default gravity
	/*var gravity = Physics.behavior("constant-acceleration",{
			acc: {
			x:0, 
			y:0
		} 
	});*/
	// adding gravity to the world
	//world.add(gravity);
	// adding collision detection with canvas edges
	world.add(Physics.behavior("edge-collision-detection", {
		  aabb: Physics.aabb(0, -100, resx, resy),
		  restitution: 2
	}));
	// bodies will react to forces such as gravity
	world.add(Physics.behavior("body-impulse-response"));
	// enabling collision detection among bodies
	world.add(Physics.behavior("body-collision-detection"));
	world.add(Physics.behavior("sweep-prune"));

	this.generateBubbles = function( pbalance, color, number, pminXRatio, pminYRatio, pmaxXRatio, pmaxYRatio ){
		var score = Math.floor(Math.random()*26) + 5;
		//balance = -( e.pageX/resx * 2 - 1 );
		var offset = $(this).offset();
		pxmin = pminXRatio * resx;
		pymin = pminYRatio * resy;
		pxmax = pmaxXRatio * resx;
		pymax = pmaxYRatio * resy;

		newBubblesColor = color;
		bubblesToCreate += number;
		
		fAngleStep = 2 * 3.1415 / number;
		balance = this.inverseLeftRight ? -pbalance : pbalance;

		iNumberOfPushLeftBubbles += balance < 0 ? number : 0;
		iNumberOfPushRightBubbles += balance >= 0 ? number : 0;
		behavior.battleLineTargetPosition = resx / 2 + iNumberOfPushRightBubbles - iNumberOfPushLeftBubbles;

		var iBaseIndicatorWidth = 3;
		var iBaseIndicatorHeight = 10;
		var iMaxIndicatorWidth = 8;
		var iMaxIndicatorHeight = 20;
		$("#pushRightIndicator p")[0].innerHTML = iNumberOfPushRightBubbles;
		$("#pushLeftIndicator p")[0].innerHTML = iNumberOfPushLeftBubbles;
		var iLeftMult = ( 1 + ( iNumberOfPushLeftBubbles - iNumberOfPushRightBubbles ) /
			( iNumberOfPushLeftBubbles + iNumberOfPushRightBubbles ) );
		var iRightMult = ( 1 + ( iNumberOfPushRightBubbles - iNumberOfPushLeftBubbles ) /
			( iNumberOfPushLeftBubbles + iNumberOfPushRightBubbles ) );
		$("#pushRightIndicator")[0].style.minWidth = ( iBaseIndicatorWidth + iMaxIndicatorWidth / 2 * iRightMult ) + "%";
		$("#pushRightIndicator")[0].style.minHeight = ( iBaseIndicatorHeight + iMaxIndicatorHeight / 2 * iRightMult ) + "%";
		$("#pushRightIndicator p")[0].style.fontSize = ( 50 + 50 * iRightMult ) + "%";
		$("#pushLeftIndicator")[0].style.minWidth = ( iBaseIndicatorWidth + iMaxIndicatorWidth / 2 * iLeftMult ) + "%";
		$("#pushLeftIndicator")[0].style.minHeight = ( iBaseIndicatorHeight + iMaxIndicatorHeight / 2 * iLeftMult ) + "%";
		$("#pushLeftIndicator p")[0].style.fontSize = ( 50 + 50 * iLeftMult ) + "%";

		var fNewPosVSNegBalance = iRightMult - iLeftMult;
		if( fLastPosVSNegBalance < 0 && fNewPosVSNegBalance >= 0 )
		{
			fGlowIsAppearing = bIsGlowEnabled;
		}

		fLastPosVSNegBalance = fNewPosVSNegBalance;

		this.battleLineTargetPosition = this.width / 2;
	};

	// handling timestep
	Physics.util.ticker.subscribe(this.timestep);

	Physics.util.ticker.start();
}

Bubbles.prototype.render = function()
{
	world.render();
}

Bubbles.prototype.timestep = function(time,dt)
{
	world.step(time);
	var div = $("#pushRightGlowIndicator")[0];
	div.style.opacity = fGlowVisibility;
	div.style.filter = "alpha(opacity=(" + ( fGlowVisibility * 100 ) + ")";

	if( fGlowIsAppearing && fGlowVisibility < 1 )
	{
		fGlowVisibility = Math.min( 1, fGlowVisibility + time * fGlowAppearSpeed );
		fGlowIsAppearing = fGlowVisibility < 1;
	}
	else if( !fGlowIsAppearing && fGlowVisibility > 0 )
	{
		fGlowVisibility = Math.max( 0, fGlowVisibility - time * fGlowDisappearSpeed );
	}
}

Bubbles.prototype.styleForBubble = function( radius, color, balance )
{
	if( !this.bubbleStyles )
	{
		this.bubbleStyles = new Array();
	}

	var strStyleID = radius + color + balance;
	if( typeof( this.bubbleStyles[ strStyleID ] ) == "undefined" )
	{
		this.bubbleStyles[ strStyleID ] =
		{			
			'circle' :
			{
				strokeStyle: color,
				lineWidth: 1,
				padding: 1,
				isPositive: balance >= 0,
				fillStyle: color,
				angleIndicator: false,
				sign:
				{
					inside:
					{
						strokeStyle: 'rgba(195, 195, 195, 1)',
						lineWidth: 2
					},
					outside:
					{
						strokeStyle: 'rgba(0, 0, 0, 1)',
						lineWidth: 4
					}
				}
			}
		};
	}

	return this.bubbleStyles[ strStyleID ];
}

Bubbles.prototype.step = function()
{
	if( bubblesToCreate > 0 )
	{
		while( bubblesToCreate > 0 )
		{
			var bubble = Physics.body( "circle", {
				x: pxmin + ( pxmax - pxmin ) / 2 + Math.sin( fCurrentAngle ) * ( pxmax - pxmin ) * 0.5,
				y: pymin + ( pymax - pymin ) / 2 + Math.cos( fCurrentAngle ) * ( pymax - pymin ) * 0.75,
				radius: baseRadius,
				restitution:0.2,
				mass: 1,
				maxSpeed: Math.random() * 10 - 5 + 15,
				styles: bubblesWorld.styleForBubble( baseRadius, newBubblesColor, balance )
			} );

			bubble.color = newBubblesColor;
			bubble.balance = balance;
			bubble.state.scale = 1;
			bubble.age = 0;
			bubble.seed = Math.random() * 100;
			bubble.isPushLeft = balance < 0;
			behavior.PushLeftCount += bubble.isPushLeft ? 1 : 0;
			behavior.PushRightCount += bubble.isPushLeft ? 0 : 1;
			world.add( bubble );
			--bubblesToCreate;
			fCurrentAngle += fAngleStep;
		}
	}
}
