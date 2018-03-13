import os
import json
from lxml import etree
from flask import Flask
from flask import render_template, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import csv
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


def create_json_response(path:str , file_extension:str):
    """
    This methods creates the JSON File required to build the modal in the front end.
    JSON contains names of all activities in the csv or xes.
    :param path: String to the file
    :param file_extension: XES or CSV
    :return: JSON
    """
    # Start to create JSON file to create Modal in front end
    json_data = {}
    json_data["attributes"] = []
    if file_extension == ".csv":
        with open(path) as csv_file:
            reader = csv.reader(csv_file)
            header = reader.__next__()
            for item in header:
                json_activities = dict()
                json_activities["name"] = item
                json_data["attributes"].append(json_activities)
            print(json_data)
            return json_data
    elif file_extension == ".xes":
        root = etree.parse(path)
        first_event = root.xpath("/log/trace/event")[0]
        for attribute in first_event.iterchildren():
            json_activities = dict()
            json_activities["name"] = attribute.attrib["key"]
            json_data["attributes"].append(json_activities)
        print(json_data)
        return json_data
    else:
        return "No valid file uploaded"


@app.route('/upload', methods=["POST"])
def upload_file():
    """
    This method uploads the supplied file if it is .xes or .csv and hands over the header information to JS.
    :return: JSON
    """
    # richard Maybe restrict fileSize to 50mb
    if request.method == "POST":
        if 'file' not in request.files:
            return "No file uploaded!"
        else:
            file = request.files['file']
            _, file_extension = os.path.splitext(file.filename)
            # FIXME Process Name is not handed over in request. Check Vue.js
            process_name = request.values["processName"]
            labels = request.form.getlist("labels")[0].split(
                ",")  # WTF? Warum split? Warum kommt das Ding nicht normal an?
            for label in labels:
                process_name = process_name + "_" + label
            process_name = process_name + file_extension
            # TODO delete when bug above is fixed
            if process_name == "":
                process_name = "Logfile" + file_extension

            if file_extension in ['.xes', '.csv']:
                # TODO Makes Notes to the basedir shit - Why is at not working as I want?
                basedir = os.path.abspath(os.path.dirname(__file__))
                secured_filename = secure_filename(process_name)
                file.save(os.path.join(basedir, app.config['UPLOAD_FOLDER'], secured_filename))
                # TODO would be nice if we could parse the file directly.
                global global_path
                path = os.path.join(basedir, app.config['UPLOAD_FOLDER'], secured_filename)
                global_path = path
                print("uploaded..")
                return create_json_response(path, file_extension)
            else:
                return "Only XES or CSV upload allowed"



"""
@app.route('/upload', methods=["POST"])
def upload_xes():
    # TODO Achtung FileSize
    # richard Turn upload function into general upload not only XES. Maybe restrict fileSize to 50mb 
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
                # TODO would be nice if we could parse the file directly without saving in /temp
                global global_path
                path = os.path.join(basedir, app.config['UPLOAD_FOLDER'] + secure_filename(process_name))
                global_path = path
                print("uploaded..")
                return "File has been uploaded"
            else:
                return "Only XES upload allowed"
"""
@app.route('/data', methods=["GET", "POST"])
def get_data():
    global global_path
    if global_path != "":
        process = Pm.Process(global_path)

        process_discovery_obj = Pm.Discovery(process)
        print("follower: ..")
        # TODO fix the iteration
        # TODO Not hardcoded concept:name here! Won't work with other naming! Is the case here and in Discovery.py!!!
        direct_follower = process_discovery_obj.get_direct_followers("Activity", True)
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
