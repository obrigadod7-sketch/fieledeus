import requests
import sys
import json
from datetime import datetime

class WatizatAPITester:
    def __init__(self, base_url="https://social-assist-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        if endpoint.startswith('/'):
            url = f"{self.base_url}{endpoint}"
        else:
            url = f"{self.base_url}/api/{endpoint}"
            
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test GET /health endpoint"""
        return self.run_test("Health Check", "GET", "/health", 200)

    def test_root_endpoint(self):
        """Test GET / endpoint"""
        return self.run_test("Root Endpoint", "GET", "/", 200)

    def test_api_root_endpoint(self):
        """Test GET /api/ endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_help_locations_categories(self):
        """Test GET /api/help-locations/categories endpoint"""
        success, response = self.run_test(
            "Help Locations Categories",
            "GET",
            "help-locations/categories",
            200
        )
        
        if success and isinstance(response, dict) and 'categories' in response:
            categories = response['categories']
            
            # Check if we have expected categories
            expected_categories = ['food', 'health', 'legal', 'housing', 'clothes', 'social', 'education', 'work']
            found_categories = [cat['value'] for cat in categories if cat['value'] != 'all']
            
            # Check if each category has required fields
            all_have_required_fields = True
            for cat in categories:
                if cat['value'] == 'all':
                    if not ('icon' in cat and 'count' in cat):
                        all_have_required_fields = False
                        break
                else:
                    if not ('icon' in cat and 'color' in cat and 'count' in cat):
                        all_have_required_fields = False
                        break
            
            has_expected_categories = all(cat in found_categories for cat in expected_categories)
            
            if all_have_required_fields and has_expected_categories:
                self.log_test("Categories Structure Validation", True, f"Found {len(categories)} categories with proper structure")
                return True
            else:
                error_msg = []
                if not all_have_required_fields:
                    error_msg.append("Missing required fields")
                if not has_expected_categories:
                    missing = [cat for cat in expected_categories if cat not in found_categories]
                    error_msg.append(f"Missing categories: {missing}")
                self.log_test("Categories Structure Validation", False, "; ".join(error_msg))
        
        return False

    def test_user_registration(self):
        """Test POST /api/auth/register endpoint"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "email": f"test_migrant_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test Migrant {timestamp}",
            "role": "migrant",
            "languages": ["pt", "fr"]
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_admin_login(self):
        """Test login with admin credentials from review request"""
        login_data = {
            "email": "admin@watizat.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response and 'user' in response:
            user = response['user']
            if user.get('role') == 'admin':
                self.log_test("Admin Login Validation", True, f"Successfully logged in as admin: {user.get('name')}")
                # Store admin token for further tests
                self.admin_token = response['token']
                return True
            else:
                self.log_test("Admin Login Validation", False, f"User role is {user.get('role')}, expected admin")
        return False

    def test_ai_chat_with_openai(self):
        """Test POST /api/ai/chat endpoint (should return ai_enabled: true with OpenAI key)"""
        if not self.token:
            self.log_test("AI Chat - No Token", False, "No authentication token available")
            return False
            
        chat_data = {
            "message": "Onde posso encontrar comida gratuita em Paris?",
            "language": "pt"
        }
        
        success, response = self.run_test(
            "AI Chat with OpenAI",
            "POST",
            "ai/chat",
            200,
            data=chat_data
        )
        
        if success and 'ai_enabled' in response:
            ai_enabled = response['ai_enabled']
            if ai_enabled:
                self.log_test("AI Chat OpenAI Integration", True, "AI is enabled and working with OpenAI")
                return True
            else:
                self.log_test("AI Chat OpenAI Integration", False, "AI is disabled - OpenAI key may not be working")
                return False
        else:
            self.log_test("AI Chat OpenAI Integration", False, "Response missing ai_enabled field")
            return False

    def test_create_post_multiple_categories(self):
        """Test POST /api/posts - criar post com múltiplas categorias"""
        if not self.token:
            self.log_test("Create Post Multiple Categories - No Token", False, "No authentication token available")
            return False
            
        # Test creating post with multiple categories (up to 3)
        post_data = {
            "type": "need",
            "category": "housing",  # categoria principal
            "categories": ["housing", "work", "education"],  # múltiplas categorias
            "title": "Preciso de ajuda com moradia, trabalho e educação",
            "description": "Sou novo na França e preciso de ajuda para encontrar moradia, trabalho e validar meus diplomas."
        }
        
        success, response = self.run_test(
            "Create Post with Multiple Categories",
            "POST",
            "posts",
            200,
            data=post_data
        )
        
        if success and 'categories' in response:
            # Verify the post has the correct categories
            returned_categories = response['categories']
            expected_categories = ["housing", "work", "education"]
            
            if set(returned_categories) == set(expected_categories):
                self.log_test("Multiple Categories Validation", True, f"Post created with categories: {returned_categories}")
                return True, response['id']
            else:
                self.log_test("Multiple Categories Validation", False, f"Expected {expected_categories}, got {returned_categories}")
        
        return False, None

    def test_get_posts_with_categories(self):
        """Test GET /api/posts - deve retornar posts com campo 'categories' array"""
        if not self.token:
            self.log_test("Get Posts with Categories - No Token", False, "No authentication token available")
            return False
            
        success, response = self.run_test(
            "Get Posts with Categories Array",
            "GET",
            "posts",
            200
        )
        
        if success and isinstance(response, list):
            # Check if posts have categories field
            posts_with_categories = 0
            for post in response:
                if 'categories' in post and isinstance(post['categories'], list):
                    posts_with_categories += 1
            
            if posts_with_categories > 0:
                self.log_test("Posts Categories Field Validation", True, f"Found {posts_with_categories} posts with categories array")
                return True
            else:
                self.log_test("Posts Categories Field Validation", False, "No posts found with categories array field")
        
        return False

    def test_category_filtering(self):
        """Test filtro de posts por categoria deve funcionar com múltiplas categorias"""
        if not self.token:
            self.log_test("Category Filtering - No Token", False, "No authentication token available")
            return False
        
        # First create a post with multiple categories
        post_success, post_id = self.test_create_post_multiple_categories()
        if not post_success:
            self.log_test("Category Filtering Setup", False, "Failed to create test post")
            return False
        
        # Test filtering by one of the categories
        success, response = self.run_test(
            "Filter Posts by Category (housing)",
            "GET",
            "posts?category=housing",
            200
        )
        
        if success and isinstance(response, list):
            # Check if the created post appears in housing category filter
            found_post = False
            for post in response:
                if post.get('id') == post_id:
                    found_post = True
                    break
            
            if found_post:
                self.log_test("Category Filtering Validation", True, "Post found when filtering by housing category")
            else:
                self.log_test("Category Filtering Validation", False, "Post not found when filtering by housing category")
                return False
        
        # Test filtering by another category (work)
        success, response = self.run_test(
            "Filter Posts by Category (work)",
            "GET",
            "posts?category=work",
            200
        )
        
        if success and isinstance(response, list):
            # Check if the created post appears in work category filter
            found_post = False
            for post in response:
                if post.get('id') == post_id:
                    found_post = True
                    break
            
            if found_post:
                self.log_test("Multiple Category Filtering Validation", True, "Post found when filtering by work category (multiple categories working)")
                return True
            else:
                self.log_test("Multiple Category Filtering Validation", False, "Post not found when filtering by work category")
        
        return False

    def test_mural_get(self):
        """Test GET /api/mural - get mural messages"""
        success, response = self.run_test(
            "Get Mural Messages",
            "GET",
            "mural",
            200
        )
        if success and isinstance(response, dict) and 'messages' in response:
            messages = response.get('messages', [])
            self.log_test("Mural Messages Structure", True, f"Found {len(messages)} mural messages")
            return True, messages
        else:
            self.log_test("Mural Messages Structure", False, "Response missing 'messages' field or wrong format")
            return False, []

    def test_mural_post(self, name, message):
        """Test POST /api/mural - create new mural message"""
        success, response = self.run_test(
            "Create Mural Message",
            "POST",
            "mural",
            200,
            data={"name": name, "message": message}
        )
        if success and isinstance(response, dict) and 'id' in response:
            self.log_test("Mural Message Creation", True, f"Message created with ID: {response['id']}")
            return True, response
        else:
            self.log_test("Mural Message Creation", False, "Response missing 'id' field or wrong format")
            return False, {}

    def test_render_yaml_config(self):
        """Check if render.yaml uses yarn instead of npm"""
        print("\n🔧 Checking render.yaml configuration...")
        try:
            with open('/app/render.yaml', 'r') as f:
                content = f.read()
                
            if 'yarn install' in content:
                self.log_test("Render.yaml Configuration", True, "Uses 'yarn install' correctly")
                return True
            elif 'npm install' in content:
                self.log_test("Render.yaml Configuration", False, "Still uses 'npm install' instead of 'yarn install'")
                return False
            else:
                self.log_test("Render.yaml Configuration", False, "No install command found")
                return False
                
        except Exception as e:
            self.log_test("Render.yaml Configuration", False, f"Error reading file: {e}")
            return False

    def test_volunteer_category_matching(self):
        """Test voluntários devem ver posts que contenham alguma das categorias que eles selecionaram"""
        # Create a volunteer user with specific help categories
        timestamp = datetime.now().strftime('%H%M%S')
        volunteer_data = {
            "email": f"test_volunteer_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test Volunteer {timestamp}",
            "role": "volunteer",
            "languages": ["pt", "fr"],
            "help_categories": ["housing", "legal"]  # Volunteer can help with housing and legal
        }
        
        success, response = self.run_test(
            "Register Volunteer with Help Categories",
            "POST",
            "auth/register",
            200,
            data=volunteer_data
        )
        
        if not success or 'token' not in response:
            self.log_test("Volunteer Registration", False, "Failed to register volunteer")
            return False
        
        volunteer_token = response['token']
        
        # Create a post that matches volunteer's categories
        post_data = {
            "type": "need",
            "category": "housing",
            "categories": ["housing", "work"],  # housing matches volunteer's help_categories
            "title": "Preciso de ajuda com moradia e trabalho",
            "description": "Preciso encontrar um lugar para morar e um emprego."
        }
        
        # Use original token to create post
        success, post_response = self.run_test(
            "Create Post for Volunteer Matching",
            "POST",
            "posts",
            200,
            data=post_data
        )
        
        if not success:
            self.log_test("Post Creation for Volunteer Test", False, "Failed to create test post")
            return False
        
        post_id = post_response['id']
        
        # Now get posts as volunteer and check if the post appears
        # Temporarily store original token
        original_token = self.token
        self.token = volunteer_token
        
        success, posts_response = self.run_test(
            "Get Posts as Volunteer",
            "GET",
            "posts",
            200
        )
        
        # Restore original token
        self.token = original_token
        
        if success and isinstance(posts_response, list):
            # Check if volunteer can see the post
            found_matching_post = False
            for post in posts_response:
                if post.get('id') == post_id and post.get('can_help'):
                    found_matching_post = True
                    break
            
            if found_matching_post:
                self.log_test("Volunteer Category Matching", True, "Volunteer can see posts matching their help categories")
                return True
            else:
                self.log_test("Volunteer Category Matching", False, "Volunteer cannot see posts matching their help categories")
        
        return False

    def run_basic_tests(self):
        """Run the basic tests as specified in the review request"""
        print("🚀 Starting Watizat Backend Tests...")
        print(f"📍 Base URL: {self.base_url}")
        
        # Test 1: GET /health
        print("\n📝 Step 1: Test health endpoint")
        self.test_health_endpoint()
        
        # Test 2: GET /
        print("\n📝 Step 2: Test root endpoint")
        self.test_root_endpoint()
        
        # Test 3: GET /api/
        print("\n📝 Step 3: Test API root endpoint")
        self.test_api_root_endpoint()
        
        # Test 4: GET /api/help-locations/categories
        print("\n📝 Step 4: Test help locations categories")
        self.test_help_locations_categories()
        
        # Test 5: POST /api/auth/register
        print("\n📝 Step 5: Test user registration")
        if not self.test_user_registration():
            print("⚠️  Registration failed, some tests may not work")
        
        # Test 6: Admin login with provided credentials
        print("\n📝 Step 6: Test admin login")
        self.test_admin_login()
        
        # Test 7: POST /api/ai/chat (with OpenAI)
        print("\n📝 Step 7: Test AI chat with OpenAI")
        self.test_ai_chat_with_openai()
        
        return True

    def run_mural_tests(self):
        """Run tests specific to mural de mensagens feature"""
        print("\n📋 Starting Mural de Mensagens Tests...")
        
        # Test 1: GET /api/mural - get existing messages
        print("\n📝 Mural Test 1: Get existing mural messages")
        get_success, existing_messages = self.test_mural_get()
        
        # Test 2: POST /api/mural - create new message
        print("\n📝 Mural Test 2: Create new mural message")
        test_name = f"TestUser_{datetime.now().strftime('%H%M%S')}"
        test_message = f"Test message from backend test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        post_success, post_response = self.test_mural_post(test_name, test_message)
        
        # Test 3: GET /api/mural again to verify the new message was added
        if post_success:
            print("\n📝 Mural Test 3: Verify message was saved")
            get_success_2, new_messages = self.test_mural_get()
            if get_success_2 and len(new_messages) > len(existing_messages):
                self.log_test("Mural Message Persistence", True, "New message successfully saved and retrieved")
            else:
                self.log_test("Mural Message Persistence", False, "Message may not have been properly saved")
        
        # Test 4: Check render.yaml configuration
        print("\n📝 Mural Test 4: Check render.yaml configuration")
        self.test_render_yaml_config()
        
        return True

    def run_multiple_categories_tests(self):
        """Run tests specific to multiple categories feature"""
        print("\n🎯 Starting Multiple Categories Feature Tests...")
        
        # Test 1: POST /api/posts - criar post com múltiplas categorias
        print("\n📝 Multiple Categories Test 1: Create post with multiple categories")
        self.test_create_post_multiple_categories()
        
        # Test 2: GET /api/posts - deve retornar posts com campo 'categories' array
        print("\n📝 Multiple Categories Test 2: Get posts with categories array")
        self.test_get_posts_with_categories()
        
        # Test 3: Filtro de posts por categoria deve funcionar com múltiplas categorias
        print("\n📝 Multiple Categories Test 3: Category filtering with multiple categories")
        self.test_category_filtering()
        
        # Test 4: Voluntários devem ver posts que contenham alguma das categorias que eles selecionaram
        print("\n📝 Multiple Categories Test 4: Volunteer category matching")
        self.test_volunteer_category_matching()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = WatizatAPITester()
    
    try:
        # Run basic tests first
        tester.run_basic_tests()
        
        # Run multiple categories specific tests
        tester.run_multiple_categories_tests()
        
        # Run mural de mensagens tests
        tester.run_mural_tests()
        
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())