import pymongo
import operator
import math
import datetime
import time
import sys

from pymongo import MongoClient
from pymongo import Connection
from .config import *
from math import fmod
from bson.objectid import ObjectId

client = MongoClient()
db = client[db_name_vote]

class Singleton(type) :
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class GameVote(metaclass=Singleton) :
    client = MongoClient()
    db = client[db_name_vote]

    # def __init__(self):
    #     # team_size 와 player_size 나중에 db 에서 불러오도록 수정한다.
    #     self.team_size = 9
    #     self.player_size = 6
    #     self.init()

    # def init(self):
    #     self.populate_votes()

    def populate_votes(self, team_size, player_size) :
        init = 0
        if self.db.game_admin.count() > 0 :
            self.db.game_admin.drop()
        self.db.game_admin.insert ( {'team_size' : team_size, 'player_size' : player_size} )

        if self.db.game_votes.count() > 0 :
            self.db.game_votes.drop()
        for team_index in range(team_size) :
            for player_index in range(player_size) :
                player_id = self.db.game_votes.insert( {'username' : '%d-%d' %(team_index + 1, player_index + 1), 'team_index' : team_index + 1, 'begin' : False, 'end' : False} )
                init += 1
        print('total populated players : ', init)
        return init

    # def populate_votes(self) :
    #     init = 0
    #     if self.db.game_votes.count() > 0 :
    #         return
    #     for team_index in range(self.team_size) :
    #         for player_index in range(self.player_size) :
    #             player_id = self.db.game_votes.insert( {'username' : '%d-%d' %(team_index + 1, player_index + 1), 'team_index' : team_index + 1, 'voted' : False} )
    #             init += 1
    #     print('total populated players : ', init)

    def get_size(self) :
        s_c = self.db.game_admin.find()

        size = s_c[0]
        return size

    def get_player_id_in_votes(self, key, team_index, player_index):
        player_document = db.game_votes.find_one( {'username' : '%d-%d' %(team_index, player_index)} )
        print ('@@@', player_document)
        if player_document[key] == False :
            player_id = player_document['_id']
        else :
            player_id = "Done"

        return player_id

    # def get_player_id_in_votes(self, team_index, player_index):
    #     try:
    #         player_id = db.game_votes.find_one( {'username' : '%d-%d' %(team_index, player_index)} )['_id']
    #     except TypeError:
    #         player_id = "None"
    #     return player_id

    # def update_votes(self, player_id, choices, scores, texts) :
    #     result = db.votes.find_and_modify (
    #         {'_id' : player_id},
    #         {'$set' :
    #             {
    #                 'voted' : True,
    #                 'choices' : choices,
    #                 'scores' : scores,
    #                 'texts' : texts
    #             }
    #         }
    #     )
    #     print('update', result)
    #     return result

    def update_votes(self, player_id, key, wish_game) :
        result = db.game_votes.find_and_modify (
            {'_id' : player_id},
            {
                '$addToSet' : { 'answers' : { 'type' : key, 'wish_game' : wish_game } },
                '$set' : { key : True }
            }
        )
        print('update', result)

    def get_vote_result(self):
        vote_c = self.db.game_votes.find()

        vote_list = []
        for vote in vote_c:
            vote_list.append(vote)
        return vote_list
