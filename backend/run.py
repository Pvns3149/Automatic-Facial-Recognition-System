import os
from dotenv import load_dotenv
from app import create_app


#Written by Puvan 2026 - Main app to begin backend server and load env 
#Load env files and config
load_dotenv()

config_name = os.environ.get("FLASK_ENV")
app = create_app(config_name)

#Start app
if __name__ == "__main__":
    app.run(host="localhost", port=5000)
