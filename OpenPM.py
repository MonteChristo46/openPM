import os
import json

from flask import Flask
from flask import render_template, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

import openPM as Pm

# Flask

app = Flask(__name__)
CORS(app)  # To solve the header issue

# Constants
UPLOAD_FOLDER = 'static/temp/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global Variables
global_path = ""


@app.route('/', methods=["GET", "POST"])
def index():
    return render_template("sidebar.html")


@app.route('/upload', methods=["POST"])
def upload_xes():
    # TODO Achtung FileSize
    if request.method == "POST":
        if 'file' not in request.files:
            return "No XES file uploaded!"
        else:
            xes = request.files['file']
            process_name = request.values["processName"]  # Be careful when script also should handle CSV!
            labels = request.form.getlist("labels")[0].split(
                ",")  # WTF? Warum split? Warum kommt das Ding nicht normal an?
            for label in labels:
                process_name = process_name + "_" + label
            process_name = process_name + ".xes"

            if xes.filename.endswith('.xes'):
                # TODO Makes Notes to the basedir shit - Why is at not working as I want?
                basedir = os.path.abspath(os.path.dirname(__file__))
                xes.save(os.path.join(basedir, app.config['UPLOAD_FOLDER'], secure_filename(process_name)))
                # TODO would be nice if we could parse the file directly.
                global global_path
                path = os.path.join(basedir, app.config['UPLOAD_FOLDER'] + secure_filename(process_name))
                global_path = path
                print("uploaded..")
                return "File has been uploaded"
            else:
                return "Only XES upload allowed"


@app.route('/data', methods=["GET", "POST"])
def get_data():
    global global_path
    if global_path != "":
        process = Pm.Process(global_path)

        process_discovery_obj = Pm.Discovery(process)
        print("follower: ..")
        # TODO fix the iteration
        direct_follower = process_discovery_obj.get_direct_followers("concept:name", True)
        print("direct follower found")
        causal_dependencies = Pm.Discovery.get_causal_dependencies(direct_follower)
        print(causal_dependencies)
        return process_discovery_obj.to_json(causal_dependencies, True)
    else:
        print("Global_Path is empty")
        return ""


# TODO-fixme this is not an solution. A file database would make much more sense.
@app.route('/search/<string>/', methods=["GET", "POST"])
def search(string: str):
    basedir = os.path.abspath(os.path.dirname(__file__))
    files = os.listdir(os.path.join(basedir, app.config['UPLOAD_FOLDER']))
    return_list = []
    for file in files:
        if string in file:
            return_list.append(file)
    return json.dumps(return_list)


if __name__ == '__main__':
    app.run()
