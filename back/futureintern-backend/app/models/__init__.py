from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .intern import Internship
from .application import Application
