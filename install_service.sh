#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

echo "Installing Nissi Backend as a background systemd service..."

# Create systemd service file
cat <<EOT > /etc/systemd/system/nissi-backend.service
[Unit]
Description=Nissi Server Console Native Backend
After=network.target

[Service]
User=root
WorkingDirectory=/home/nissi/nissiserverconsole/backend
ExecStart=/home/nissi/nissiserverconsole/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOT

# Reload systemd and start the service
systemctl daemon-reload
systemctl enable nissi-backend
systemctl start nissi-backend

echo "Service installed and started in the background!"
echo "You can check its status anytime with: sudo systemctl status nissi-backend"
echo "You can view logs with: sudo journalctl -u nissi-backend -f"
