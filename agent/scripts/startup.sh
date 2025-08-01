Xvfb :99 -screen 0 1280x800x24 &
export DISPLAY=:99

cd ~/flow-tester/agent
git pull origin main
source .venv/bin/activate

python3 consumer.py
# sudo shutdown -h now
