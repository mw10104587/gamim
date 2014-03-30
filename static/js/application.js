//hostname which is emotion-chat-v1.herokuapp
var inbox = new ReconnectingWebSocket("ws://"+ location.host + "/receive");
var outbox = new ReconnectingWebSocket("ws://"+ location.host + "/submit");
var visual = new Bubbles( { canvasid: "bubblesContainer", width: 640, height: 480,
	battleField: { width: 640, height: 30 }, maxSpeed: 15, maxBubbles: 250 } );

//receiving a message
//get data and show in chat box
inbox.onmessage = function(message) {
  console.log(message);
  var data = JSON.parse(message.data);
  var name = data.handle;
  var content = data.text;
  var textLength = parseInt(data.length);
  console.log(textLength);
 
  var negP = parseFloat(data.neg);
  console.log(data.neg);
  var posP = parseFloat(data.pos);
  console.log(posP);
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

  console.log(emotionRangeClassString);

  //if it's the content we entered
  if ( $("#input-name")[0].value == name ) {    
	$("#chat-text").append("<div class='bubble-span-panel'><div class='words my-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text ).html() + "</div></div></div>"); 

	var iPusherHeightNeeded = $("#chat-text").height();
	var childrenHeightSum=0;
	var divLastChatWindow;
	$("#chat-text div.bubble-span-panel").each( function(){
		console.log("Chat div height : " + $(this).height() );
		childrenHeightSum = childrenHeightSum + $(this).outerHeight( true );
		divLastChatWindow = $(this);
	});

	$("#chat-bottom-pusher")[0].style.minHeight = ( iPusherHeightNeeded - childrenHeightSum ) + 'px';
	visual.generateBubbles( posP - negP, textLength, divLastChatWindow.offsetLeft, divLastChatWindow.offsetTop,
		divLastChatWindow.offsetLeft + divLastChatWindow.offsetWidth / 2,
		divLastChatWindow.offsetTop + divLastChatWindow.offsetHeight / 2 );
  }
  //if it's the content other people entered
  else{

     $("#chat-text").append("<div class='bubble-span-panel'><div class='words his-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text ).html() + "</div></div></div>");
  visual.generateBubbles( posP - negP, textLength, 120, 500, 120, 500 );
  }

  
  $("#chat-text").stop().animate({
    scrollTop: $('#chat-text')[0].scrollHeight
  }, 800);
};

inbox.onclose = function(){
    console.log('inbox closed');
    this.inbox = new WebSocket(inbox.url);

};

outbox.onclose = function(){
    console.log('outbox closed');
    this.outbox = new WebSocket(outbox.url);
};


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
