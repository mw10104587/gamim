# -*- coding: utf-8 -*-

"""
Chat Server
===========

This application uses WebSockets to run a primitive chat server.
"""

import os, urlparse, redis
import sys
import json
import logging

# server stuff
import gevent
from flask import Flask, render_template
from flask_sockets import Sockets

# semantic
import subprocess
import shlex

# save chat messages for future use.
from firebase import firebase
from datetime import datetime


class ChatBackend(object):
    # Interface for registering and updating WebSocket clients.

    def __init__(self):
        self.clients = list()

        # pub sub is the short hand of publish and subscribe,
        # detail: http://redis.io/topics/pubsub
        self.pubsub = my_redis.pubsub()

        # subscribe the client to this channel
        self.pubsub.subscribe(REDIS_CHANNEL)

        # initialize a firebase to save all the chat contents so we can do further analysis.
        # firebase is another web database service that we can save data into, and it provides a better interface. 
        self.my_firebase = firebase.FirebaseApplication("https://gamim-test1.firebaseio.com", None)


    def __iter_data(self):
        for message in self.pubsub.listen():
            data = message.get('data')
        #/print data
            if message['type'] == 'message':
                app.logger.info(u'Sending message: {}'.format(data))
                yield data

    def register(self, client):
        # Register a WebSocket connection for Redis updates.
        # when a client joins the chat, the list is appended with a new user name.
        self.clients.append(client)

    def send(self, client, data):
        # Send given data to the registered client.
        # Automatically discards invalid connections.
        try:
            client.send(data)
        except Exception:
            self.clients.remove(client)

    def run(self):
        # Listens for new messages in Redis, and sends them to clients.
        for data in self.__iter_data():
            for client in self.clients:
                gevent.spawn(self.send, client, data)

    def start(self):
        # Maintains Redis subscription in the background.
        gevent.spawn(self.run)

    def saveToFirebase(self, name, content, emotionValue):

        chat_message = { "name": name, 
                        "content": content, 
                        "emotionValue": emotionValue, 
                        "time":str( datetime.now() )
                       }

        # debug
        # print "trying to save"
        # print json.dumps(chat_message, indent=4)
        # sys.stdout.flush()

        # result = self.my_firebase.post("/messages", chat_message, {'print': 'pretty'}, {'X_FANCY_HEADER': 'VERY FANCY'})
        result = self.my_firebase.post("/messages", chat_message)
        
        # print "Save to Firebase"
        # print result
        # sys.stdout.flush()




# A global function that calculates the pos and neg of a sentence.
def RateSentiment(sentiString):
    #open a subprocess using shlex to get the command line string into the correct args list format
    p = subprocess.Popen(shlex.split("java -jar SentiStrengthCom.jar stdin sentidata SentiStrength_Data/"),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    
    #communicate via stdin the string to be rated. Note that all spaces are replaced with +
    stdout_text, stderr_text = p.communicate(sentiString.replace(" ","+"))
    
    #remove the tab spacing between the positive and negative ratings. e.g. 1    -5 -> 1-5
    stdout_text = stdout_text.rstrip().replace("\t","")

    return stdout_text



# debug use
# sys.stdout.flush()

# this is a redis url given after we register the redis service on Heroku.
REDIS_URL = os.environ.get('REDISCLOUD_URL')

# for local test, we can't get the heroku config variable.
if REDIS_URL == None:
    REDIS_URL = "redis://rediscloud:etvTJuT8iU0JQvYE@pub-redis-18654.us-east-1-3.4.ec2.garantiadata.com:18654"

# we need a channel name so that different clients know which channel to subscribe
REDIS_CHANNEL = 'gamim-test-1'

app = Flask(__name__)
app.debug = 'DEBUG' in os.environ

sockets = Sockets(app)


# redis is a db service to save key-value pairs."
# redis = redis.from_url(REDIS_URL)

# url = urlparse.urlparse(REDIS_URL)
# my_redis = redis.Redis(host=url.hostname, port=url.port, password=url.password)

my_redis = redis.from_url(REDIS_URL)

chats = ChatBackend()
chats.start()





@app.route('/')
def hello():
    return render_template('index.html')

@sockets.route('/submit')
def inbox(ws):
    # ws means web socket
    # Receives incoming chat messages, inserts them into Redis.

    # while not ws.closed:
    while ws.socket is not None:
        # Sleep to prevent *constant* context-switches.
        gevent.sleep(0.1)
        message = ws.receive()
	
        if message:
            jsonMessage = json.loads(message)
            text = jsonMessage["text"]
            sentistrength_result = RateSentiment(text)
            
            # handle is just a random key.
            name = jsonMessage["handle"]
            
            pos_value = int(sentistrength_result[:1])
            neg_value = int(sentistrength_result[2:])
            emotion_value = getEmotionValueFrom( pos_value, neg_value)  
            message = message.replace("}", ',\"' + 'length\":\"' + str( getLengthOfMessage(message) )+ '\"' + ',\"' + 'neg\":\"' + sentistrength_result[2:] + '\"' + ',\"' + 'pos\":\"' + sentistrength_result[:1] + '\"' + '}' )

            print message

            # print and flush
            # print emotion_value
            sys.stdout.flush()

            app.logger.info(u'Inserting message: {}'.format(message))

            #post the message to redis channel
            my_redis.publish(REDIS_CHANNEL, message)

            # save the chat message to firebase
            chats.saveToFirebase( name, text, emotion_value )

def getEmotionValueFrom(pos, neg):
    if max([pos, neg]) == pos:
        return pos
    else:
        return (-1) * neg

@sockets.route('/receive')
def outbox(ws):
    # Sends outgoing chat messages, via `ChatBackend`.
    chats.register(ws)

    # while not ws.closed:
    while not ws.socket is not None:
        # Context switch while `ChatBackend.start` is running in the background.
        gevent.sleep()


# get number of characters.
def getLengthOfMessage(message):    
    decoded = json.loads(message)
    return len( decoded['text'] )


