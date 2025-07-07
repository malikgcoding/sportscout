class SportFinderQuiz {
    constructor() {
        this.questions = [
            {
                text: "What motivates you to be active?",
                answers: ["Competing and winning", "Improving health", "Having fun", "Learning new skills", "Being part of a team"],
                weights: {
                    competitive: [5, 2, 1, 3, 4],
                    recreational: [1, 4, 5, 3, 4],
                    skill: [3, 2, 3, 5, 4],
                    team: [4, 3, 2, 3, 5]
                }
            },
            {
                text: "What type of activities do you prefer?",
                answers: ["Solo workouts", "Group fitness", "Outdoor adventures", "Team sports", "Classes or lessons"],
                weights: {
                    competitive: [4, 2, 3, 5, 3],
                    recreational: [2, 4, 5, 3, 3],
                    skill: [3, 3, 4, 4, 5],
                    team: [2, 3, 2, 5, 4]
                }
            },
            {
                text: "How do you approach training or practice?",
                answers: ["I follow a strict schedule", "I train when I feel like it", "I try to improve every session", "I like casual, varied sessions", "I follow a coach or program"],
                weights: {
                    competitive: [5, 2, 4, 2, 4],
                    recreational: [2, 5, 3, 4, 3],
                    skill: [3, 2, 5, 4, 4],
                    team: [4, 3, 4, 3, 5]
                }
            },
            {
                text: "What's your ideal sport environment?",
                answers: ["High-pressure and competitive", "Fun and social", "Quiet and focused", "Outdoors and adventurous", "Organized and structured"],
                weights: {
                    competitive: [5, 2, 3, 3, 4],
                    recreational: [2, 5, 3, 4, 3],
                    skill: [3, 3, 4, 3, 4],
                    team: [4, 5, 2, 3, 5]
                }
            },
            {
                text: "How do you feel about teamwork?",
                answers: ["Love it – team player!", "Prefer solo", "Depends on the situation", "I like coaching others", "I like learning from others"],
                weights: {
                    competitive: [4, 2, 3, 4, 3],
                    recreational: [4, 3, 4, 3, 3],
                    skill: [3, 3, 4, 5, 5],
                    team: [5, 1, 4, 4, 5]
                }
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

        // Restore previously selected answer if available
        if (this.answers[this.currentQuestionIndex] !== undefined) {
            this.selectAnswer(this.answers[this.currentQuestionIndex]);
        }

        this.updateNavigationButtons();
    }

    selectAnswer(index) {
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        buttons[index].classList.add('selected');

        this.selectedAnswerIndex = index;
        this.answers[this.currentQuestionIndex] = index;
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        prevBtn.textContent = this.currentQuestionIndex === 0 ? 'Back to Dashboard' : 'Previous';
        prevBtn.onclick = this.currentQuestionIndex === 0
            ? () => window.location.href = 'dashboard.html'
            : () => this.previousQuestion();

        nextBtn.disabled = this.selectedAnswerIndex === -1;
        nextBtn.textContent = this.currentQuestionIndex === this.questions.length - 1 ? 'Finish' : 'Next';
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
        }
    }

    async finishQuiz() {
        const result = this.calculateResult();

        // Save base result immediately
        localStorage.setItem('sportResult', JSON.stringify({
            type: result.title,
            description: result.description,
            completedAt: Date.now()
        }));

        document.getElementById('quiz-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';

        const aiPrompt = this.generateAIPrompt(result);

        this.showLoadingState();
        this.processAIRequest(aiPrompt, result);
        this.startRedirectCountdown();
    }

    generateAIPrompt(result) {
        const answerSummary = this.answers.map((index, i) => {
            const question = this.questions[i];
            return `Question: "${question.text}" - Answer: "${question.answers[index]}"`;
        }).join('. ');

        return `Based on this sport compatibility quiz: ${answerSummary}. 

The user's sport personality type is: ${result.title} - ${result.description}

Please suggest:
1. 3-4 sports that match their personality
2. Training environments they’d thrive in
3. Tips to stay consistent and engaged

Format:

SPORT RECOMMENDATIONS:
1. [Sport] - [Why it fits]
2. [Sport] - [Why it fits]

BEST TRAINING ENVIRONMENT:
[Suggested setup, structure, solo vs team, etc.]

CONSISTENCY STRATEGIES:
[How to keep them engaged long-term]`;
    }

    async processAIRequest(prompt, baseResult) {
        try {
            const response = await fetch('deepseek-proxy.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const responseText = await response.text();
            const data = JSON.parse(responseText);

            if (data.success && data.recommendation) {
                localStorage.setItem('sportResult', JSON.stringify({
                    type: baseResult.title,
                    description: baseResult.description,
                    aiResponse: data.recommendation,
                    completedAt: Date.now()
                }));
            }
        } catch (err) {
            console.error('AI fetch failed:', err);
        }
    }

    startRedirectCountdown() {
        let countdown = 3;
        const interval = setInterval(() => {
            if (countdown <= 0) {
                clearInterval(interval);
                window.location.href = 'dashboard.html';
            }
            countdown--;
        }, 1000);
    }

    showLoadingState() {
        const display = document.getElementById('ai-recommendation');
        display.innerHTML = `
            <div class="loading-screen">
                <div class="loading-spinner"></div>
                <div class="loading-text">Generating Your Sport Profile...</div>
                <div class="loading-subtext">Redirecting shortly...</div>
            </div>
        `;
    }

    calculateResult() {
        const scores = { competitive: 0, recreational: 0, skill: 0, team: 0 };

        this.answers.forEach((index, qIndex) => {
            const weights = this.questions[qIndex].weights;
            for (const type in weights) {
                scores[type] += weights[type][index];
            }
        });

        const topType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

        const resultMap = {
            competitive: {
                title: "The Competitor",
                description: "You're driven by challenge, winning, and structured training. Sports with measurable goals suit you best."
            },
            recreational: {
                title: "The Recreational Athlete",
                description: "You enjoy movement for fun, health, and social connection. You prefer laid-back, varied activities."
            },
            skill: {
                title: "The Skill Seeker",
                description: "You love learning new techniques and refining your form. Mastery keeps you coming back."
            },
            team: {
                title: "The Team Player",
                description: "You thrive in group settings and value shared goals. Camaraderie and collaboration motivate you."
            }
        };

        return resultMap[topType];
    }
}

// Global instance
let sportQuiz;

document.addEventListener('DOMContentLoaded', () => {
    sportQuiz = new SportFinderQuiz();
});

function nextQuestion() {
    sportQuiz.nextQuestion();
}

function previousQuestion() {
    sportQuiz.previousQuestion();
}
