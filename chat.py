# -*- coding: utf-8 -*-

"""
Chat Server
===========

This application uses WebSockets to run a primitive chat server.
"""

import os
import sys
import json
import logging
import redis
import gevent

from flask import Flask, render_template
from flask_sockets import Sockets

#import nltk.classify.util
#from nltk.classify import NaiveBayesClassifier
#import pickle
import json

import subprocess
import shlex
import firebasin
from datetime import datetime

def RateSentiment(sentiString):
    #open a subprocess using shlex to get the command line string into the correct args list format
    p = subprocess.Popen(shlex.split("java -jar SentiStrengthCom.jar stdin sentidata SentiStrength_Data/"),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    #communicate via stdin the string to be rated. Note that all spaces are replaced with +
    stdout_text, stderr_text = p.communicate(sentiString.replace(" ","+"))
    #remove the tab spacing between the positive and negative ratings. e.g. 1    -5 -> 1-5
    stdout_text = stdout_text.rstrip().replace("\t","")
    return stdout_text

#print RateSentiment("I'm very happy to see you here")

#print RateSentiment("you're such an asshole")

#print RateSentiment("good job!")

sys.stdout.flush()

#def myClassify(chat):
#    return classifier1.classify(word_feats( chat.split() ))


REDIS_URL = os.environ['REDISCLOUD_URL']
REDIS_CHAN = 'chat'

app = Flask(__name__)
app.debug = 'DEBUG' in os.environ

sockets = Sockets(app)
redis = redis.from_url(REDIS_URL)
"""redis is used to save key-value pairs.."""


class ChatBackend(object):
    """Interface for registering and updating WebSocket clients."""

    def __init__(self):
        self.clients = list()
        self.pubsub = redis.pubsub()
        self.pubsub.subscribe(REDIS_CHAN)
        self.firebase = firebasin.Firebase("https://gamim.firebaseio.com/")

    def __iter_data(self):
        for message in self.pubsub.listen():
            data = message.get('data')
	    #/print data
            if message['type'] == 'message':
                app.logger.info(u'Sending message: {}'.format(data))
                yield data

    def register(self, client):
        """Register a WebSocket connection for Redis updates."""
        self.clients.append(client)

    def send(self, client, data):
        """Send given data to the registered client.
        Automatically discards invalid connections."""
        try:
            client.send(data)
        except Exception:
            self.clients.remove(client)

    def run(self):
        """Listens for new messages in Redis, and sends them to clients."""
        for data in self.__iter_data():
            for client in self.clients:
                gevent.spawn(self.send, client, data)

    def start(self):
        """Maintains Redis subscription in the background."""
        gevent.spawn(self.run)

    def saveToFirebase(self, name, content, emotionValue):

        self.firebase.push({"name": name, "content": content, "emotionValue": emotionValue, "time":str(datetime.now() )})


chats = ChatBackend()
chats.start()



@app.route('/')
def hello():
    return render_template('index.html')

@sockets.route('/submit')
def inbox(ws):
    """Receives incoming chat messages, inserts them into Redis."""
    while ws.socket is not None:
        # Sleep to prevent *contstant* context-switches.
        gevent.sleep(0.1)
        message = ws.receive()
        #print message
        #sys.stdout.flush()
	
        if message:
            jsonMessage = json.loads(message)
            #NLTK version analysis
            #message = message.replace("}", ',\"' + 'length\":\"' + str( getLengthOfMessage(message) )+ '\"' + ',\"' + 'neg\":\"' + str(getNegEmotionValue(jsonMessage["text"])) + '\"' + ',\"' + 'pos\":\"' + str(getPosEmotionValue(jsonMessage["text"])) + '\"' + '}' )
            #SentiStrength analysis
            text = jsonMessage["text"]
            sentistrength_result = RateSentiment(text)
            name = jsonMessage["handle"]
            posV = sentistrength_result[:1]
            negV = sentistrength_result[2:]
            emotionV = getEmotionValueFrom( int(posV), int(negV) )  
            message = message.replace("}", ',\"' + 'length\":\"' + str( getLengthOfMessage(message) )+ '\"' + ',\"' + 'neg\":\"' + sentistrength_result[2:] + '\"' + ',\"' + 'pos\":\"' + sentistrength_result[:1] + '\"' + '}' )


            print emotionV
            sys.stdout.flush()
            app.logger.info(u'Inserting message: {}'.format(message))
            #post the message to given channel
            redis.publish(REDIS_CHAN, message)
            chats.saveToFirebase( name, text, emotionV )

def getEmotionValueFrom(pos, neg):
    if max([pos, neg]) == pos:
        return pos
    else:
        return (-1) * neg

@sockets.route('/receive')
def outbox(ws):
    """Sends outgoing chat messages, via `ChatBackend`."""
    chats.register(ws)

    while ws.socket is not None:
        # Context switch while `ChatBackend.start` is running in the background.
        gevent.sleep()


# get number of characters.
def getLengthOfMessage(message):    
    decoded = json.loads(message)
    return len( decoded['text'] )


