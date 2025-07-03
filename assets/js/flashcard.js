jQuery(document).ready(function($) {
    console.log('Tora Flashcard Frontend JS loaded');
    if (typeof toraFlashcardData === 'undefined') {
        console.error('Tora Flashcard: toraFlashcardData is not defined');
        return;
    }
    console.log('AJAX URL:', toraFlashcardData.ajax_url);
    console.log('Nonce:', toraFlashcardData.nonce);
    console.log('Checking window.displayFlashcardMatch:', typeof window.displayFlashcardMatch);
    console.log('Checking window.displayReflexTraining:', typeof window.displayReflexTraining);

    // Hàm hiển thị popup xác nhận thoát (toàn cục)
    window.showExitConfirmation = function(mode, $slider, $quizContainer, $learnContainer, wrongQuestions, learnedCards, notLearnedCards) {
        if ($slider.find('.exit-confirmation-popup').length > 0) {
            console.log('Exit confirmation popup already exists, skipping creation');
            return;
        }

        var message = mode === 'retry' 
            ? 'Bạn có chắc muốn thoát chế độ làm lại? Tiến trình sẽ không được lưu.'
            : mode === 'learn'
            ? 'Bạn có chắc muốn thoát chế độ học? Tiến trình sẽ không được lưu.'
            : mode === 'matching-game'
            ? 'Bạn có chắc muốn thoát trò chơi ghép thẻ? Tiến trình sẽ không được lưu.'
            : mode === 'reflex-training'
            ? 'Bạn có chắc muốn thoát trò chơi luyện phản xạ? Tiến trình sẽ không được lưu.'
            : 'Bạn có chắc muốn thoát chế độ kiểm tra? Tiến trình sẽ không được lưu.';
        var $exitPopup = $(`
            <div class="exit-confirmation-popup">
                <h3>${message}</h3>
                <button class="exit-confirm">Thoát</button>
                <button class="exit-cancel">Tiếp tục</button>
            </div>
        `);
        $slider.append($exitPopup);
        $exitPopup.css('display', 'block');

        $exitPopup.find('.exit-confirm').off('click').on('click', function() {
            $exitPopup.remove();
            if (mode === 'learn' && $learnContainer) {
                $learnContainer.remove();
                $learnContainer = null;
                if (learnedCards && notLearnedCards) {
                    learnedCards.length = 0;
                    notLearnedCards.length = 0;
                }
            } else if ($quizContainer) {
                $quizContainer.remove();
                $quizContainer = null;
                if (wrongQuestions) {
                    wrongQuestions.length = 0;
                }
            }
            console.log('Exit confirmed - mode:', mode, 'wrongQuestions:', wrongQuestions, 'learnedCards:', learnedCards, 'notLearnedCards:', notLearnedCards);
            $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
        });

        $exitPopup.find('.exit-cancel').off('click').on('click', function() {
            $exitPopup.remove();
            console.log('Exit cancelled - mode:', mode);
        });
    };

    $('.flashcard-slider').each(function() {
        var $slider = $(this);
        var $cards = $slider.find('.flashcard-item');
        var total = parseInt($slider.data('total'));
        var setId = parseInt($slider.data('set-id'));
        var $counter = $slider.find('.flashcard-counter');
        var $progressBar = $slider.find('.progress-bar');

        console.log('Slider initialized:', { slider: $slider.length, cards: $cards.length, total, setId });

        if ($cards.length !== total) {
            console.warn('Mismatch: Expected ' + total + ' cards, found ' + $cards.length);
            return;
        }

        var currentIndex = 0;
        var wrongQuestions = [];
        var retryCount = 0;
        var isRetryMode = false;
        var $quizContainer = null;
        var $learnContainer = null;

        // Khởi tạo giao diện mặc định
        $cards.hide().eq(0).show().addClass('active');
        $counter.text((currentIndex + 1) + '/' + total);
        $progressBar.css('width', ((currentIndex + 1) / total * 100) + '%');

        // Xử lý lật thẻ mặc định
        $cards.on('click touchstart', function(e) {
            e.preventDefault();
            var $wrapper = $(this).find('.flashcard-wrapper');
            $wrapper.toggleClass('flipped');
            console.log('Flipped card:', $(this).find('.flashcard-front-content p').text());
        });

        // Xử lý điều hướng mặc định
        $('.nav-button.prev', $slider).on('click touchend', function(e) {
            e.preventDefault();
            currentIndex = currentIndex - 1 < 0 ? total - 1 : currentIndex - 1;
            updateCard($cards.eq(currentIndex), currentIndex);
        });

        $('.nav-button.next', $slider).on('click touchend', function(e) {
            e.preventDefault();
            currentIndex = currentIndex + 1 >= total ? 0 : currentIndex + 1;
            updateCard($cards.eq(currentIndex), currentIndex);
        });

        function updateCard($newCard, index) {
            $cards.removeClass('active').hide();
            $newCard.addClass('active').show();
            $newCard.find('.flashcard-wrapper').removeClass('flipped');
            $counter.text((index + 1) + '/' + total);
            $progressBar.css('width', ((index + 1) / total * 100) + '%');
        }

        // Xử lý các chế độ
        $slider.on('click', '.mode-item, .mode-item .mode-icon', function(e) {
            e.preventDefault();
            var $target = $(e.target).closest('.mode-item');
            const mode = $target.data('mode');
            $('.mode-item').removeClass('active');
            $target.addClass('active');
            $('.learn-new-words-container, .quiz-container, .flashcard-match-container').remove();
            $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').hide();
            console.log('Mode selected:', mode);

            if (mode === 'learn-new-words') {
                var learnedCards = [];
                var notLearnedCards = [];
                currentIndex = 0;

                var $flashcardItems = $slider.find('.learn-flashcard-item');
                var flashcards = [];
                $flashcardItems.each(function() {
                    var $inner = $(this).find('.learn-flashcard-inner');
                    var term = $inner.find('.learn-term').text();
                    var definition = $inner.find('.learn-definition').text();
                    if (term && definition) {
                        flashcards.push({
                            id: $(this).data('id'),
                            term: term,
                            definition: definition,
                            html: $inner.clone()
                        });
                    }
                });
                console.log('Initial flashcards length:', flashcards.length, 'flashcards:', flashcards);

                if (flashcards.length === 0) {
                    console.error('No valid flashcards found for learn mode');
                    alert('Không có flashcard để học!');
                    $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
                    return;
                }

                // ----------- SỬA ĐỔI PHẦN HTML learn-stats VỀ GIAO DIỆN MỚI -----------
                $learnContainer = $('<div class="learn-new-words-container max-w-2xl mx-auto p-4"></div>');
                $learnContainer.append(`
                    <div class="learn-actions-top">
                        <button class="action-button power-button">
                            <i class="fa-solid fa-power-off"></i>
                        </button>
                    </div>
                    <div class="learn-control-section">
                        <div class="learn-stats-custom">
                            <div class="stat-block not-learned">
                                <div class="stat-count">0</div>
                                <div class="stat-label"><span class="icon">✗</span> Chưa thuộc</div>
                            </div>
                            <div class="stat-progress">
                                <span class="stat-current">0</span>/<span class="stat-total">${flashcards.length}</span>
                            </div>
                            <div class="stat-block learned">
                                <div class="stat-count">0</div>
                                <div class="stat-label"><span class="icon">✓</span> Đã thuộc</div>
                            </div>
                        </div>
                        <div class="flashcard-progress">
                            <div class="progress-bar"></div>
                        </div>
                    </div>
<div class="learn-flashcard-section">
        <div class="learn-flashcard-wrapper">
            <button class="action-button not-learned-button">
                <img src="https://hoccungtora.com/wp-content/uploads/cross.png" alt="Not Learned" />
            </button>
            <div class="learn-flashcard-inner">
                <div class="learn-flashcard-front">
                    <p class="learn-term"></p>
                </div>
                <div class="learn-flashcard-back">
                    <p class="learn-definition"></p>
                </div>
            </div>
            <button class="action-button learn-button">
                <img src="https://hoccungtora.com/wp-content/uploads/checked.png" alt="Learned" />
            </button>
        </div>
    </div>
                    <div class="learn-notification" style="display: none;"></div>
                `);
                $slider.append($learnContainer);

                // Hàm cập nhật giao diện số lượng cho stat mới
                function updateCustomStats(learned, notLearned, total) {
                    $learnContainer.find('.stat-block.not-learned .stat-count').text(notLearned);
                    $learnContainer.find('.stat-block.learned .stat-count').text(learned);
                    $learnContainer.find('.stat-progress .stat-current').text(learned + notLearned);
                    $learnContainer.find('.stat-progress .stat-total').text(total);
                }

                function showFlashcard(index, cards) {
                    if (index >= cards.length) {
                        var allCardIds = flashcards.map(card => card.id);
                        learnedCards = learnedCards.filter(id => allCardIds.includes(id));
                        notLearnedCards = notLearnedCards.filter(id => allCardIds.includes(id));
                        updateCustomStats(learnedCards.length, notLearnedCards.length, flashcards.length);

                        var totalCount = learnedCards.length + notLearnedCards.length;
                        console.log('Final state - learnedCards:', learnedCards, 'notLearnedCards:', notLearnedCards, 'totalCount:', totalCount, 'expectedTotal:', flashcards.length);

                        // ----- SỬA learn-popup: đổi .relearn-button thành <p>, bọc 2 nút vào .learn-popup-actions -----
                        if (notLearnedCards.length === 0) {
                            $learnContainer.find('.learn-notification').html(`
                                <div class="learn-popup">
                                    <h3>Chúc mừng!</h3>
                                    <p>Bạn đã thuộc hết tất cả từ vựng.</p>
                                    <div class="learn-popup-actions">
                                        <button class="quiz-button">Làm bài kiểm tra</button>
                                        <button class="exit-button">Thoát</button>
                                    </div>
                                </div>
                            `).fadeIn(300);
                        } else {
                            $learnContainer.find('.learn-notification').html(`
                                <div class="learn-popup">
                                    <h3>Hoàn thành lượt học!</h3>
                                    <p>Bạn còn ${notLearnedCards.length} từ chưa thuộc.</p>
                                    <div class="learn-popup-actions">
                                        <p class="relearn-button">Học lại từ chưa thuộc</p>
                                        <button class="quiz-button">Làm bài kiểm tra</button>
                                    </div>
                                </div>
                            `).fadeIn(300);
                        }
                        return;
                    }

                    var card = cards[index];
                    console.log('Displaying card:', card.id, card.term, 'index:', index, 'cards.length:', cards.length);
                    var $newInner = card.html.clone();
                    $learnContainer.find('.learn-flashcard-inner').html($newInner.html());
                    $learnContainer.find('.progress-bar').css('width', ((index + 1) / cards.length * 100) + '%');
                    $learnContainer.find('.learn-flashcard-wrapper').removeClass('flipped');
                    updateCustomStats(learnedCards.length, notLearnedCards.length, flashcards.length);
                }

                showFlashcard(currentIndex, flashcards);

$learnContainer.find('.learn-flashcard-wrapper').on('click touchstart', function(e) {
    // Nếu click vào nút thì không lật thẻ!
    if ($(e.target).closest('.learn-button, .not-learned-button').length > 0) return;
    e.preventDefault();
    $(this).toggleClass('flipped');
});

                $learnContainer.find('.learn-button, .not-learned-button').on('click', function(e) {
e.preventDefault();
e.stopPropagation();
    var action = $(this).hasClass('learn-button') ? 'learned' : 'not-learned';
    var cardId = flashcards[currentIndex].id;

    if (action === 'learned') {
        if (!learnedCards.includes(cardId)) {
            learnedCards.push(cardId);
            notLearnedCards = notLearnedCards.filter(id => id !== cardId);
        }
    } else if (action === 'not-learned') {
        if (!notLearnedCards.includes(cardId)) {
            notLearnedCards.push(cardId);
            if (learnedCards.includes(cardId)) {
                learnedCards = learnedCards.filter(id => id !== cardId);
            }
        }
    }

    currentIndex++;
    showFlashcard(currentIndex, flashcards);
                });

                $learnContainer.on('click', '.relearn-button', function() {
                    currentIndex = 0;
                    var unlearnedFlashcards = flashcards.filter(card => notLearnedCards.includes(card.id));
                    if (unlearnedFlashcards.length === 0) {
                        unlearnedFlashcards = flashcards;
                    } else {
                        flashcards = unlearnedFlashcards;
                        currentIndex = 0;
                        learnedCards = [];
                        notLearnedCards = [];
                        updateCustomStats(0, unlearnedFlashcards.length, flashcards.length);
                    }
                    console.log('Relearn - unlearnedFlashcards:', unlearnedFlashcards.length, 'flashcards:', flashcards.length);
                    $learnContainer.find('.learn-notification').hide();
                    showFlashcard(currentIndex, flashcards);
                });

                $learnContainer.on('click', '.quiz-button, .exit-button', function() {
                    var $this = $(this);
if ($this.hasClass('quiz-button')) {
    var $flashcardItems = $slider.find('.learn-flashcard-item');
    var flashcards = [];
    $flashcardItems.each(function() {
        var $inner = $(this).find('.learn-flashcard-inner');
        var term = $inner.find('.learn-term').text();
        var definition = $inner.find('.learn-definition').text();
        if (term && definition) {
            flashcards.push({
                id: $(this).data('id'),
                term: term,
                definition: definition
            });
        }
    });
    console.log('Quiz flashcards:', flashcards);
    
    // Định nghĩa maxWords và tạo popup sau khi đã có flashcards
    var maxWords = flashcards.length;
    var $quizPopup = $(`
    <div class="quiz-start-popup">
        <h3>Chọn số câu để kiểm tra</h3>
        <p class="quiz-description">Nhập số câu từ 2 đến ${flashcards.length}. Nếu bạn bỏ qua thì số câu sẽ là ${flashcards.length}.</p>
        <input type="number" id="quiz-word-count" min="2" max="${flashcards.length}" placeholder="Nhập số câu">
        <p class="error-message" style="display: none; color: red; margin: 5px 0;"></p>
        <div class="quiz-popup-actions">
            <button class="quiz-start">Bắt đầu Kiểm tra</button>
            <button class="quiz-cancel">Quay lại</button>
        </div>
    </div>
`);                
                        $slider.append($quizPopup);
                        $quizPopup.css('display', 'block');
                        $learnContainer.hide();
       $quizPopup.find('.quiz-start').on('click', function() {
    var inputValue = $('#quiz-word-count').val();
    var maxWords = flashcards.length;
    var wordCount;
    var $errorMessage = $quizPopup.find('.error-message');

    // Ẩn thông báo lỗi cũ (nếu có)
    $errorMessage.hide();

    // Kiểm tra nếu input rỗng hoặc không phải số
    if (inputValue === '' || isNaN(parseInt(inputValue))) {
        wordCount = maxWords;
    } else {
        wordCount = parseInt(inputValue);
    }

    console.log('Input value:', inputValue);
    console.log('Parsed word count:', wordCount);
    console.log('Max words:', maxWords);

    // Kiểm tra điều kiện chặt chẽ hơn
    if (wordCount !== parseInt(wordCount)) {
        $errorMessage.text('Vui lòng nhập số nguyên').show();
        return;
    }

    if (wordCount < 2) {
        $errorMessage.text('Số câu phải lớn hơn hoặc bằng 2').show();
        return;
    }

    if (wordCount > maxWords) {
        $errorMessage.text(`Số câu phải nhỏ hơn hoặc bằng ${maxWords}`).show();
        return;
    }

    // Nếu tất cả điều kiện đều hợp lệ
    $quizPopup.hide();
    $quizPopup.remove();
    startQuiz(wordCount, flashcards);
});
                        $quizPopup.find('.quiz-cancel').on('click', function() {
                            $quizPopup.remove();
                            $learnContainer.show();
                        });
                    } else {
                        $learnContainer.remove();
                        $learnContainer = null;
                        learnedCards = [];
                        notLearnedCards = [];
                        console.log('Exit learn mode - learnedCards:', learnedCards, 'notLearnedCards:', notLearnedCards);
                        $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
                    }
                });

                $learnContainer.find('.power-button').on('click', function() {
                    window.showExitConfirmation('learn', $slider, $quizContainer, $learnContainer, wrongQuestions, learnedCards, notLearnedCards);
                });
            } 
            else if (mode === 'quiz') {
    var $flashcardItems = $slider.find('.learn-flashcard-item');
    var flashcards = [];
    $flashcardItems.each(function() {
        var $inner = $(this).find('.learn-flashcard-inner');
        var term = $inner.find('.learn-term').text();
        var definition = $inner.find('.learn-definition').text();
        if (term && definition) {
            flashcards.push({
                id: $(this).data('id'),
                term: term,
                definition: definition
            });
        }
    });
    console.log('Quiz flashcards:', flashcards);
    
    if (flashcards.length === 0) {
        console.error('No valid flashcards found for quiz');
        alert('Không có flashcard để kiểm tra!');
        $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
        return;
    }
    
    // Tạo popup sau khi đã có flashcards
   var $quizPopup = $(`
        <div class="quiz-start-popup">
            <h3>Chọn số câu để kiểm tra</h3>
            <p class="quiz-description">Nhập số câu từ 2 đến ${flashcards.length}. Nếu bạn bỏ qua thì số câu sẽ là ${flashcards.length}.</p>
            <input type="number" id="quiz-word-count" min="2" max="${flashcards.length}" placeholder="Nhập số câu">
            <p class="error-message" style="display: none; color: red; margin: 5px 0;"></p>
            <div class="quiz-popup-actions">
                <button class="quiz-start">Bắt đầu Kiểm tra</button>
                <button class="quiz-cancel">Quay lại</button>
            </div>
        </div>
    `); 
    $slider.append($quizPopup);
    $quizPopup.css('display', 'block');
    
 $quizPopup.find('.quiz-start').on('click', function() {
    var inputValue = $('#quiz-word-count').val();
    var maxWords = flashcards.length;
    var wordCount;
    var $errorMessage = $quizPopup.find('.error-message');

    // Ẩn thông báo lỗi cũ (nếu có)
    $errorMessage.hide();

    // Kiểm tra nếu input rỗng hoặc không phải số
    if (inputValue === '' || isNaN(parseInt(inputValue))) {
        wordCount = maxWords;
    } else {
        wordCount = parseInt(inputValue);
    }

    console.log('Input value:', inputValue);
    console.log('Parsed word count:', wordCount);
    console.log('Max words:', maxWords);

    // Kiểm tra điều kiện chặt chẽ hơn
    if (wordCount !== parseInt(wordCount)) {
        $errorMessage.text('Vui lòng nhập số nguyên').show();
        return;
    }

    if (wordCount < 2) {
        $errorMessage.text('Số câu phải lớn hơn hoặc bằng 2').show();
        return;
    }

    if (wordCount > maxWords) {
        $errorMessage.text(`Số câu phải nhỏ hơn hoặc bằng ${maxWords}`).show();
        return;
    }

    // Nếu tất cả điều kiện đều hợp lệ
    $quizPopup.hide();
    $quizPopup.remove();
    startQuiz(wordCount, flashcards);
});
    $quizPopup.find('.quiz-cancel').on('click', function() {
        $quizPopup.remove();
        $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
    });
}
            else if (mode === 'matching-game') {
                var $flashcardItems = $slider.find('.learn-flashcard-item');
                var flashcards = [];
                $flashcardItems.each(function() {
                    var $inner = $(this).find('.learn-flashcard-inner');
                    var term = $inner.find('.learn-term').text();
                    var definition = $inner.find('.learn-definition').text();
                    if (term && definition) {
                        flashcards.push({
                            id: $(this).data('id'),
                            term: term,
                            definition: definition
                        });
                    }
                });
                console.log('Flashcard Match flashcards:', flashcards);
                if (flashcards.length < 2) {
                    console.error('No valid flashcards found for Flashcard Match');
                    alert('Không có flashcard để chơi!');
                    $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
                    return;
                }
                startFlashcardMatch(flashcards);
            } else if (mode === 'reflex-training') {
                var $flashcardItems = $slider.find('.learn-flashcard-item');
                var flashcards = [];
                $flashcardItems.each(function() {
                    var $inner = $(this).find('.learn-flashcard-inner');
                    var term = $inner.find('.learn-term').text();
                    var definition = $inner.find('.learn-definition').text();
                    if (term && definition) {
                        flashcards.push({
                            id: $(this).data('id'),
                            term: term,
                            definition: definition
                        });
                    }
                });
                console.log('Reflex Training flashcards:', flashcards);
                if (flashcards.length < 2) {
                    console.error('No valid flashcards found for Reflex Training');
                    alert('Không có flashcard để chơi!');
                    $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
                    return;
                }
                startReflexTraining(flashcards);
            }
        });

        function startQuiz(wordCount, allFlashcards) {
            console.log('Starting quiz with wordCount:', wordCount, 'allFlashcards:', allFlashcards.length);
            var usedFlashcardIds = [];
            var availableFlashcards = allFlashcards.filter(card => !usedFlashcardIds.includes(card.id));
            console.log('Available flashcards after filtering:', availableFlashcards.length);

            var quizData = initializeQuiz($slider, wordCount, availableFlashcards);
            var questions = quizData.questions;
            currentIndex = 0;
            wrongQuestions = [];
            retryCount = 0;
            isRetryMode = false;

            $quizContainer = $('<div class="quiz-container"></div>');
            $slider.append($quizContainer);
            $quizContainer.css('display', 'block');

            function displayNextQuestion() {
                console.log('Displaying question:', currentIndex, 'of', questions.length, 'type:', questions[currentIndex] ? questions[currentIndex].type : 'none', 'isRetryMode:', isRetryMode);
                if (currentIndex < questions.length) {
                    $quizContainer.empty();
                    console.log('Container cleared:', $quizContainer.html());
                    if (questions[currentIndex].type === 'single') {
                        console.log('Calling displaySingleChoice with question:', questions[currentIndex]);
                        window.displaySingleChoice($quizContainer, questions[currentIndex], function(isCorrect) {
                            if (!isCorrect) wrongQuestions.push(currentIndex);
                            currentIndex++;
                            displayNextQuestion();
                        }, currentIndex, questions.length);
                    } else if (questions[currentIndex].type === 'truefalse') {
                        console.log('Calling displayTrueFalse with question:', questions[currentIndex]);
                        window.displayTrueFalse($quizContainer, questions[currentIndex], function(isCorrect) {
                            if (!isCorrect) wrongQuestions.push(currentIndex);
                            currentIndex++;
                            displayNextQuestion();
                        }, currentIndex, questions.length);
                    } else if (questions[currentIndex].type === 'match') {
                        console.log('Calling displayMatch with question:', questions[currentIndex]);
                        window.displayMatch($quizContainer, questions[currentIndex], function(isCorrect) {
                            if (!isCorrect) wrongQuestions.push(currentIndex);
                            currentIndex++;
                            displayNextQuestion();
                        }, currentIndex, questions.length);
                    }
                } else {
                    showQuizResult();
                }
            }

            function showQuizResult() {
                $quizContainer.css('display', 'none');
                console.log('Quiz finished - wrongQuestions:', wrongQuestions, 'retryCount:', retryCount);
                if (wrongQuestions.length > 0) {
                    $slider.append(`
                        <div class="quiz-result-popup">
                            <h3>Thông báo / Cùng ôn lại những lỗi sai nào !!!</h3>
                        </div>
                    `);
                    $slider.find('.quiz-result-popup').css('display', 'block');
                    setTimeout(function() {
                        $slider.find('.quiz-result-popup').remove();
                        retryCount++;
                        isRetryMode = true;
                        currentIndex = 0;
                        questions = wrongQuestions.map(i => questions[i]);
                        wrongQuestions = [];
                        console.log('Retry mode started - retryCount:', retryCount, 'new questions:', questions);
                        $quizContainer.css('display', 'block');
                        displayNextQuestion();
                    }, 2000);
                } else {
                    $slider.append(`
                        <div class="quiz-result-popup">
                            <h3>Chúc mừng, bạn trả lời đúng hết!</h3>
                        </div>
                    `);
                    $slider.find('.quiz-result-popup').css('display', 'block');
                    setTimeout(function() {
                        $slider.find('.quiz-result-popup').remove();
                        if ($quizContainer) {
                            $quizContainer.remove();
                            $quizContainer = null;
                        }
                        wrongQuestions = [];
                        console.log('Quiz completed successfully - wrongQuestions reset:', wrongQuestions);
                        $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
                    }, 2000);
                }
            }

            displayNextQuestion();
        }

        function startFlashcardMatch(flashcards) {
            console.log('Starting Flashcard Match with flashcards:', flashcards.length);
            if (flashcards.length < 2) {
                console.error('No valid flashcards found for Flashcard Match');
                alert('Không có flashcard để chơi!');
                $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
                return;
            }
            var $matchContainer = $('<div class="flashcard-match-container"></div>');
            $slider.append($matchContainer);
            console.log('Match container appended:', {
                container: $matchContainer.length,
                parent: $slider.length,
                sliderDisplay: $slider.css('display')
            });
            $matchContainer.css('display', 'block');
            console.log('Match container display:', $matchContainer.css('display'));

            if (typeof window.displayFlashcardMatch === 'function') {
                window.displayFlashcardMatch($matchContainer, flashcards, function(newFlashcards) {
                    startFlashcardMatch(newFlashcards);
                });
            } else {
                console.error('window.displayFlashcardMatch is not defined');
                $matchContainer.remove();
                alert('Lỗi: Không thể khởi động trò chơi ghép thẻ!');
                $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
            }
        }

        function startReflexTraining(flashcards) {
            console.log('Starting Reflex Training with flashcards:', flashcards.length);
            if (flashcards.length < 2) {
                console.error('No valid flashcards found for Reflex Training');
                alert('Không có flashcard để chơi!');
                $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
                return;
            }
            var $reflexContainer = $('<div class="flashcard-match-container"></div>');
            $slider.append($reflexContainer);
            console.log('Reflex container appended:', {
                container: $reflexContainer.length,
                parent: $slider.length,
                sliderDisplay: $slider.css('display')
            });
            $reflexContainer.css('display', 'block');
            console.log('Reflex container display:', $reflexContainer.css('display'));

            if (typeof window.displayReflexTraining === 'function') {
                window.displayReflexTraining($reflexContainer, flashcards, function(newFlashcards) {
                    startReflexTraining(newFlashcards);
                });
            } else {
                console.error('window.displayReflexTraining is not defined');
                $reflexContainer.remove();
                alert('Lỗi: Không thể khởi động trò chơi luyện phản xạ!');
                $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
            }
        }

        // Bookmark and filter logic
        const $vocabularyGrid = $slider.find('#vocabularyGrid');
        const $btnAll = $slider.find('.btn-all');
        const $btnSaved = $slider.find('.btn-saved');
        let bookmarkedItems = JSON.parse(localStorage.getItem('bookmarkedItems')) || [];

        updateGrid('all');

        $slider.on('click', '.bookmark-button', function(e) {
            e.preventDefault();
            const $button = $(this);
            const $iconCircle = $button.find('.bookmark-icon-circle');
            const cardId = $button.data('id');
            const $vocabItem = $button.closest('.vocab-item');
            const isSavedTabActive = $btnSaved.hasClass('active');

            if ($iconCircle.hasClass('bookmarked')) {
                bookmarkedItems = bookmarkedItems.filter(id => id !== cardId);
                $iconCircle.removeClass('bookmarked');
                $vocabItem.removeClass('bookmarked');
                if (isSavedTabActive) {
                    $vocabItem.hide();
                    updateGrid('saved');
                }
            } else {
                bookmarkedItems.push(cardId);
                $iconCircle.addClass('bookmarked');
                $vocabItem.addClass('bookmarked bookmarked-effect');
                setTimeout(() => $vocabItem.removeClass('bookmarked-effect'), 300);
            }

            localStorage.setItem('bookmarkedItems', JSON.stringify(bookmarkedItems));
            updateGrid($('.list-actions .active').data('filter'));
        });

        $slider.find('.list-actions button').on('click', function() {
            const filter = $(this).data('filter');
            $('.list-actions button').removeClass('active');
            $(this).addClass('active');
            updateGrid(filter);
        });

        function updateGrid(filter) {
            const $items = $vocabularyGrid.find('.vocab-item');
            $items.hide();

            if (filter === 'all') {
                $items.each(function() {
                    const cardId = $(this).data('id');
                    $(this).show();
                    if (bookmarkedItems.includes(cardId)) {
                        $(this).find('.bookmark-icon-circle').addClass('bookmarked');
                        $(this).addClass('bookmarked');
                    } else {
                        $(this).find('.bookmark-icon-circle').removeClass('bookmarked');
                        $(this).removeClass('bookmarked');
                    }
                });
            } else if (filter === 'saved') {
                $items.each(function() {
                    const cardId = $(this).data('id');
                    if (bookmarkedItems.includes(cardId)) {
                        $(this).show();
                        $(this).find('.bookmark-icon-circle').addClass('bookmarked');
                        $(this).addClass('bookmarked');
                    }
                });
            }
        }
    });
});