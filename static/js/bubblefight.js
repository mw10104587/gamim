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
px = 0;
py = 0;
pBattleX = 320;
pBattleY = 20;
bubblesToCreate = 0;
positiveBubblesList = [];
negativeBubblesList = [];
balance = 0.1;

function Bubbles(config)
{	 	

	// world declaration
	// creation of the renderer which will draw the world
	renderer = Physics.renderer("canvas",{
		el: config.canvasid,    // canvas element id
		width: config.width,        // canvas width
		height: config.height,        // canvas height
		meta: true        // setting it to "true" will display FPS
	});
	// adding the renderer to the world
	world.add(renderer);

	this.battleLine = Physics.body( "convex-polygon", {
		x: config.battleField.width / 2,
		y: config.battleField.height,
		vertices: [
			{ x: -5, y: -config.battleField.height },
			{ x: 5, y: -config.battleField.height },
			{ x: 5, y: config.battleField.height },
			{ x: -5, y: config.battleField.height }
		],
		hidden: true,
		fixed: true,
		mass: 5000000000
	} );
	world.add( this.battleLine );

	world.add(Physics.behavior('battle-behavior', { world: world, battleLine: this.battleLine,
		positiveBubbles: positiveBubblesList, negativeBubbles: negativeBubblesList,
		maxSpeed:config.maxSpeed, maxCircles:config.maxBubbles }) );
	// what happens at every iteration step? We render (show the world)
	world.subscribe("step",this.render);

	world.subscribe("step",this.step);
	
	// this is the default gravity
	var gravity = Physics.behavior("constant-acceleration",{
			acc: {
			x:0, 
			y:0
		} 
	});
	// adding gravity to the world
	//world.add(gravity);
	// adding collision detection with canvas edges
	world.add(Physics.behavior("edge-collision-detection", {
		  aabb: Physics.aabb(0, 0, 640, 480),
		  restitution: 0
	}));
	// bodies will react to forces such as gravity
	world.add(Physics.behavior("body-impulse-response"));
	// enabling collision detection among bodies
	world.add(Physics.behavior("body-collision-detection"));
	world.add(Physics.behavior("sweep-prune"));

	this.generateBubbles = function( pbalance, number, pminX, pminY, pmaxX, pmaxY ){
		var score = Math.floor(Math.random()*26) + 5;
		//balance = -( e.pageX/640 * 2 - 1 );
		var offset = $(this).offset();
		px = ( pminX + pmaxX ) / 2;
		py = ( pminY + pmaxY ) / 2;

		bubblesToCreate += number;
		balance = pbalance;
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
		var bubble = Physics.body( "circle", {
			x: px + Math.floor(Math.random()*4) - 1.5,
			y: py + Math.floor(Math.random()*4) - 1.5,
			radius: 4,
			restitution:0.2,
			mass: 0.2,
			maxSpeed: Math.random() * 10 - 5 + 15,
			styles: {
				'circle' : {
					strokeStyle: balance < 0 ? 'rgba(105, 44, 44, 0.7)' : 'rgba(44, 105, 44, 0.7)',
					lineWidth: 1,
					fillStyle: balance < 0 ? 'rgba(105, 44, 44, 0.7)' : 'rgba(44, 105, 44, 0.7)',
					angleIndicator: balance < 0 ? 'rgba(105, 44, 44, 0.7)' : 'rgba(44, 105, 44, 0.7)'
				}
			}
		} );
	
		if( balance < 0 )
		{
			// Create a negative bubble
			bubble.geometry.name
			negativeBubblesList[ negativeBubblesList.length ] = bubble;
		}
		else
		{
			// Create a positive bubble
			positiveBubblesList[ positiveBubblesList.length ] = bubble;
		}
	
		world.add( bubble );
		--bubblesToCreate;
	}
}
