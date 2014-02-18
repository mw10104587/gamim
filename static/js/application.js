var inbox = new ReconnectingWebSocket("ws://"+ location.host + "/receive");
var outbox = new ReconnectingWebSocket("ws://"+ location.host + "/submit");

inbox.onmessage = function(message) {
  console.log(message);
  var data = JSON.parse(message.data);
  //console.log( data.length );
  var name = data.handle;
  var content = data.text;
  var textLength = parseInt(data.length);
  console.log(textLength);
 
  negP = parseFloat(data.neg);
  console.log(data.neg);
/*console.log("********************");
  console.log(negP);
  console.log(negP > 0 && negP < 1%11);
  console.log(negP > 0);
  console.log(negP < 1%11);
  console.log( (1%11) ) ;
  console.log( 1/11 );
  console.log("*********************");
*/

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


  //our own text
  if ( $("#input-name")[0].value == name ) {
    
    $("#chat-text").append("<div class='bubble-span-panel'><div class='words my-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text + "  --> length = " + data.length + ", value of neg = " + data.neg ).html() + "</div></div></div>");   
    console.log("the neg value = ");
    console.log(data.neg);
  }
  //other's chat content
  else{

     $("#chat-text").append("<div class='bubble-span-panel'><div class='words his-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text + "  --> length = " + data.length + ", value of neg = " + data.neg ).html() + "</div></div></div>");

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

$("#input-form").on("submit", function(event) {

  if ( $("#input-name").val() == ""){
    alert("Type your name!!");
    return
  }
  event.preventDefault();
  var handle = $("#input-name")[0].value;
  var text   = $("#input-text")[0].value;
  var stringifyText = JSON.stringify({handle: handle, text: text} );
  outbox.send(JSON.stringify({ handle: handle, text: text }));
  $("#input-text")[0].value = "";
  console.log(stringifyText);
});

//called when button pressed,
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
