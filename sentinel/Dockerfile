FROM python:3.10-alpine
WORKDIR /app
RUN pip install requests
COPY agent.py .
CMD ["python", "agent.py"]
