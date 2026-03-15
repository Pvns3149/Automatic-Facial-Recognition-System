import os
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from app import create_app
from app.models import Sample #Change to class

# #Setup scheduler and task
# def check_time():
#     current_time = datetime.now()
#     target_time = current_time + timedelta(minutes=15)

#     classes = Sample.query.filter(Sample.end_time.between(current_time, target_time)).all()
#         #Send email


# #Scheduler init
# def start_scheduler():
#     scheduler = BackgroundScheduler()
#     scheduler.add_job(check_time, 'interval', minutes=15)
#     scheduler.start()



#Load env files and config
load_dotenv()

config_name = os.environ.get("FLASK_ENV")
app = create_app(config_name)

#Start app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
