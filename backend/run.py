import os
from dotenv import load_dotenv

from app import create_app

#load env files
load_dotenv()

config_name = os.environ.get("FLASK_ENV")
app = create_app(config_name)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
