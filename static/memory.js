// Basic Memory Game Implementation
class BasicMemoryGame {
    constructor() {
        this.emojis = ['🌟', '🎈', '🎁', '🎯', '🎨', '🎭', '🎪', '🎸'];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.gameTimer = null;
        this.gameActive = false;
        this.totalPairs = 8;
        
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
        this.gameComplete = document.getElementById('game-complete');
        this.finalTime = document.getElementById('final-time');
        this.finalMoves = document.getElementById('final-moves');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
    }
    
    startGame() {
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
        // Create pairs of emojis
        this.cards = [...this.emojis, ...this.emojis];
        this.shuffleArray(this.cards);
        
        // Clear board
        this.gameBoard.innerHTML = '';
        
        // Create card elements
        this.cards.forEach((emoji, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.emoji = emoji;
            cardElement.dataset.index = index;
            cardElement.addEventListener('click', () => this.flipCard(cardElement));
            this.gameBoard.appendChild(cardElement);
        });
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
        cardElement.textContent = cardElement.dataset.emoji;
        this.flippedCards.push(cardElement);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            setTimeout(() => this.checkMatch(), 800);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.dataset.emoji === card2.dataset.emoji) {
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
            card1.textContent = '';
            card2.textContent = '';
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
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.finalTime.textContent = timeString;
        this.finalMoves.textContent = this.moves;
        this.gameComplete.style.display = 'block';
        
        // Calculate score (higher is better, based on speed and efficiency)
        const score = Math.max(1000 - (this.moves * 10) - totalTime, 100);
        
        // Save score if student is registered
        this.saveScore('basic', score, totalTime);
    }
    
    async saveScore(gameType, score, timeInSeconds) {
        try {
            const formData = new FormData();
            formData.append('game_type', gameType);
            formData.append('score', score);
            formData.append('time_taken', timeInSeconds);
            formData.append('difficulty', 'easy');
            
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
        this.matchesCounter.textContent = '0/8';
    }
}

// Global function for play again button
function playAgain() {
    if (window.memoryGame) {
        window.memoryGame.resetGame();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.memoryGame = new BasicMemoryGame();
});
