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

function Bubbles(config)
{
	// world declaration
	// creation of the renderer which will draw the world
	renderer = Physics.renderer( config.renderer,{
		el: config.canvasid,    // canvas element id
		width: config.width,        // canvas width
		height: config.height,        // canvas height
		meta: false        // setting it to "true" will display FPS
	});

	baseRadius = baseRadius * config.width / 640;

	// adding the renderer to the world
	world.add(renderer);

	this.inverseLeftRight = config.inverseLeftRight;

	resx = config.width;
	resy = config.height;

	this.battleLine = Physics.body( "convex-polygon", {
		x: config.battleField.width / 2,
		y: config.battleField.height - 50,
		vertices: [
			{ x: -1, y: -config.battleField.height - 250 },
			{ x: 1, y: -config.battleField.height - 250 },
			{ x: 1, y: config.battleField.height },
			{ x: -1, y: config.battleField.height }
		],
		hidden: true,
		fixed: true,
		mass: 5000000000
	} );
	world.add( this.battleLine );

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
		$("#pushRightIndicator p")[0].innerHTML = iNumberOfPushRightBubbles;
		$("#pushLeftIndicator p")[0].innerHTML = iNumberOfPushLeftBubbles;
		var iLeftMult = ( 1 + ( iNumberOfPushLeftBubbles - iNumberOfPushRightBubbles ) /
			( iNumberOfPushLeftBubbles + iNumberOfPushRightBubbles ) );
		var iRightMult = ( 1 + ( iNumberOfPushRightBubbles - iNumberOfPushLeftBubbles ) /
			( iNumberOfPushLeftBubbles + iNumberOfPushRightBubbles ) );
		$("#pushRightIndicator")[0].style.minWidth = ( 15 + 15 * iRightMult ) + "px";
		$("#pushRightIndicator")[0].style.minHeight = ( 35 + 30 * iRightMult ) + "px";
		$("#pushRightIndicator p")[0].style.fontSize = ( 50 + 50 * iRightMult ) + "%";
		$("#pushLeftIndicator")[0].style.minWidth = ( 15 + 15 * iLeftMult ) + "px";
		$("#pushLeftIndicator")[0].style.minHeight = ( 35 + 30 * iLeftMult ) + "px";
		$("#pushLeftIndicator p")[0].style.fontSize = ( 50 + 50 * iLeftMult ) + "%";

		
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
				styles: 					
					{				
					'circle' : {
						strokeStyle: newBubblesColor,//balance < 0 ? 'rgba(105, 44, 44, 0.7)' : 'rgba(44, 105, 44, 0.7)',
						lineWidth: 1,
						fillStyle: newBubblesColor,//balance < 0 ? 'rgba(105, 44, 44, 0.7)' : 'rgba(44, 105, 44, 0.7)',
						angleIndicator: 0//balance < 0 ? 'rgba(105, 44, 44, 0.7)' : 'rgba(44, 105, 44, 0.7)'
					}
				}
			} );

			bubble.age = 0;
			bubble.isPushLeft = balance < 0;
			behavior.PushLeftCount += bubble.isPushLeft ? 1 : 0;
			behavior.PushRightCount += bubble.isPushLeft ? 0 : 1;
			world.add( bubble );
			--bubblesToCreate;
			fCurrentAngle += fAngleStep;
		}
	}
}
