Physics.behavior('battle-behavior', function( parent ){
				
	return {
		init: function( cfg ){
			parent.init.call(this, cfg);
			this.world = cfg.world;
			
			this.battleLine = cfg.battleLine;

			this.width = cfg.width;
			this.height = cfg.height;
			this.battleLineTargetPosition = this.width / 2;
			
			this.pushRightBubbles = cfg.pushRightBubbles;
			this.pushLeftBubbles = cfg.pushLeftBubbles;
			
			this.maxSpeed = cfg.maxSpeed;
			maxCircles = cfg.maxBubbles;

			this.PushLeftCount = 0;
			this.PushRightCount = 0;
		},
		
		// apply an acceleration (up/down) based on the Y distance to battle field
		behave: function( data ){
			var iTotalBubbles = this.PushLeftCount + this.PushRightCount;
			
			if( iTotalBubbles > 0 )
			{
				// The minus one is for non bubble bodies, which is currently only the battleField line.
				var iNonBubbleCount = 1;

				var aMergeCandidates = new Array();
				var iMergeCandidatesCount = 0;
				var body;
				var scratch = Physics.scratchpad();
				var vAcc = scratch.vector();
				var vDeltaForce = scratch.vector();
				var vPositionInNearFuture = scratch.vector();
				var iXBattleCenter = this.fieldWidth / 2;
				var fBattleVerticalCenter = 100;
				var bIsMergingEnabled = false;
				
				for ( var i = 0; i < iTotalBubbles; i++ )
				{
					var idx = i + iNonBubbleCount;
					body = data.bodies[ idx ];
					
					if( ++body.age < 100 )
						continue;

					var bIsPushLeft = body.isPushLeft;

					vPositionInNearFuture.set( body.state.vel.get( 0 ), body.state.vel.get( 1 ) );
					vPositionInNearFuture.mult( 100 ).add( body.state.pos.get( 0 ), body.state.pos.get( 1 ) );
					
					var bIsInBattleArea = body.state.pos.get( 1 ) <= fBattleVerticalCenter * 2;

					if( bIsMergingEnabled && bIsInBattleArea && iTotalBubbles > maxCircles &&
						( bIsPushLeft == ( this.PushLeftCount > this.PushRightCount ) ) &&
						body.geometry.radius < baseRadius * bubleSizeMultiplierLimit )
					{
						var bMerged = false;

						for ( var j = 0; j < iMergeCandidatesCount; j++ )
						{
							var vXDist = Math.abs( body.state.pos.get( 0 ) -
								aMergeCandidates[ j ].state.pos.get( 0 ) );
							var vYDist = Math.abs( body.state.pos.get( 1 ) -
								aMergeCandidates[ j ].state.pos.get( 1 ) );
							if( body.isPushLeft == aMergeCandidates[ j ].isPushLeft &&
								vXDist < body.geometry.radius + aMergeCandidates[ j ].geometry.radius &&
								vYDist < body.geometry.radius + aMergeCandidates[ j ].geometry.radius )
							{
								body.geometry.radius = body.geometry.radius * bubleSizeMultiplierStep;
								body.view = null;
								this.world.removeBody( aMergeCandidates[ j ] );
								aMergeCandidates.splice( j, 1 );
								--iMergeCandidatesCount;
								--iTotalBubbles;
								--i;
								this.PushLeftCount -= body.isPushLeft ? 1 : 0;
								this.PushRightCount -= body.isPushLeft ? 0 : 1;
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

					var xTarget = 0;
					var yTarget = 0;
					var fRandSine = Math.sin( ( body.state.pos.get( 1 ) + body.state.pos.get( 0 ) ) / 100 ) * 25;
					
					// We can distinguish 3 cases :
					var yLowerAreaLimit = this.height - 100;
					var bWillBeInLowerArea = !bIsInBattleArea && vPositionInNearFuture.get( 1 ) >= yLowerAreaLimit;
					var bWillBeInMiddleArea = !bIsInBattleArea && !bWillBeInLowerArea;
					var fMaxDeltaForce = this.maxSpeed / 10000;
					// 1. The bubble has just been generated and is in the lower area
					if( bWillBeInLowerArea )
					{
						xTarget = bIsPushLeft ? body.state.pos.get( 0 ) + 100 : body.state.pos.get( 0 ) - 100;
						yTarget = body.state.pos.get( 1 ) - 25 + fRandSine;
					}
					// 2. The bubble will be in the middle area and is simply going up
					else if( bWillBeInMiddleArea )
					{
						xTarget = ( bIsPushLeft ? body.state.pos.get( 0 ) + 50 : body.state.pos.get( 0 ) - 50 ) + fRandSine;
						yTarget = body.state.pos.get( 1 ) - 25;
					}
					// 3. The bubble is in the battle area, it just goes toward the battle line
					else
					{
						xTarget = this.battleLine.state.pos.get( 0 ) + ( bIsPushLeft ? -10 : 10 );
						// Still some test, are we on the right side ?
						var bIsOnTheRightSide = bIsPushLeft == ( this.battleLine.state.pos.get( 0 ) < body.state.pos.get( 0 ) );
						var fVerticalHardDownPusher = body.state.pos.get( 1 ) < 25 ? 100 : 25;
						yTarget = bIsOnTheRightSide ? body.state.pos.get( 1 ) + fRandSine + fVerticalHardDownPusher : body.state.pos.get( 1 ) + 100;
						fMaxDeltaForce = this.maxSpeed / 100000;
					}

					xTarget = Math.min( this.width - 25, Math.max( 25, xTarget ) );
					yTarget = Math.min( this.height - 25, Math.max( 25, yTarget ) );

					vDeltaForce.set( xTarget - vPositionInNearFuture.get( 0 ), yTarget - vPositionInNearFuture.get( 1 ) );
					var fFinalStrength = Math.min( vDeltaForce.norm(), fMaxDeltaForce );
					vDeltaForce = vDeltaForce.normalize();
					vDeltaForce = vDeltaForce.mult( fFinalStrength );

					body.applyForce( vDeltaForce );
					var fFinalSpeed = Math.min( body.state.vel.norm(), this.maxSpeed / 100 );
					body.state.vel.normalize().mult( fFinalSpeed );
				}
				
				var iMaxLinePos = Math.min( resx - resx / 10, this.battleLine.state.pos.get( 0 ) + 0.05 );
				var iMinLinePos = Math.max( resx / 10, this.battleLine.state.pos.get( 0 ) - 0.05 );
				this.battleLine.state.pos.set( Math.max( iMinLinePos, Math.min( iMaxLinePos, this.battleLineTargetPosition ) ),
				this.battleLine.state.pos.get( 1 ) );
				scratch.done();
			}
		}
	};
});
