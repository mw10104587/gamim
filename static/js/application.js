

var inbox = new ReconnectingWebSocket("ws://"+ location.host + "/receive");
var outbox = new ReconnectingWebSocket("ws://"+ location.host + "/submit");

inbox.onmessage = function(message) {
  console.log(message);
  var data = JSON.parse(message.data);
  console.log( data.length );
  var name = data.handle;
  var content = data.text;

  var emotionRangeClassString = ""
    if (data.neg > 0.75 ) 
      emotionRangeClassString = "rg-1"
    if (data.neg > 0.5 && data.neg < 0.75)
      emotionRangeClassString = "rg-2"
    if (data.neg > 0.25 && data.neg < 0.5)
      emotionRangeClassString = "rg-3"
    if (data.neg > 0 && data.neg < 0.25)
      emotionRangeClassString = "rg-4"

  //our own text
  if ( $("#input-name")[0].value == name ) {
    
    $("#chat-text").append("<div class='panel panel-default bubble-span'><div class='words my-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text + "  --> length = " + data.length + ", value of neg = " + data.neg ).html() + "</div></div></div>");   
    console.log("the neg value = ");
    console.log(data.neg);
  }
  //other's chat content
  else{

     $("#chat-text").append("<div class='panel panel-default bubble-span'><div class='words his-words "+emotionRangeClassString+"'" + "><div class='panel-body white-text'>" + $('<span/>').text(data.text + "  --> length = " + data.length + ", value of neg = " + data.neg ).html() + "</div></div></div>");

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
    
    //if($("#input-name").attr('readonly')) console.log("test2");

    //$("#input-name").attr('readonly', false);
    

}
