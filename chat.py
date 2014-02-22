# -*- coding: utf-8 -*-

"""
Chat Server
===========

This simple application uses WebSockets to run a primitive chat server.
"""

import os
import sys
import json
import logging
import redis
import gevent
from flask import Flask, render_template
from flask_sockets import Sockets

import nltk.classify.util
from nltk.classify import NaiveBayesClassifier
import pickle
import json


#load the saved NLTK Classifier.
classifier1Pickle = open('classifier_movie_review.pickle','r')
classifier1 = pickle.load(classifier1Pickle)
classifier1Pickle.close()


def word_feats(words):
    return dict([(word, True) for word in words])


def getNegEmotionValue(theString):
    samples = classifier1.prob_classify( word_feats( theString.split() ) )
    #print samples
    #print samples.samples()
    #print samples.prob("neg")
    return samples.prob("neg")

def getPosEmotionValue(theString):
    samples = classifier1.prob_classify( word_feats( theString.split() ))
    return samples.prob("pos")


def myClassify(chat):
    return classifier1.classify(word_feats( chat.split() ))


REDIS_URL = os.environ['REDISCLOUD_URL']
REDIS_CHAN = 'chat'

app = Flask(__name__)
app.debug = 'DEBUG' in os.environ

sockets = Sockets(app)
redis = redis.from_url(REDIS_URL)
#redis is used to save key-value pairs..



class ChatBackend(object):
    """Interface for registering and updating WebSocket clients."""

    def __init__(self):
        self.clients = list()
        self.pubsub = redis.pubsub()
        self.pubsub.subscribe(REDIS_CHAN)

    def __iter_data(self):
        for message in self.pubsub.listen():
            data = message.get('data')
	    print data
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
        #message = message + str( getLengthOfMessage(message) )
        print message
        sys.stdout.flush()
	
        if message:
            #message = message.replace("}", ',\"' + 'length\":\"' + str( getLengthOfMessage(message) )+ '\"' + '}' )
            jsonMessage = json.loads(message)
            print "length of message function"
            print getLengthOfMessage(message)
            message = message.replace("}", ',\"' + 'length\":\"' + str( getLengthOfMessage(message) )+ '\"' + ',\"' + 'neg\":\"' + str(getNegEmotionValue(jsonMessage["text"])) + '\"' + ',\"' + 'pos\":\"' + str(getPosEmotionValue(jsonMessage["text"])) + '\"' + '}' )
            
            #print "message after modification is: " + message
            sys.stdout.flush()
            app.logger.info(u'Inserting message: {}'.format(message))
            #post the message to given channel
            redis.publish(REDIS_CHAN, message)

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


