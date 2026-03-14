import uvicorn
import os
import sys

if __name__ == "__main__":
    # Add the current directory to sys.path to ensure modules can be imported
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    print("Starting backend server...")
    print("Access the API at http://localhost:8000")
    print("Access API documentation at http://localhost:8000/docs")
    
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
