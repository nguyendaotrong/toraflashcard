(function($) {
    function initializeQuiz($slider, totalQuestions, flashcards) {
        console.log('Initializing quiz with totalQuestions:', totalQuestions, 'flashcards:', flashcards.length);

        // Phân bổ số lượng câu hỏi như cũ
        var singleChoiceCount = 0;
        var trueFalseCount = 0;
        var matchCount = 0;

        if (totalQuestions === 2) {
            singleChoiceCount = 1;
            trueFalseCount = 1;
            matchCount = 0;
        } else if (totalQuestions === 3) {
            singleChoiceCount = 1;
            trueFalseCount = 1;
            matchCount = 1;
        } else if (totalQuestions === 4) {
            singleChoiceCount = 2;
            trueFalseCount = 1;
            matchCount = 1;
        } else if (totalQuestions === 5) {
            singleChoiceCount = 2;
            trueFalseCount = 2;
            matchCount = 1;
        } else {
            var milestone = Math.floor(totalQuestions / 5);
            singleChoiceCount = 2 * milestone;
            trueFalseCount = 2 * milestone;
            matchCount = Math.min(4, milestone);

            var remainder = totalQuestions % 5;
            if (remainder === 1) {
                singleChoiceCount += 1;
            } else if (remainder === 2) {
                singleChoiceCount += 1;
                trueFalseCount += 1;
            } else if (remainder === 3) {
                singleChoiceCount += 2;
                trueFalseCount += 1;
            } else if (remainder === 4) {
                singleChoiceCount += 2;
                trueFalseCount += 2;
            }
        }

        var questions = [];

        // SINGLE CHOICE: tránh trùng trong chính nó
        var usedFlashcardIdsSingle = [];
        for (var i = 0; i < singleChoiceCount; i++) {
            var availableFlashcards = flashcards.filter(card => !usedFlashcardIdsSingle.includes(card.id));
            if (availableFlashcards.length === 0) availableFlashcards = flashcards.slice(); // Cho phép lặp lại
            var flashcard = availableFlashcards[Math.floor(Math.random() * availableFlashcards.length)];
            usedFlashcardIdsSingle.push(flashcard.id);

            var options = [flashcard.definition];
            while (options.length < 4) {
                var randomFlashcard = flashcards[Math.floor(Math.random() * flashcards.length)];
                if (!options.includes(randomFlashcard.definition)) {
                    options.push(randomFlashcard.definition);
                }
            }
            options.sort(() => 0.5 - Math.random());

            questions.push({
                type: 'single',
                question: flashcard.term,
                correctAnswer: flashcard.definition,
                options: options,
                id: flashcard.id
            });
        }

        // TRUE/FALSE: tránh trùng trong chính nó
        var usedFlashcardIdsTrueFalse = [];
        for (var i = 0; i < trueFalseCount; i++) {
            var availableFlashcards = flashcards.filter(card => !usedFlashcardIdsTrueFalse.includes(card.id));
            if (availableFlashcards.length === 0) availableFlashcards = flashcards.slice();
            var flashcard = availableFlashcards[Math.floor(Math.random() * availableFlashcards.length)];
            usedFlashcardIdsTrueFalse.push(flashcard.id);

            var isTrue = Math.random() > 0.5;
            var definition = isTrue ? flashcard.definition : flashcards[Math.floor(Math.random() * flashcards.length)].definition;
            while (definition === flashcard.definition && !isTrue) {
                definition = flashcards[Math.floor(Math.random() * flashcards.length)].definition;
            }

            questions.push({
                type: 'truefalse',
                term: flashcard.term,
                definition: definition,
                correctDefinition: flashcard.definition,
                id: flashcard.id
            });
        }

        // MATCH: tránh trùng cặp trong chính 1 câu match
        for (var i = 0; i < matchCount; i++) {
            var pairCount = Math.min(6, Math.max(2, Math.floor(Math.random() * flashcards.length)));
            var availableFlashcards = flashcards.slice();
            if (availableFlashcards.length < pairCount) pairCount = availableFlashcards.length;
            if (pairCount < 2) break;

            var pairs = [];
            var correctPairs = [];
            for (var j = 0; j < pairCount; j++) {
                if (availableFlashcards.length === 0) break;
                var idx = Math.floor(Math.random() * availableFlashcards.length);
                var flashcard = availableFlashcards[idx];
                pairs.push({ id: flashcard.id, term: flashcard.term, definition: flashcard.definition });
                correctPairs.push({ id: flashcard.id, term: flashcard.term, definition: flashcard.definition });
                availableFlashcards.splice(idx, 1);
            }

            questions.push({
                type: 'match',
                pairs: pairs,
                correctPairs: correctPairs
            });
        }

        // Sắp xếp lại thứ tự nếu muốn
        questions.sort((a, b) => {
            if (a.type === 'single' && b.type !== 'single') return -1;
            if (a.type === 'truefalse' && b.type === 'match') return -1;
            if (a.type === b.type) return 0;
            return 1;
        });

        // Đảm bảo đủ số lượng câu hỏi
        if (questions.length > totalQuestions) questions = questions.slice(0, totalQuestions);
        while (questions.length < totalQuestions) {
            // Bổ sung random Single Choice nếu thiếu
            var flashcard = flashcards[Math.floor(Math.random() * flashcards.length)];
            var options = [flashcard.definition];
            while (options.length < 4) {
                var randomFlashcard = flashcards[Math.floor(Math.random() * flashcards.length)];
                if (!options.includes(randomFlashcard.definition)) {
                    options.push(randomFlashcard.definition);
                }
            }
            options.sort(() => 0.5 - Math.random());
            questions.push({
                type: 'single',
                question: flashcard.term,
                correctAnswer: flashcard.definition,
                options: options,
                id: flashcard.id
            });
        }

        console.log('Final questions:', questions);
        return { questions: questions };
    }

    window.initializeQuiz = initializeQuiz;
})(jQuery);
