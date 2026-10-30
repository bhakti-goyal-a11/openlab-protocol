import datetime
import os
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
import models
import auth
import trustledger
import fairshare_engine

def seed_database(db: Session):
    # Check if already seeded
    if db.query(models.Department).first():
        print("Database already contains data. Skipping seed.")
        return

    print("Seeding OpenLab TrustX database with realistic institutional demo dataset...")

    # 1. Departments
    csai_dept = models.Department(
        name="Computer Science & AI Research Facility",
        code="CSAI",
        location="Alan Turing Computing Center, Wing 3A"
    )
    mech_dept = models.Department(
        name="Mechanical Engineering & Advanced Prototyping Lab",
        code="MECH",
        location="Engineering Quadrangle Building B, Ground Level"
    )
    elec_dept = models.Department(
        name="Precision Electronics, RF & Micro-Fabrication Lab",
        code="ELEC",
        location="Nikola Tesla Applied Sciences Tower, Suite 210"
    )
    db.add_all([csai_dept, mech_dept, elec_dept])
    db.commit()
    db.refresh(csai_dept)
    db.refresh(mech_dept)
    db.refresh(elec_dept)

    # 2. Users
    pw_hash = auth.hash_password("password123")

    # Students
    alex = models.User(
        email="alex.chen@campus.edu",
        full_name="Alex Chen",
        role="STUDENT",
        department_id=csai_dept.id,
        hashed_password=pw_hash,
        student_id_number="STU-CS-2024-8841",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    )
    priya = models.User(
        email="priya.sharma@campus.edu",
        full_name="Priya Sharma",
        role="STUDENT",
        department_id=mech_dept.id,
        hashed_password=pw_hash,
        student_id_number="STU-ME-2024-6729",
        avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
    )
    jordan = models.User(
        email="jordan.taylor@campus.edu",
        full_name="Jordan Taylor",
        role="STUDENT",
        department_id=elec_dept.id,
        hashed_password=pw_hash,
        student_id_number="STU-EE-2024-3312",
        avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
    )

    # Custodians
    vance = models.User(
        email="marcus.vance@campus.edu",
        full_name="Dr. Marcus Vance",
        role="LAB_CUSTODIAN",
        department_id=csai_dept.id,
        hashed_password=pw_hash,
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    )
    sarah = models.User(
        email="sarah.jenkins@campus.edu",
        full_name="Sarah Jenkins, MSc",
        role="LAB_CUSTODIAN",
        department_id=mech_dept.id,
        hashed_password=pw_hash,
        avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    )

    # Administrator / Dean
    dean = models.User(
        email="eleanor.wright@campus.edu",
        full_name="Dean Eleanor Wright",
        role="ADMIN",
        department_id=csai_dept.id,
        hashed_password=pw_hash,
        avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
    )

    db.add_all([alex, priya, jordan, vance, sarah, dean])
    db.commit()
    for u in [alex, priya, jordan, vance, sarah, dean]:
        db.refresh(u)

    # 3. Fairness Profiles
    alex_fairness = models.FairnessScore(
        user_id=alex.id,
        fairness_score=8.9,
        trust_score=95,
        current_weekly_hours=4.5,
        max_weekly_quota=14.0,
        concurrency_limit=3,
        total_completed_bookings=8,
        no_show_count=0
    )
    priya_fairness = models.FairnessScore(
        user_id=priya.id,
        fairness_score=8.1,
        trust_score=89,
        current_weekly_hours=6.0,
        max_weekly_quota=12.0,
        concurrency_limit=2,
        total_completed_bookings=5,
        no_show_count=0
    )
    jordan_fairness = models.FairnessScore(
        user_id=jordan.id,
        fairness_score=5.4,
        trust_score=70, # Penalized due to 1 past no-show
        current_weekly_hours=2.0,
        max_weekly_quota=6.0,
        concurrency_limit=1,
        total_completed_bookings=2,
        no_show_count=1
    )
    db.add_all([alex_fairness, priya_fairness, jordan_fairness])
    db.commit()

    # 4. Equipment Items (10 High-Value Units)
    eq_list = [
        models.Equipment(
            name="NVIDIA DGX H100 8-GPU Compute Station",
            model_number="DGX-H100-640GB",
            category="Compute & AI",
            department_id=csai_dept.id,
            custodian_id=vance.id,
            status="AVAILABLE",
            replacement_value=240000.0,
            hourly_idle_cost=75.0,
            required_qualification="GPU-CLUSTER-CERT",
            safety_guidelines="Strict quota on multi-node allocation. Monitor temperature and NVLink thermal dissipation under 85C.",
            image_url="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600",
            check_in_window_minutes=15,
            location_room="Turing 302 Server Cluster"
        ),
        models.Equipment(
            name="Tormach 1100MX 5-Axis Precision CNC Mill",
            model_number="1100MX-BT30",
            category="Subtractive Machining",
            department_id=mech_dept.id,
            custodian_id=sarah.id,
            status="AVAILABLE",
            replacement_value=38500.0,
            hourly_idle_cost=55.0,
            required_qualification="CNC-5AXIS-SAFETY",
            safety_guidelines="Always verify tool offsets using touch probe. Eye protection and enclosed safety interlock mandatory.",
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
            check_in_window_minutes=15,
            location_room="Mech Bay B-104"
        ),
        models.Equipment(
            name="Formlabs Form 4 Industrial SLA 3D Printer",
            model_number="FL-FORM4-RESIN",
            category="Rapid Prototyping",
            department_id=mech_dept.id,
            custodian_id=sarah.id,
            status="AVAILABLE",
            replacement_value=18500.0,
            hourly_idle_cost=30.0,
            required_qualification="3D-PRINT-ADVANCED",
            safety_guidelines="Wear nitrile gloves when handling liquid photopolymer resin. Isopropyl alcohol wash tank must remain covered.",
            image_url="https://images.unsplash.com/photo-1631553127988-34863a152345?w=600",
            check_in_window_minutes=20,
            location_room="Prototyping Bay 1"
        ),
        models.Equipment(
            name="Keysight Infiniium 4-Channel 1GHz Mixed Signal Oscilloscope",
            model_number="MSOS104A",
            category="Precision Electronics",
            department_id=elec_dept.id,
            custodian_id=vance.id,
            status="AVAILABLE",
            replacement_value=22000.0,
            hourly_idle_cost=40.0,
            required_qualification="RF-LAB-SAFETY",
            safety_guidelines="Ensure active ESD wrist strap is grounded. Maximum input voltage 50V RMS. Do not exceed channel bandwidth ratings.",
            image_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
            check_in_window_minutes=15,
            location_room="Tesla Suite 210 Station 4"
        ),
        models.Equipment(
            name="NVIDIA RTX 6000 Ada Multi-GPU Workstation",
            model_number="RTX6000-ADA-48GB",
            category="Compute & AI",
            department_id=csai_dept.id,
            custodian_id=vance.id,
            status="AVAILABLE",
            replacement_value=14500.0,
            hourly_idle_cost=35.0,
            required_qualification="GPU-CLUSTER-CERT",
            safety_guidelines="Dedicated for CUDA deep learning fine-tuning and PyTorch model distributed execution.",
            image_url="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600",
            check_in_window_minutes=15,
            location_room="Turing 304 AI Lab"
        ),
        models.Equipment(
            name="Bantam Tools High-Speed Precision PCB Milling Machine",
            model_number="BT-PCB-PRO",
            category="Precision Electronics",
            department_id=elec_dept.id,
            custodian_id=sarah.id,
            status="AVAILABLE",
            replacement_value=16500.0,
            hourly_idle_cost=28.0,
            required_qualification="PCB-MILL-CERT",
            safety_guidelines="Double-sided tape fixturing required. Vacuum spoil-board dust collector must be running at all times.",
            image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
            check_in_window_minutes=15,
            location_room="Tesla Suite 210 Station 1"
        ),
        models.Equipment(
            name="Universal Laser Systems VLS6.60 60W CO2 Laser Cutter",
            model_number="ULS-VLS6.60",
            category="Rapid Prototyping",
            department_id=mech_dept.id,
            custodian_id=sarah.id,
            status="AVAILABLE",
            replacement_value=24000.0,
            hourly_idle_cost=45.0,
            required_qualification="LASER-SAFETY-L2",
            safety_guidelines="Never cut PVC or vinyl materials. Inspect honeycomb bed for flare-ups. Exhaust blower must be verified before firing beam.",
            image_url="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600",
            check_in_window_minutes=15,
            location_room="Prototyping Bay 2"
        ),
        models.Equipment(
            name="Markforged X7 Continuous Carbon Fiber 3D Printer",
            model_number="MF-X7-IND",
            category="Rapid Prototyping",
            department_id=mech_dept.id,
            custodian_id=sarah.id,
            status="AVAILABLE",
            replacement_value=75000.0,
            hourly_idle_cost=60.0,
            required_qualification="3D-PRINT-ADVANCED",
            safety_guidelines="Laser bed leveling inspection required prior to starting continuous fiber strand deposition.",
            image_url="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600",
            check_in_window_minutes=15,
            location_room="Advanced Composites Lab"
        ),
        models.Equipment(
            name="Rohde & Schwarz FSV3030 Signal & Spectrum Analyzer (30 GHz)",
            model_number="R&S-FSV3030",
            category="Precision Electronics",
            department_id=elec_dept.id,
            custodian_id=vance.id,
            status="AVAILABLE",
            replacement_value=82000.0,
            hourly_idle_cost=65.0,
            required_qualification="RF-LAB-SAFETY",
            safety_guidelines="Use torque wrench on 2.92mm precision RF connectors. Calibrate noise floor attenuation before high-power sweep.",
            image_url="https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600",
            check_in_window_minutes=15,
            location_room="Tesla RF Anechoic Chamber"
        ),
        models.Equipment(
            name="Instron 5969 Dual-Column Universal Materials Tensile Tester",
            model_number="INSTRON-5969",
            category="Controlled Lab",
            department_id=mech_dept.id,
            custodian_id=sarah.id,
            status="AVAILABLE",
            replacement_value=95000.0,
            hourly_idle_cost=70.0,
            required_qualification="TENSILE-TEST-L1",
            safety_guidelines="Install polycarbonate shatter shield around test grips. Verify mechanical limit switches before initiating 50kN load cycle.",
            image_url="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600",
            check_in_window_minutes=20,
            location_room="Materials Characterization Lab"
        )
    ]
    db.add_all(eq_list)
    db.commit()
    for eq in eq_list:
        db.refresh(eq)

    # 5. Training Credentials (TrustPass Badges)
    now = datetime.datetime.utcnow()
    one_year_later = now + datetime.timedelta(days=365)
    six_months_ago = now - datetime.timedelta(days=180)

    creds = [
        # Alex Chen credentials
        models.TrainingCredential(
            user_id=alex.id,
            qualification_code="GPU-CLUSTER-CERT",
            title="Accelerated HPC & Multi-GPU Infrastructure Safety",
            issuer_name="AI Center of Excellence",
            status="APPROVED",
            verified_by_id=vance.id,
            issued_at=six_months_ago,
            expires_at=one_year_later,
            notes="Passed written quiz and thermal monitoring exam with 98% score."
        ),
        models.TrainingCredential(
            user_id=alex.id,
            qualification_code="3D-PRINT-ADVANCED",
            title="Industrial SLA/SLS Additive Manufacturing Safety",
            issuer_name="Makerspace Technical Advisory",
            status="APPROVED",
            verified_by_id=sarah.id,
            issued_at=six_months_ago,
            expires_at=one_year_later,
            notes="Certified for Formlabs resin handling and UV post-cure station."
        ),
        # Alex has a PENDING credential for Custodians to review in the UI!
        models.TrainingCredential(
            user_id=alex.id,
            qualification_code="CNC-5AXIS-SAFETY",
            title="5-Axis Precision Subtractive Machining & CAM Offsets",
            issuer_name="Dept of Mechanical Engineering",
            status="PENDING",
            issued_at=now - datetime.timedelta(days=1),
            expires_at=one_year_later,
            proof_document_url="https://example.com/certificates/alex_cnc_completion.pdf",
            notes="Completed 12-hour hands-on workshop with Prof. Miller. Ready for custodian sign-off."
        ),
        # Priya Sharma credentials
        models.TrainingCredential(
            user_id=priya.id,
            qualification_code="CNC-5AXIS-SAFETY",
            title="5-Axis Precision Subtractive Machining & CAM Offsets",
            issuer_name="Dept of Mechanical Engineering",
            status="APPROVED",
            verified_by_id=sarah.id,
            issued_at=six_months_ago,
            expires_at=one_year_later,
            notes="Master of CAM programming; certified lead operator."
        ),
        models.TrainingCredential(
            user_id=priya.id,
            qualification_code="LASER-SAFETY-L2",
            title="Class 4 High-Power Industrial Laser Systems Safety",
            issuer_name="Campus Environmental Health & Safety",
            status="APPROVED",
            verified_by_id=sarah.id,
            issued_at=six_months_ago,
            expires_at=one_year_later,
            notes="Completed optics alignment and emergency suppression protocols."
        ),
        # Jordan Taylor credentials
        models.TrainingCredential(
            user_id=jordan.id,
            qualification_code="RF-LAB-SAFETY",
            title="Microwave RF Instrumentation & Spectrum Analyzer Operations",
            issuer_name="Tesla Center RF Lab Staff",
            status="APPROVED",
            verified_by_id=vance.id,
            issued_at=six_months_ago,
            expires_at=one_year_later,
            notes="Certified for sub-10GHz analyzers."
        ),
        models.TrainingCredential(
            user_id=jordan.id,
            qualification_code="GPU-CLUSTER-CERT",
            title="Accelerated HPC & Multi-GPU Infrastructure Safety",
            issuer_name="Computer Science Faculty",
            status="PENDING",
            issued_at=now - datetime.timedelta(days=2),
            expires_at=one_year_later,
            proof_document_url="https://example.com/certificates/jordan_hpc.pdf",
            notes="Needs access for deep neural DSP audio model training."
        )
    ]
    db.add_all(creds)
    db.commit()

    # 6. Sample Bookings & Handover Inspections
    # Booking 1: Past completed booking by Alex on DGX H100 with ProofHandover
    b1_start = now - datetime.timedelta(days=2, hours=4)
    b1_end = now - datetime.timedelta(days=2, hours=1)
    b1 = models.Booking(
        equipment_id=eq_list[0].id, # DGX H100
        user_id=alex.id,
        start_time=b1_start,
        end_time=b1_end,
        purpose="Fine-tuning Llama-3-8B on institutional robotics telemetry",
        status="COMPLETED",
        check_in_deadline=b1_start + datetime.timedelta(minutes=15),
        checked_in_at=b1_start + datetime.timedelta(minutes=3),
        released_at=b1_end
    )
    db.add(b1)
    db.commit()
    db.refresh(b1)

    # Pre-use and Post-use inspections for Booking 1
    insp1_pre = models.HandoverInspection(
        booking_id=b1.id,
        equipment_id=eq_list[0].id,
        inspector_id=alex.id,
        inspection_type="PRE_USE",
        condition_rating="EXCELLENT",
        checklist_cleanliness=True,
        checklist_calibration=True,
        checklist_safety_guards=True,
        checklist_consumables=True,
        photo_url="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500",
        notes="All 8 SXM5 H100 GPUs reporting clean health check. Ambient temp 21C.",
        created_at=b1_start + datetime.timedelta(minutes=4)
    )
    insp1_post = models.HandoverInspection(
        booking_id=b1.id,
        equipment_id=eq_list[0].id,
        inspector_id=alex.id,
        inspection_type="POST_USE",
        condition_rating="EXCELLENT",
        checklist_cleanliness=True,
        checklist_calibration=True,
        checklist_safety_guards=True,
        checklist_consumables=True,
        photo_url="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500",
        notes="Checkpoints saved to network NAS. GPU memory flushed. Rack powered normal.",
        counter_signed_by_id=vance.id,
        created_at=b1_end
    )
    db.add_all([insp1_pre, insp1_post])
    db.commit()

    # Booking 2: Currently Active Booking by Priya on Tormach CNC Mill
    b2_start = now - datetime.timedelta(minutes=30)
    b2_end = now + datetime.timedelta(hours=2)
    b2 = models.Booking(
        equipment_id=eq_list[1].id, # Tormach CNC
        user_id=priya.id,
        start_time=b2_start,
        end_time=b2_end,
        purpose="Machining aerospace-grade 6061-T6 aluminum suspension bracket for Formula Student car",
        status="IN_PROGRESS",
        check_in_deadline=b2_start + datetime.timedelta(minutes=15),
        checked_in_at=b2_start + datetime.timedelta(minutes=5)
    )
    db.add(b2)
    db.commit()
    db.refresh(b2)

    insp2_pre = models.HandoverInspection(
        booking_id=b2.id,
        equipment_id=eq_list[1].id,
        inspector_id=priya.id,
        inspection_type="PRE_USE",
        condition_rating="GOOD",
        checklist_cleanliness=True,
        checklist_calibration=True,
        checklist_safety_guards=True,
        checklist_consumables=True,
        photo_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500",
        notes="Spindle runout inspected under 0.0002 in. Coolant tank filled with 8% semi-synthetic fluid.",
        created_at=b2_start + datetime.timedelta(minutes=6)
    )
    db.add(insp2_pre)
    db.commit()

    # Booking 3: Upcoming reservation by Alex for Formlabs Form 4
    b3_start = now + datetime.timedelta(hours=3)
    b3_end = now + datetime.timedelta(hours=5)
    b3 = models.Booking(
        equipment_id=eq_list[2].id, # Formlabs Form 4
        user_id=alex.id,
        start_time=b3_start,
        end_time=b3_end,
        purpose="Printing bio-compatible microfluidic test manifold",
        status="RESERVED",
        check_in_deadline=b3_start + datetime.timedelta(minutes=20)
    )
    db.add(b3)
    db.commit()

    # Booking 4: A Past NO_SHOW_RELEASED booking demonstrating FairShare Ghost Slot Slashing
    b4_start = now - datetime.timedelta(days=1, hours=3)
    b4_end = now - datetime.timedelta(days=1, hours=1)
    b4 = models.Booking(
        equipment_id=eq_list[3].id, # Keysight Scope
        user_id=jordan.id,
        start_time=b4_start,
        end_time=b4_end,
        purpose="High-speed differential bus eye diagram capture",
        status="NO_SHOW_RELEASED",
        check_in_deadline=b4_start + datetime.timedelta(minutes=15),
        released_at=b4_start + datetime.timedelta(minutes=16)
    )
    db.add(b4)
    db.commit()

    # 7. Sample Waitlist Entry
    w1 = models.BookingWaitlist(
        equipment_id=eq_list[0].id,
        user_id=jordan.id,
        requested_slot_start=now + datetime.timedelta(days=1, hours=2),
        requested_slot_end=now + datetime.timedelta(days=1, hours=5),
        priority_score=6.2,
        status="WAITING"
    )
    db.add(w1)
    db.commit()

    # 8. Sample Incident / Dispute for Custodians
    inc1 = models.EquipmentIncident(
        equipment_id=eq_list[6].id, # Laser cutter
        reported_by_id=sarah.id,
        description="Minor particulate accumulation on mirror 3 and loose honeycomb guide rail reported during weekly custodian sweep.",
        severity="LOW",
        status="RESOLVED",
        resolution_notes="Mirror cleaned with spectrophotometric methanol and guide re-aligned. Back in production.",
        resolved_by_id=sarah.id,
        resolved_at=now - datetime.timedelta(days=1)
    )
    inc2 = models.EquipmentIncident(
        equipment_id=eq_list[2].id, # Formlabs Form 4
        reported_by_id=jordan.id,
        description="Resin wiper arm jammed midway through previous user cycle. Tray tank requires inspection before new prints.",
        severity="MEDIUM",
        status="OPEN"
    )
    db.add_all([inc1, inc2])
    db.commit()

    # 9. Maintenance Records
    m1 = models.MaintenanceRecord(
        equipment_id=eq_list[0].id,
        technician_name="NVIDIA Enterprise Field Support",
        action_taken="Semi-annual coolant loop replacement and BMC firmware v24.08 update.",
        cost=1850.0,
        scheduled_date=now - datetime.timedelta(days=30),
        completed_date=now - datetime.timedelta(days=29)
    )
    m2 = models.MaintenanceRecord(
        equipment_id=eq_list[1].id,
        technician_name="Tormach Factory Certified Service",
        action_taken="5-axis harmonic drive rotary zero calibration and new spindle collet ring.",
        cost=920.0,
        scheduled_date=now - datetime.timedelta(days=14),
        completed_date=now - datetime.timedelta(days=13)
    )
    db.add_all([m1, m2])
    db.commit()

    # 10. Generate Tamper-Evident SHA-256 Audit Events (TrustLedger)
    print("Generating SHA-256 hash-chained audit events in TrustLedger...")

    seed_events = [
        ("SYSTEM_GENESIS", "genesis@openlab.protocol", None, "System", 0, {
            "version": "1.0.0",
            "protocol": "OPENLAB TRUSTX",
            "standard": "SHA-256 Hash Chained Audit Log",
            "note": "Genesis anchor initialized for institutional equipment governance."
        }),
        ("USER_REGISTERED", "alex.chen@campus.edu", alex.id, "User", alex.id, {
            "email": alex.email,
            "role": alex.role,
            "department": "CSAI",
            "student_id": alex.student_id_number
        }),
        ("USER_REGISTERED", "priya.sharma@campus.edu", priya.id, "User", priya.id, {
            "email": priya.email,
            "role": priya.role,
            "department": "MECH",
            "student_id": priya.student_id_number
        }),
        ("USER_REGISTERED", "marcus.vance@campus.edu", vance.id, "User", vance.id, {
            "email": vance.email,
            "role": "LAB_CUSTODIAN",
            "department": "CSAI"
        }),
        ("CREDENTIAL_APPROVED", "marcus.vance@campus.edu", vance.id, "TrainingCredential", creds[0].id, {
            "credential_id": creds[0].id,
            "user_id": alex.id,
            "qualification_code": "GPU-CLUSTER-CERT",
            "approver": vance.email,
            "status": "APPROVED"
        }),
        ("BOOKING_CREATED", "alex.chen@campus.edu", alex.id, "Booking", b1.id, {
            "booking_id": b1.id,
            "equipment_id": eq_list[0].id,
            "equipment_name": eq_list[0].name,
            "purpose": b1.purpose
        }),
        ("CHECK_IN_CONFIRMED", "alex.chen@campus.edu", alex.id, "Booking", b1.id, {
            "booking_id": b1.id,
            "equipment_id": eq_list[0].id,
            "status": "CHECKED_IN"
        }),
        ("HANDOVER_INSPECTION_SUBMITTED", "alex.chen@campus.edu", alex.id, "HandoverInspection", insp1_pre.id, {
            "inspection_id": insp1_pre.id,
            "booking_id": b1.id,
            "inspection_type": "PRE_USE",
            "condition_rating": "EXCELLENT"
        }),
        ("HANDOVER_INSPECTION_SUBMITTED", "alex.chen@campus.edu", alex.id, "HandoverInspection", insp1_post.id, {
            "inspection_id": insp1_post.id,
            "booking_id": b1.id,
            "inspection_type": "POST_USE",
            "condition_rating": "EXCELLENT",
            "counter_signed_by": vance.email
        }),
        ("GHOST_SLOT_RELEASED", "system@openlab.protocol", None, "Booking", b4.id, {
            "booking_id": b4.id,
            "equipment_name": eq_list[3].name,
            "penalized_user_id": jordan.id,
            "reason": "Digital check-in deadline elapsed without student attestation",
            "trust_penalty": -15
        }),
        ("BOOKING_CREATED", "priya.sharma@campus.edu", priya.id, "Booking", b2.id, {
            "booking_id": b2.id,
            "equipment_id": eq_list[1].id,
            "equipment_name": eq_list[1].name,
            "status": "IN_PROGRESS"
        }),
        ("DISPUTE_FILED", "jordan.taylor@campus.edu", jordan.id, "EquipmentIncident", inc2.id, {
            "incident_id": inc2.id,
            "equipment_id": eq_list[2].id,
            "severity": "MEDIUM",
            "description": inc2.description
        })
    ]

    for ev_type, actor_email, actor_id, entity_type, entity_id, payload in seed_events:
        trustledger.record_audit_event(
            db=db,
            event_type=ev_type,
            actor_email=actor_email,
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload
        )

    print("Seed complete! All database models, demo credentials, and SHA-256 audit logs initialized successfully.")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
