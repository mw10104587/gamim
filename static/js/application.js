//hostname which is emotion-chat-v1.herokuapp

// console.log(location.host);

// update from ws -> wss to remove client side ssl error, because modern browsers support https right now...
var inbox = new ReconnectingWebSocket("wss://" + location.host + "/receive", null, {debug: false, recoonectInterval: 500});
var outbox = new ReconnectingWebSocket("wss://" + location.host + "/submit", null, {debug: false, recoonectInterval: 500});


function computedStyle(pelem)
{
  var computedStyle;
  if (typeof pelem.currentStyle != 'undefined')
    { computedStyle = pelem.currentStyle; }
  else
    { computedStyle = document.defaultView.getComputedStyle(pelem, null); }

  return computedStyle;
}

var bInverseLeftAndRight = false;

var visualBubbles = new Bubbles( { debug: false, rendererName: "canvasBubbles", canvasid: "bubblesContainer", width: $("#bubblesContainer")[0].clientWidth, height: $("#bubblesContainer")[0].clientHeight,
	battleField: { width: $("#bubblesContainer")[0].clientWidth, height: $("#bubblesContainer")[0].clientHeight * 30 / 100 }, maxSpeed: 30, maxBubbles: 120, inverseLeftRight: bInverseLeftAndRight } );

if( bInverseLeftAndRight )
{
	var xLeftLeft = computedStyle( $("#pushLeftIndicator")[0] ).left;
	var xLeftRight = computedStyle( $("#pushLeftIndicator")[0] ).right;
	$("#pushLeftIndicator")[0].left = computedStyle( $("#pushRightIndicator")[0] ).left;
	$("#pushLeftIndicator")[0].right = computedStyle( $("#pushRightIndicator")[0] ).right;
	$("#pushRightIndicator")[0].left = xLeftLeft;
	$("#pushRightIndicator")[0].right = xLeftRight;
}

//receiving a message
//get data and show in chat box
inbox.onmessage = function(message) {
  // console.log(message);
  var data = JSON.parse(message.data);
  var name = data.handle;
  var content = data.text;
  var textLength = parseInt(data.length);
  // console.log(textLength);
 
  var negP = parseFloat(data.neg);
  // console.log(data.neg);
  var posP = parseFloat(data.pos);
  // console.log(posP);
  /*
  var emotionRangeClassString = ""
    if (     negP > 0     && negP < 1/11 )  
      emotionRangeClassString = "rg-11";
    else if (negP >= 1/11 && negP < 2/11)
      emotionRangeClassString = "rg-10";
    else if (negP >= 2/11 && negP < 3/11)
      emotionRangeClassString = "rg-9";
    else if (negP >= 3/11 && negP < 4/11)
      emotionRangeClassString = "rg-8";
    else if (negP >= 4/11 && negP < 5/11)
      emotionRangeClassString = "rg-7";
    else if (negP >= 5/11 && negP < 6/11)
      emotionRangeClassString = "rg-6";
    else if (negP >= 6/11 && negP < 7/11)
      emotionRangeClassString = "rg-5";
    else if (negP >= 7/11 && negP < 8/11)
      emotionRangeClassString = "rg-4";
    else if (negP >= 8/11 && negP < 9/11)
      emotionRangeClassString = "rg-3";
    else if (negP >= 9/11 && negP < 10/11)
      emotionRangeClassString = "rg-2";
    else if (negP >= 10/11 && negP <= 1)
      emotionRangeClassString = "rg-1";
  */
  var emotionRangeClassString = ""
    if ( negP > posP){

      switch(negP){
        case 1:
          emotionRangeClassString = "rg-5";
          break;
        case 2:
          emotionRangeClassString = "rg-4";
          break;
        case 3:
          emotionRangeClassString = "rg-3";
          break;
        case 4:
          emotionRangeClassString = "rg-2";
          break;
        case 5:
          emotionRangeClassString = "rg-1";
          break;
      }
    }
    else if(posP > negP){
      var index = posP + 6;
      emotionRangeClassString = "rg-".concat( index.toString() );
      
    }
    else{ 
      emotionRangeClassString = "rg-6";
    }

  // console.log(emotionRangeClassString);

	var bubblesColor = 'black';
	var fX = 0.45;
	var fY = 0.45;
	var fWidth = 0.1;
	var fHeight = 0.1;

  //if it's the content we entered
  if ( $("#input-name")[0].value == name ) {    
	$("#chat-text").append("<div class='bubble-span-panel'><div class='words my-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text ).html() + "</div></div></div>"); 
  }
  //if it's the content other people entered
  else{

     $("#chat-text").append("<div class='bubble-span-panel'><div class='words his-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text ).html() + "</div></div></div>");
  }


	var iPusherHeightNeeded = $("#chat-text").height();
	var childrenHeightSum=0;
	var chatDiv = $("#chat-text")[0];
	var divLastChatWindow;
	$("#chat-text div.bubble-span-panel").each( function(){
		// console.log("Chat div height : " + $(this).height() );
		childrenHeightSum = childrenHeightSum + $(this).outerHeight( true );
	});

	$("div.bubble-span-panel > div").each( function(){
		divLastChatWindow = $(this)[0];
	});

	$("#chat-bottom-pusher")[0].style.minHeight = ( iPusherHeightNeeded - childrenHeightSum ) + 'px';

	bubblesColor = computedStyle( divLastChatWindow ).borderTopColor;
	fX = divLastChatWindow.offsetLeft / chatDiv.clientWidth;
	fY = ( divLastChatWindow.offsetTop - chatDiv.scrollTop ) / chatDiv.clientHeight;
	fWidth = divLastChatWindow.clientWidth / chatDiv.clientWidth;
	fHeight = divLastChatWindow.clientHeight / chatDiv.clientHeight;

	// console.log('bubbles color : ' + bubblesColor );
	// console.log('bubbles generation rect : ' + fX + ';' + fY + ' ' + fWidth + 'x' + fHeight );
	visualBubbles.generateBubbles( posP - negP, bubblesColor, textLength, fX, fY, fX + fWidth, fY + fHeight );

  
  $("#chat-text").stop().animate({
    scrollTop: $('#chat-text')[0].scrollHeight
  }, 800);
};


/*
inbox.onopen = function(){
  console.log("inbox opened");

}

inbox.onclose = function(){
  console.log('inbox closed');
    this.inbox = new WebSocket(inbox.url);

};

outbox.onopen = function(){
  console.log("outbox opened");
}

outbox.onclose = function(){
    console.log('outbox closed');
    this.outbox = new WebSocket(outbox.url);
};*/


//send message to server when submit button pressed.
$("#input-form").on("submit", function(event) {

  if ( $("#input-name").val() == ""){
    alert("Type your name!!");
    return
  }
  event.preventDefault();
  var handle = $("#input-name")[0].value;
  var text   = $("#input-text")[0].value;

  //we stringify it because it only support string.

  var output_string = JSON.stringify({ handle: handle, text: text });
  // console.log(output_string);
  outbox.send(JSON.stringify({ handle: handle, text: text }));
  $("#input-text")[0].value = "";
  //console.log(stringifyText);
});

//called when confirm button pressed,
//change the input
//change the button
function nameConfirm(){

    if(!$("#input-name").prop('readonly')) {
        $("#input-name").prop('readonly', true);
        $("#name-confirm-btn").html("Reset");    
    }
    else{
        $("#input-name").prop('readonly', false);
        $("#name-confirm-btn").html("Confirm");
    }
    
}
