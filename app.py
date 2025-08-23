import os
import logging
import time
from flask import Flask, render_template, request, jsonify, g
from werkzeug.exceptions import BadRequest, InternalServerError
from gemini_service import AutoCoachGemini

# Production-ready logging configuration
logging.basicConfig(
    level=logging.INFO if os.environ.get('FLASK_ENV') == 'production' else logging.DEBUG,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

app = Flask(__name__)

# Production-ready configuration
app.config.update(
    SECRET_KEY=os.environ.get("SESSION_SECRET", "dev-secret-key"),
    JSON_SORT_KEYS=False,
    JSONIFY_PRETTYPRINT_REGULAR=False,
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB max request size
)

# Rate limiting storage (simple in-memory for demo)
request_counts = {}
RATE_LIMIT = 30  # requests per minute
RATE_WINDOW = 60  # seconds

# Initialize Gemini service
gemini_service = AutoCoachGemini()

@app.route('/')
def index():
    """Render the main chat interface"""
    return render_template('index.html')

@app.before_request
def before_request():
    """Track request timing and implement rate limiting"""
    g.start_time = time.time()
    
    # Simple rate limiting
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    current_time = time.time()
    
    # Clean old entries
    request_counts[client_ip] = [t for t in request_counts.get(client_ip, []) if current_time - t < RATE_WINDOW]
    
    # Check rate limit
    if len(request_counts.get(client_ip, [])) >= RATE_LIMIT:
        return jsonify({
            'error': 'Too many requests. Please wait a moment before trying again.',
            'retry_after': RATE_WINDOW
        }), 429
    
    # Add current request
    if client_ip not in request_counts:
        request_counts[client_ip] = []
    request_counts[client_ip].append(current_time)

@app.after_request
def after_request(response):
    """Log request timing and add security headers"""
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Log request timing
    if hasattr(g, 'start_time'):
        duration = time.time() - g.start_time
        logging.info(f"{request.method} {request.path} - {response.status_code} - {duration:.3f}s")
    
    return response

@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'service': 'AutoCoach AI',
        'ai_configured': gemini_service.is_configured(),
        'timestamp': time.time()
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests and return AI responses"""
    try:
        # Validate content type
        if not request.is_json:
            raise BadRequest('Content-Type must be application/json')
        
        data = request.get_json()
        
        if not data:
            raise BadRequest('Request body cannot be empty')
        
        # Validate and sanitize input
        user_message = data.get('message', '').strip()
        study_mode = data.get('mode', 'Explain Concept')
        
        # Input validation
        if not user_message:
            raise BadRequest('Message cannot be empty')
        
        if len(user_message) > 5000:
            raise BadRequest('Message is too long. Please keep it under 5000 characters.')
        
        # Validate study mode
        valid_modes = ['Explain Concept', 'Homework Helper', 'Practice Quiz', 'Creative Thinking']
        if study_mode not in valid_modes:
            study_mode = 'Explain Concept'
        
        # Check if AI service is configured
        if not gemini_service.is_configured():
            return jsonify({
                'error': 'AI service is currently unavailable. Please try again later.'
            }), 503
        
        # Generate AI response using Gemini
        start_ai_time = time.time()
        ai_response = gemini_service.generate_study_response(user_message, study_mode)
        ai_duration = time.time() - start_ai_time
        
        logging.info(f"AI response generated in {ai_duration:.3f}s for mode: {study_mode}")
        
        return jsonify({
            'response': ai_response,
            'mode': study_mode,
            'timestamp': time.time()
        })
        
    except BadRequest as e:
        logging.warning(f"Bad request in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logging.error(f"Unexpected error in chat endpoint: {str(e)}")
        return jsonify({
            'error': 'We\'re experiencing high demand. Please try again in a moment.'
        }), 500

@app.errorhandler(400)
def bad_request(error):
    """Handle bad request errors"""
    return jsonify({
        'error': 'Invalid request. Please check your input and try again.'
    }), 400

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors by serving the main app"""
    if request.path.startswith('/api') or request.path.startswith('/chat'):
        return jsonify({'error': 'Endpoint not found'}), 404
    return render_template('index.html'), 404

@app.errorhandler(429)
def rate_limit_exceeded(error):
    """Handle rate limit errors"""
    return jsonify({
        'error': 'Too many requests. Please wait a moment before trying again.',
        'retry_after': RATE_WINDOW
    }), 429

@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    logging.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'We\'re experiencing technical difficulties. Please try again later.'
    }), 500

@app.errorhandler(503)
def service_unavailable(error):
    """Handle service unavailable errors"""
    return jsonify({
        'error': 'Service temporarily unavailable. Please try again later.'
    }), 503

if __name__ == '__main__':
    # Production-ready configuration
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    port = int(os.environ.get('PORT', 5000))
    
    logging.info(f"Starting AutoCoach AI on port {port} (debug={debug_mode})")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
