# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import tempfile
from typing import Optional, Dict, List

# Import aimakerspace modules for RAG functionality
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel

# Initialize FastAPI application with a title
app = FastAPI(title="RAG Chat API with PDF Upload")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Global storage for vector databases (in production, use proper storage)
vector_databases: Dict[str, VectorDatabase] = {}

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4o-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication
    pdf_id: Optional[str] = None  # Optional PDF ID for RAG context

# Define the data model for question generation requests
class QuestionGenerationRequest(BaseModel):
    topic: str  # Selected topic for question generation
    pdf_id: Optional[str] = None  # Optional PDF ID for context-aware questions
    question_count: Optional[int] = 1  # Number of questions to generate
    difficulty: Optional[str] = "medium"  # Difficulty level: easy, medium, hard
    question_types: Optional[List[str]] = ["factual", "analytical"]  # Types of questions
    api_key: str  # OpenAI API key for authentication
    model: Optional[str] = "gpt-4o-mini"  # Model to use for generation

# PDF upload endpoint
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    """Upload and process a PDF file for RAG functionality"""
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create a temporary file to store the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Load and process the PDF
            pdf_loader = PDFLoader(temp_file_path)
            pdf_loader.load_file()
            
            # Split the text into chunks
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_texts(pdf_loader.documents)
            
            # Create embedding model with the provided API key
            os.environ["OPENAI_API_KEY"] = api_key
            embedding_model = EmbeddingModel()
            
            # Create vector database and build from chunks
            vector_db = VectorDatabase(embedding_model=embedding_model)
            vector_db = await vector_db.abuild_from_list(chunks)
            
            # Generate a unique ID for this PDF
            pdf_id = f"pdf_{hash(file.filename + str(len(chunks)))}"
            
            # Store the vector database
            vector_databases[pdf_id] = vector_db
            
            return {
                "pdf_id": pdf_id,
                "filename": file.filename,
                "chunks_count": len(chunks),
                "message": "PDF uploaded and indexed successfully"
            }
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)} chunks_count: {len(chunks)}") from e

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Prepare messages
        messages = [{"role": "system", "content": request.developer_message}]
        
        # If PDF ID is provided, retrieve relevant context
        context_message = ""
        if request.pdf_id and request.pdf_id in vector_databases:
            vector_db = vector_databases[request.pdf_id]
            
            # Search for relevant chunks based on user message
            relevant_chunks = vector_db.search_by_text(
                request.user_message, 
                k=3,  # Get top 3 most relevant chunks
                return_as_text=True
            )
            
            if relevant_chunks:
                context_message = "Based on the uploaded PDF, here is the relevant context:\n\n"
                for i, chunk in enumerate(relevant_chunks, 1):
                    context_message += f"Context {i}:\n{chunk}\n\n"
                
                context_message += "Please answer the user's question using ONLY the information provided in the context above. If the answer cannot be found in the context, please say so."
                
                # Update the system message to include context
                messages[0]["content"] = request.developer_message + "\n\n" + context_message
        
        # Add user message
        messages.append({"role": "user", "content": request.user_message})
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=messages,
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e)) from e

# Get list of uploaded PDFs
@app.get("/api/pdfs")
async def list_pdfs():
    """Get list of uploaded and indexed PDFs"""
    pdf_list = []
    for pdf_id, vector_db in vector_databases.items():
        pdf_list.append({
            "pdf_id": pdf_id,
            "chunks_count": len(vector_db.vectors)
        })
    return {"pdfs": pdf_list}

# Delete a PDF from memory
@app.delete("/api/pdfs/{pdf_id}")
async def delete_pdf(pdf_id: str):
    """Delete a PDF from memory"""
    if pdf_id in vector_databases:
        del vector_databases[pdf_id]
        return {"message": "PDF deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="PDF not found")

# Generate random questions based on topic
@app.post("/api/generate-questions")
async def generate_questions(request: QuestionGenerationRequest):
    """Generate random questions based on selected topic and optional PDF context"""
    try:
        # Initialize OpenAI client with the provided API key
        os.environ["OPENAI_API_KEY"] = request.api_key
        client = OpenAI(api_key=request.api_key)
        
        # Build the context for question generation
        context_chunks = []
        if request.pdf_id and request.pdf_id in vector_databases:
            vector_db = vector_databases[request.pdf_id]
            
            # Search for relevant chunks based on the topic
            try:
                relevant_chunks = vector_db.search_by_text(
                    request.topic, 
                    k=5,  # Get top 5 most relevant chunks
                    return_as_text=True
                )
                context_chunks = relevant_chunks
            except Exception as e:
                print(f"Error searching vector database: {e}")
                # Continue without context if search fails
        
        # Build the prompt for question generation
        difficulty_instructions = {
            "easy": "Generate simple, straightforward questions that test basic understanding and recall.",
            "medium": "Generate moderately complex questions that require some analysis and understanding of relationships.",
            "hard": "Generate challenging questions that require critical thinking, synthesis, and deep analysis."
        }
        
        question_type_instructions = {
            "factual": "Ask direct questions about facts, definitions, and specific information.",
            "analytical": "Ask questions that require analysis, comparison, and interpretation.",
            "application": "Ask questions about how concepts apply to real-world scenarios.",
            "synthesis": "Ask questions that require combining multiple concepts or ideas."
        }
        
        # Create the system prompt
        system_prompt = f"""You are an expert legal educator creating {request.difficulty} level MULTIPLE CHOICE questions about "{request.topic}".

DIFFICULTY LEVEL: {difficulty_instructions.get(request.difficulty, difficulty_instructions["medium"])}

QUESTION TYPES TO INCLUDE: {", ".join([question_type_instructions.get(qt, qt) for qt in request.question_types])}

INSTRUCTIONS:
1. Generate exactly {request.question_count} multiple choice question(s) about "{request.topic}"
2. Each question should be clear, specific, and educational
3. Vary the question types as requested: {", ".join(request.question_types)}
4. Each question must have exactly 4 answer choices (A, B, C, D)
5. Make questions that would help someone learn about this legal topic
6. Return questions in this EXACT JSON format:

[
  {{
    "question": "What is the definition of...",
    "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this is correct"
  }}
]

IMPORTANT: Return ONLY valid JSON array. No additional text or formatting.

"""

        # Add context if available
        if context_chunks:
            context_text = "\n\n".join([f"Context {i+1}: {chunk}" for i, chunk in enumerate(context_chunks)])
            system_prompt += f"""
RELEVANT CONTEXT FROM UPLOADED DOCUMENT:
{context_text}

Use this context to create more specific and relevant questions about "{request.topic}".
"""
        else:
            system_prompt += f"""
No specific document context provided. Generate general questions about "{request.topic}" based on your knowledge of legal concepts.
"""

        # Generate questions using OpenAI
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate {request.question_count} multiple choice questions about '{request.topic}' with {request.difficulty} difficulty level."}
            ],
            temperature=0.7,  # Balanced creativity and consistency
            max_tokens=2000
        )
        
        # Parse the response to extract questions
        questions_text = response.choices[0].message.content.strip()
        
        try:
            # Try to parse as JSON
            import json
            questions_data = json.loads(questions_text)
            
            # Validate the structure
            if not isinstance(questions_data, list):
                raise ValueError("Response is not a JSON array")
                
            for i, q in enumerate(questions_data):
                if not all(key in q for key in ["question", "choices", "correct_answer", "explanation"]):
                    raise ValueError(f"Question {i+1} missing required fields")
                if not isinstance(q["choices"], list) or len(q["choices"]) != 4:
                    raise ValueError(f"Question {i+1} must have exactly 4 choices")
                if not (0 <= q["correct_answer"] <= 3):
                    raise ValueError(f"Question {i+1} correct_answer must be 0-3")
            
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback: create a simple multiple choice question
            print(f"Failed to parse JSON response: {e}")
            questions_data = [{
                "question": f"What are the key legal aspects of {request.topic}?",
                "choices": [
                    "It involves criminal penalties",
                    "It is a civil matter only", 
                    "It has no legal implications",
                    "It depends on the specific circumstances"
                ],
                "correct_answer": 3,
                "explanation": "Legal matters often depend on specific circumstances and context."
            }]
        
        return {
            "topic": request.topic,
            "questions": questions_data[:request.question_count],
            "difficulty": request.difficulty,
            "question_types": request.question_types,
            "has_context": len(context_chunks) > 0,
            "context_chunks_used": len(context_chunks)
        }
        
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}") from e

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
