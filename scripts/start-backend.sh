#!/bin/bash

# Start backend server
cd "$(dirname "$0")/../backend"
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 5001
