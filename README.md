# OPENLAB TRUSTX – AI-Assisted Campus Resource Governance & Trust Platform

> **A 100% Pure-Software Architecture for Unlocking Underutilized Campus Equipment & Specialized Facilities via Cryptographic Identity, Algorithmic Fair-Share Queuing, Dual-Sided Digital Handover, and Tamper-Evident SHA-256 Audit Chains.**

---

## 1. Executive Summary & Problem Solved

Higher education and research institutions invest tens of millions of dollars annually into specialized capital assets—ranging from 8-GPU deep learning clusters ($240k) and 5-axis CNC mills ($38k) to GHz mixed-signal oscilloscopes and industrial 3D printers. 

Despite overwhelming student and researcher demand, these critical assets routinely experience **catastrophic underutilization, idling between 60% and 75% of available operating hours**. 

Previous attempts attempted to solve this with physical hardware (IoT power relays, smart locks, RFID turnstiles). However, root-cause analysis demonstrates that **institutional equipment sits dark due to digital, administrative, and trust breakdowns**:
1. **Defensive Custodian Gatekeeping:** Custodians face 100% downside for broken machinery and 0% reward for sharing, so they lock facilities behind informal favoritism.
2. **Untrained Operators:** No programmatic check that users hold valid safety certificates.
3. **Resource Monopolization & Ghost Bookings:** Seniors bulk-reserve prime calendar slots with zero opportunity cost, leading to a **28%–38% phantom reservation rate**.
4. **The Asymmetric Handover Blackbox:** When machine damage occurs, absence of pre/post-use condition records triggers insoluble blame disputes.
5. **Blind CapEx Duplication:** Major universities waste **\$2.4M to \$6.8M annually** procuring redundant equipment across adjacent departments because sharing mechanisms do not exist.

**OPENLAB TRUSTX** delivers a **pure-software governance protocol** that eliminates administrative friction, enforces mathematical fairness, captures photographic condition escrow, and seals an unalterable SHA-256 audit log—requiring zero hardware dongles or proprietary sensors.

---

## 2. Six Core Modules

```
+----------------------------------------------------------------------------------------------------+
|                                    OPENLAB TRUSTX CORE ARCHITECTURE                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [A] TrustPass            [B] FairShare AI            [C] ProofHandover                            |
|   - Digital Skill Passport - Algorithmic Fair Booking   - Condition Photographic Escrow            |
|   - Competency Badging     - Dynamic Weekly Quotas      - Structured Checkpoint Attestation        |
|   - Expiry Tracking        - Ghost Slot Recovery Engine - Mutual Counter-Sign Handover             |
|                                                                                                    |
|  [D] TrustLedger          [E] Resource Radar          [F] Smart Utilization                        |
|   - SHA-256 Chained Blocks - Federated Asset Index      - Real-Time Fleet KPIs                     |
|   - Tamper Detection Tool  - Cross-Silo Discovery       - CapEx Duplication Radar                  |
|   - Cryptographic Integrity- Smart Alternative Finder   - Explainable AI Recommendations           |
+----------------------------------------------------------------------------------------------------+
```

### A. TrustPass – Digital Skill Passport
* **Student Identity & Badge Registry:** Programmatic validation of user competency tiers (e.g., `GPU-CLUSTER-CERT`, `CNC-5AXIS-SAFETY`, `RF-LAB-SAFETY`).
* **Certificate Expiry Tracking:** Pre-flight checks guarantee expired safety qualifications are rejected prior to booking.
* **Custodian Approval Queue:** Custodians review uploaded waivers, inspect certificates, and counter-sign badges.
* **Unauthorized Access Blocker:** Students cannot claim or operate high-risk machinery without active verified credentials.

### B. FairShare AI – Intelligent Fair Booking
* **Dynamic Fairness Score (1.0 to 10.0):** Prioritizes students with fewer past opportunities and low weekly consumption using the mathematical decay formula:
  $$\text{FairnessScore} = \text{clamp}\Big(10.0 - (\text{HoursUsed} \times 0.6) - (\text{NoShows} \times 1.8) + \text{TrustReward}, 1.0, 10.0\Big)$$
* **Dynamic Booking Quotas & Concurrency Caps:** High-trust students unlock up to 14 hrs/week and 3 concurrent slots; students with infractions are throttled to 4 hrs/week and 1 concurrent slot.
* **Ghost Slot Recovery Engine:** Digital check-in deadline ($t_{\text{start}} + \text{window}$). If a student fails to check in digitally, the system slashes their TrustScore (-15), marks the slot `NO_SHOW_RELEASED`, and automatically awards the reservation to the top-ranked waitlisted student!

### C. ProofHandover – Digital Equipment Inspection
* **Dual-Sided Condition Escrow:** Outgoing users submit photographic evidence and structured condition checklists upon finishing; incoming users verify the machine state before counter-signing custody.
* **Structured Checkpoints:** Cleanliness, spindle zero calibration, safety guards, and consumables.
* **Dispute Adjudication:** Pinpoints damage liability to the exact user window, eliminating custodian fear of unaccounted breakage.

### D. TrustLedger – Tamper-Evident Audit System
* **SHA-256 Hash Chaining:** Every booking, check-in, inspection, cancellation, and dispute creates an immutable record referencing the previous block's SHA-256 hash.
* **Verification Dashboard:** Traverses the entire audit log, confirming that sequence numbers and hash links are contiguous from the Genesis block (`0x000...000`).
* **Tamper Simulation Engine:** Built-in interactive test allowing judges to intentionally alter database records to observe TrustLedger instantly detecting and locating the compromised record!

### E. Campus Resource Radar
* **Federated Cross-Campus Discovery:** Search specialized hardware across Computer Science, Mechanical Engineering, and Precision Electronics.
* **Smart Alternative Finder:** Suggests equivalent equipment in adjacent departments when a target machine is booked or requires unheld qualifications.

### F. Smart Utilization Intelligence
* **Institutional Executive Dashboard:** Live computed utilization percentages, idle equipment hours, and maintenance costs.
* **CapEx Duplication Radar:** Identifies adjacent departments owning underutilized machinery in the same category, computing concrete cost savings (e.g., saving \$120,000–\$240,000 in duplicate procurements).
* **Actionable AI Recommendations:** Explainable, data-driven suggestions derived directly from live application records.

---

## 3. Technology Stack

- **Backend:** Python FastAPI, SQLAlchemy 2.0 (ORM), Pydantic v2 (Validation), Bcrypt (Password Hashing), PyJWT (Authentication), SQLite / PostgreSQL compatibility.
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React icons, Recharts (Visual Analytics).
- **Security:** JWT Bearer authentication, role-based authorization gates, canonical JSON SHA-256 cryptographic chaining, secure multipart file uploads.

---

## 4. User Personas & Demo Login Credentials

The application includes a **Universal One-Click Role Switcher** in the top navigation bar, enabling instantaneous switching between all three primary stakeholders:

| Role | Persona Name | Email | Password | Standing / Role Overview |
| :--- | :--- | :--- | :--- | :--- |
| **STUDENT** | Alex Chen | `alex.chen@campus.edu` | `password123` | High TrustScore (95), GPU & SLA 3D certified, 0 no-shows, clean record. |
| **STUDENT** | Priya Sharma | `priya.sharma@campus.edu` | `password123` | Fairness (8.1), 5-Axis CNC lead operator, Formula SAE car team. |
| **STUDENT** | Jordan Taylor | `jordan.taylor@campus.edu` | `password123` | TrustScore (70), 1 past no-show penalty on record (Probation Demo). |
| **LAB CUSTODIAN** | Dr. Marcus Vance | `marcus.vance@campus.edu` | `password123` | Manages CSAI DGX H100 cluster, reviews & approves student badges. |
| **LAB CUSTODIAN** | Sarah Jenkins | `sarah.jenkins@campus.edu` | `password123` | Manages CNC Mills & Laser Cutters, adjudicates damage disputes. |
| **ADMIN / DEAN** | Dean Eleanor Wright | `eleanor.wright@campus.edu` | `password123` | Reviews Institutional CapEx Duplication Radar & Tamper-Evident Ledger. |

---

## 5. Quick Start Instructions (PowerShell / Windows)

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ (Tested on Node.js v24)
- Git

### Step 1: Clone and Navigate to Repository
```powershell
cd "c:\Users\abish\Desktop\openlab protocol\openlab-protocol"
```

### Step 2: Run Backend Server
In your first terminal:
```powershell
# Run the FastAPI server directly
python backend/main.py
```
*The database (`openlab_trustx.db`) is automatically generated and populated with realistic demo departments, 10 equipment assets, student passports, and SHA-256 audit logs upon initial launch.*

Backend API will be live at: **`http://127.0.0.1:8000`**  
Interactive Swagger Docs at: **`http://127.0.0.1:8000/docs`**

### Step 3: Run Frontend Application
In a second terminal:
```powershell
cd frontend
npm run dev
```

Frontend application will be live at: **`http://localhost:5173`**

---

## 6. End-to-End Verification & Test Suite

The repository includes a comprehensive automated test suite verifying all 6 governance modules:
```powershell
python -m pytest backend/tests/test_trustx.py
```

### Test Results Summary:
```
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.2.0, pluggy-1.7.0
collected 8 items

backend/tests/test_trustx.py ........                                    [100%]

============================== 8 passed in 5.03s ==============================
```

Verified Test Scenarios:
1. `test_health_check`: Validates API health and pure-software architectural flags.
2. `test_auth_login`: Validates Bcrypt credential verification and JWT token issuance.
3. `test_trustpass_profile`: Validates student skill passport, dynamic TrustScore, and badge registry.
4. `test_equipment_resource_radar`: Validates equipment cataloging and cross-department category filtering.
5. `test_eligibility_and_booking`: Validates pre-flight prerequisite verification and slot creation.
6. `test_trustledger_cryptographic_verification`: Confirms SHA-256 block hash chaining from Genesis block.
7. `test_trustledger_tamper_detection`: Simulates database tampering, verifies immediate detection of compromised block, and confirms successful cryptographic re-sealing.
8. `test_smart_utilization_analytics`: Validates institutional KPI computation, utilization rates, and CapEx duplication detection.

---

## 7. Interactive Feature Walkthrough Guide

1. **Test Pre-Flight Eligibility (TrustPass):**
   - Switch to **Jordan Taylor** using the top Role Switcher.
   - Navigate to **Resource Radar** and select the *NVIDIA DGX H100*.
   - Click **Reserve Slot**: Notice the system prevents booking because Jordan lacks the `GPU-CLUSTER-CERT` badge.
   - Click **Smart Alternatives**: The system recommends equivalent high-GPU workstations in adjacent labs!

2. **Test Ghost Slot Recovery (FairShare AI):**
   - Navigate to **FairShare Bookings**.
   - Notice the upcoming and active bookings.
   - Click **"Run Ghost Slot Recovery"**: The background engine scans for unconfirmed reservations, automatically slashes the no-show user's TrustScore (-15), frees the slot, and awards it to the highest-priority student on the waitlist!

3. **Test Condition Escrow (ProofHandover):**
   - Navigate to **ProofHandover**.
   - Inspect the side-by-side **Condition Escrow Vault**: View the pre-use photograph and operational checklist compared against the post-use return state.
   - Upload a new condition photo and submit an inspection.

4. **Test Cryptographic Tamper Detection (TrustLedger):**
   - Navigate to **TrustLedger Audit**.
   - Notice the green banner: `CRYPTOGRAPHIC INTEGRITY: 100% VERIFIED SECURE`.
   - Click **"Simulate DB Tamper"**: Simulates a rogue admin retroactively editing an audit payload.
   - Notice the banner immediately flashes red: `SECURITY COMPROMISED: UNAUTHORIZED TAMPER DETECTED AT BLOCK #X`.
   - Click **"Re-Seal Chain"**: Cryptographically repairs and anchors the chain back to certified green status!

5. **Test CapEx Duplication Radar (Smart Intelligence):**
   - Switch to **Dean Eleanor Wright**.
   - Navigate to **Smart Intelligence**.
   - Review the **Resource Sharing Intelligence: Duplicate CapEx Detection** section: Identifies parallel machine purchases across Computer Science and Precision Electronics, projecting **\$108,000+** in avoidable expenditures through OpenLab federation.

---

## 8. API Endpoint Reference

| HTTP Method | Route | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Student/Staff onboarding | Public |
| `POST` | `/api/auth/login` | JWT credential authentication | Public |
| `GET` | `/api/auth/me` | Current profile & fairness state | Authenticated |
| `POST` | `/api/auth/switch-demo-user` | One-click persona switcher | Public |
| `GET` | `/api/trustpass/my-passport` | Digital Skill Passport & Badges | Student |
| `POST` | `/api/trustpass/credentials` | Submit training certificate | Student |
| `GET` | `/api/trustpass/credentials/pending` | Review queue for certificates | Custodian / Admin |
| `POST` | `/api/trustpass/credentials/{id}/approve` | Grant qualification badge | Custodian / Admin |
| `GET` | `/api/trustpass/verify-eligibility/{id}` | Pre-flight qualification check | Authenticated |
| `GET` | `/api/equipment` | Search & filter campus resources | Public |
| `GET` | `/api/equipment/{id}/alternatives` | Cross-department alternative finder | Authenticated |
| `POST` | `/api/bookings` | Create fair-share reservation | Authenticated |
| `POST` | `/api/bookings/{id}/check-in` | Digital check-in attestation | Student |
| `POST` | `/api/bookings/auto-release-ghosts` | Ghost Slot Recovery execution | Authenticated |
| `POST` | `/api/handover/upload-photo` | Store inspection photograph | Authenticated |
| `POST` | `/api/handover/inspect` | Attest pre/post-use condition | Authenticated |
| `GET` | `/api/handover/booking/{id}` | Side-by-side condition escrow | Authenticated |
| `GET` | `/api/ledger/events` | SHA-256 chained event log | Authenticated |
| `GET` | `/api/ledger/verify` | Full cryptographic integrity check | Authenticated |
| `POST` | `/api/ledger/simulate-tamper` | Demo database tampering tool | Admin / Custodian |
| `POST` | `/api/ledger/repair` | Cryptographic chain re-anchoring | Admin |
| `GET` | `/api/analytics/dashboard` | CapEx & utilization intelligence | Authenticated |

---

## 9. Architectural Compliance Note

**OpenLab TrustX** strictly complies with the **100% Pure Software Mandate**:
- Zero external IoT plugs, microcontrollers, smart locks, or RFID readers required.
- Accessible from any web browser or mobile phone without specialized hardware installations.
- Institutional auditability guaranteed through mathematical SHA-256 hash chaining.
