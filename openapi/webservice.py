# this Python snippet is stored as openapi/webservice.py
import connexion

app = connexion.App(__name__)
app.add_api('openapi.yaml', validate_responses=True)
app.run(port=8080)