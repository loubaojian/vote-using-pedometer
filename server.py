import tornado.escape
import tornado.ioloop
import tornado.web
import tornado.httpserver
import os
import pymongo
import operator
import tornado.websocket
import json
import sys
import datetime
import random
from multiprocessing import Manager

dirname = os.path.dirname(__file__)
print(dirname)

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db'))

print(sys.path)

STATIC_PATH = os.path.join(dirname, 'static')

print(STATIC_PATH)

from stat import *
from db.jockey import Jockey
from db.game_vote import GameVote

from datetime import date
from bson import Binary, Code
from bson.json_util import dumps
from json import JSONEncoder
from bson.objectid import ObjectId


jockey = Jockey()
game_vote = GameVote()

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/static/(.*)", IndexDotHTMLAwareStaticFileHandler, {"path": STATIC_PATH}),
            (r"/person/questions", QuestionsHandler),
            (r"/person/teams", TeamsHandler),
            (r"/person/players", PlayersHandler),
            (r"/person/get-size", VoteSizeHandler),
            (r"/person/votes", VotesHandler),
            (r"/votews", VoteSocketHandler),
            (r"/person/results/(.*)", VoteResultHandler),
            (r"/person/populate/(.*)/(.*)", VotePopulateHandler),
            (r"/person/add-question", VoteAddQuestionHandler),
            (r"/person/delete-question/(.*)", VoteDeleteQuestionHandler),

            (r"/game/populate/(.*)/(.*)", GamePopulateHandler),
            (r"/game/get-size", GameSizeHandler),
            (r"/game/questions", GameQuestionsHandler),
            (r"/game/teams", GameTeamsHandler),
            (r"/game/players", GamePlayersHandler),
            (r"/game/votes", GameVotesHandler),

            (r"/()$", tornado.web.StaticFileHandler, {'path': 'www/index.html'}),
            (r"/(.*)", tornado.web.StaticFileHandler, {'path':'www/'})
        ]
        # settings = {
        #     "static_path": STATIC_PATH,
        #     "debug": True,
        #     # "static_url_prefix": "/static/",
        #     "static_handler_class" : IndexDotHTMLAwareStaticFileHandler
        # }
        tornado.web.Application.__init__(self, handlers) #, **settings)

class BaseHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Accept,Origin,Content-Type,X-Requested-With")
        self.set_header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        self.set_header("Access-Control-Allow-Credentials", "true")

class VoteSocketHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        print("WebSocket opened")

    def on_message(self, message):
        print("message", message)
        self.write_message(JSONEncoder().encode({'echo': message}))

    def on_close(self):
        print("WebSocket closed")

class VotePopulateHandler(BaseHandler):
    def get(self, team_size, player_size):
        result = jockey.populate_votes(int(team_size), int(player_size))
        self.write(JSONEncoder().encode(result))

class GamePopulateHandler(tornado.web.RequestHandler):
    def get(self, team_size, player_size):
        result = game_vote.populate_votes(int(team_size), int(player_size))
        self.write(JSONEncoder().encode(result))


class VoteAddQuestionHandler(BaseHandler):
    def post(self):
        data = json.loads(self.request.body.decode(encoding='UTF-8'))
        print("추가질문", data)
        result = jockey.add_question(data['type'], data['value'])
        self.write(JSONEncoder().encode(result))

class VoteDeleteQuestionHandler(BaseHandler):
    def get(self, question_id):
        print ("@@@id", question_id)
        result = jockey.delete_question(question_id)
        self.write(JSONEncoder().encode(result))

class VoteSizeHandler(BaseHandler):
    def get(self):
        size = jockey.get_size()
        print("size", size)
        self.write(JSONEncoder().encode(size))

class GameSizeHandler(tornado.web.RequestHandler):
    def get(self):
        size = game_vote.get_size()
        print("size", size)
        self.write(JSONEncoder().encode(size))

class QuestionsHandler(BaseHandler):
    def get(self):
        # question_list = [
        #     { 'type' : 'choice', 'value' : '우리팀 리더는 누구였습니까?' },
        #     { 'type' : 'choice', 'value' : '우리팀 아이디어 뱅크는 누구였습니까?' },
        #     { 'type' : 'score', 'value' : '우리팀 협업 점수는? (0-100)' },
        #     { 'type' : 'score', 'value' : '내가 우리팀에 기여한 점수는 몇점입니까? (0~100점)' },
        #     { 'type' : 'text', 'value' : '나의 제2의 도약을 위해 가장 필요한 것을 한 단어로 말한다면?' }
        # ]
        question_list = jockey.get_questions()
        print("question_list", question_list)
        self.write(JSONEncoder().encode(question_list))

class GameQuestionsHandler(tornado.web.RequestHandler):
    def get(self):
        question_list = [
            '가장 하고 싶은 게임을 선택해주세요'
        ]
        print("question_list", question_list)
        self.write(JSONEncoder().encode(question_list))

class TeamsHandler(BaseHandler):
    def get(self):
        team_size = jockey.team_size
        print("team_size", team_size)
        self.write(JSONEncoder().encode(team_size))

class GameTeamsHandler(tornado.web.RequestHandler):
    def get(self):
        team_size = game_vote.team_size
        print("team_size", team_size)
        self.write(JSONEncoder().encode(team_size))

class PlayersHandler(BaseHandler):
    def get(self):
        player_size = jockey.player_size
        print("player_size", player_size)
        self.write(JSONEncoder().encode(player_size))

class GamePlayersHandler(tornado.web.RequestHandler):
    def get(self):
        player_size = game_vote.player_size
        print("player_size", player_size)
        self.write(JSONEncoder().encode(player_size))

class VotesHandler(tornado.web.RequestHandler):
    def post(self):
        data = json.loads(self.request.body.decode(encoding='UTF-8'))
        print("투표완료", data)
        player_id = jockey.get_player_id_in_votes( data['teamId'], data['playerId'] )
        print("플레이어 아이디", player_id)
        if player_id == "Done" :
            self.write(JSONEncoder().encode("Fail"))
        else :
            jockey.update_votes( player_id, data['choices'], data['scores'], data['texts'], data['memberTypes'] )
            self.write(JSONEncoder().encode("Success"))

class GameVotesHandler(tornado.web.RequestHandler):
    def get(self):
        vote_list = game_vote.get_vote_result()
        print("vote_list", vote_list)
        self.write(JSONEncoder().encode(vote_list))

    def put(self):
        data = json.loads(self.request.body.decode(encoding='UTF-8'))
        print("투표완료", data)
        player_id = game_vote.get_player_id_in_votes( data['type'], data['teamId'], data['playerId'] )
        print("플레이어 아이디", player_id)
        if player_id == "Done" :
            self.write(JSONEncoder().encode("Fail"))
        else :
            game_vote.update_votes( player_id, data['type'], data['wishGame'] )
            self.write(JSONEncoder().encode("Success"))

class VoteResultHandler(tornado.web.RequestHandler):
    def get(self, team_index):
        vote_list = jockey.get_vote_result(int(team_index))
        player_list = jockey.get_player_literal_name(int(team_index))
        print("vote_list", vote_list)
        print("player_list", player_list)
        self.write(JSONEncoder().encode({'vote_list': vote_list, 'player_list': player_list}))

class IndexDotHTMLAwareStaticFileHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        # Disable cache
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Accept,Origin,Content-Type,X-Requested-With")
        self.set_header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        self.set_header("Access-Control-Allow-Credentials", "true")

    def parse_url_path(self, url_path):
        if not url_path or url_path.endswith('/'):
            url_path += 'index.html'

        return super(IndexDotHTMLAwareStaticFileHandler, self).parse_url_path(url_path)

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, date):
            return o.isoformat()
        if isinstance(o, datetime.timedelta):
            return o.total_seconds()
        return json.JSONEncoder.default(self, o)

def main():
    applicaton = Application()
    server = tornado.httpserver.HTTPServer(applicaton)
    port = 9900
    server.bind(port)
    print("port : ", port)
    server.start(2)
    with Manager() as manager:
        d = manager.dict()
        print(d)
        print(tornado.process.task_id())

    tornado.ioloop.IOLoop.current().start()

if __name__ == "__main__":
    main()
