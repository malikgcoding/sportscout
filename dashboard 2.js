document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeHamburgerMenu();
    initializeSidebar();
    initializeProfileSystem();
});

function initializeHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (hamburger && sidebar && overlay) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            
            // Update profile stats when menu opens
            if (sidebar.classList.contains('active')) {
                updateProfileQuickStats();
            }
        });

        overlay.addEventListener('click', function() {
            hamburger.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

function initializeSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-section]');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Handle navigation
            const section = this.getAttribute('data-section');
            handleSidebarNavigation(section);
            
            // Close sidebar
            const hamburger = document.getElementById('hamburger');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            if (hamburger) hamburger.classList.remove('active');
            if (sidebar) sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    });
}

function handleSidebarNavigation(section) {
    switch(section) {
        case 'dashboard':
            // Already on dashboard
            break;
        case 'sport-finder':
            window.location.href = 'quiz.html';
            break;
        case 'clubs':
            alert('Clubs feature coming soon!');
            break;
        case 'equipment':
            alert('Equipment recommendations coming soon!');
            break;
    }
}

function initializeDashboard() {
    loadSportRecommendations();
    updateUserStats();
    loadRecentActivity();
    loadAllQuizzes();
    updateProgress();
}

function loadSportRecommendations() {
    const container = document.getElementById('sport-recommendations');
    const quizAnswers = localStorage.getItem('sportScoutAnswers');
    
    let allSports = [];
    
    // Add main sport finder results
    if (quizAnswers) {
        const aiError = localStorage.getItem('sportScoutAIError');
        const storedRecommendation = localStorage.getItem('sportScoutAIResponse');
        
        if (!aiError && storedRecommendation) {
            const parsedResponse = parseAIResponse(storedRecommendation);
            
            // Add primary sport with full reasoning as explanation
            allSports.push({
                name: parsedResponse.mainSport,
                description: parsedResponse.reasoning.length > 80 ? 
                    parsedResponse.reasoning.substring(0, 80) + '...' : parsedResponse.reasoning,
                fullExplanation: parsedResponse.reasoning,
                isPrimary: true,
                source: 'Sport Finder'
            });
            
            // Add alternatives from main quiz with their descriptions as explanations
            allSports.push(...parsedResponse.alternatives.map(alt => ({
                name: alt.name,
                description: alt.description || 'Great alternative option',
                fullExplanation: alt.description || `${alt.name} is recommended as a great alternative sport that matches your preferences and personality profile.`,
                isPrimary: false,
                source: 'Sport Finder'
            })));
        }
    }
    
    // Add results from all completed additional analyses
    const additionalQuizzes = [
        { key: 'fitnessPersonalityResult', name: 'Fitness Personality' },
        { key: 'workoutIntensityResult', name: 'Workout Intensity' },
        { key: 'nutritionResult', name: 'Nutrition Profile' },
        { key: 'recoveryResult', name: 'Recovery Style' }
    ];
    
    additionalQuizzes.forEach(quiz => {
        const result = localStorage.getItem(quiz.key);
        if (result) {
            try {
                const parsed = JSON.parse(result);
                
                // Add the main result as a sport match
                allSports.push({
                    name: parsed.type,
                    description: parsed.description,
                    fullExplanation: `${parsed.type}: ${parsed.description}`,
                    isPrimary: false,
                    source: quiz.name
                });
                
                // Extract sport recommendations from AI response if available
                if (parsed.aiResponse) {
                    const sportMatches = extractSportRecommendations(parsed.aiResponse, quiz.name);
                    allSports.push(...sportMatches);
                }
            } catch (e) {
                console.error('Error parsing analysis result:', e);
            }
        }
    });
    
    if (allSports.length > 0) {
        // Remove duplicates by name, prioritizing primary sports
        const uniqueSports = [];
        const seenNames = new Set();
        
        // First pass: add primary sports
        allSports.filter(sport => sport.isPrimary).forEach(sport => {
            const normalizedName = sport.name.toLowerCase().trim();
            if (!seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniqueSports.push(sport);
            }
        });
        
        // Second pass: add non-primary sports that aren't duplicates
        allSports.filter(sport => !sport.isPrimary).forEach(sport => {
            const normalizedName = sport.name.toLowerCase().trim();
            if (!seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniqueSports.push(sport);
            }
        });
        
        // Limit to top 8 for better display
        const displaySports = uniqueSports.slice(0, 8);
        
        let cardsHTML = '<div class="sport-cards-mini">';
        displaySports.forEach((sport, index) => {
            const cardClass = sport.isPrimary ? 'sport-card-mini primary' : 'sport-card-mini';
            const truncatedDesc = sport.description.length > 80 ? 
                sport.description.substring(0, 80) + '...' : sport.description;
            
            cardsHTML += `
                <div class="${cardClass}" onclick="showSportDetails('${sport.name.replace(/'/g, "\\'")}', '${(sport.fullExplanation || sport.description).replace(/'/g, "\\'")}', '${sport.source}')">
                    <div class="sport-name-mini">${sport.name}</div>
                    <div class="sport-desc-mini">${truncatedDesc}</div>
                    <div style="font-size: 0.6rem; color: #22c55e; margin-top: 5px; opacity: 0.8;">from ${sport.source}</div>
                </div>
            `;
        });
        cardsHTML += '</div>';
        
        container.innerHTML = cardsHTML;
    } else {
        container.innerHTML = `
            <div class="no-data">
                <p>Take our analyses to get personalized sport recommendations!</p>
                <a href="quiz.html" class="btn-small">Start Analysis</a>
            </div>
        `;
    }
}

function extractSportRecommendations(aiResponse, source) {
    const sports = [];
    const lines = aiResponse.split('\n');
    
    let inSportsSection = false;
    lines.forEach(line => {
        line = line.trim();
        
        // Detect various sports sections
        if ((line.toLowerCase().includes('sport') || line.toLowerCase().includes('perfect') || 
             line.toLowerCase().includes('recommend') || line.toLowerCase().includes('compatible')) && 
            line.includes(':')) {
            inSportsSection = true;
            return;
        }
        
        // Extract sport recommendations
        if (inSportsSection && (line.match(/^\d+\./) || line.startsWith('-') || line.startsWith('•'))) {
            const cleanLine = line.replace(/^\d+\.\s*|^[-•]\s*/g, '').trim();
            if (cleanLine.includes(':')) {
                const [sportName, description] = cleanLine.split(':');
                if (sportName && description) {
                    sports.push({
                        name: sportName.trim(),
                        description: description.trim().length > 80 ? 
                            description.trim().substring(0, 80) + '...' : description.trim(),
                        fullExplanation: `${sportName.trim()}: ${description.trim()}`,
                        isPrimary: false,
                        source: source
                    });
                }
            } else if (cleanLine.length > 2) {
                // Sometimes sports are listed without descriptions
                const explanation = `${cleanLine} is recommended based on your ${source.toLowerCase()} profile and would be a great match for your preferences.`;
                sports.push({
                    name: cleanLine,
                    description: `Great match for your ${source.toLowerCase()} profile`,
                    fullExplanation: explanation,
                    isPrimary: false,
                    source: source
                });
            }
        }
        
        // Stop when we hit another major section
        if (inSportsSection && line.match(/^[A-Z\s]{3,}:/) && 
            !line.toLowerCase().includes('sport') && !line.toLowerCase().includes('perfect')) {
            inSportsSection = false;
        }
    });
    
    return sports.slice(0, 3); // Limit to 3 sports per quiz
}

function parseAIResponse(response) {
    let cleanedResponse = response
        .replace(/REASONING:\s*/g, '')
        .replace(/ALTERNATIVES:\s*/g, '')
        .replace(/\*\*REASONING:\*\*\s*/g, '')
        .replace(/\*\*ALTERNATIVES:\*\*\s*/g, '');
    
    const lines = cleanedResponse.split('\n').filter(line => line.trim() !== '');
    let currentSport = null;
    let reasoning = '';
    let alternatives = [];
    
    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('PERFECT SPORT:') || line.startsWith('**PERFECT SPORT:**')) {
            currentSport = line.replace(/\*\*(.*?)\*\*|\*\*(.*?)$|PERFECT SPORT:\s*/g, '').trim();
        } else if (line.match(/^\d+\./) || line.startsWith('•') || line.startsWith('-')) {
            const cleanLine = line.replace(/^\d+\.\s*|^[•-]\s*/g, '').trim();
            if (cleanLine.includes(':')) {
                const [sport, desc] = cleanLine.split(':');
                alternatives.push({
                    name: sport.trim(),
                    description: desc.trim()
                });
            } else {
                alternatives.push({
                    name: cleanLine,
                    description: `${cleanLine} is a great alternative sport that would suit your personality and preferences.`
                });
            }
        } else if (line.length > 20 && !line.includes(':') && !currentSport) {
            reasoning += (reasoning ? ' ' : '') + line;
        } else if (currentSport && line.length > 20 && !line.includes(':') && alternatives.length === 0) {
            reasoning += (reasoning ? ' ' : '') + line;
        }
    });
    
    if (!currentSport) {
        const firstLine = lines[0];
        if (firstLine) {
            currentSport = firstLine.replace(/\*\*(.*?)\*\*/g, '$1').trim();
            reasoning = lines.slice(1, 3).join(' ');
            
            const sportKeywords = ['tennis', 'soccer', 'basketball', 'swimming', 'running', 'cycling', 'volleyball', 'badminton', 'golf', 'yoga', 'pilates', 'boxing', 'martial arts', 'climbing', 'hiking'];
            const foundSports = sportKeywords.filter(sport => 
                cleanedResponse.toLowerCase().includes(sport.toLowerCase()) && 
                sport.toLowerCase() !== currentSport.toLowerCase()
            );
            
            alternatives = foundSports.slice(0, 4).map(sport => ({
                name: sport.charAt(0).toUpperCase() + sport.slice(1),
                description: `${sport.charAt(0).toUpperCase() + sport.slice(1)} is a great alternative option that matches your personality profile.`
            }));
        }
    }
    
    if (reasoning) {
        reasoning = reasoning
            .replace(/\bThis sport is perfect because\b/gi, 'Perfect for you because')
            .replace(/\bIt provides\b/gi, 'Provides')
            .replace(/\bIt offers\b/gi, 'Offers')
            .replace(/\bIt allows\b/gi, 'Allows')
            .replace(/\bIt helps\b/gi, 'Helps')
            .trim();
        
        if (!reasoning.endsWith('.') && !reasoning.endsWith('!')) {
            reasoning += '.';
        }
    }
    
    return {
        mainSport: currentSport || 'Personalized Sport',
        reasoning: reasoning || 'Perfect match based on your preferences and personality profile.',
        alternatives: alternatives.length > 0 ? alternatives : [
            { name: 'Tennis', description: 'Individual or doubles play with great cardio benefits and strategic thinking' },
            { name: 'Swimming', description: 'Full body workout that\'s easy on joints and great for all fitness levels' },
            { name: 'Cycling', description: 'Great for cardio and exploring outdoors while being low-impact' }
        ]
    };
}

function initializeProfileSystem() {
    // Create or load user profile
    let userProfile = getUserProfile();
    if (!userProfile) {
        userProfile = createNewProfile();
        saveUserProfile(userProfile);
    }
    
    // Update profile data whenever quiz is completed
    updateProfileFromQuizzes(userProfile);
    saveUserProfile(userProfile);
}

function createNewProfile() {
    return {
        id: generateProfileId(),
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        completedQuizzes: [],
        preferences: {
            theme: 'dark',
            notifications: true
        },
        stats: {
            totalQuizzes: 0,
            profileCompletion: 60,
            activeDays: 1,
            streakDays: 1
        },
        achievements: [],
        personalData: {
            name: null,
            age: null,
            goals: []
        }
    };
}

function generateProfileId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getUserProfile() {
    const profileData = localStorage.getItem('sportScoutProfile');
    if (profileData) {
        try {
            return JSON.parse(profileData);
        } catch (e) {
            console.error('Error parsing profile data:', e);
            return null;
        }
    }
    return null;
}

function saveUserProfile(profile) {
    profile.lastActiveAt = Date.now();
    localStorage.setItem('sportScoutProfile', JSON.stringify(profile));
}

function updateProfileFromQuizzes(profile) {
    const completedQuizzes = getCompletedQuizzes();
    
    // Update completed quizzes in profile
    profile.completedQuizzes = completedQuizzes.map(quiz => ({
        name: quiz.name,
        completedAt: quiz.completedAt,
        result: getQuizResult(quiz.name)
    }));
    
    // Update stats
    profile.stats.totalQuizzes = completedQuizzes.length;
    profile.stats.profileCompletion = Math.min(85, 60 + (completedQuizzes.length * 5));
    
    // Update active days (simple implementation)
    const daysSinceCreation = Math.floor((Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24));
    profile.stats.activeDays = Math.max(1, daysSinceCreation);
    
    // Add achievements based on completion
    updateAchievements(profile, completedQuizzes.length);
}

function getQuizResult(quizName) {
    const resultKeys = {
        'Sport Finder': 'sportScoutAIResponse',
        'Fitness Personality': 'fitnessPersonalityResult',
        'Workout Intensity': 'workoutIntensityResult',
        'Nutrition Profile': 'nutritionResult',
        'Recovery Style': 'recoveryResult'
    };
    
    const key = resultKeys[quizName];
    if (key) {
        const result = localStorage.getItem(key);
        if (result) {
            try {
                const parsed = JSON.parse(result);
                // For additional quizzes, include AI response if available
                if (parsed.aiResponse) {
                    return {
                        type: parsed.type,
                        description: parsed.description,
                        aiResponse: parsed.aiResponse,
                        completedAt: parsed.completedAt
                    };
                }
                return parsed;
            } catch (e) {
                return result; // Return as string if not JSON
            }
        }
    }
    return null;
}

function loadAllQuizzes() {
    const container = document.getElementById('additional-quizzes');
    if (!container) {
        console.error('Analysis tools container not found');
        return;
    }

    const completedQuizzes = getCompletedQuizzes();
    const completedNames = completedQuizzes.map(q => q.name);
    
    // Define all available analysis tools including the main one
    const allQuizzes = [
        {
            title: 'Sport Finder',
            description: 'Find your perfect sport match with our comprehensive AI-powered assessment.',
            duration: '5 min',
            file: 'quiz.html'
        },
        {
            title: 'Fitness Personality',
            description: 'Discover your unique fitness personality with AI-generated training strategies.',
            duration: '3 min',
            file: 'fitness-personality-quiz.html'
        },
        {
            title: 'Workout Intensity',
            description: 'Get AI-powered workout recommendations for your optimal intensity level.',
            duration: '2 min',
            file: 'workout-intensity-quiz.html'
        },
        {
            title: 'Nutrition Profile',
            description: 'Receive personalized AI nutrition plans for your eating style and sports goals.',
            duration: '4 min',
            file: 'nutrition-quiz.html'
        },
        {
            title: 'Recovery Style',
            description: 'Get AI-optimized recovery strategies tailored to your rest preferences.',
            duration: '2 min',
            file: 'recovery-quiz.html'
        }
    ];

    let quizzesHTML = '';
    
    allQuizzes.forEach(quiz => {
        const isCompleted = completedNames.includes(quiz.title);
        const completedClass = isCompleted ? ' completed' : '';
        
        quizzesHTML += `
            <div class="quiz-item${completedClass}" onclick="${isCompleted ? 'void(0)' : `startQuiz('${quiz.file}', '${quiz.title}')`}">
                <div class="quiz-title">${quiz.title}</div>
                <div class="quiz-description">${quiz.description}</div>
                <div class="quiz-duration">${quiz.duration}</div>
            </div>
        `;
    });
    
    if (quizzesHTML) {
        container.innerHTML = quizzesHTML;
    } else {
        container.innerHTML = `
            <div class="no-data">
                <p>Analysis tools are loading...</p>
            </div>
        `;
    }
}

function updateUserStats() {
    const profile = getUserProfile();
    const completedQuizzes = getCompletedQuizzes();
    
    // Update quiz completion date
    if (completedQuizzes.length > 0) {
        const latestQuiz = completedQuizzes.sort((a, b) => b.completedAt - a.completedAt)[0];
        const date = new Date(parseInt(latestQuiz.completedAt));
        const quizDateElement = document.getElementById('quiz-date');
        if (quizDateElement) {
            quizDateElement.textContent = date.toLocaleDateString();
        }
    } else {
        const quizDateElement = document.getElementById('quiz-date');
        if (quizDateElement) {
            quizDateElement.textContent = 'Not yet';
        }
    }
    
    // Update matches count
    const recommendations = localStorage.getItem('sportScoutAIResponse');
    const matchesCountElement = document.getElementById('matches-count');
    if (matchesCountElement) {
        if (recommendations) {
            const parsedResponse = parseAIResponse(recommendations);
            const totalMatches = 1 + (parsedResponse.alternatives ? parsedResponse.alternatives.length : 0);
            matchesCountElement.textContent = totalMatches;
        } else {
            matchesCountElement.textContent = '0';
        }
    }
    
    // Update profile-based stats with proper element targeting
    if (profile) {
        const statItems = document.querySelectorAll('.stat-item');
        if (statItems.length >= 4) {
            // Profile Score (3rd stat item)
            const profileScoreElement = statItems[2].querySelector('.stat-value');
            if (profileScoreElement) {
                profileScoreElement.textContent = `${profile.stats.profileCompletion}%`;
            }
            
            // Active Days (4th stat item)
            const activeDaysElement = statItems[3].querySelector('.stat-value');
            if (activeDaysElement) {
                activeDaysElement.textContent = profile.stats.activeDays;
            }
        }
    }
}

function updateProgress() {
    const completedQuizzes = getCompletedQuizzes();
    const profile = getUserProfile();
    const totalQuizzes = 5; // Sport Finder + 4 additional analyses
    const completionPercentage = Math.round((completedQuizzes.length / totalQuizzes) * 100);
    
    // Update progress bars with specific targeting
    const progressItems = document.querySelectorAll('.progress-item');
    if (progressItems.length >= 3 && profile) {
        // Profile Completion
        const profileProgressPercent = progressItems[0].querySelector('.progress-percent');
        const profileProgressFill = progressItems[0].querySelector('.progress-fill');
        if (profileProgressPercent && profileProgressFill) {
            profileProgressPercent.textContent = `${profile.stats.profileCompletion}%`;
            profileProgressFill.style.width = `${profile.stats.profileCompletion}%`;
        }
        
        // Analysis Completion
        const analysisProgressPercent = progressItems[1].querySelector('.progress-percent');
        const analysisProgressFill = progressItems[1].querySelector('.progress-fill');
        if (analysisProgressPercent && analysisProgressFill) {
            analysisProgressPercent.textContent = `${completionPercentage}%`;
            analysisProgressFill.style.width = `${completionPercentage}%`;
        }
        
        // Goals Achievement (based on completion)
        const goalsPercent = completedQuizzes.length >= 3 ? 75 : completedQuizzes.length * 25;
        const goalsProgressPercent = progressItems[2].querySelector('.progress-percent');
        const goalsProgressFill = progressItems[2].querySelector('.progress-fill');
        if (goalsProgressPercent && goalsProgressFill) {
            goalsProgressPercent.textContent = `${goalsPercent}%`;
            goalsProgressFill.style.width = `${goalsPercent}%`;
        }
    }
}

function loadRecentActivity() {
    const profile = getUserProfile();
    const completedQuizzes = getCompletedQuizzes();
    const container = document.getElementById('activities-content') || 
                    document.querySelector('.activities-widget > div:last-child') ||
                    document.querySelector('.activities-widget').children[1];
    
    if (!container) {
        console.error('Activities container not found');
        return;
    }
    
    if (completedQuizzes.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">🎯</div>
                <span class="activity-text">Welcome to SportScout!</span>
                <span class="activity-time">Just now</span>
            </div>
            <div class="activity-item">
                <div class="activity-icon">📊</div>
                <span class="activity-text">Profile created</span>
                <span class="activity-time">Just now</span>
            </div>
        `;
        return;
    }
    
    let activitiesHTML = '';
    
    // Add recent achievements
    if (profile && profile.achievements && profile.achievements.length > 0) {
        const recentAchievements = profile.achievements
            .sort((a, b) => b.earnedAt - a.earnedAt)
            .slice(0, 1);
        
        recentAchievements.forEach(achievement => {
            const date = new Date(achievement.earnedAt);
            const timeAgo = getTimeAgo(date);
            
            activitiesHTML += `
                <div class="activity-item">
                    <div class="activity-icon">🏆</div>
                    <span class="activity-text">Earned "${achievement.title}" achievement</span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            `;
        });
    }
    
    // Add recent analysis completions
    completedQuizzes.slice(0, 3).forEach(quiz => {
        const date = new Date(parseInt(quiz.completedAt));
        const timeAgo = getTimeAgo(date);
        
        activitiesHTML += `
            <div class="activity-item">
                <div class="activity-icon">✓</div>
                <span class="activity-text">Completed ${quiz.name} Analysis</span>
                <span class="activity-time">${timeAgo}</span>
            </div>
        `;
    });
    
    container.innerHTML = activitiesHTML;
}

function getCompletedQuizzes() {
    const completed = [];
    
    // Check for main Sport Finder quiz
    if (localStorage.getItem('sportScoutAnswers')) {
        completed.push({
            name: 'Sport Finder',
            completedAt: localStorage.getItem('sportScoutQuizCompletedAt') || Date.now()
        });
    }
    
    // Check for additional quizzes
    const additionalQuizzes = [
        { key: 'fitnessPersonalityResult', name: 'Fitness Personality' },
        { key: 'workoutIntensityResult', name: 'Workout Intensity' },
        { key: 'nutritionResult', name: 'Nutrition Profile' },
        { key: 'recoveryResult', name: 'Recovery Style' }
    ];
    
    additionalQuizzes.forEach(quiz => {
        const result = localStorage.getItem(quiz.key);
        if (result) {
            try {
                const parsed = JSON.parse(result);
                completed.push({
                    name: quiz.name,
                    completedAt: parsed.completedAt || Date.now()
                });
            } catch (e) {
                // If it's not JSON, still count it as completed
                completed.push({
                    name: quiz.name,
                    completedAt: Date.now()
                });
            }
        }
    });
    
    return completed.sort((a, b) => b.completedAt - a.completedAt);
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
}

function showSportDetails(name, explanation, source) {
    // Create a more detailed modal-style alert
    const formattedExplanation = explanation.length > 300 ? 
        explanation.substring(0, 300) + '...' : explanation;
    
    alert(`🏆 ${name}\n\nRecommended by: ${source}\n\n${formattedExplanation}\n\n💡 This recommendation is based on your personality profile and preferences from our AI analysis.`);
}

function clearPreviousResults() {
    localStorage.removeItem('sportScoutAIResponse');
    localStorage.removeItem('sportScoutAIError');
    localStorage.removeItem('sportScoutQuizJustCompleted');
    localStorage.removeItem('sportScoutQuizCompletedAt');
    localStorage.removeItem('sportScoutAnswers');
    localStorage.removeItem('sportScoutAIPrompt');
}

// Simple visibility change handler
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        console.log('Page visible, refreshing dashboard...');
        loadSportRecommendations();
        updateUserStats();
        loadRecentActivity();
        updateProgress();
    }
});

function startQuiz(filename, title) {
    window.location.href = filename;
}

function updateProfileQuickStats() {
    const container = document.getElementById('profile-quick-stats');
    const profile = getUserProfile();
    const completedQuizzes = getCompletedQuizzes();
    
    if (container && profile) {
        container.innerHTML = `
            <div class="profile-stat">
                <span class="profile-stat-label">Analyses Completed</span>
                <span class="profile-stat-value">${completedQuizzes.length}/5</span>
            </div>
            <div class="profile-stat">
                <span class="profile-stat-label">Profile Completion</span>
                <span class="profile-stat-value">${profile.stats.profileCompletion}%</span>
            </div>
            <div class="profile-stat">
                <span class="profile-stat-label">Achievements</span>
                <span class="profile-stat-value">${profile.achievements ? profile.achievements.length : 0}</span>
            </div>
            <div class="profile-stat">
                <span class="profile-stat-label">Days Active</span>
                <span class="profile-stat-value">${profile.stats.activeDays}</span>
            </div>
        `;
    }
}

function updateAchievements(profile, completedCount) {
    const achievements = [
        { id: 'first_quiz', title: 'Getting Started', description: 'Completed your first analysis', threshold: 1 },
        { id: 'explorer', title: 'Explorer', description: 'Completed 3 analyses', threshold: 3 },
        { id: 'completionist', title: 'Completionist', description: 'Completed all analyses', threshold: 5 }
    ];
    
    achievements.forEach(achievement => {
        if (completedCount >= achievement.threshold) {
            const hasAchievement = profile.achievements.some(a => a.id === achievement.id);
            if (!hasAchievement) {
                profile.achievements.push({
                    ...achievement,
                    earnedAt: Date.now()
                });
            }
        }
    });
}

function exportProfile() {
    const profile = getUserProfile();
    if (profile) {
        const dataStr = JSON.stringify(profile, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sportscout-profile-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

function importProfile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedProfile = JSON.parse(e.target.result);
                
                // Validate profile structure
                if (importedProfile.id && importedProfile.completedQuizzes) {
                    // Merge with existing or replace
                    const confirmReplace = confirm('This will replace your current profile. Continue?');
                    if (confirmReplace) {
                        saveUserProfile(importedProfile);
                        location.reload(); // Refresh to show imported data
                    }
                } else {
                    alert('Invalid profile file format');
                }
            } catch (error) {
                alert('Error reading profile file');
            }
        };
        reader.readAsText(file);
    }
}

function clearProfile() {
    const confirmClear = confirm('This will delete all your data including quiz results. This cannot be undone. Continue?');
    if (confirmClear) {
        // Clear all SportScout related localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('sportScout') || key.includes('Result') || key === 'sportScoutProfile') {
                localStorage.removeItem(key);
            }
        });
        location.reload();
    }
}

// Add profile management functions to global scope
window.exportProfile = exportProfile;
window.importProfile = importProfile;
window.clearProfile = clearProfile;

// Global function for quiz navigation
window.startQuiz = startQuiz;