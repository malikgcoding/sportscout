class FitnessPersonalityQuiz {
    constructor() {
        this.questions = [
            {
                text: "What motivates you most during workouts?",
                answers: ["Competing with others", "Personal achievement", "Social interaction", "Stress relief", "Routine and structure"],
                weights: { competitor: [5,3,2,1,2], achiever: [3,5,2,2,3], social: [2,2,5,3,1], mindful: [1,2,3,5,2], structured: [2,4,1,2,5] }
            },
            {
                text: "How do you prefer to exercise?",
                answers: ["In groups or teams", "With a workout buddy", "Alone with music", "In nature outdoors", "Following a strict plan"],
                weights: { competitor: [4,3,2,2,3], achiever: [2,3,4,3,4], social: [5,4,2,3,1], mindful: [2,2,3,5,2], structured: [3,2,3,2,5] }
            },
            {
                text: "What's your ideal workout environment?",
                answers: ["Busy gym with energy", "Quiet home setup", "Outdoor spaces", "Specialized studios", "Familiar consistent space"],
                weights: { competitor: [5,1,3,3,2], achiever: [3,4,3,2,3], social: [4,2,3,4,2], mindful: [2,3,5,3,2], structured: [3,3,2,3,5] }
            },
            {
                text: "How do you track your fitness progress?",
                answers: ["Compare with others", "Personal records and data", "How clothes fit", "How I feel mentally", "Detailed workout logs"],
                weights: { competitor: [5,3,2,1,3], achiever: [2,5,3,2,4], social: [3,2,4,3,2], mindful: [1,2,3,5,2], structured: [3,4,2,2,5] }
            },
            {
                text: "What's your approach to trying new workouts?",
                answers: ["Love the challenge", "Research thoroughly first", "Try with friends", "Follow my intuition", "Stick to proven methods"],
                weights: { competitor: [5,2,3,2,1], achiever: [4,4,2,3,2], social: [3,2,5,2,2], mindful: [2,2,2,5,3], structured: [2,3,2,2,5] }
            },
            {
                text: "How do you handle workout plateaus?",
                answers: ["Push harder and compete", "Analyze and adjust strategy", "Find workout partners", "Listen to my body", "Follow a structured plan"],
                weights: { competitor: [5,3,2,1,2], achiever: [3,5,2,2,3], social: [2,3,5,2,2], mindful: [1,2,2,5,3], structured: [2,4,2,2,5] }
            }
        ];

        this.currentQuestionIndex = 0;
        this.answers = [];
        this.selectedAnswerIndex = -1;
        
        this.initializeQuiz();
    }

    initializeQuiz() {
        document.getElementById('total-questions').textContent = this.questions.length;
        this.displayQuestion();
        this.updateNavigationButtons();
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        document.getElementById('question-text').textContent = question.text;
        document.getElementById('current-question').textContent = (this.currentQuestionIndex + 1).toString();

        const container = document.getElementById('answers-container');
        container.innerHTML = '';
        this.selectedAnswerIndex = -1;

        question.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer;
            button.onclick = () => this.selectAnswer(index);
            container.appendChild(button);
        });

        // Restore previous answer if exists
        if (this.answers[this.currentQuestionIndex] !== undefined) {
            this.selectAnswer(this.answers[this.currentQuestionIndex]);
        }

        this.updateNavigationButtons();
    }

    selectAnswer(answerIndex) {
        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => btn.classList.remove('selected'));
        answerButtons[answerIndex].classList.add('selected');
        
        this.selectedAnswerIndex = answerIndex;
        this.answers[this.currentQuestionIndex] = answerIndex;
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (this.currentQuestionIndex === 0) {
            prevBtn.textContent = 'Back to Dashboard';
            prevBtn.onclick = () => window.location.href = 'dashboard.html';
        } else {
            prevBtn.textContent = 'Previous';
            prevBtn.onclick = () => this.previousQuestion();
        }

        nextBtn.disabled = this.selectedAnswerIndex === -1;
        
        if (this.currentQuestionIndex === this.questions.length - 1) {
            nextBtn.textContent = 'Finish';
        } else {
            nextBtn.textContent = 'Next';
        }

        nextBtn.onclick = () => this.nextQuestion();
    }

    nextQuestion() {
        if (this.selectedAnswerIndex === -1) return;

        if (this.currentQuestionIndex === this.questions.length - 1) {
            this.finishQuiz();
        } else {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            
            if (this.answers[this.currentQuestionIndex] !== undefined) {
                this.selectAnswer(this.answers[this.currentQuestionIndex]);
            }
        }
    }

    async finishQuiz() {
        const result = this.calculateResult();
        
        // Save basic result immediately
        localStorage.setItem('fitnessPersonalityResult', JSON.stringify({
            type: result.title,
            description: result.description,
            completedAt: Date.now()
        }));
        
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        const aiPrompt = this.generateAIPrompt(result);
        
        this.showLoadingState();
        
        // Start AI request and redirect after delay
        this.processAIRequest(aiPrompt, result);
        this.startRedirectCountdown();
    }

    startRedirectCountdown() {
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = 'dashboard.html';
            }
            countdown--;
        }, 1000);
    }

    generateAIPrompt(result) {
        const answerSummary = this.answers.map((answerIndex, questionIndex) => {
            const question = this.questions[questionIndex];
            return `Question: "${question.text}" - Answer: "${question.answers[answerIndex]}"`;
        }).join('. ');

        return `Based on this fitness personality assessment: ${answerSummary}. 

The user's fitness personality is: ${result.title} - ${result.description}

Please provide personalized fitness recommendations including:
1. Workout styles that match their personality
2. Motivation strategies that work for their type
3. Training environment preferences
4. 3-4 specific activities or sports that align with their fitness personality

Format your response as:

WORKOUT STYLES:
[Specific workout types and approaches that match their personality]

MOTIVATION STRATEGIES:
[How to stay motivated based on their personality type]

TRAINING ENVIRONMENT:
[Ideal settings and conditions for their workouts]

RECOMMENDED ACTIVITIES:
1. [Activity]: [Why it matches their fitness personality]
2. [Activity]: [Why it matches their fitness personality]
3. [Activity]: [Why it matches their fitness personality]`;
    }

    async processAIRequest(aiPrompt, basicResult) {
        try {
            const response = await fetch('deepseek-proxy.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: aiPrompt
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const responseText = await response.text();
            const data = JSON.parse(responseText);
            
            if (data.success && data.recommendation) {
                // Update stored result with AI response
                localStorage.setItem('fitnessPersonalityResult', JSON.stringify({
                    type: basicResult.title,
                    description: basicResult.description,
                    aiResponse: data.recommendation,
                    completedAt: Date.now()
                }));
            }
        } catch (error) {
            console.error('AI request failed:', error);
            // Keep basic result even if AI fails
        }
    }

    showLoadingState() {
        const recommendationDisplay = document.getElementById('ai-recommendation');
        recommendationDisplay.innerHTML = `
            <div class="loading-screen">
                <div class="loading-spinner"></div>
                <div class="loading-text">Analyzing Your Fitness Personality</div>
                <div class="loading-subtext">Redirecting to dashboard...</div>
            </div>
        `;
    }

    showResult(result) {
        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        document.querySelector('.result-title').textContent = result.title;
        
        let contentHTML = `<div style="margin-bottom: 20px;">${result.description}</div>`;
        
        if (result.aiResponse) {
            contentHTML += `
                <div style="background: rgba(60, 60, 60, 0.4); padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <h4 style="color: #22c55e; margin-bottom: 10px;">🥗 Personalized Nutrition Plan</h4>
                    <div style="white-space: pre-line; line-height: 1.6;">${result.aiResponse}</div>
                </div>
            `;
        } else if (result.error) {
            contentHTML += `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 6px; margin-top: 15px;">
                    <p style="color: #ef4444; font-size: 0.9rem;">AI recommendations temporarily unavailable. Your basic profile has been saved.</p>
                </div>
            `;
        }
        
        document.getElementById('result-content').innerHTML = contentHTML;

        localStorage.setItem('fitnessPersonalityResult', JSON.stringify({
            type: result.title,
            description: result.description,
            aiResponse: result.aiResponse || null,
            completedAt: Date.now()
        }));
    }

    calculateResult() {
        const scores = { competitor: 0, achiever: 0, social: 0, mindful: 0, structured: 0 };

        this.answers.forEach((answerIndex, questionIndex) => {
            const question = this.questions[questionIndex];
            Object.keys(question.weights).forEach(type => {
                scores[type] += question.weights[type][answerIndex];
            });
        });

        const topType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

        const personalityTypes = {
            competitor: {
                title: "The Competitor",
                description: "You thrive on competition and challenges. You're motivated by comparing your performance with others and pushing your limits through competitive activities."
            },
            achiever: {
                title: "The Goal Achiever",
                description: "You're driven by personal accomplishment and measurable progress. You prefer structured approaches with clear metrics and personal records to beat."
            },
            social: {
                title: "The Social Exerciser",
                description: "You find motivation through social connections and group activities. Working out with others energizes you and keeps you accountable."
            },
            mindful: {
                title: "The Mindful Mover",
                description: "You focus on how exercise makes you feel mentally and physically. You prefer intuitive, holistic approaches that connect mind and body."
            },
            structured: {
                title: "The Systematic Trainer",
                description: "You excel with organized, consistent routines. You prefer detailed plans, regular schedules, and methodical approaches to fitness."
            }
        };

        return personalityTypes[topType];
    }
}

// Global functions
let quiz;

function nextQuestion() {
    quiz.nextQuestion();
}

function previousQuestion() {
    quiz.previousQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
    quiz = new FitnessPersonalityQuiz();
});
