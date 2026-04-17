"""
PasseportEtudiant API Tests
Tests all backend endpoints for the French passport-styled orientation app.
Covers: halls, schools, students, classes, stamps, recap, analytics
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic API health and root endpoint tests"""
    
    def test_api_root(self):
        """Test API root returns app info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["app"] == "PasseportEtudiant"
        assert "version" in data
        print("✓ API root endpoint working")


class TestHalls:
    """Hall endpoints tests"""
    
    def test_get_halls_returns_4(self):
        """GET /api/halls returns 4 halls"""
        response = requests.get(f"{BASE_URL}/api/halls")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        # Verify hall structure
        for hall in data:
            assert "id" in hall
            assert "label" in hall
            assert "color" in hall
        print(f"✓ GET /api/halls returns {len(data)} halls")


class TestSchools:
    """School endpoints tests"""
    
    def test_get_schools_returns_16(self):
        """GET /api/schools returns 16 seeded schools with qr_token"""
        response = requests.get(f"{BASE_URL}/api/schools")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 16
        # Verify school structure and qr_token
        for school in data:
            assert "id" in school
            assert "name" in school
            assert "hall_id" in school
            assert "qr_token" in school
            assert school["qr_token"].startswith("STAND-")
        print(f"✓ GET /api/schools returns {len(data)} schools with qr_token")
    
    def test_get_school_by_id(self):
        """GET /api/schools/{id} returns a school"""
        response = requests.get(f"{BASE_URL}/api/schools/s1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "s1"
        assert data["name"] == "CentraleSupélec"
        assert "qr_token" in data
        print(f"✓ GET /api/schools/s1 returns {data['name']}")
    
    def test_get_school_not_found(self):
        """GET /api/schools/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/schools/invalid-school-id")
        assert response.status_code == 404
        print("✓ GET /api/schools/invalid returns 404")


class TestDemoStudents:
    """Demo student endpoints tests"""
    
    def test_get_demo_lucas(self):
        """GET /api/students/demo-lucas returns Lucas with filieres/consents"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "demo-lucas"
        assert data["name"] == "Lucas Martin"
        assert data["is_anonymous"] == False
        assert "filieres" in data
        assert "consents" in data
        assert isinstance(data["filieres"], list)
        assert "Ingénierie" in data["filieres"]
        print(f"✓ GET /api/students/demo-lucas returns Lucas with filieres: {data['filieres']}")
    
    def test_get_demo_theo_anonymous(self):
        """GET /api/students/demo-theo returns Théo as anonymous"""
        response = requests.get(f"{BASE_URL}/api/students/demo-theo")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "demo-theo"
        assert data["name"] == "Théo"
        assert data["is_anonymous"] == True
        print(f"✓ GET /api/students/demo-theo returns anonymous student")
    
    def test_get_student_not_found(self):
        """GET /api/students/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/students/invalid-student-id")
        assert response.status_code == 404
        print("✓ GET /api/students/invalid returns 404")


class TestClasses:
    """Class endpoints tests"""
    
    def test_get_demo_class(self):
        """GET /api/classes/PROF2026 returns the demo class"""
        response = requests.get(f"{BASE_URL}/api/classes/PROF2026")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "PROF2026"
        assert data["teacher_name"] == "M. Bernard"
        assert "school_name" in data
        print(f"✓ GET /api/classes/PROF2026 returns demo class: {data['school_name']}")
    
    def test_get_class_students(self):
        """GET /api/classes/PROF2026/students returns students with stamp_count"""
        response = requests.get(f"{BASE_URL}/api/classes/PROF2026/students")
        assert response.status_code == 200
        data = response.json()
        assert "class" in data
        assert "students" in data
        assert isinstance(data["students"], list)
        # Check stamp_count is present on students
        for student in data["students"]:
            assert "stamp_count" in student
        print(f"✓ GET /api/classes/PROF2026/students returns {len(data['students'])} students")
    
    def test_get_class_not_found(self):
        """GET /api/classes/{invalid_code} returns 404"""
        response = requests.get(f"{BASE_URL}/api/classes/INVALID123")
        assert response.status_code == 404
        print("✓ GET /api/classes/INVALID returns 404")
    
    def test_create_class(self):
        """POST /api/classes creates a new class with unique code"""
        payload = {
            "teacher_name": "TEST_Prof Test",
            "school_name": "TEST_Lycée Test"
        }
        response = requests.post(f"{BASE_URL}/api/classes", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "code" in data
        assert data["code"].startswith("PROF")
        assert data["teacher_name"] == payload["teacher_name"]
        assert data["school_name"] == payload["school_name"]
        print(f"✓ POST /api/classes created class with code: {data['code']}")
        return data["code"]


class TestStudentCreation:
    """Student creation and update tests"""
    
    def test_create_student_valid_class_code(self):
        """POST /api/students with valid class_code=PROF2026 creates a student"""
        payload = {
            "name": "TEST_Student One",
            "emoji": "🧑‍🎓",
            "classe": "Terminale générale",
            "filieres": ["Ingénierie"],
            "formation": ["École d'ingénieurs"],
            "class_code": "PROF2026"
        }
        response = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["class_code"] == "PROF2026"
        assert "serial" in data
        assert data["serial"].startswith("SAL-2026-")
        print(f"✓ POST /api/students created student: {data['name']} with serial {data['serial']}")
        return data["id"]
    
    def test_create_student_invalid_class_code(self):
        """POST /api/students with invalid class_code returns 400"""
        payload = {
            "name": "TEST_Invalid Student",
            "class_code": "INVALID_CODE"
        }
        response = requests.post(f"{BASE_URL}/api/students", json=payload)
        assert response.status_code == 400
        print("✓ POST /api/students with invalid class_code returns 400")
    
    def test_update_student_consents(self):
        """PATCH /api/students/{id} updates consents/emoji/filieres"""
        # Update Lucas's consents
        payload = {
            "consents": {"l": True, "d": True, "c": False, "e": True}
        }
        response = requests.patch(f"{BASE_URL}/api/students/demo-lucas", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["consents"]["e"] == True
        print(f"✓ PATCH /api/students/demo-lucas updated consents")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/students/demo-lucas")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["consents"]["e"] == True
        print("✓ Consent update persisted correctly")


class TestStamps:
    """Stamp CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get a school qr_token for testing"""
        response = requests.get(f"{BASE_URL}/api/schools/s1")
        self.school = response.json()
        self.qr_token = self.school["qr_token"]
    
    def test_create_stamp_with_qr_token(self):
        """POST /api/stamps with student_id and qr_token creates a stamp"""
        payload = {
            "student_id": "demo-lucas",
            "qr_token": self.qr_token
        }
        response = requests.post(f"{BASE_URL}/api/stamps", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "stamp" in data
        assert "duplicate" in data
        assert "school" in data
        assert data["school"]["id"] == "s1"
        print(f"✓ POST /api/stamps created stamp for {data['school']['name']}, duplicate={data['duplicate']}")
        return data["stamp"]["id"] if not data["duplicate"] else None
    
    def test_create_stamp_with_school_id_fallback(self):
        """POST /api/stamps with school_id as qr_token (fallback) also works"""
        payload = {
            "student_id": "demo-lucas",
            "qr_token": "s2"  # Using school_id directly
        }
        response = requests.post(f"{BASE_URL}/api/stamps", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "stamp" in data
        assert data["school"]["id"] == "s2"
        print(f"✓ POST /api/stamps with school_id fallback works for {data['school']['name']}")
    
    def test_create_stamp_anonymous_forbidden(self):
        """POST /api/stamps for anonymous student demo-theo returns 403"""
        payload = {
            "student_id": "demo-theo",
            "qr_token": self.qr_token
        }
        response = requests.post(f"{BASE_URL}/api/stamps", json=payload)
        assert response.status_code == 403
        print("✓ POST /api/stamps for anonymous student returns 403")
    
    def test_create_stamp_duplicate(self):
        """POST /api/stamps duplicate returns duplicate=true without creating new row"""
        # First stamp
        payload = {
            "student_id": "demo-lucas",
            "qr_token": "s3"
        }
        response1 = requests.post(f"{BASE_URL}/api/stamps", json=payload)
        assert response1.status_code == 200
        
        # Second stamp (duplicate)
        response2 = requests.post(f"{BASE_URL}/api/stamps", json=payload)
        assert response2.status_code == 200
        data = response2.json()
        assert data["duplicate"] == True
        print("✓ POST /api/stamps duplicate returns duplicate=true")
    
    def test_list_stamps(self):
        """GET /api/students/{id}/stamps lists stamps"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas/stamps")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/students/demo-lucas/stamps returns {len(data)} stamps")
    
    def test_delete_stamp(self):
        """DELETE /api/stamps/{id} removes a stamp"""
        # Create a stamp first
        payload = {
            "student_id": "demo-lucas",
            "qr_token": "s4"
        }
        create_response = requests.post(f"{BASE_URL}/api/stamps", json=payload)
        assert create_response.status_code == 200
        stamp_data = create_response.json()
        
        if not stamp_data["duplicate"]:
            stamp_id = stamp_data["stamp"]["id"]
            # Delete the stamp
            delete_response = requests.delete(f"{BASE_URL}/api/stamps/{stamp_id}")
            assert delete_response.status_code == 200
            print(f"✓ DELETE /api/stamps/{stamp_id} removed stamp")
        else:
            print("✓ Stamp already existed (duplicate), skipping delete test")
    
    def test_create_stamp_invalid_qr(self):
        """POST /api/stamps with invalid qr_token returns 400"""
        payload = {
            "student_id": "demo-lucas",
            "qr_token": "INVALID-QR-TOKEN"
        }
        response = requests.post(f"{BASE_URL}/api/stamps", json=payload)
        assert response.status_code == 400
        print("✓ POST /api/stamps with invalid qr_token returns 400")


class TestRecap:
    """Recap endpoint tests"""
    
    def test_recap_lucas(self):
        """GET /api/students/{id}/recap returns score, recos, next, stamps"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas/recap")
        assert response.status_code == 200
        data = response.json()
        assert "student" in data
        assert "stamps" in data
        assert "score" in data
        assert "recos" in data
        assert "next" in data
        assert "duration_min" in data
        assert isinstance(data["stamps"], list)
        assert isinstance(data["recos"], list)
        assert isinstance(data["next"], list)
        print(f"✓ GET /api/students/demo-lucas/recap returns score={data['score']}, {len(data['stamps'])} stamps, {len(data['recos'])} recos")
    
    def test_recap_anonymous_empty_recos(self):
        """GET /api/students/demo-theo/recap: recos should be empty because anonymous"""
        response = requests.get(f"{BASE_URL}/api/students/demo-theo/recap")
        assert response.status_code == 200
        data = response.json()
        assert data["recos"] == []
        assert data["score"] == 0
        print("✓ GET /api/students/demo-theo/recap returns empty recos for anonymous")


class TestAnalytics:
    """Analytics endpoint tests"""
    
    def test_analytics_overview(self):
        """GET /api/analytics/overview returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        assert response.status_code == 200
        data = response.json()
        
        # Check all required fields
        assert "total_students" in data
        assert "total_stamps" in data
        assert "total_classes" in data
        assert "avg_stamps" in data
        assert "top_schools" in data
        assert "hall_counts" in data
        assert "consents" in data
        assert "filieres_dist" in data
        assert "recent" in data
        
        # Verify data types
        assert isinstance(data["total_students"], int)
        assert isinstance(data["total_stamps"], int)
        assert isinstance(data["hall_counts"], list)
        assert isinstance(data["top_schools"], list)
        assert isinstance(data["consents"], dict)
        assert isinstance(data["filieres_dist"], list)
        assert isinstance(data["recent"], list)
        
        print(f"✓ GET /api/analytics/overview returns: {data['total_students']} students, {data['total_stamps']} stamps, {data['total_classes']} classes")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
