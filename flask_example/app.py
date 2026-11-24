import json
import os
import socket
import subprocess
import sys
import threading
import webbrowser

# Автоустановка Flask при необходимости
try:
    from flask import Flask, render_template, request, jsonify
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "flask"])
    from flask import Flask, render_template, request, jsonify

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
PHOTOS_DIR = os.path.join(STATIC_DIR, "photos")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
VOTES_FILE = os.path.join(BASE_DIR, "votes.txt")

# Автоматическое создание нужных папок и тестовых картинок, чтобы не было FileNotFoundError
os.makedirs(PHOTOS_DIR, exist_ok=True)
if not any(f.lower().endswith((".jpg", ".jpeg", ".png")) for f in os.listdir(PHOTOS_DIR)):
    # Минимальный валидный 1x1 PNG в байтах для 3 стартовых карточек
    sample_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
        b"\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    for name in ("photo_1.png", "photo_2.png", "photo_3.png"):
        with open(os.path.join(PHOTOS_DIR, name), "wb") as img_f:
            img_f.write(sample_png)

app = Flask(__name__, template_folder=TEMPLATES_DIR, static_folder=STATIC_DIR)


def load_votes():
    try:
        with open(VOTES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_votes(votes):
    with open(VOTES_FILE, "w", encoding="utf-8") as f:
        json.dump(votes, f, ensure_ascii=False, indent=2)


def get_photos():
    return [
        filename
        for filename in os.listdir(PHOTOS_DIR)
        if filename.lower().endswith((".jpg", ".jpeg", ".png"))
    ]


@app.route("/")
def index():
    photos = get_photos()
    votes = load_votes()
    return render_template("index.html", photos=photos, votes=votes)


@app.route("/vote", methods=["POST"])
def vote():
    photo_id = request.form.get("photo_id")
    votes = load_votes()
    if photo_id:
        votes[photo_id] = votes.get(photo_id, 0) + 1
        save_votes(votes)
    return jsonify(votes)


@app.route("/results")
def results():
    votes = load_votes()
    return render_template("results.html", votes=votes)


def find_free_port(start_port=5000):
    for port in range(start_port, start_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return start_port


if __name__ == "__main__":
    try:
        port = find_free_port(5000)
        url = f"http://127.0.0.1:{port}/"
        print(f"\n[+] Сервер запущено: {url}\n")
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
        app.run(host="127.0.0.1", port=port, debug=False)
    except Exception as err:
        print(f"\n[ПОМИЛКА]: {err}")
    finally:
        input("\nНатисніть Enter для виходу...")