"""
PasseportEtudiant API Tests - New Features (Iteration 2)
Tests for: Leaderboard, Leads/Analytics, Admin endpoints, Class deletion
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ============== LEADERBOARD TESTS ==============
class TestLeaderboard:
    """GET /api/leaderboard - Classes ranked by avg stamps"""
    
    def test_leaderboard_returns_ranked_classes(self):
        """GET /api/leaderboard returns classes with required fields"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least PROF2026 and PROF2026B
        
        # Check required fields
        for row in data:
            assert "code" in row
            assert "school_name" in row
            assert "teacher_name" in row
            assert "students" in row
            assert "stamps" in row
            assert "avg" in row
            assert "rank" in row
        
        # Verify ranking is correct (sorted by avg descending)
        for i in range(len(data) - 1):
            assert data[i]["avg"] >= data[i + 1]["avg"], "Leaderboard should be sorted by avg descending"
        
        # Verify rank numbers are sequential
        for i, row in enumerate(data):
            assert row["rank"] == i + 1, f"Rank should be {i + 1}, got {row['rank']}"
        
        print(f"✓ GET /api/leaderboard returns {len(data)} classes, top: {data[0]['school_name']} with avg {data[0]['avg']}")
    
    def test_leaderboard_contains_demo_classes(self):
        """Leaderboard should contain PROF2026 and PROF2026B"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        codes = [row["code"] for row in data]
        assert "PROF2026" in codes, "PROF2026 should be in leaderboard"
        assert "PROF2026B" in codes, "PROF2026B should be in leaderboard"
        print("✓ Leaderboard contains both demo classes PROF2026 and PROF2026B")


# ============== LEADS/ANALYTICS TESTS ==============
class TestLeads:
    """GET /api/analytics/leads - Qualified leads with filters"""
    
    def test_leads_returns_all_students(self):
        """GET /api/analytics/leads returns students with required fields"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 7  # At least 7 demo students (excluding Théo who is anonymous)
        
        # Check required fields
        for lead in data:
            assert "id" in lead
            assert "name" in lead
            assert "score" in lead
            assert "stamp_count" in lead
            assert "consents" in lead
            assert "filieres" in lead
            assert "class_code" in lead
        
        # Verify sorted by score descending
        for i in range(len(data) - 1):
            assert data[i]["score"] >= data[i + 1]["score"], "Leads should be sorted by score descending"
        
        print(f"✓ GET /api/analytics/leads returns {len(data)} leads, top: {data[0]['name']} with score {data[0]['score']}")
    
    def test_leads_filter_by_filiere(self):
        """GET /api/analytics/leads?filiere=Ingénierie filters correctly"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads?filiere=Ingénierie")
        assert response.status_code == 200
        data = response.json()
        
        # All returned leads should have Ingénierie in filieres
        for lead in data:
            assert "Ingénierie" in lead["filieres"], f"{lead['name']} should have Ingénierie filiere"
        
        # Should include Lucas, Sarah, Hugo (who have Ingénierie)
        names = [lead["name"] for lead in data]
        assert any("Lucas" in n for n in names), "Lucas should be in Ingénierie filter"
        assert any("Sarah" in n for n in names), "Sarah should be in Ingénierie filter"
        assert any("Hugo" in n for n in names), "Hugo should be in Ingénierie filter"
        
        print(f"✓ GET /api/analytics/leads?filiere=Ingénierie returns {len(data)} leads")
    
    def test_leads_filter_by_consent_diplomeo(self):
        """GET /api/analytics/leads?consent=d returns only students with Diplomeo consent"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads?consent=d")
        assert response.status_code == 200
        data = response.json()
        
        # All returned leads should have Diplomeo consent
        for lead in data:
            assert lead["consents"].get("d") == True, f"{lead['name']} should have Diplomeo consent"
        
        # Hugo and Léa should NOT be in results (they don't have Diplomeo consent)
        names = [lead["name"] for lead in data]
        assert not any("Hugo" in n for n in names), "Hugo should NOT be in Diplomeo filter"
        assert not any("Léa" in n for n in names), "Léa should NOT be in Diplomeo filter"
        
        print(f"✓ GET /api/analytics/leads?consent=d returns {len(data)} leads with Diplomeo consent")
    
    def test_leads_filter_by_min_stamps(self):
        """GET /api/analytics/leads?min_stamps=3 filters correctly"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads?min_stamps=3")
        assert response.status_code == 200
        data = response.json()
        
        # All returned leads should have at least 3 stamps
        for lead in data:
            assert lead["stamp_count"] >= 3, f"{lead['name']} should have at least 3 stamps"
        
        # Hugo (2 stamps) and Léa (1 stamp) should NOT be in results
        names = [lead["name"] for lead in data]
        assert not any("Hugo" in n for n in names), "Hugo (2 stamps) should NOT be in min_stamps=3 filter"
        assert not any("Léa" in n for n in names), "Léa (1 stamp) should NOT be in min_stamps=3 filter"
        
        print(f"✓ GET /api/analytics/leads?min_stamps=3 returns {len(data)} leads with >=3 stamps")
    
    def test_leads_combined_filters(self):
        """GET /api/analytics/leads with multiple filters"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads?filiere=Ingénierie&consent=d&min_stamps=3")
        assert response.status_code == 200
        data = response.json()
        
        # All returned leads should match all filters
        for lead in data:
            assert "Ingénierie" in lead["filieres"]
            assert lead["consents"].get("d") == True
            assert lead["stamp_count"] >= 3
        
        print(f"✓ Combined filters return {len(data)} leads")


class TestLeadsCsv:
    """GET /api/analytics/leads.csv - CSV export"""
    
    def test_leads_csv_returns_csv_with_attachment_header(self):
        """GET /api/analytics/leads.csv returns CSV with Content-Disposition attachment"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads.csv")
        assert response.status_code == 200
        
        # Check Content-Type
        assert "text/csv" in response.headers.get("Content-Type", "")
        
        # Check Content-Disposition attachment header
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, "Should have attachment disposition"
        assert "filename=" in content_disp, "Should have filename"
        
        # Check CSV content
        content = response.text
        lines = content.strip().split("\n")
        assert len(lines) >= 2, "CSV should have header + at least 1 data row"
        
        # Check header row
        header = lines[0]
        assert "Nom" in header
        assert "Score" in header
        assert "Tampons" in header
        assert "Consent_Diplomeo" in header
        
        print(f"✓ GET /api/analytics/leads.csv returns CSV with {len(lines) - 1} data rows")
    
    def test_leads_csv_with_filters(self):
        """GET /api/analytics/leads.csv with filters"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads.csv?min_stamps=3")
        assert response.status_code == 200
        
        content = response.text
        lines = content.strip().split("\n")
        
        # All data rows should have stamp count >= 3
        for line in lines[1:]:  # Skip header
            parts = line.split(";")
            stamp_count = int(parts[6])  # Tampons column
            assert stamp_count >= 3, f"CSV row should have >=3 stamps, got {stamp_count}"
        
        print(f"✓ GET /api/analytics/leads.csv?min_stamps=3 returns filtered CSV")


# ============== ADMIN STATS TESTS ==============
class TestAdminStats:
    """GET /api/admin/stats - Admin statistics"""
    
    def test_admin_stats_returns_required_fields(self):
        """GET /api/admin/stats returns students breakdown, stamps, classes, schools"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "students" in data
        assert "stamps" in data
        assert "classes" in data
        assert "schools" in data
        
        # Check students breakdown
        students = data["students"]
        assert "total" in students
        assert "real" in students
        assert "demo" in students
        assert "anonymous" in students
        
        # Verify counts make sense
        assert students["total"] == students["real"] + students["demo"]
        assert students["anonymous"] >= 1  # At least Théo
        assert students["demo"] >= 8  # At least 8 demo students
        assert data["schools"] == 16  # 16 seeded schools
        
        print(f"✓ GET /api/admin/stats: {students['total']} students ({students['demo']} demo, {students['real']} real), {data['stamps']} stamps, {data['classes']} classes")


class TestAdminAllStudents:
    """GET /api/admin/all-students - All students including demo"""
    
    def test_admin_all_students_returns_all_with_stamp_count(self):
        """GET /api/admin/all-students returns all students with stamp_count"""
        response = requests.get(f"{BASE_URL}/api/admin/all-students")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 8  # At least 8 demo students
        
        # Check all students have stamp_count
        for student in data:
            assert "stamp_count" in student
            assert "id" in student
            assert "name" in student
            assert "is_demo" in student
        
        # Verify demo students are included
        ids = [s["id"] for s in data]
        assert "demo-lucas" in ids
        assert "demo-theo" in ids
        assert "demo-emma" in ids
        assert "demo-sarah" in ids
        
        print(f"✓ GET /api/admin/all-students returns {len(data)} students with stamp_count")


class TestAdminAllClasses:
    """GET /api/admin/all-classes - All classes with student_count"""
    
    def test_admin_all_classes_returns_all_with_student_count(self):
        """GET /api/admin/all-classes returns all classes with student_count"""
        response = requests.get(f"{BASE_URL}/api/admin/all-classes")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 2  # At least PROF2026 and PROF2026B
        
        # Check all classes have student_count
        for cls in data:
            assert "student_count" in cls
            assert "code" in cls
            assert "school_name" in cls
            assert "teacher_name" in cls
        
        # Verify demo classes are included
        codes = [c["code"] for c in data]
        assert "PROF2026" in codes
        assert "PROF2026B" in codes
        
        print(f"✓ GET /api/admin/all-classes returns {len(data)} classes with student_count")


# ============== CLASS DELETION TESTS ==============
class TestClassDeletion:
    """DELETE /api/classes/{code} - Class deletion with protection"""
    
    def test_delete_demo_class_prof2026_blocked(self):
        """DELETE /api/classes/PROF2026 returns 403 (protected)"""
        response = requests.delete(f"{BASE_URL}/api/classes/PROF2026")
        assert response.status_code == 403
        data = response.json()
        assert "protected" in data.get("detail", "").lower()
        print("✓ DELETE /api/classes/PROF2026 returns 403 (protected)")
    
    def test_delete_demo_class_prof2026b_blocked(self):
        """DELETE /api/classes/PROF2026B returns 403 (protected)"""
        response = requests.delete(f"{BASE_URL}/api/classes/PROF2026B")
        assert response.status_code == 403
        data = response.json()
        assert "protected" in data.get("detail", "").lower()
        print("✓ DELETE /api/classes/PROF2026B returns 403 (protected)")
    
    def test_delete_non_demo_class_works(self):
        """DELETE /api/classes/{code} works for non-demo classes"""
        # First create a test class
        create_response = requests.post(f"{BASE_URL}/api/classes", json={
            "teacher_name": "TEST_Delete Teacher",
            "school_name": "TEST_Delete School"
        })
        assert create_response.status_code == 200
        code = create_response.json()["code"]
        
        # Delete the class
        delete_response = requests.delete(f"{BASE_URL}/api/classes/{code}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["ok"] == True
        assert data["deleted_class"] == code
        
        # Verify class is deleted
        get_response = requests.get(f"{BASE_URL}/api/classes/{code}")
        assert get_response.status_code == 404
        
        print(f"✓ DELETE /api/classes/{code} works for non-demo class")
    
    def test_delete_class_cascade_removes_students_and_stamps(self):
        """DELETE /api/classes/{code}?cascade=true removes students and stamps"""
        # Create a test class
        create_class_response = requests.post(f"{BASE_URL}/api/classes", json={
            "teacher_name": "TEST_Cascade Teacher",
            "school_name": "TEST_Cascade School"
        })
        assert create_class_response.status_code == 200
        code = create_class_response.json()["code"]
        
        # Create a student in the class
        create_student_response = requests.post(f"{BASE_URL}/api/students", json={
            "name": "TEST_Cascade Student",
            "class_code": code
        })
        assert create_student_response.status_code == 200
        student_id = create_student_response.json()["id"]
        
        # Create a stamp for the student
        create_stamp_response = requests.post(f"{BASE_URL}/api/stamps", json={
            "student_id": student_id,
            "qr_token": "s1"
        })
        assert create_stamp_response.status_code == 200
        
        # Delete the class with cascade
        delete_response = requests.delete(f"{BASE_URL}/api/classes/{code}?cascade=true")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["ok"] == True
        assert data["deleted_students"] >= 1
        assert data["deleted_stamps"] >= 1
        
        # Verify student is deleted
        get_student_response = requests.get(f"{BASE_URL}/api/students/{student_id}")
        assert get_student_response.status_code == 404
        
        print(f"✓ DELETE /api/classes/{code}?cascade=true removed {data['deleted_students']} students and {data['deleted_stamps']} stamps")


# ============== ENRICHED SEED TESTS ==============
class TestEnrichedSeed:
    """Verify enriched seed data"""
    
    def test_seed_has_all_demo_students(self):
        """Seed should have Lucas, Théo, Emma, Nadia, Hugo (PROF2026) + Sarah, Malik, Léa (PROF2026B)"""
        response = requests.get(f"{BASE_URL}/api/admin/all-students")
        assert response.status_code == 200
        data = response.json()
        
        ids = [s["id"] for s in data]
        
        # PROF2026 students
        assert "demo-lucas" in ids, "Lucas should be seeded"
        assert "demo-theo" in ids, "Théo should be seeded"
        assert "demo-emma" in ids, "Emma should be seeded"
        assert "demo-nadia" in ids, "Nadia should be seeded"
        assert "demo-hugo" in ids, "Hugo should be seeded"
        
        # PROF2026B students
        assert "demo-sarah" in ids, "Sarah should be seeded"
        assert "demo-malik" in ids, "Malik should be seeded"
        assert "demo-lea" in ids, "Léa should be seeded"
        
        print("✓ All 8 demo students are seeded correctly")
    
    def test_seed_has_demo_classes(self):
        """Seed should have PROF2026 (Henri-IV) and PROF2026B (Louis-le-Grand)"""
        response = requests.get(f"{BASE_URL}/api/admin/all-classes")
        assert response.status_code == 200
        data = response.json()
        
        codes = {c["code"]: c for c in data}
        
        assert "PROF2026" in codes, "PROF2026 should be seeded"
        assert "PROF2026B" in codes, "PROF2026B should be seeded"
        
        # Verify school names
        assert "Henri-IV" in codes["PROF2026"]["school_name"]
        assert "Louis-le-Grand" in codes["PROF2026B"]["school_name"]
        
        print("✓ Both demo classes PROF2026 and PROF2026B are seeded correctly")
    
    def test_seed_students_have_stamps(self):
        """Demo students should have pre-seeded stamps"""
        # Check Lucas has stamps
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas/stamps")
        assert response.status_code == 200
        lucas_stamps = response.json()
        assert len(lucas_stamps) >= 1, "Lucas should have stamps"
        
        # Check Sarah has stamps (she has 7 in seed)
        response = requests.get(f"{BASE_URL}/api/students/demo-sarah/stamps")
        assert response.status_code == 200
        sarah_stamps = response.json()
        assert len(sarah_stamps) >= 5, "Sarah should have many stamps"
        
        print(f"✓ Demo students have pre-seeded stamps (Lucas: {len(lucas_stamps)}, Sarah: {len(sarah_stamps)})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
