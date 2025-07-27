from flask import render_template, request, redirect, session, url_for, flash
from flask_login import current_user
from app import app, db
from replit_auth import require_login, make_replit_blueprint
from models import Student, QuizResult, MemoryScore
from datetime import datetime

app.register_blueprint(make_replit_blueprint(), url_prefix="/auth")

# Make session permanent
@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route('/')
def home():
    if current_user.is_authenticated and current_user.is_teacher:
        return redirect(url_for('teacher_dashboard'))
    return render_template('home.html')

@app.route('/quiz', methods=['GET', 'POST'])
def quiz():
    if request.method == 'POST':
        scores = {'Visual': 0, 'Auditory': 0, 'Kinesthetic': 0}
        for i in range(1, 11):
            answer = request.form.get(f'q{i}')
            if answer in scores:
                scores[answer] += 1
        session['scores'] = scores
        
        # If student is registered, save the result
        student_id = session.get('student_id')
        if student_id:
            dominant = max(scores, key=scores.get)
            quiz_result = QuizResult(
                student_id=student_id,
                visual_score=scores['Visual'],
                auditory_score=scores['Auditory'],
                kinesthetic_score=scores['Kinesthetic'],
                dominant_style=dominant
            )
            db.session.add(quiz_result)
            db.session.commit()
        
        return redirect(url_for('result'))
    return render_template('quiz.html')

@app.route('/result')
def result():
    scores = session.get('scores', {'Visual': 0, 'Auditory': 0, 'Kinesthetic': 0})
    dominant = max(scores, key=scores.get)
    return render_template('result.html', scores=scores, dominant=dominant)

@app.route('/tips')
def tips():
    scores = session.get('scores', {'Visual': 0, 'Auditory': 0, 'Kinesthetic': 0})
    dominant = max(scores, key=scores.get)
    return render_template('tips.html', style=dominant)

@app.route('/memory')
def memory():
    return render_template('memory.html')

@app.route('/memory/visual')
def memory_visual():
    return render_template('memory_visual.html')

@app.route('/memory/audio')
def memory_audio():
    return render_template('memory_audio.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/mix-learning-style')
def mix_learning_style():
    return render_template('mix_learning_style.html')

@app.route('/note-analyzer', methods=['GET', 'POST'])
def note_analyzer():
    if request.method == 'POST':
        # Handle file upload and analyze notes
        if 'note_image' not in request.files:
            flash('No file uploaded!', 'error')
            return redirect(request.url)
        
        file = request.files['note_image']
        if file.filename == '':
            flash('No file selected!', 'error')
            return redirect(request.url)
        
        # For now, provide sample analysis based on filename or random selection
        analysis_results = analyze_note_style(file.filename)
        return render_template('note_analyzer.html', analysis=analysis_results)
    
    return render_template('note_analyzer.html')

@app.route('/daily-challenge')
def daily_challenge():
    return render_template('daily_challenge.html')

@app.route('/style-coach')
def style_coach():
    # Get user's learning style from session or default to Visual
    scores = session.get('scores', {'Visual': 0, 'Auditory': 0, 'Kinesthetic': 0})
    dominant = max(scores, key=scores.get) if any(scores.values()) else 'Visual'
    return render_template('style_coach.html', style=dominant)

@app.route('/style-challenge')
def style_challenge():
    return render_template('style_challenge.html')

@app.route('/kinesthetic-game')
def kinesthetic_game():
    return render_template('kinesthetic_game.html')

@app.route('/restart')
def restart():
    # Keep student_id if it exists
    student_id = session.get('student_id')
    session.clear()
    if student_id:
        session['student_id'] = student_id
    return redirect(url_for('home'))

@app.route('/student/register', methods=['GET', 'POST'])
def student_register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        teacher_code = request.form.get('teacher_code')
        
        if not name or not teacher_code:
            flash('Name and teacher code are required!', 'error')
            return render_template('student_register.html')
        
        # Find teacher by ID (teacher_code is the teacher's user ID)
        from models import User
        teacher = User.query.filter_by(id=teacher_code, is_teacher=True).first()
        if not teacher:
            flash('Invalid teacher code!', 'error')
            return render_template('student_register.html')
        
        # Create student
        student = Student(name=name, email=email, teacher_id=teacher.id)
        db.session.add(student)
        db.session.commit()
        
        # Store student ID in session
        session['student_id'] = student.id
        session['student_name'] = student.name
        
        flash(f'Successfully registered under {teacher.first_name or teacher.email}!', 'success')
        return redirect(url_for('home'))
    
    return render_template('student_register.html')

@app.route('/teacher/dashboard')
@require_login
def teacher_dashboard():
    if not current_user.is_teacher:
        flash('Access denied. Teachers only.', 'error')
        return redirect(url_for('home'))
    
    students = Student.query.filter_by(teacher_id=current_user.id).all()
    
    # Get recent quiz results
    quiz_results = []
    for student in students:
        latest_quiz = QuizResult.query.filter_by(student_id=student.id).order_by(QuizResult.created_at.desc()).first()
        if latest_quiz:
            quiz_results.append({
                'student': student,
                'result': latest_quiz
            })
    
    # Get recent memory scores
    memory_scores = []
    for student in students:
        recent_scores = MemoryScore.query.filter_by(student_id=student.id).order_by(MemoryScore.created_at.desc()).limit(5).all()
        if recent_scores:
            memory_scores.append({
                'student': student,
                'scores': recent_scores
            })
    
    return render_template('teacher_dashboard.html', 
                         students=students, 
                         quiz_results=quiz_results, 
                         memory_scores=memory_scores,
                         teacher_code=current_user.id)

@app.route('/memory/save_score', methods=['POST'])
def save_memory_score():
    student_id = session.get('student_id')
    if not student_id:
        return {'success': False, 'message': 'Not registered as student'}
    
    game_type = request.form.get('game_type')
    score = int(request.form.get('score', 0))
    time_taken = int(request.form.get('time_taken', 0))
    difficulty = request.form.get('difficulty', 'easy')
    
    memory_score = MemoryScore(
        student_id=student_id,
        game_type=game_type,
        score=score,
        time_taken=time_taken,
        difficulty=difficulty
    )
    db.session.add(memory_score)
    db.session.commit()
    
    return {'success': True}

def analyze_note_style(filename):
    """Analyze uploaded notes and provide learning style feedback"""
    import random
    
    # Sample analysis based on common note-taking patterns
    patterns = [
        {
            'style': 'Visual',
            'confidence': 85,
            'features': ['Charts/diagrams detected', 'Color coding used', 'Mind map structure'],
            'feedback': 'Great visual organization! Your notes show strong visual learning patterns.',
            'tips': [
                'Continue using colors and diagrams',
                'Try adding more symbols and icons',
                'Consider digital mind mapping tools'
            ]
        },
        {
            'style': 'Kinesthetic',
            'confidence': 78,
            'features': ['Handwritten notes', 'Bullet points', 'Action-oriented language'],
            'feedback': 'Your hands-on approach to note-taking shows kinesthetic learning!',
            'tips': [
                'Try taking notes while standing or walking',
                'Use sticky notes for key concepts',
                'Practice rewriting important points'
            ]
        },
        {
            'style': 'Auditory',
            'confidence': 72,
            'features': ['Question format notes', 'Dialogue structure', 'Sound-related keywords'],
            'feedback': 'Your notes suggest you learn well through listening and discussion!',
            'tips': [
                'Try recording yourself reading your notes',
                'Discuss key points with study partners',
                'Use text-to-speech for review'
            ]
        }
    ]
    
    # Return random analysis for demo purposes
    return random.choice(patterns)
