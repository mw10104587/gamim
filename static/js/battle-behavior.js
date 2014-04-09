Physics.behavior('battle-behavior', function( parent ){
				
	return {
		init: function( cfg ){
			parent.init.call(this, cfg);
			this.world = cfg.world;
			
			this.battleLine = cfg.battleLine;
			this.fieldWidth = cfg.width;
			
			this.positiveBubbles = cfg.positiveBubbles;
			this.negativeBubbles = cfg.negativeBubbles;
			
			this.maxSpeed = cfg.maxSpeed;
			this.maxCircles = cfg.maxBubbles;

			this.PositiveCount = 0;
			this.NegativeCount = 0;
		},
		
		// apply an acceleration (up/down) based on the Y distance to battle field
		behave: function( data ){
			// The minus one is for non bubble bodies, which is the battleField line.
			var iNonBubbleCount = 1;
			var iTotalBubbles = this.PositiveCount + this.NegativeCount;
			
			if( iTotalBubbles > 0 )
			{
				var aMergeCandidates = new Array();
				var iMergeCandidatesCount = 0;
				var body;
				var scratch = Physics.scratchpad();
				var vAcc = scratch.vector();
				var iXBattleCenter = ( this.fieldWidth - 20 ) / 2 + 10;
				var iBattleLineModifier = iXBattleCenter;
				
				for ( var i = 0; i < iTotalBubbles; i++ )
				{
					var idx = i + iNonBubbleCount;
					body = data.bodies[ idx ];
					var bIsPositive = body.isPositive;

					var velocity = body.state.vel;
					
					var bIsInBattleArea = body.state.pos.get( 1 ) < this.battleLine.state.pos.get( 1 ) * 2;
					var iMultiplier = 4;
					while( iMultiplier <= body.geometry.radius )
					{
						iBattleLineModifier += bIsInBattleArea ? bIsPositive ? 1 : -1 : 0;
						iMultiplier *= 1.25;
					}
				

					if( bIsInBattleArea && iTotalBubbles > this.maxCircles &&
						( bIsPositive == ( this.PositiveCount > this.NegativeCount ) ) &&
						body.geometry.radius < 4 * 2.5 )
					{
						var bMerged = false;

						for ( var j = 0; j < iMergeCandidatesCount; j++ )
						{
							var vXDist = Math.abs( body.state.pos.get( 0 ) -
								aMergeCandidates[ j ].state.pos.get( 0 ) );
							var vYDist = Math.abs( body.state.pos.get( 1 ) -
								aMergeCandidates[ j ].state.pos.get( 1 ) );
							if( body.isPositive == aMergeCandidates[ j ].isPositive &&
								vXDist < body.geometry.radius + aMergeCandidates[ j ].geometry.radius &&
								vYDist < body.geometry.radius + aMergeCandidates[ j ].geometry.radius )
							{
								body.geometry.radius = body.geometry.radius * 1.25;
								body.view = null;
								this.world.removeBody( aMergeCandidates[ j ] );
								aMergeCandidates.splice( j, 1 );
								--iMergeCandidatesCount;
								--iTotalBubbles;
								--i;
								this.PositiveCount -= body.isPositive ? 1 : 0;
								this.NegativeCount -= body.isPositive ? 0 : 1;
								bMerged = true;
								break;
							}
						}

						if( !bMerged )
						{
							aMergeCandidates[ iMergeCandidatesCount ] = body;
							++iMergeCandidatesCount;
						}

						continue;
					}
					
					var x = ( !bIsInBattleArea ? bIsPositive ? 20 - body.state.pos.get( 0 ) :
						this.fieldWidth - 20 - body.state.pos.get( 0 ) :
						( this.battleLine.state.pos.get( 0 ) - body.state.pos.get( 0 ) ) * 3 );
					x = x - velocity.get( 0 ) * 2000;
					x = x + Math.sin( body.state.pos.get( 1 ) / 10 + 3.14 ) * -90 /*- 45*/;
					x = Math.min( Math.abs( x ), body.options.maxSpeed - Math.abs( velocity.get( 0 ) ) ) * ( x < 0 ? -1 : 1 );
					
					var y = ( this.battleLine.state.pos.get( 1 ) - body.state.pos.get( 1 ) -
						Math.max( 0, velocity.get( 1 ) * 2000 ) );
					y = ( bIsPositive == ( body.state.pos.get( 0 ) > this.battleLine.state.pos.get( 0 ) ) ) ? 500 : y;
					y = Math.min( Math.abs( y ), body.options.maxSpeed - Math.abs( velocity.get( 1 ) ) ) * ( y < 0 ? -1 : 1 );
					
					vAcc.set( x * 0.000003, y * 0.000003 );
					
					body.accelerate( vAcc );
				}
				
				this.battleLine.state.pos.set( Math.max( 10, Math.min( 630, iBattleLineModifier ) ), this.battleLine.state.pos.get( 1 ) );
				scratch.done();
			}
		}
	};
});
