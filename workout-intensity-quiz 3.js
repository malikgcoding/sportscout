class WorkoutIntensityQuiz {
    constructor() {
        this.questions = [
            {
                text: "How do you prefer to start your workouts?",
                answers: ["Gentle warm-up and gradual build", "Quick warm-up then go hard", "Jump right into intense activity", "Long warm-up and preparation", "Whatever feels right that day"],
                weights: { low: [4,2,1,3,3], moderate: [3,4,2,4,4], high: [1,3,5,2,2], variable: [2,3,3,3,5] }
            },
            {
                text: "What's your ideal workout duration?",
                answers: ["30 minutes or less", "30-45 minutes", "45-60 minutes", "60-90 minutes", "As long as it takes"],
                weights: { low: [3,4,3,2,2], moderate: [2,4,5,3,3], high: [4,3,3,2,2], variable: [3,3,4,4,5] }
            },
            {
                text: "How do you feel about high-intensity intervals?",
                answers: ["Too intense for me", "Occasionally, if I'm feeling good", "Love them, use them regularly", "Prefer steady-state exercise", "Mix it up based on mood"],
                weights: { low: [5,2,1,4,2], moderate: [2,4,3,3,4], high: [1,2,5,1,3], variable: [2,3,3,2,5] }
            },
            {
                text: "How often do you work out per week?",
                answers: ["1-2 times", "3-4 times", "5-6 times", "Daily", "Varies by schedule"],
                weights: { low: [5,3,1,1,3], moderate: [3,5,3,2,4], high: [1,3,5,4,2], variable: [2,4,2,2,5] }
            },
            {
                text: "How do you gauge workout intensity?",
                answers: ["Barely break a sweat", "Moderate breathing increase", "Heavy breathing, high heart rate", "Push to near maximum", "Listen to my body signals"],
                weights: { low: [5,3,1,1,2], moderate: [2,5,3,2,3], high: [1,2,4,5,2], variable: [3,4,2,2,5] }
            },
            {
                text: "What's your recovery approach?",
                answers: ["Minimal recovery needed", "Rest day between workouts", "Active recovery sessions", "Structured recovery protocols", "Recovery as needed"],
                weights: { low: [4,4,3,2,3], moderate: [2,4,5,3,4], high: [2,2,3,5,3], variable: [3,3,4,3,5] }
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
        localStorage.setItem('workoutIntensityResult', JSON.stringify({
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

        return `Based on this workout intensity assessment: ${answerSummary}. 

The user's workout intensity preference is: ${result.title} - ${result.description}

Please provide specific workout intensity recommendations including:
1. Optimal workout intensity levels and heart rate zones
2. Workout frequency and duration recommendations
3. Progressive training approach
4. 3-4 sports/activities that match their intensity preference

Format your response as:

INTENSITY GUIDELINES:
[Specific heart rate zones, effort levels, and intensity markers]

FREQUENCY & DURATION:
[Recommended workout schedule and session lengths]

PROGRESSION STRATEGY:
[How to gradually increase or maintain intensity]

MATCHING ACTIVITIES:
1. [Activity]: [Why it matches their intensity preference]
2. [Activity]: [Why it matches their intensity preference]
3. [Activity]: [Why it matches their intensity preference]`;
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
                localStorage.setItem('workoutIntensityResult', JSON.stringify({
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
                <div class="loading-text">Calculating Your Intensity Profile</div>
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

        localStorage.setItem('workoutIntensityResult', JSON.stringify({
            type: result.title,
            description: result.description,
            aiResponse: result.aiResponse || null,
            completedAt: Date.now()
        }));
    }

    calculateResult() {
        const scores = { low: 0, moderate: 0, high: 0, variable: 0 };

        this.answers.forEach((answerIndex, questionIndex) => {
            const question = this.questions[questionIndex];
            Object.keys(question.weights).forEach(type => {
                scores[type] += question.weights[type][answerIndex];
            });
        });

        const topType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

        const intensityTypes = {
            low: {
                title: "The Gentle Exerciser",
                description: "You prefer low-intensity, sustainable workouts that focus on consistency over intensity. You enjoy gentle movements that support long-term health."
            },
            moderate: {
                title: "The Balanced Trainer",
                description: "You thrive with moderate intensity workouts that challenge you without overwhelming. You prefer a balanced approach with steady, consistent effort."
            },
            high: {
                title: "The Intensity Seeker",
                description: "You love high-intensity workouts that push your limits. You're motivated by challenging sessions and intense physical demands."
            },
            variable: {
                title: "The Adaptive Exerciser",
                description: "You prefer varying your workout intensity based on how you feel, your schedule, and your goals. You like flexibility in your training approach."
            }
        };

        return intensityTypes[topType];
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
    quiz = new WorkoutIntensityQuiz();
});
