#!/bin/bash

Xvfb :99 -screen 0 1280x800x24 &
export DISPLAY=:99

cd ~/flow-tester/agent
git pull origin main

~/flow-tester/agent/.venv/bin/python ~/flow-tester/agent/agent.py
# sudo shutdown -h now
