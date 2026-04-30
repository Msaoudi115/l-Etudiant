"""
PasseportEtudiant V3 - Lead Scoring & Badge System Tests
Tests for: D1+D2+D3+D4 scoring, badge unlocking, temperature, lead value, expanded schools, why tags
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestSchoolsAndHalls:
    """Test expanded school list (~39 schools) and 5 halls"""
    
    def test_halls_returns_5_halls(self):
        """GET /api/halls returns 5 halls including Conférences"""
        response = requests.get(f"{BASE_URL}/api/halls")
        assert response.status_code == 200
        halls = response.json()
        assert len(halls) == 5
        
        hall_ids = {h['id'] for h in halls}
        assert hall_ids == {'i', 'c', 's', 'a', 'k'}
        
        hall_labels = {h['label'] for h in halls}
        assert 'Ingénierie & Numérique' in hall_labels
        assert 'Commerce' in hall_labels
        assert 'Sciences Po · Université' in hall_labels
        assert 'Arts & Design' in hall_labels
        assert 'Conférences' in hall_labels
    
    def test_schools_returns_39_schools(self):
        """GET /api/schools returns ~39 schools across 5 halls"""
        response = requests.get(f"{BASE_URL}/api/schools")
        assert response.status_code == 200
        schools = response.json()
        assert len(schools) == 39
        
        # Count schools per hall
        from collections import Counter
        hall_counts = Counter(s['hall_id'] for s in schools)
        assert hall_counts['i'] == 14  # Ingénierie & Numérique
        assert hall_counts['c'] == 8   # Commerce
        assert hall_counts['s'] == 8   # Sciences Po · Université
        assert hall_counts['a'] == 4   # Arts & Design
        assert hall_counts['k'] == 5   # Conférences
    
    def test_ingenierie_schools_include_expected(self):
        """Ingénierie & Numérique tab includes expected schools"""
        response = requests.get(f"{BASE_URL}/api/schools")
        assert response.status_code == 200
        schools = response.json()
        
        ing_schools = [s['name'] for s in schools if s['hall_id'] == 'i']
        expected = ['CentraleSupélec', 'École des Ponts ParisTech', 'Arts et Métiers', 
                    'Mines Paris - PSL', 'École 42', 'Epitech']
        for name in expected:
            assert name in ing_schools, f"Missing {name} in Ingénierie schools"


class TestScoreBreakdown:
    """Test D1+D2+D3+D4 scoring formula"""
    
    def test_sarah_score_around_89(self):
        """Sarah (8 stamps, all consents, conf, all D3 flags, 2 filières premium) scores ~89"""
        response = requests.get(f"{BASE_URL}/api/students/demo-sarah/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert data['score'] == 89
        assert 'score_breakdown' in data
        breakdown = data['score_breakdown']
        
        # Check 4 dimensions exist
        dims = {d['key']: d for d in breakdown['dimensions']}
        assert set(dims.keys()) == {'D1', 'D2', 'D3', 'D4'}
        
        # D1 - Intentionnalité (25 max)
        assert dims['D1']['max'] == 25
        assert dims['D1']['value'] == 20.0  # 2 filieres * 5 + 4 consents * 2.5
        
        # D2 - Comportement in-fair (40 max)
        assert dims['D2']['max'] == 40
        assert dims['D2']['critical'] == True  # D2 is marked critical
        
        # D3 - Engagement post-fair (25 max)
        assert dims['D3']['max'] == 25
        assert dims['D3']['value'] == 25  # All D3 flags true
        
        # D4 - Valeur commerciale (10 max)
        assert dims['D4']['max'] == 10
        assert dims['D4']['value'] == 10.0  # 4 consents + 2 premium filieres
    
    def test_lucas_score_around_74(self):
        """Lucas (5 stamps, 3 consents, conf, scan+email+click, Ingénierie+Numérique) scores ~74"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert data['score'] == 74
        breakdown = data['score_breakdown']
        dims = {d['key']: d for d in breakdown['dimensions']}
        
        # D1: 2 filieres * 5 + 3 consents * 2.5 = 17.5
        assert dims['D1']['value'] == 17.5
        
        # D3: email(8) + click(10) + no return(0) = 18
        assert dims['D3']['value'] == 18
    
    def test_lea_low_score(self):
        """Léa (1 stamp Arts only) has lower score, badge 'first' unlocked"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lea/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert data['score'] < 30  # Low score
        assert data['score'] == 12  # Exact expected
        
        # Check badges
        badge_ids = [b['id'] for b in data['badges']]
        assert 'first' in badge_ids
        assert 'marathon' not in badge_ids
        assert 'completiste' not in badge_ids
    
    def test_score_breakdown_items_have_pts_and_max(self):
        """Each dimension has items with pts and max fields"""
        response = requests.get(f"{BASE_URL}/api/students/demo-sarah/recap")
        assert response.status_code == 200
        breakdown = response.json()['score_breakdown']
        
        for dim in breakdown['dimensions']:
            assert 'items' in dim
            for item in dim['items']:
                assert 'label' in item
                assert 'pts' in item
                assert 'max' in item


class TestGatingRule:
    """Test 0 stamp = score 0 gating rule"""
    
    def test_zero_stamps_score_zero(self):
        """A student with 0 stamps should have score=0 even with consents"""
        # Théo is anonymous but also has 0 stamps
        response = requests.get(f"{BASE_URL}/api/students/demo-theo/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data['stamps']) == 0
        assert data['score'] == 0
        
        # Check gating_zero flag
        if 'score_breakdown' in data:
            assert data['score_breakdown'].get('gating_zero') == True


class TestTemperatureAndLeadValue:
    """Test lead temperature and EUR value"""
    
    def test_sarah_hot_lead(self):
        """Sarah with score 89 is Hot lead with 80€ value"""
        response = requests.get(f"{BASE_URL}/api/students/demo-sarah/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert data['temperature']['value'] == 'hot'
        assert data['temperature']['label'] == '🔥 Hot'
        assert data['lead_value_eur'] == 80
    
    def test_lucas_warm_lead(self):
        """Lucas with score 74 is Tiède lead"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert data['temperature']['value'] == 'warm'
        assert data['temperature']['label'] == '♨️ Tiède'
        assert data['lead_value_eur'] > 0  # Between 40-80
    
    def test_lea_non_qualified(self):
        """Léa with low score is Non-qualifié with 0€ value"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lea/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert data['temperature']['value'] == 'none'
        assert data['lead_value_eur'] == 0


class TestBadges:
    """Test badge unlocking system (6 badges)"""
    
    def test_all_badges_defined(self):
        """Recap returns all_badges array with 6 entries"""
        response = requests.get(f"{BASE_URL}/api/students/demo-sarah/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert 'all_badges' in data
        assert len(data['all_badges']) == 6
        
        badge_ids = {b['id'] for b in data['all_badges']}
        assert badge_ids == {'first', 'explorer', 'marathon', 'curieux', 'premium', 'completiste'}
    
    def test_sarah_badges(self):
        """Sarah has first, marathon, curieux, premium badges"""
        response = requests.get(f"{BASE_URL}/api/students/demo-sarah/recap")
        assert response.status_code == 200
        data = response.json()
        
        badge_ids = {b['id'] for b in data['badges']}
        assert 'first' in badge_ids  # 1+ stamps
        assert 'marathon' in badge_ids  # 5+ stamps
        assert 'curieux' in badge_ids  # 1+ conference
        assert 'premium' in badge_ids  # Premium filière visited
    
    def test_lea_only_first_badge(self):
        """Léa with 1 stamp only has 'first' badge"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lea/recap")
        assert response.status_code == 200
        data = response.json()
        
        badge_ids = {b['id'] for b in data['badges']}
        assert badge_ids == {'first'}


class TestAnalyticsLeads:
    """Test analytics/leads endpoint with score_breakdown"""
    
    def test_leads_have_score_breakdown(self):
        """GET /api/analytics/leads returns rows with score_breakdown"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads")
        assert response.status_code == 200
        leads = response.json()
        
        assert len(leads) > 0
        for lead in leads:
            assert 'score_breakdown' in lead
            assert 'temperature' in lead
            assert 'lead_value_eur' in lead
    
    def test_leads_sorted_by_score(self):
        """Leads are sorted by score descending"""
        response = requests.get(f"{BASE_URL}/api/analytics/leads")
        assert response.status_code == 200
        leads = response.json()
        
        scores = [l['score'] for l in leads]
        assert scores == sorted(scores, reverse=True)


class TestRecoWhyTags:
    """Test recommendation explainability ('why' tags)"""
    
    def test_recos_have_why_tags(self):
        """Recommendations include 'why' array explaining the match"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data['recos']) > 0
        for reco in data['recos']:
            assert 'why' in reco
            assert isinstance(reco['why'], list)
            assert len(reco['why']) > 0
    
    def test_why_tags_include_filiere_bonus(self):
        """Why tags include filière-specific bonuses"""
        response = requests.get(f"{BASE_URL}/api/students/demo-lucas/recap")
        assert response.status_code == 200
        recos = response.json()['recos']
        
        # Lucas has Ingénierie + Numérique filieres
        all_why = []
        for r in recos:
            all_why.extend(r['why'])
        
        # Should see filière bonuses
        why_text = ' '.join(all_why)
        assert 'Ingénierie' in why_text or 'Numérique' in why_text
    
    def test_anonymous_no_recos(self):
        """Anonymous Théo has no recos"""
        response = requests.get(f"{BASE_URL}/api/students/demo-theo/recap")
        assert response.status_code == 200
        data = response.json()
        
        assert data['recos'] == []


class TestScoreProgression:
    """Test score progression across different profiles"""
    
    def test_score_ordering(self):
        """Sarah > Lucas > Malik > Nadia > Emma > Hugo > Léa"""
        students = ['demo-sarah', 'demo-lucas', 'demo-malik', 'demo-nadia', 
                    'demo-emma', 'demo-hugo', 'demo-lea']
        scores = {}
        
        for sid in students:
            response = requests.get(f"{BASE_URL}/api/students/{sid}/recap")
            assert response.status_code == 200
            scores[sid] = response.json()['score']
        
        # Sarah should be highest
        assert scores['demo-sarah'] >= scores['demo-lucas']
        # Léa should be lowest (non-anonymous)
        assert scores['demo-lea'] <= scores['demo-hugo']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
