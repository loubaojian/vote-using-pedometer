import pymongo
import operator
# import xlrd
import math
import datetime
import time
import sys

from pymongo import MongoClient
from pymongo import Connection
from .config import *
from math import fmod
from bson.objectid import ObjectId


class Singleton(type) :
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]



class Jockey(metaclass=Singleton) :

    client = MongoClient()
    # client = MongoClient("192.168.1.5")
    v_db = client[db_name_vote]
    m_db = client[db_name_momak]

    # def __init__(self):
        # team_size 와 player_size 나중에 db 에서 불러오도록 수정한다.
        # self.team_size = 9
        # self.player_size = 6
        # self.question_size = 4
        # self.init()

    # def init(self):
    #     self.populate_votes()


    def populate_votes(self, team_size, player_size) :
        init = 0
        if self.v_db.votes_admin.count() > 0 :
            self.v_db.votes_admin.drop()
        self.v_db.votes_admin.insert ( {'team_size' : team_size, 'player_size' : player_size} )

        if self.v_db.votes.count() > 0 :
            self.v_db.votes.drop()
        for team_index in range(team_size) :
            for player_index in range(player_size) :
                player_id = self.v_db.votes.insert( {'username' : '%d-%d' %(team_index + 1, player_index + 1), 'team_index' : team_index + 1, 'voted' : False} )
                init += 1
        print('total populated players : ', init)
        return init

    def add_question(self, q_type, q_value) :
        result = self.v_db.questions.insert( {'where': 'person', 'type': q_type, 'value': q_value} )
        print ('new question : ', result)
        return result

    def delete_question(self, question_id) :
        result = self.v_db.questions.remove( {'_id' : ObjectId(question_id)} )
        print ('deleted question : ', result)
        return result

    def get_size(self) :
        s_c = self.v_db.votes_admin.find()

        size = s_c[0]
        return size

    def get_questions(self) :
        q_c = self.v_db.questions.find ( {'where': 'person'} )

        question_list = []
        for q in q_c :
            question_list.append(q)
        return question_list

    def get_player_id_in_votes(self, team_index, player_index):
        # try:
        #     player_id = v_db.votes.find_one( {'username' : '%d-%d' %(team_index, player_index)} )['_id']
        # except TypeError:
        #     player_id = "None"

        player_document = v_db.votes.find_one( {'username' : '%d-%d' %(team_index, player_index)} )
        print ('@@@', player_document)
        if player_document['voted'] == False :
            player_id = player_document['_id']
        else :
            player_id = "Done"


        return player_id

    def get_player_id_in_votes_for_type(self, team_index, player_index):
        player_document = v_db.votes.find_one( {'username' : '%d-%d' %(team_index, player_index)} )
        print ('@@@', player_document)
        player_id = player_document['_id']
        return player_id

    def update_votes(self, player_id, choices, scores, texts, memberTypes) :
        result = v_db.votes.find_and_modify (
            {'_id' : player_id},
            {'$set' :
                {
                    'voted' : True,
                    'choices' : choices,
                    'scores' : scores,
                    'texts' : texts,
                    'types' : memberTypes
                }
            }
        )
        print('update', result)
        return result

    def get_vote_result(self, team_index):
        vote_c = self.v_db.votes.find({'team_index': team_index, 'voted': True})

        vote_list = []
        for vote in vote_c:
            vote_list.append(vote)
        return vote_list

    def get_player_literal_name(self, team_index):
        players_c = self.m_db.players.find({'team_index': team_index})

        p_name_list = []
        for player in players_c :
            p_name_list.append(player)
        return p_name_list
