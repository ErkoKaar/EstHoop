"""
Uudiskiri "Eestlased välismaal": liitumine kinnituslingiga ja Resendi kontaktid.

Tellijad ja loobumised elavad Resendis (kontaktid ühes segmendis), oma tabelit pole.
Nädalakirja saadab send_newsletter.py.

Kinnituslink kannab HMAC-allkirjaga aadressi ja ajatemplit, seega ootel tellimusi ei
pea kuhugi salvestama. Link viib esiotsa lehele /uudiskiri, kus tellimus kinnitatakse
nupuvajutusega. Pelgalt lingi avamine ei kinnita: e-posti turvaskännerid avavad
lingid ise ja liidaksid aadressi omaniku teadmata.

Keskkonnamuutujad: RESEND_API_KEY, RESEND_SEGMENT_ID, NEWSLETTER_SECRET,
TURNSTILE_SECRET_KEY, valikuliselt NEWSLETTER_FROM.
"""
import base64
import hashlib
import hmac
import html
import os
import re
import time
from urllib.parse import quote

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

RESEND_API = "https://api.resend.com"
TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
SITE_URL = "https://esthoop.ee"
FROM = os.environ.get("NEWSLETTER_FROM") or "EstHoop <uudiskiri@esthoop.ee>"
TIMEOUT = 15
TOKEN_TTL = 3 * 86400
# Ei püüa RFC-d järgi teha: aadressi kehtivuse otsustab kinnituskiri ise
EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
SUBSCRIBE_ENV = ("RESEND_API_KEY", "RESEND_SEGMENT_ID", "NEWSLETTER_SECRET", "TURNSTILE_SECRET_KEY")

router = APIRouter(prefix="/newsletter")


def env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Keskkonnamuutuja {name} puudub")
    return value


def resend(method: str, path: str, **kwargs) -> requests.Response:
    # Ilma User-Agent päiseta vastab Resend 403-ga
    return requests.request(
        method, f"{RESEND_API}{path}",
        headers={"Authorization": f"Bearer {env('RESEND_API_KEY')}", "User-Agent": "esthoop/1.0"},
        timeout=TIMEOUT, **kwargs,
    )


def raise_for(r: requests.Response) -> requests.Response:
    if not r.ok:
        raise RuntimeError(f"Resend {r.request.method} {r.url} -> {r.status_code}: {r.text[:300]}")
    return r


# ── Kinnitustoken ─────────────────────────────────────────────────────────────

def _sign(payload: str) -> str:
    return hmac.new(env("NEWSLETTER_SECRET").encode(), payload.encode(), hashlib.sha256).hexdigest()


def make_token(email: str, now: float | None = None) -> str:
    payload = f"{email}|{int(now if now is not None else time.time())}"
    encoded = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    return f"{encoded}.{_sign(payload)}"


def read_token(token: str, now: float | None = None) -> str | None:
    """Tokenist e-posti aadress. None, kui allkiri ei klapi või link on aegunud."""
    if len(token) > 1024:
        return None
    encoded, _, signature = token.partition(".")
    try:
        payload = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)).decode()
        email, issued = payload.rsplit("|", 1)
        issued = int(issued)
    except ValueError:  # ka binascii.Error ja UnicodeDecodeError
        return None
    # Baitidena: str-ide võrdlus viskab mitte-ASCII sisendi peale TypeErrori
    if not hmac.compare_digest(signature.encode(), _sign(payload).encode()):
        return None
    if (now if now is not None else time.time()) - issued > TOKEN_TTL:
        return None
    return email


# ── Resendi kontaktid ─────────────────────────────────────────────────────────

def add_contact(email: str) -> None:
    """Lisab kinnitatud aadressi uudiskirja segmenti.

    Olemasolev kontakt (kordne kinnitus või varem loobunud aadress) märgitakse
    uuesti tellijaks ja lisatakse segmenti, kui ta seal veel pole.
    """
    segment = env("RESEND_SEGMENT_ID")
    path = f"/contacts/{quote(email, safe='')}"

    r = resend("PATCH", path, json={"unsubscribed": False})
    if r.status_code == 404:
        raise_for(resend("POST", "/contacts", json={
            "email": email, "unsubscribed": False, "segments": [{"id": segment}],
        }))
        return
    raise_for(r)

    current = raise_for(resend("GET", f"{path}/segments")).json().get("data") or []
    if not any(s.get("id") == segment for s in current):
        raise_for(resend("POST", f"{path}/segments/{segment}"))


# ── Kinnituskiri ──────────────────────────────────────────────────────────────

def _confirm_email(link: str) -> dict:
    href = html.escape(link, quote=True)
    body = f"""\
<!doctype html>
<html lang="et">
<body style="margin:0;padding:0;background:#f3f5f8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f8;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;">
        <tr><td style="padding:32px 28px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;font-size:16px;line-height:1.6;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0072ce;">EstHoop</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#08060d;">Kinnita uudiskirja tellimus</h1>
          <p style="margin:0 0 24px;">Sellele aadressile telliti EstHoopi nädalakiri "Eestlased välismaal": iga esmaspäev möödunud nädala klubimängud ja parimad sooritused.</p>
          <p style="margin:0 0 24px;">
            <a href="{href}" style="display:inline-block;background:#0072ce;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:8px;">Kinnitan tellimuse</a>
          </p>
          <p style="margin:0;font-size:14px;color:#6b7280;">Link kehtib 3 päeva. Kui sa ise ei tellinud, ei pea midagi tegema: ilma kinnituseta sulle kirju ei saadeta.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    text = (
        "Kinnita EstHoopi uudiskirja tellimus\n\n"
        "Sellele aadressile telliti EstHoopi nädalakiri \"Eestlased välismaal\".\n"
        f"Kinnitamiseks ava link: {link}\n\n"
        "Link kehtib 3 päeva. Kui sa ise ei tellinud, ei pea midagi tegema."
    )
    return {"subject": "Kinnita EstHoopi uudiskirja tellimus", "html": body, "text": text}


def _turnstile_ok(token: str) -> bool:
    try:
        r = requests.post(
            TURNSTILE_VERIFY,
            data={"secret": env("TURNSTILE_SECRET_KEY"), "response": token},
            timeout=TIMEOUT,
        )
        return bool(r.json().get("success"))
    except (requests.RequestException, ValueError):
        return False


# ── Endpointid ────────────────────────────────────────────────────────────────

class SubscribeIn(BaseModel):
    email: str
    turnstileToken: str


class ConfirmIn(BaseModel):
    token: str


def _check_configured():
    missing = [name for name in SUBSCRIBE_ENV if not os.environ.get(name, "").strip()]
    if missing:
        print(f"Uudiskiri: puuduvad keskkonnamuutujad {', '.join(missing)}")
        raise HTTPException(status_code=503, detail="Uudiskiri pole veel kasutusel.")


@router.post("/subscribe", status_code=202)
def subscribe(body: SubscribeIn):
    _check_configured()
    email = body.email.strip().lower()
    if len(email) > 254 or not EMAIL_RE.fullmatch(email):
        raise HTTPException(status_code=400, detail="Kontrolli e-posti aadressi.")
    token = body.turnstileToken.strip()
    if not token or len(token) > 2048 or not _turnstile_ok(token):
        raise HTTPException(status_code=400, detail="Robotikontroll ebaõnnestus. Proovi uuesti.")

    link = f"{SITE_URL}/uudiskiri?token={make_token(email)}"
    try:
        raise_for(resend("POST", "/emails", json={"from": FROM, "to": [email], **_confirm_email(link)}))
    except (RuntimeError, requests.RequestException) as e:
        print(f"Uudiskiri: kinnituskiri ebaõnnestus: {e}")
        raise HTTPException(status_code=502, detail="Kinnituskirja saatmine ebaõnnestus. Proovi hiljem uuesti.")
    return {"ok": True}


@router.post("/confirm")
def confirm(body: ConfirmIn):
    _check_configured()
    email = read_token(body.token.strip())
    if not email:
        raise HTTPException(status_code=400, detail="Kinnituslink on aegunud või vigane. Liitu uuesti.")
    try:
        add_contact(email)
    except (RuntimeError, requests.RequestException) as e:
        print(f"Uudiskiri: kontakti lisamine ebaõnnestus: {e}")
        raise HTTPException(status_code=502, detail="Tellimuse kinnitamine ebaõnnestus. Proovi hiljem uuesti.")
    return {"ok": True}
