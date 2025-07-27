// Visual Memory Game Implementation
class VisualMemoryGame {
    constructor() {
        this.patterns = [
            { type: 'circle', color: '#FF6B6B' },
            { type: 'square', color: '#4ECDC4' },
            { type: 'triangle', color: '#45B7D1' },
            { type: 'diamond', color: '#96CEB4' },
            { type: 'star', color: '#FFEAA7' },
            { type: 'hexagon', color: '#DDA0DD' },
            { type: 'heart', color: '#FF7675' },
            { type: 'oval', color: '#74B9FF' }
        ];
        
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.gameTimer = null;
        this.gameActive = false;
        this.difficulty = 'easy';
        this.totalPairs = 4;
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('game-board');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.movesCounter = document.getElementById('moves-count');
        this.timerDisplay = document.getElementById('timer');
        this.matchesCounter = document.getElementById('matches-count');
        this.scoreDisplay = document.getElementById('score');
        this.gameComplete = document.getElementById('game-complete');
        this.finalTime = document.getElementById('final-time');
        this.finalMoves = document.getElementById('final-moves');
        this.finalScore = document.getElementById('final-score');
        this.finalDifficulty = document.getElementById('final-difficulty');
        
        this.difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        this.difficultyRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                this.setDifficulty();
            });
        });
    }
    
    setDifficulty() {
        switch(this.difficulty) {
            case 'easy':
                this.totalPairs = 4;
                this.gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
                this.gameBoard.style.gridTemplateRows = 'repeat(2, 1fr)';
                break;
            case 'medium':
                this.totalPairs = 6;
                this.gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
                this.gameBoard.style.gridTemplateRows = 'repeat(3, 1fr)';
                break;
            case 'hard':
                this.totalPairs = 8;
                this.gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
                this.gameBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
                break;
        }
        this.matchesCounter.textContent = `0/${this.totalPairs}`;
    }
    
    startGame() {
        this.setDifficulty();
        
        this.gameActive = true;
        this.startTime = Date.now();
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        
        this.startBtn.style.display = 'none';
        this.resetBtn.style.display = 'inline-block';
        this.gameComplete.style.display = 'none';
        
        this.createBoard();
        this.startTimer();
        this.updateDisplay();
    }
    
    createBoard() {
        // Select patterns based on difficulty
        const selectedPatterns = this.patterns.slice(0, this.totalPairs);
        this.cards = [...selectedPatterns, ...selectedPatterns];
        this.shuffleArray(this.cards);
        
        // Clear board
        this.gameBoard.innerHTML = '';
        
        // Create card elements
        this.cards.forEach((pattern, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'visual-card';
            cardElement.dataset.pattern = JSON.stringify(pattern);
            cardElement.dataset.index = index;
            
            // Create the visual pattern
            const imageDiv = document.createElement('div');
            imageDiv.className = 'card-image';
            imageDiv.style.backgroundImage = this.createPatternSVG(pattern);
            cardElement.appendChild(imageDiv);
            
            cardElement.addEventListener('click', () => this.flipCard(cardElement));
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    createPatternSVG(pattern) {
        const size = 80;
        const center = size / 2;
        let svg = '';
        
        switch(pattern.type) {
            case 'circle':
                svg = `<circle cx="${center}" cy="${center}" r="30" fill="${pattern.color}"/>`;
                break;
            case 'square':
                svg = `<rect x="15" y="15" width="50" height="50" fill="${pattern.color}"/>`;
                break;
            case 'triangle':
                svg = `<polygon points="${center},15 15,65 65,65" fill="${pattern.color}"/>`;
                break;
            case 'diamond':
                svg = `<polygon points="${center},10 65,${center} ${center},70 15,${center}" fill="${pattern.color}"/>`;
                break;
            case 'star':
                svg = `<polygon points="${center},10 45,30 70,30 50,45 60,70 ${center},55 20,70 30,45 10,30 35,30" fill="${pattern.color}"/>`;
                break;
            case 'hexagon':
                svg = `<polygon points="20,30 20,50 ${center},60 60,50 60,30 ${center},20" fill="${pattern.color}"/>`;
                break;
            case 'heart':
                svg = `<path d="M${center},60 C${center},50 20,35 20,25 C20,15 30,10 ${center},20 C50,10 60,15 60,25 C60,35 ${center},50 ${center},60 Z" fill="${pattern.color}"/>`;
                break;
            case 'oval':
                svg = `<ellipse cx="${center}" cy="${center}" rx="35" ry="25" fill="${pattern.color}"/>`;
                break;
        }
        
        const fullSVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svg}</svg>`)}`;
        return `url("${fullSVG}")`;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    flipCard(cardElement) {
        if (!this.gameActive || 
            cardElement.classList.contains('flipped') || 
            cardElement.classList.contains('matched') ||
            this.flippedCards.length >= 2) {
            return;
        }
        
        cardElement.classList.add('flipped');
        this.flippedCards.push(cardElement);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            setTimeout(() => this.checkMatch(), 1000);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.dataset.pattern === card2.dataset.pattern) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            
            if (this.matchedPairs === this.totalPairs) {
                this.endGame();
            }
        } else {
            // No match
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }
        
        this.flippedCards = [];
        this.updateDisplay();
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    updateDisplay() {
        this.movesCounter.textContent = this.moves;
        this.matchesCounter.textContent = `${this.matchedPairs}/${this.totalPairs}`;
        
        // Calculate and display current score
        const currentTime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        const baseScore = this.difficulty === 'easy' ? 500 : this.difficulty === 'medium' ? 800 : 1200;
        const score = Math.max(baseScore - (this.moves * 15) - (currentTime * 2), 50);
        this.scoreDisplay.textContent = score;
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Calculate final score
        const baseScore = this.difficulty === 'easy' ? 500 : this.difficulty === 'medium' ? 800 : 1200;
        const finalScore = Math.max(baseScore - (this.moves * 15) - (totalTime * 2), 50);
        
        this.finalTime.textContent = timeString;
        this.finalMoves.textContent = this.moves;
        this.finalScore.textContent = finalScore;
        this.finalDifficulty.textContent = this.difficulty;
        this.gameComplete.style.display = 'block';
        
        // Save score
        this.saveScore('visual', finalScore, totalTime);
    }
    
    async saveScore(gameType, score, timeInSeconds) {
        try {
            const formData = new FormData();
            formData.append('game_type', gameType);
            formData.append('score', score);
            formData.append('time_taken', timeInSeconds);
            formData.append('difficulty', this.difficulty);
            
            const response = await fetch('/memory/save_score', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('Score saved successfully');
            }
        } catch (error) {
            console.log('Could not save score:', error);
        }
    }
    
    resetGame() {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        
        this.startBtn.style.display = 'inline-block';
        this.resetBtn.style.display = 'none';
        this.gameComplete.style.display = 'none';
        
        this.gameBoard.innerHTML = '';
        this.timerDisplay.textContent = '0:00';
        this.movesCounter.textContent = '0';
        this.scoreDisplay.textContent = '0';
        this.setDifficulty();
    }
}

// Global function for play again button
function playAgain() {
    if (window.visualMemoryGame) {
        window.visualMemoryGame.resetGame();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.visualMemoryGame = new VisualMemoryGame();
});
