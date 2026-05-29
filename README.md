# Automatic Student Attendance System  

A full-stack web application with a React frontend and Python Flask backend, connected via a REST API with PostgreSQL database integration with SQLAlchemy ORM. This system is built for educators, that enables automatic attendance monitoring for students in universities, the management of student attendance for different classes that occur at different times of the day, and provides attendance analytics for each of these classes.

# Project Structure

```
├── backend/                   # Python Flask API
│   ├── app/
│   │   ├── __init__.py        # Flask app factory
│   │   ├── facemodels.py      # Facial recognition models
│   │   ├── models.py          # SQLAlchemy database models
│   │   └── routes.py          # API endpoints
│   ├── migrations/...         # Alembic migration files
│   ├── config.py              # Configuration settings
│   ├── insert-to-db=script.py # Data seeding script, UNUSED
│   ├── requirements.txt       # Python dependencies
│   └── run.py                 # Application entry point
├── frontend/                  # React application
│   ├── public/...             # Assets, icons, logos etc
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js         # API service for backend communication
│   │   ├── App1.jsx           # Main application component
│   │   ├── index.css          # Application styles
│   │   └── ...                # JSX files for other pages
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json           # Node.js dependencies
│   └── vite.config.js         # Vite configuration with API proxy
├── .gitignore
└── README.md
```

# Getting Started: Live Website (Recommended) 
In terms of system installation, the Automatic Student Attendance System does not require the installation or setup of any software dependencies. The system is designed to be a web platform, accessible online through the public internet on any desktop browser of choice. You can visit the live deployment [here](https://13.239.176.109). Please email the team at **asas.w14team@gmail.com** to obtain the credentials for log in.

After logging in, if you encounter an empty dashboard that reads "No currently running classes," it simply means what it suggests and is not an error. 

# Getting Started: Local Setup Instructions  
This section provides information for the setup of the Automatic Student Attendance System for hosting locally. It should be noted that, should the platform be deployed live and be accessible through the public internet, the below only provides a reference as deployment methods on web hosting platforms may vary. Generally, a similar process is expected for non-local deployment, but special configurations such as CORS and cookie policies may be required, as well as the use of a proper HTTP web server and WSGI server for the Flask application.  

## Pre-requisites  
The web application requires some dependencies that must first be installed on the local device, specified below:  

1. Ensure the following is installed in the local environment:  
	* Git
	* Python 3.8+
	* Node.js 18+  
	* npm
   * A Mailtrap API key

2. From the command line, navigate to the desired destination directory where the system will be hosted:  
	```
	cd path/to/directory
	```

3. Clone the repository by running the following command:  
	```
	git clone https://github.com/Pvns3149/Automatic-Facial-Recognition-System.git
	```

4. All system subdirectories and files should now be cloned to the directory specified in step 2. Please follow the environment configurations and build process in the next segment.  

## Environment Configuration  
It is necessary to first configure some environment variables, reqiured to be set to be acceessed by the system.  

1. From this point on, the directory `path/to/directory/Automatic-Facial-Recognition-System` will be referred to as the "**system directory**". From the system directory, navigate to `frontend` and create an environment file named `.env`. Paste the following contents into the file and save it:  
	```
	VITE_API_BASE_URL="http://localhost:5000/api"
	```

2. Then, navigate to the `backend` directory and create an environment file named `.env`. Paste the following contents into the file and save it:  
	```
	FLASK_ENV="production"
	INSIGHTFACE_ROOT="../.insightface/models/buffalo_l"
	EMAIL_API_KEY="yourmailtrapemailapikey"
	AUTH_KEY="anykeyofchoice"
	FLASK_APP=run.py
	```
 where `EMAIL_API_KEY` requires a Mailtrap API key of your own, and `AUTH_KEY` can be any string.

## Build Process  
The below step-by-step instructions demonstrate the build process and execution of the system.  

### PostgreSQL Database Setup
#### Using the Demo Database  
For a simple demonstration of the system, it is recommended to use the database maintained by the team. For this purpose, you are highly advised to visit the [live website](https://13.239.176.109) instead. If hosting locally is absolutely necessary, please email the team at **asas.w14team@gmail.com** to obtain the `connection-string` value. Then, add this line to the `backend/.env` file defined earlier:  
```
DATABASE_URL="connection-string"
```
where the `connection-string` is the value you obtained from the team through the email.

#### Using your own Database
If you choose to use a local database or your own PostgreSQL instance, please contact the team to be informed of relevant database documentation of the system. Then, please **create tables and load your own data** fully consistent with the specified schema and recommended data formats as advised by the team. Additionally, please ensure that the **embeddings** uploaded to the database in Student rows are generated by the `buffalo_l/w600k_r50.onnx` model.  

Configure the environment variable `DATABASE_URL` such that it points to your database instance. As of the current system, only `PostgreSQL` is fully supported, and ensure the `pgvector` extension is installed and enabled for the storage of embeddings.  

### Backend Setup  
1. From the system directory, navigate to the `backend` subdirectory:  
	```
	cd backend
	```

2. Create a Python virtual environment:  
	```
	python -m venv venv
	```
	Then, activate the virtual environment. For Unix-based systems:  
	```
	source venv/bin/activate
	```
	
	For Windows, if you're using command prompt:
	```
	"venv/Scripts/activate"
	```
	or if you're using Powershell:
	```
	(Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned) ; (& "venv\Scripts\activate")
	```

3. Ensure the virtual environment is running and you are inside it. Install all backend dependencies:  
	```
	pip install -r requirements.txt
	```

4. Run the Flask server:
	```
	python run.py
	```

### Frontend Setup  
1. From the system directory, navigate to the `frontend` subdirectory:
	```
	cd frontend
	```

2. Install frontend dependencies:  
	```
	npm install
	npm install -g serve
	```

3. Start the production server:
	```
	npm run build
	serve -s dist
	```

The system will be available at **http://localhost:3000**.

# Technologies Used

- **Frontend**: React 19, Vite
- **Backend**: Python, Flask 3.0
- **Database**: SQLAlchemy ORM
- **API**: RESTful API with Flask-CORS for cross-origin support
