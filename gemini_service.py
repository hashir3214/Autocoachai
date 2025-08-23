import os
import logging
import time
from typing import Optional
from google import genai
from google.genai import types

class AutoCoachGemini:
    """Service class for handling Gemini AI interactions for AutoCoach"""
    
    def __init__(self):
        """Initialize the Gemini client with enhanced error handling"""
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.client: Optional[genai.Client] = None
        self.model = "gemini-2.5-flash"
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds
        
        if not self.api_key:
            logging.warning("GEMINI_API_KEY not found in environment variables")
        else:
            self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize the Gemini client with retry logic"""
        for attempt in range(self.max_retries):
            try:
                self.client = genai.Client(api_key=self.api_key)
                logging.info("Gemini client initialized successfully")
                return
            except Exception as e:
                logging.error(f"Failed to initialize Gemini client (attempt {attempt + 1}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    self.client = None
        
        # Define study mode prompts
        self.mode_prompts = {
            "Explain Concept": {
                "system": "You are AutoCoach AI, an exceptionally intelligent and comprehensive study assistant. You have deep expertise across all academic subjects and excel at providing thorough, well-structured explanations. Your responses should be detailed, informative, and intellectually rigorous while remaining accessible. Always provide comprehensive coverage of topics, include multiple perspectives, real-world applications, examples, and connections to related concepts. Structure your responses with clear sections, use precise terminology, and aim for the depth and quality of responses similar to ChatGPT. Be supportive but focus primarily on delivering exceptional educational content.",
                "prefix": "I'll provide you with a comprehensive explanation of this concept. Let me break this down thoroughly:"
            },
            "Homework Helper": {
                "system": "You are AutoCoach AI, an intelligent academic tutor with expertise in pedagogical methods. You excel at guiding students through complex problems using the Socratic method, providing detailed step-by-step reasoning, and helping students develop critical thinking skills. Never give direct answers, but provide comprehensive guidance, detailed explanations of underlying concepts, multiple solution approaches, and thorough reasoning. Your responses should be as detailed and thoughtful as ChatGPT, focusing on deep understanding rather than quick solutions. Include relevant background information, common mistakes to avoid, and connections to broader concepts.",
                "prefix": "Let me guide you through this problem systematically. I'll help you understand the underlying concepts and develop your problem-solving skills:"
            },
            "Practice Quiz": {
                "system": "You are AutoCoach AI, an expert assessment creator and educational specialist. You excel at creating comprehensive, challenging, and educationally valuable quiz questions that test deep understanding. Provide detailed explanations for all answers, include multiple question types, cover various difficulty levels, and give thorough feedback on responses. Your quiz content should be as sophisticated and comprehensive as ChatGPT's educational content, with rich explanations, context, and learning objectives clearly outlined.",
                "prefix": "I'll create a comprehensive practice assessment for you. This will include detailed questions with thorough explanations:"
            },
            "Creative Thinking": {
                "system": "You are AutoCoach AI, an expert in creative problem-solving methodologies, design thinking, and innovation strategies. You have deep knowledge of creativity frameworks, brainstorming techniques, lateral thinking methods, and creative processes used across various fields. Provide comprehensive, structured approaches to creative challenges, detailed methodologies, multiple creative exercises, and thorough explanations of creative principles. Your responses should match ChatGPT's depth and sophistication in exploring creative concepts, offering extensive resources, techniques, and applications.",
                "prefix": "Let me provide you with a comprehensive exploration of creative thinking approaches for this challenge:"
            }
        }
    
    def generate_study_response(self, user_message: str, study_mode: str) -> str:
        """
        Generate a study-focused response using Gemini AI with enhanced error handling
        
        Args:
            user_message: The student's question or topic
            study_mode: The selected study mode
            
        Returns:
            AI-generated response tailored to the study mode
        """
        # Check if client is properly initialized
        if not self.client:
            return self._get_fallback_response(study_mode)
        
        # Sanitize input
        user_message = self._sanitize_input(user_message)
        
        for attempt in range(self.max_retries):
            try:
                response_text = self._make_ai_request(user_message, study_mode)
                if response_text:
                    return response_text
                    
            except Exception as e:
                logging.error(f"Error generating Gemini response (attempt {attempt + 1}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    return self._get_error_response(str(e))
        
        return "I'm experiencing technical difficulties. Please try again in a moment."
    
    def _sanitize_input(self, text: str) -> str:
        """Sanitize user input to prevent potential issues"""
        # Remove potential problematic characters and limit length
        sanitized = text.strip()[:5000]
        # Remove null bytes and other control characters
        sanitized = ''.join(char for char in sanitized if ord(char) >= 32 or char in '\n\r\t')
        return sanitized
    
    def _make_ai_request(self, user_message: str, study_mode: str) -> Optional[str]:
        """Make the actual AI request with proper error handling"""
        # Get mode-specific prompts
        mode_config = self.mode_prompts.get(study_mode, self.mode_prompts["Explain Concept"])
        system_instruction = mode_config["system"]
        message_prefix = mode_config["prefix"]
        
        # Construct the full prompt
        full_prompt = f"{message_prefix}\n\n{user_message}"
        
        # Generate response using Gemini
        response = self.client.models.generate_content(
            model=self.model,
            contents=[
                types.Content(
                    role="user", 
                    parts=[types.Part(text=full_prompt)]
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                max_output_tokens=4000,
                stop_sequences=["\n\n---\n\n"],  # Optional stop sequence
                candidate_count=1
            )
        )
        
        if response and response.text:
            return response.text.strip()
        return None
    
    def _get_fallback_response(self, study_mode: str) -> str:
        """Provide helpful fallback responses when AI is unavailable"""
        fallbacks = {
            "Explain Concept": "I'd love to help explain that concept! However, I'm currently having trouble connecting to my AI brain. Please check that the GEMINI_API_KEY is properly configured, and I'll be right back to help you learn! 🧠✨",
            "Homework Helper": "I'm here to guide you through your homework step by step! Unfortunately, I'm experiencing some technical difficulties right now. Please verify the GEMINI_API_KEY configuration, and I'll be back to help you succeed! 📚💪",
            "Practice Quiz": "I'd love to create an engaging quiz for you! However, I'm currently offline. Please check the GEMINI_API_KEY setup, and I'll return with fantastic practice questions! 🎯📝",
            "Creative Thinking": "I'm excited to explore creative solutions with you! Unfortunately, I'm having connection issues right now. Please ensure the GEMINI_API_KEY is configured, and I'll be back to spark your creativity! 🚀💡"
        }
        return fallbacks.get(study_mode, fallbacks["Explain Concept"])
    
    def _get_error_response(self, error_msg: str) -> str:
        """Provide user-friendly error responses"""
        if "API key" in error_msg.lower():
            return "I'm having trouble with my API configuration. Please try again in a moment, or contact support if the issue persists."
        elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
            return "I'm experiencing high demand right now. Please wait a moment and try again."
        elif "timeout" in error_msg.lower():
            return "I'm taking longer than usual to respond. Please try again with a simpler question."
        else:
            return "I'm having technical difficulties. Please try rephrasing your question or try again later."
    
    def is_configured(self) -> bool:
        """Check if the Gemini service is properly configured"""
        return self.client is not None
