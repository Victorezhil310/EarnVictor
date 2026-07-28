import os
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EarnVictor Backend API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase REST Client config
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bgpjiufwfrffibcbyjlh.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncGppdWZ3ZnJmZmliY2J5amxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDU4MzIsImV4cCI6MjEwMDc4MTgzMn0.vJ6yVUYfoH_U7287KvTNGi9vjr1Xm7GefVJLkOhIWNQ")

class SupabaseRESTClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }

    def select(self, table: str, params: dict = None):
        r = requests.get(f"{self.url}/rest/v1/{table}", headers=self.headers, params=params)
        r.raise_for_status()
        return r.json()

    def update(self, table: str, data: dict, params: dict):
        headers = {**self.headers, "Prefer": "return=representation"}
        r = requests.patch(f"{self.url}/rest/v1/{table}", headers=headers, json=data, params=params)
        r.raise_for_status()
        return r.json()

    def insert(self, table: str, data: dict):
        headers = {**self.headers, "Prefer": "return=representation"}
        r = requests.post(f"{self.url}/rest/v1/{table}", headers=headers, json=data)
        r.raise_for_status()
        return r.json()

# Instantiate client
db = SupabaseRESTClient(SUPABASE_URL, SUPABASE_KEY)

# PIN verification model
class PinLogin(BaseModel):
    pin: str

class VerifyDomainRequest(BaseModel):
    property_id: str
    url: str

class AdEventRequest(BaseModel):
    zone_id: str
    event_type: str
    ip_address: str = "127.0.0.1"
    user_agent: str = ""

@app.get("/")
def home():
    return {"status": "running", "app": "EarnVictor API Server"}

# Owner PIN validation
@app.post("/api/owner-login")
def owner_login(data: PinLogin):
    if data.pin == "20032004":
        return {"status": "success", "token": "ev_owner_secure_session_2026_2100", "role": "owner"}
    else:
        raise HTTPException(status_code=401, detail="Invalid Owner Access PIN")

# Automated Website/App verification
@app.post("/api/verify-property")
def verify_property(data: VerifyDomainRequest):
    prop_id = data.property_id
    target_url = data.url
    
    if not target_url.startswith("http://") and not target_url.startswith("https://"):
        target_url = "https://" + target_url

    # Fetch token from Database
    try:
        prop_data = db.select("properties", {"id": f"eq.{prop_id}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database read failed: {str(e)}")
        
    if not prop_data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db_prop = prop_data[0]
    verification_token = db_prop["verification_token"]

    verified = False
    error_msg = ""
    
    # Method 1: HTML Scrape
    try:
        response = requests.get(target_url, timeout=10, headers={"User-Agent": "EarnVictor-Verification-Bot/1.0"})
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            meta_tag = soup.find('meta', attrs={'name': 'earnvictor-verification'})
            if meta_tag and meta_tag.get('content') == verification_token:
                verified = True
            
            # Fallback: scan whole HTML text
            if not verified and verification_token in response.text:
                verified = True
    except Exception as e:
        error_msg = f"Failed to fetch homepage: {str(e)}"

    # Method 2: Text file check
    if not verified:
        try:
            txt_url = target_url.rstrip("/") + "/earnvictor-verify.txt"
            txt_response = requests.get(txt_url, timeout=10, headers={"User-Agent": "EarnVictor-Verification-Bot/1.0"})
            if txt_response.status_code == 200 and verification_token in txt_response.text:
                verified = True
        except Exception as e:
            if not error_msg:
                error_msg = f"Failed to read verify.txt: {str(e)}"

    try:
        if verified:
            # Update database status to verified
            db.update("properties", {"status": "verified"}, {"id": f"eq.{prop_id}"})
            return {"status": "success", "message": "Property verified successfully!"}
        else:
            rejection_reason = error_msg if error_msg else "Verification token not found on the page or in /earnvictor-verify.txt"
            db.update("properties", {"status": "rejected", "rejection_reason": rejection_reason}, {"id": f"eq.{prop_id}"})
            return {
                "status": "failed",
                "message": "Verification failed.",
                "reason": rejection_reason
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

# Serve Dynamic Ad Tag Script
@app.get("/api/ad-serve")
def ad_serve(zone_id: str = Query(..., description="ID of the ad zone")):
    js_code = f"""
    (function() {{
        console.log("EarnVictor Loaded: Zone " + "{zone_id}");
        
        var style = document.createElement('style');
        style.innerHTML = `
            .ev-ad-container {{
                font-family: 'Outfit', sans-serif;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border: 1px solid rgba(255,255,255,0.1);
                background: linear-gradient(135deg, #1e1b4b, #311042);
                color: #ffffff;
                padding: 16px;
                max-width: 350px;
                text-align: center;
                margin: 15px auto;
                position: relative;
                transition: all 0.3s ease;
            }}
            .ev-ad-container:hover {{
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
            }}
            .ev-ad-badge {{
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid rgba(16, 185, 129, 0.4);
            }}
            .ev-ad-title {{
                font-size: 16px;
                font-weight: 700;
                margin-top: 12px;
                margin-bottom: 6px;
                color: #f3f4f6;
            }}
            .ev-ad-desc {{
                font-size: 12px;
                color: #d1d5db;
                margin-bottom: 15px;
                line-height: 1.4;
            }}
            .ev-ad-btn {{
                background: linear-gradient(90deg, #8b5cf6, #ec4899);
                color: #ffffff;
                border: none;
                border-radius: 6px;
                padding: 8px 20px;
                font-size: 13px;
                font-weight: bold;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                transition: opacity 0.2s;
            }}
            .ev-ad-btn:hover {{
                opacity: 0.9;
            }}
        `;
        document.head.appendChild(style);

        var adDiv = document.createElement('div');
        adDiv.className = 'ev-ad-container';
        adDiv.innerHTML = `
            <span class="ev-ad-badge">Ads by EarnVictor</span>
            <div class="ev-ad-title">Play EarnVictor Mini-Games!</div>
            <div class="ev-ad-desc">Monetize your websites, apps, and Telegram channels with up to 95% revenue share. Instant payouts in USD/INR.</div>
            <a href="https://earnvictor.com/signup" target="_blank" class="ev-ad-btn" id="ev-ad-link-${zone_id}">Join EarnVictor Now</a>
        `;

        var scriptTag = document.querySelector('script[data-zone="{zone_id}"]');
        if (scriptTag && scriptTag.parentNode) {{
            scriptTag.parentNode.insertBefore(adDiv, scriptTag.nextSibling);
        }} else {{
            document.body.appendChild(adDiv);
        }}

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:8000/api/ad-event", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({{
            zone_id: "{zone_id}",
            event_type: "impression",
            ip_address: "ClientIP",
            user_agent: navigator.userAgent
        }}));

        var adLink = document.getElementById("ev-ad-link-${zone_id}");
        if (adLink) {{
            adLink.addEventListener("click", function() {{
                var clickXhr = new XMLHttpRequest();
                clickXhr.open("POST", "http://localhost:8000/api/ad-event", true);
                clickXhr.setRequestHeader("Content-Type", "application/json");
                clickXhr.send(JSON.stringify({{
                    zone_id: "{zone_id}",
                    event_type: "click",
                    ip_address: "ClientIP",
                    user_agent: navigator.userAgent
                }}));
            }});
        }}
    }})();
    """
    from fastapi.responses import Response
    return Response(content=js_code, media_type="application/javascript")

# Log impressions and clicks securely & update balance
@app.post("/api/ad-event")
def log_ad_event(event: AdEventRequest):
    zone_id = event.zone_id
    event_type = event.event_type
    
    try:
        # 1. Fetch zone details
        zone_data = db.select("zones", {"id": f"eq.{zone_id}"})
        if not zone_data:
            raise HTTPException(status_code=404, detail="Ad zone not found")
        zone = zone_data[0]
        property_id = zone["property_id"]
        cpm_rate = float(zone["cpm_rate"])
        
        # 2. Fetch property and publisher details
        prop_data = db.select("properties", {"id": f"eq.{property_id}"})
        if not prop_data:
            raise HTTPException(status_code=404, detail="Property not found")
        property_data = prop_data[0]
        
        # If the property isn't verified, ads shouldn't track real earnings
        if property_data["status"] != "verified":
             return {"status": "ignored", "reason": "Property is not verified yet"}

        publisher_id = property_data["publisher_id"]

        # 3. Read settings
        settings_data = db.select("settings")
        settings_dict = {item["key"]: item["value"] for item in settings_data}
        
        commission_rate = float(settings_dict.get("owner_commission_rate", "0.20"))
        usd_to_inr = float(settings_dict.get("default_usd_to_inr", "83.50"))

        # Calculate earnings
        base_rev_usd = 0.0
        if event_type == "impression":
            base_rev_usd = cpm_rate / 1000.0
        elif event_type == "click":
            base_rev_usd = (cpm_rate / 1000.0) * 1.5

        owner_commission_usd = base_rev_usd * commission_rate
        publisher_revenue_usd = base_rev_usd - owner_commission_usd
        publisher_revenue_inr = publisher_revenue_usd * usd_to_inr
        
        # 4. Insert log event into DB
        db.insert("ad_events", {
            "zone_id": zone_id,
            "publisher_id": publisher_id,
            "event_type": event_type,
            "ip_address": event.ip_address,
            "user_agent": event.user_agent,
            "revenue_usd": publisher_revenue_usd,
            "revenue_inr": publisher_revenue_inr,
            "owner_commission_usd": owner_commission_usd
        })
        
        # 5. Update user profile balances
        profile_data = db.select("profiles", {"id": f"eq.{publisher_id}"})
        if profile_data:
            profile = profile_data[0]
            new_usd = float(profile["balance_usd"]) + publisher_revenue_usd
            new_inr = float(profile["balance_inr"]) + publisher_revenue_inr
            
            db.update("profiles", {
                "balance_usd": new_usd,
                "balance_inr": new_inr
            }, {"id": f"eq.{publisher_id}"})

        return {
            "status": "success",
            "earned_usd": publisher_revenue_usd,
            "earned_inr": publisher_revenue_inr,
            "commission_usd": owner_commission_usd
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ad event logging failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
