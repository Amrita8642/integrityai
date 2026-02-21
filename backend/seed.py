"""
Seed script — creates demo users for testing.
Usage: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models import User, Policy
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Student
if not db.query(User).filter(User.email == "student@demo.com").first():
    db.add(User(name="Demo Student", email="student@demo.com", password_hash=pwd.hash("demo1234"), role="student"))
    print("Created: student@demo.com / demo1234")

# Educator
edu = db.query(User).filter(User.email == "educator@demo.com").first()
if not edu:
    edu = User(name="Prof. Demo", email="educator@demo.com", password_hash=pwd.hash("demo1234"), role="educator")
    db.add(edu)
    db.flush()
    db.add(Policy(educator_id=edu.id, similarity_threshold=30, min_drafts=2))
    print("Created: educator@demo.com / demo1234")

db.commit()
db.close()
print("Done.")
