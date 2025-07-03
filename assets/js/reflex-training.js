(function($) {
    console.log('reflex-training.js loaded');

    function displayReflexTraining($container, flashcards, onComplete) {
        console.log('displayReflexTraining defined');
        console.log('Flashcards received:', flashcards);
        console.log('Container:', $container.length);

        // Kiểm tra số lượng flashcard tối thiểu
        if (flashcards.length < 2) {
            console.error('Not enough flashcards for reflex training');
            alert('Lỗi: Cần ít nhất 2 flashcard để chơi!');
            $container.remove();
            $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
            return;
        }

        // Khởi tạo biến
        var score = 0;
        var maxScore = flashcards.length * 10; // Mỗi cặp được 10 điểm
        var timeLeft = flashcards.length * 2; // Thời gian đếm ngược (số cặp x 2 giây)
        var timerInterval = null;
        var correctMatches = 0;
        var incorrectMatches = 0;
        var setId = $container.closest('.flashcard-slider').data('set-id');
        var userId = toraFlashcardData.user_id || 0;
        var currentPage = 0;
        var totalPages = Math.ceil(flashcards.length / 6); // 6 cặp/trang
        var matchedCardIds = [];
        var isPaused = false;

        // Tạo container, header, timer, progress, score, và page info
        $container.empty();
        var $header = $('<div class="quiz-header"></div>');
        var $headerRight = $('<div class="quiz-header-right"></div>');
        var $powerButton = $('<button class="action-button power-button"><i class="fa-solid fa-power-off"></i></button>');
        $headerRight.append($powerButton);
        $header.append($headerRight);
        var $timer = $('<div class="match-timer">Thời gian còn lại: <span class="time-left">0:00</span></div>');
        var $progress = $('<div class="reflex-progress"><div class="progress-bar"></div></div>');
        var $scoreDisplay = $('<div class="match-score">Điểm: <span class="score">0</span></div>');
        var $pageInfo = $('<div class="match-page">Trang <span class="current-page">1</span>/<span class="total-pages">' + totalPages + '</span></div>');
        var $grid = $('<div class="flashcard-match-grid"></div>');
        $container.append($header);
        $container.append($timer);
        $container.append($progress);
        $container.append($scoreDisplay);
        $container.append($grid);
        $container.append($pageInfo);
        console.log('Header, timer, progress, score, page info, and grid appended to container');

        // Gắn sự kiện power button
        $powerButton.on('click', function() {
            console.log('Power button clicked in Reflex Training');
            window.showExitConfirmation('reflex-training', $container.closest('.flashcard-slider'), $container, null, [], null, null);
        });

        // Khởi tạo timer đếm ngược
        function startTimer() {
            if (!isPaused) {
                timerInterval = setInterval(function() {
                    timeLeft--;
                    var minutes = Math.floor(timeLeft / 60);
                    var seconds = timeLeft % 60;
                    $timer.find('.time-left').text(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                    var progressPercent = (timeLeft / (flashcards.length * 2)) * 100;
                    $progress.find('.progress-bar').css('width', progressPercent + '%');
                    if (progressPercent < 20) {
                        $progress.find('.progress-bar').addClass('warning');
                    } else {
                        $progress.find('.progress-bar').removeClass('warning');
                    }
                    console.log('Time left:', timeLeft);
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        console.log('Time up! Showing result popup');
                        showResultPopup();
                    }
                }, 1000);
            }
        }

        // Tạm dừng timer
        function pauseTimer() {
            isPaused = true;
            clearInterval(timerInterval);
            console.log('Timer paused');
        }

        // Tiếp tục timer
        function resumeTimer() {
            isPaused = false;
            startTimer();
            console.log('Timer resumed');
        }

        // Lưu điểm số qua AJAX
        function saveScore() {
            if (userId && setId) {
                $.ajax({
                    url: toraFlashcardData.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'tora_flashcard_save_match_score',
                        nonce: toraFlashcardData.nonce,
                        user_id: userId,
                        set_id: setId,
                        score: score,
                        correct_matches: correctMatches,
                        incorrect_matches: incorrectMatches,
                        time_used: flashcards.length * 2 - timeLeft // Thời gian sử dụng
                    },
                    success: function(response) {
                        console.log('Score saved:', response);
                    },
                    error: function(xhr, status, error) {
                        console.error('Error saving score:', error);
                        alert('Lỗi khi lưu điểm số. Vui lòng thử lại.');
                    }
                });
            }
        }

        // Hiển thị popup kết quả
        function showResultPopup() {
            pauseTimer();
            var resultMessage = timeLeft <= 0
                ? 'Hết thời gian! Hãy thử lại.'
                : 'Chúc mừng! Bạn đã hoàn thành trò chơi luyện phản xạ!';
            var scoreMessage = `Điểm số: ${score}/${maxScore}`;
            var matchStats = `Ghép đúng: ${correctMatches}, Ghép sai: ${incorrectMatches}`;
            var timeUsedFormatted = `Thời gian sử dụng: ${Math.floor((flashcards.length * 2 - timeLeft) / 60)}:${((flashcards.length * 2 - timeLeft) % 60 < 10 ? '0' : '') + ((flashcards.length * 2 - timeLeft) % 60)}`;

            var $resultPopup = $(`
                <div class="flashcard-match-result-popup">
                    <h3>${resultMessage}</h3>
                    <p>${scoreMessage}</p>
                    <p>${matchStats}</p>
                    <p>${timeUsedFormatted}</p>
                    <button class="match-close">Đóng</button>
                    <button class="match-replay">Chơi lại</button>
                </div>
            `);
            $container.append($resultPopup);
            $resultPopup.css('display', 'block');
            console.log('Result popup displayed:', { score, correctMatches, incorrectMatches, timeUsed: flashcards.length * 2 - timeLeft });

            $resultPopup.find('.match-close').on('click', function() {
                console.log('Reflex close button clicked');
                saveScore();
                $container.remove();
                $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
            });

            $resultPopup.find('.match-replay').on('click', function() {
                console.log('Reflex replay button clicked');
                saveScore();
                $resultPopup.remove();
                displayReflexTraining($container, flashcards, onComplete);
            });
        }

        // Hiển thị trang flashcard
        function displayPage(pageIndex) {
            pauseTimer(); // Tạm dừng timer khi chuyển trang
            $grid.empty();
            var startIndex = pageIndex * 6;
            var endIndex = Math.min(startIndex + 6, flashcards.length);
            var selectedFlashcards = flashcards.slice(startIndex, endIndex).filter(card => !matchedCardIds.includes(card.id));
            console.log('Displaying page:', pageIndex, 'Flashcards:', selectedFlashcards);

            var cards = [];
            selectedFlashcards.forEach(function(card) {
                cards.push({ content: card.term, id: card.id, type: 'term' });
                cards.push({ content: card.definition, id: card.id, type: 'definition' });
            });
            cards.sort(() => 0.5 - Math.random());

            // Tạo lưới với 12 ô
            for (var i = 0; i < 12; i++) {
                if (i < cards.length) {
                    var $card = $(`<div class="flashcard-match-item" data-id="${cards[i].id}" data-type="${cards[i].type}">${cards[i].content}</div>`);
                    $grid.append($card);
                } else {
                    var $emptyCard = $('<div class="flashcard-match-item matched"></div>');
                    $grid.append($emptyCard);
                }
            }
            console.log('Grid populated with cards for page:', pageIndex);

            $pageInfo.find('.current-page').text(pageIndex + 1);
            resumeTimer(); // Tiếp tục timer sau khi hiển thị trang
            bindClickEvents();
        }

        // Xử lý logic ghép thẻ
        var selectedTerm = null, selectedDefinition = null;
        function bindClickEvents() {
            $container.find('.flashcard-match-item').off('click').on('click', function() {
                var $this = $(this);
                console.log('Card clicked:', { id: $this.data('id'), type: $this.data('type') });

                if ($this.hasClass('matched') || $this.hasClass('incorrect')) return;
                $this.addClass('selected');
                var id = $this.data('id');
                var type = $this.data('type');

                if (type === 'term') {
                    if (selectedTerm && selectedTerm.id === id) {
                        $this.removeClass('selected');
                        selectedTerm = null;
                        console.log('Deselected term:', id);
                    } else {
                        if (selectedTerm) {
                            $container.find(`.flashcard-match-item[data-id="${selectedTerm.id}"][data-type="term"]`).removeClass('selected');
                            console.log('Deselected previous term:', selectedTerm.id);
                        }
                        selectedTerm = { id: id, element: $this };
                        console.log('Selected term:', id);
                    }
                } else {
                    if (selectedDefinition && selectedDefinition.id === id) {
                        $this.removeClass('selected');
                        selectedDefinition = null;
                        console.log('Deselected definition:', id);
                    } else {
                        if (selectedDefinition) {
                            $container.find(`.flashcard-match-item[data-id="${selectedDefinition.id}"][data-type="definition"]`).removeClass('selected');
                            console.log('Deselected previous definition:', selectedDefinition.id);
                        }
                        selectedDefinition = { id: id, element: $this };
                        console.log('Selected definition:', id);
                    }
                }

                if (selectedTerm && selectedDefinition) {
                    console.log('Checking match:', { termId: selectedTerm.id, definitionId: selectedDefinition.id });
                    if (selectedTerm.id === selectedDefinition.id) {
                        selectedTerm.element.addClass('matched correct-effect');
                        selectedDefinition.element.addClass('matched correct-effect');
                        score += 10;
                        correctMatches++;
                        matchedCardIds.push(selectedTerm.id);
                        $scoreDisplay.find('.score').text(score);
                        console.log('Match successful:', selectedTerm.id, 'Score:', score);
                        setTimeout(function() {
                            selectedTerm.element.removeClass('correct-effect');
                            selectedDefinition.element.removeClass('correct-effect');
                            if ($container.find('.flashcard-match-item:not(.matched)').length === 0) {
                                if (currentPage < totalPages - 1 && flashcards.slice((currentPage + 1) * 6).some(card => !matchedCardIds.includes(card.id))) {
                                    currentPage++;
                                    displayPage(currentPage);
                                } else {
                                    console.log('Reflex training completed!');
                                    showResultPopup();
                                }
                            }
                            selectedTerm = null;
                            selectedDefinition = null;
                        }, 700);
                    } else {
                        $container.find('.flashcard-match-item').css('pointer-events', 'none');
                        selectedTerm.element.addClass('incorrect');
                        selectedDefinition.element.addClass('incorrect');
                        incorrectMatches++;
                        console.log('Match incorrect:', { termId: selectedTerm.id, definitionId: selectedDefinition.id });
                        setTimeout(function() {
                            $container.find('.flashcard-match-item').removeClass('incorrect selected');
                            $container.find('.flashcard-match-item').css('pointer-events', 'auto');
                            console.log('Reset incorrect cards');
                            selectedTerm = null;
                            selectedDefinition = null;
                        }, 700);
                    }
                }
            });
        }

        // Hiển thị trang đầu tiên
        startTimer();
        displayPage(currentPage);
    }

    window.displayReflexTraining = displayReflexTraining;
    console.log('window.displayReflexTraining assigned:', typeof window.displayReflexTraining);
})(jQuery);