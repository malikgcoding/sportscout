class NutritionQuiz {
    constructor() {
        this.questions = [
            {
                text: "How would you describe your current eating pattern?",
                answers: ["Very structured, planned meals", "Somewhat regular", "Irregular, eat when convenient", "Constantly snacking", "Skip meals often"],
                weights: { structured: [5,3,1,0,0], flexible: [3,5,3,2,1], intuitive: [2,4,4,3,2], performance: [5,4,2,1,1] }
            },
            {
                text: "What's your primary nutrition goal for sports?",
                answers: ["Maximum performance", "Weight management", "General health", "Muscle building", "Increased energy"],
                weights: { structured: [4,3,2,4,3], flexible: [2,5,4,2,4], intuitive: [1,3,5,1,3], performance: [5,2,3,5,4] }
            },
            {
                text: "How do you prefer to prepare your meals?",
                answers: ["Meal prep on weekends", "Cook fresh daily", "Simple, quick meals", "Whatever's available", "Eat out frequently"],
                weights: { structured: [5,3,2,1,0], flexible: [3,4,5,3,2], intuitive: [2,3,4,4,3], performance: [5,4,3,2,1] }
            },
            {
                text: "How important is tracking your nutrition?",
                answers: ["Essential - I track everything", "Somewhat important", "Not really important", "Only when needed", "I prefer not to track"],
                weights: { structured: [5,3,1,2,0], flexible: [3,4,3,4,2], intuitive: [1,2,4,3,5], performance: [5,4,2,3,1] }
            },
            {
                text: "How do you handle pre-workout nutrition?",
                answers: ["Carefully planned timing", "Light snack if hungry", "Whatever I feel like", "Nothing usually", "High-energy supplements"],
                weights: { structured: [5,3,2,1,2], flexible: [3,5,4,2,3], intuitive: [2,4,5,3,1], performance: [5,3,2,1,5] }
            },
            {
                text: "What's your approach to post-workout recovery?",
                answers: ["Immediate protein and carbs", "Eat within an hour", "When I get hungry", "Don't think about it", "Recovery shakes/supplements"],
                weights: { structured: [4,4,2,1,3], flexible: [3,5,3,2,2], intuitive: [2,3,5,4,1], performance: [5,4,2,1,5] }
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
        localStorage.setItem('nutritionResult', JSON.stringify({
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

        return `Based on this nutrition profile assessment: ${answerSummary}. 

The user's nutrition style is: ${result.title} - ${result.description}

Please provide specific nutrition recommendations including:
1. Meal planning strategies that match their style
2. Pre-workout nutrition timing and foods
3. Post-workout recovery nutrition
4. 3-4 sports/activities that align with their nutrition approach

Format your response as:

NUTRITION STRATEGY:
[Specific meal planning and timing recommendations]

PRE-WORKOUT NUTRITION:
[What to eat and when before exercise]

POST-WORKOUT RECOVERY:
[Recovery nutrition recommendations]

COMPATIBLE SPORTS:
1. [Sport]: [Why it matches their nutrition style]
2. [Sport]: [Why it matches their nutrition style]
3. [Sport]: [Why it matches their nutrition style]`;
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
                localStorage.setItem('nutritionResult', JSON.stringify({
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
                <div class="loading-text">Creating Your Nutrition Plan</div>
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

        localStorage.setItem('nutritionResult', JSON.stringify({
            type: result.title,
            description: result.description,
            aiResponse: result.aiResponse || null,
            completedAt: Date.now()
        }));
    }

    calculateResult() {
        const scores = { structured: 0, flexible: 0, intuitive: 0, performance: 0 };

        this.answers.forEach((answerIndex, questionIndex) => {
            const question = this.questions[questionIndex];
            Object.keys(question.weights).forEach(type => {
                scores[type] += question.weights[type][answerIndex];
            });
        });

        const topType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

        const nutritionTypes = {
            structured: {
                title: "The Meal Planner",
                description: "You thrive on structure and planning. Meal prep, macro tracking, and scheduled eating times work best for your lifestyle and goals."
            },
            flexible: {
                title: "The Balanced Eater",
                description: "You prefer a flexible approach that balances structure with spontaneity. You can adapt your nutrition to different situations while maintaining good habits."
            },
            intuitive: {
                title: "The Intuitive Eater",
                description: "You trust your body's signals and prefer a natural approach to eating. You focus on how foods make you feel rather than strict rules."
            },
            performance: {
                title: "The Performance Fueler",
                description: "Your nutrition is optimized for athletic performance. You strategically time meals and supplements to maximize training and recovery."
            }
        };

        return nutritionTypes[topType];
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
    quiz = new NutritionQuiz();
});
