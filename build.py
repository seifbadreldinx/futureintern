#!/usr/bin/env python3
# Railway build script
import subprocess
import sys
import os

def main():
    print("Installing dependencies...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    print("Initializing database...")
    os.chdir("back/futureintern-backend")
    subprocess.check_call([sys.executable, "init_db.py"])
    
    print("Build complete!")

if __name__ == "__main__":
    main()
