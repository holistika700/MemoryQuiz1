// Audio Memory Game Implementation
class AudioMemoryGame {
    constructor() {
        this.sounds = [];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.gameTimer = null;
        this.gameActive = false;
        this.totalPairs = 6;
        this.volumeEnabled = true;
        this.currentlyPlaying = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    initializeElements() {
        this.gameBoard = document.getElementById('game-board');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.volumeBtn = document.getElementById('volume-btn');
        this.movesCounter = document.getElementById('moves-count');
        this.timerDisplay = document.getElementById('timer');
        this.matchesCounter = document.getElementById('matches-count');
        this.scoreDisplay = document.getElementById('score');
        this.gameComplete = document.getElementById('game-complete');
        this.finalTime = document.getElementById('final-time');
        this.finalMoves = document.getElementById('final-moves');
        this.finalScore = document.getElementById('final-score');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.volumeBtn.addEventListener('click', () => this.toggleVolume());
    }
    
    async initializeAudio() {
        try {
            // Initialize Tone.js
            await Tone.start();
            
            // Create different types of sounds using Tone.js
            this.sounds = [
                {
                    name: 'bell',
                    icon: 'fas fa-bell',
                    create: () => {
                        const synth = new Tone.Synth({
                            oscillator: { type: 'sine' },
                            envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 1.0 }
                        }).toDestination();
                        return () => synth.triggerAttackRelease('C5', '0.5n');
                    }
                },
                {
                    name: 'drum',
                    icon: 'fas fa-drum',
                    create: () => {
                        const noise = new Tone.Noise('pink').toDestination();
                        const env = new Tone.AmplitudeEnvelope({
                            attack: 0.01, decay: 0.2, sustain: 0, release: 0.2
                        }).toDestination();
                        noise.connect(env);
                        return () => {
                            noise.start();
                            env.triggerAttackRelease('0.2n');
                            setTimeout(() => noise.stop(), 200);
                        };
                    }
                },
                {
                    name: 'piano',
                    icon: 'fas fa-music',
                    create: () => {
                        const synth = new Tone.Synth({
                            oscillator: { type: 'triangle' },
                            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1.0 }
                        }).toDestination();
                        return () => synth.triggerAttackRelease('G4', '0.5n');
                    }
                },
                {
                    name: 'chime',
                    icon: 'fas fa-wind-chimes',
                    create: () => {
                        const synth = new Tone.FMSynth({
                            harmonicity: 3,
                            modulationIndex: 10,
                            envelope: { attack: 0.01, decay: 0.01, sustain: 1, release: 0.5 }
                        }).toDestination();
                        return () => synth.triggerAttackRelease('E5', '0.8n');
                    }
                },
                {
                    name: 'bass',
                    icon: 'fas fa-volume-down',
                    create: () => {
                        const synth = new Tone.Synth({
                            oscillator: { type: 'sawtooth' },
                            envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 0.8 }
                        }).toDestination();
                        return () => synth.triggerAttackRelease('C3', '0.6n');
                    }
                },
                {
                    name: 'whistle',
                    icon: 'fas fa-wind',
                    create: () => {
                        const synth = new Tone.Synth({
                            oscillator: { type: 'sine' },
                            envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.3 }
                        }).toDestination();
                        return () => synth.triggerAttackRelease('F6', '0.4n');
                    }
                }
            ];
            
            // Create the sound functions
            this.sounds.forEach(sound => {
                sound.play = sound.create();
            });
            
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            this.showAudioError();
        }
    }
    
    showAudioError() {
        const audioNote = document.querySelector('.audio-note');
        if (audioNote) {
            audioNote.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle text-warning me-3 fa-2x"></i>
                    <div>
                        <h6 class="mb-1">Audio Initialization Failed</h6>
                        <p class="mb-0">The audio memory game requires browser audio support. Please try refreshing the page or use a different browser.</p>
                    </div>
                </div>
            `;
        }
    }
    
    toggleVolume() {
        this.volumeEnabled = !this.volumeEnabled;
        const icon = this.volumeBtn.querySelector('i');
        
        if (this.volumeEnabled) {
            icon.className = 'fas fa-volume-up';
            this.volumeBtn.classList.remove('btn-outline-danger');
            this.volumeBtn.classList.add('btn-outline-info');
        } else {
            icon.className = 'fas fa-volume-mute';
            this.volumeBtn.classList.remove('btn-outline-info');
            this.volumeBtn.classList.add('btn-outline-danger');
        }
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
        // Create pairs of sounds
        this.cards = [...this.sounds, ...this.sounds];
        this.shuffleArray(this.cards);
        
        // Clear board
        this.gameBoard.innerHTML = '';
        
        // Create card elements
        this.cards.forEach((sound, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'audio-card';
            cardElement.dataset.sound = sound.name;
            cardElement.dataset.index = index;
            
            const iconElement = document.createElement('i');
            iconElement.className = `card-icon ${sound.icon}`;
            cardElement.appendChild(iconElement);
            
            cardElement.addEventListener('click', () => this.playCard(cardElement));
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    async playCard(cardElement) {
        if (!this.gameActive || 
            cardElement.classList.contains('matched') ||
            this.flippedCards.length >= 2 ||
            this.currentlyPlaying === cardElement) {
            return;
        }
        
        // Stop any currently playing card
        if (this.currentlyPlaying) {
            this.currentlyPlaying.classList.remove('playing');
        }
        
        // Play the sound if volume is enabled
        if (this.volumeEnabled) {
            const soundName = cardElement.dataset.sound;
            const sound = this.sounds.find(s => s.name === soundName);
            if (sound && sound.play) {
                try {
                    cardElement.classList.add('playing');
                    this.currentlyPlaying = cardElement;
                    
                    sound.play();
                    
                    // Remove playing class after animation
                    setTimeout(() => {
                        cardElement.classList.remove('playing');
                        if (this.currentlyPlaying === cardElement) {
                            this.currentlyPlaying = null;
                        }
                    }, 1000);
                } catch (error) {
                    console.error('Failed to play sound:', error);
                }
            }
        }
        
        // Add to flipped cards
        this.flippedCards.push(cardElement);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            setTimeout(() => this.checkMatch(), 1500);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.dataset.sound === card2.dataset.sound) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            
            // Play success sound
            if (this.volumeEnabled) {
                try {
                    const successSynth = new Tone.Synth().toDestination();
                    successSynth.triggerAttackRelease('C5', '0.2n');
                    successSynth.triggerAttackRelease('E5', '0.2n', '+0.1');
                    successSynth.triggerAttackRelease('G5', '0.3n', '+0.2');
                } catch (error) {
                    console.error('Failed to play success sound:', error);
                }
            }
            
            if (this.matchedPairs === this.totalPairs) {
                this.endGame();
            }
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
        const score = Math.max(800 - (this.moves * 20) - (currentTime * 3), 100);
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
        const finalScore = Math.max(800 - (this.moves * 20) - (totalTime * 3), 100);
        
        this.finalTime.textContent = timeString;
        this.finalMoves.textContent = this.moves;
        this.finalScore.textContent = finalScore;
        this.gameComplete.style.display = 'block';
        
        // Play completion sound
        if (this.volumeEnabled) {
            try {
                const completionSynth = new Tone.Synth().toDestination();
                const melody = ['C5', 'E5', 'G5', 'C6'];
                melody.forEach((note, index) => {
                    completionSynth.triggerAttackRelease(note, '0.3n', `+${index * 0.2}`);
                });
            } catch (error) {
                console.error('Failed to play completion sound:', error);
            }
        }
        
        // Save score
        this.saveScore('audio', finalScore, totalTime);
    }
    
    async saveScore(gameType, score, timeInSeconds) {
        try {
            const formData = new FormData();
            formData.append('game_type', gameType);
            formData.append('score', score);
            formData.append('time_taken', timeInSeconds);
            formData.append('difficulty', 'medium'); // Audio game has fixed difficulty
            
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
        
        // Stop any playing sounds
        if (this.currentlyPlaying) {
            this.currentlyPlaying.classList.remove('playing');
            this.currentlyPlaying = null;
        }
        
        this.startBtn.style.display = 'inline-block';
        this.resetBtn.style.display = 'none';
        this.gameComplete.style.display = 'none';
        
        this.gameBoard.innerHTML = '';
        this.timerDisplay.textContent = '0:00';
        this.movesCounter.textContent = '0';
        this.matchesCounter.textContent = '0/6';
        this.scoreDisplay.textContent = '0';
    }
}

// Global function for play again button
function playAgain() {
    if (window.audioMemoryGame) {
        window.audioMemoryGame.resetGame();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.audioMemoryGame = new AudioMemoryGame();
});
