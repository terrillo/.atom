# Native
import sys
import urllib2
import requests

reload(sys)
sys.setdefaultencoding('utf8')

# Extra
import rollbar
import rollbar.contrib.flask
from flask import Flask, Response, make_response, abort, request, current_app, render_template, got_request_exception
from flask_cors import CORS
from flask_caching import Cache

# Flask
app = Flask(__name__)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Models
from models.database import *
from models.root import *

# Config
CONFIG = {
    'brand': 'The Anchoring',
    'server': 'uWSGTI',
    'url': 'https://www.theanchoring.com'
}

# Before * request
@app.before_request
def before_request():

    # Rollbar
    if 'localhost' not in request.host_url:
        rollbar.init(
            'a16e5729bf87415993bdb897edbaa0ae',
            'production',
            root=os.path.dirname(os.path.realpath(__file__)),
            allow_logging_basic_config=False)

    # Rollbar Reporting
    got_request_exception.connect(rollbar.contrib.flask.report_exception, app)

    # Disable cache
    if 'localhost' in request.host_url or '0.0.0.0' in request.host_url:
        app.jinja_env.cache = {}

    # Connect to Database
    connection.connect()

# After * reqeust
@app.after_request
def after_request(response):
    # Close Databse
    connection.close()
    return response

# Status
@app.route('/status', methods=['GET'])
def status():
    all_records = len(pull("SELECT id from ep"))
    if all_records:
        check_db = 'OK'
    else:
        check_db = 'Impaired'
    resp = Response(json.dumps({
        'database': {
            'records': all_records,
        },
        'config': CONFIG
    }))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

# Index
@app.route('/', methods=['GET'])
def index():
    top = pull("SELECT * from ep ORDER BY `views`+0 DESC, id DESC LIMIT 1")
    top4 = pull("SELECT * from ep ORDER BY `views`+0 DESC, id DESC LIMIT 4 OFFSET 1")
    return render_template('index.html', config=CONFIG, top4=top4, top=top)

# Play
@app.route('/play/<id>', methods=['GET'])
def play(id):
    push("UPDATE ep SET views = views + 1 WHERE id='%s'" % (id)) # Update View Count
    one = pull("SELECT * from ep WHERE id='%s'" % (id))[0]
    return render_template('play.html', config=CONFIG, one=one)

# Resume
@app.route('/resume', methods=['GET'])
def resume():
    return render_template('resume.html', config=CONFIG)

# Track Plays
@app.route('/api/track/plays/<id>', methods=['GET'])
def api_play(id):
    push("UPDATE ep SET plays = plays + 1 WHERE id='%s'" % (id)) # Update Play Count
    return 'TRUE'

# Track Views
@app.route('/api/track/views/<id>', methods=['GET'])
def api_views(id):
    push("UPDATE ep SET views = views + 1 WHERE id='%s'" % (id)) # Update View Count
    return 'TRUE'

# All Records json
@app.route('/all', methods=['GET'])
def show_all():
    all_records = pull("SELECT * from ep ORDER BY plays DESC")
    resp = Response(json.dumps(all_records))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Content-Type'] = 'application/json'
    return resp

# sitemap.xml
@app.route('/sitemap.xml', methods=['GET'])
def show_sitemap():
    resp = Response(sitemap(), mimetype='text/xml')
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

# Root Files
@app.route('/<file>', methods=['GET'])
def show_robots(file):
    if os.path.exists('./root/'+file):
        text = open('./root/'+file).read()
        return text
    else:
        abort(404)

# Root Files
@app.route('/image/<path:image>', methods=['GET'])
@cache.cached(timeout=60000)
def render_image(image):
    image = image.replace(':/','://')
    request = requests.get(image)
    resp = Response(urllib2.urlopen(image).read(),  mimetype=request.headers['content-type'])
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

# 404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html')

# 500
@app.errorhandler(500)
def page_not_found(e):
    rollbar.report_message('500: %s' + request.path)
    return render_template('500.html')

# Start Server
if __name__ == "__main__":
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(host='0.0.0.0', debug=True)
