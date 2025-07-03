(function($) {
    console.log('flashcard-match.js loaded'); // Log xác nhận file tải

    function displayFlashcardMatch($container, flashcards, onComplete) {
        console.log('displayFlashcardMatch defined'); // Log xác nhận hàm định nghĩa
        console.log('Flashcards received:', flashcards); // Log dữ liệu flashcard
        console.log('Container:', $container.length); // Log container

        // Kiểm tra số lượng flashcard tối thiểu
        if (flashcards.length < 2) {
            console.error('Not enough flashcards for matching game');
            alert('Lỗi: Cần ít nhất 2 flashcard để chơi!');
            $container.remove();
            $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
            return;
        }

        // Khởi tạo biến
        var score = 0;
        var maxScore = flashcards.length * 10; // Mỗi cặp ghép đúng được 10 điểm
        var timeUsed = 0; // Thời gian sử dụng
        var timerInterval = null;
        var correctMatches = 0;
        var incorrectMatches = 0;
        var setId = $container.closest('.flashcard-slider').data('set-id'); // Lấy set_id từ DOM
        var userId = toraFlashcardData.user_id || 0; // Lấy user_id từ toraFlashcardData
        var currentPage = 0;
        var totalPages = Math.ceil(flashcards.length / 6); // Mỗi trang tối đa 6 cặp
        var matchedCardIds = []; // Theo dõi các thẻ đã ghép đúng

        // Tạo container, header, timer, score, và page info
        $container.empty();
        var $header = $('<div class="quiz-header"></div>');
        var $headerRight = $('<div class="quiz-header-right"></div>');
        var $powerButton = $('<button class="action-button power-button"><i class="fa-solid fa-power-off"></i></button>');
        $headerRight.append($powerButton);
        $header.append($headerRight);
        var $timer = $('<div class="match-timer">Thời gian sử dụng: <span class="time-left">0:00</span></div>');
        var $scoreDisplay = $('<div class="match-score">Điểm: <span class="score">0</span></div>');
        var $pageInfo = $('<div class="match-page">Trang <span class="current-page">1</span>/<span class="total-pages">' + totalPages + '</span></div>');
        var $grid = $('<div class="flashcard-match-grid"></div>');
        $container.append($header);
        $container.append($timer);
        $container.append($scoreDisplay);
        $container.append($grid);
        $container.append($pageInfo);
        console.log('Header, timer, score, page info, and grid appended to container');

        // Gắn sự kiện power button
        $powerButton.on('click', function() {
            console.log('Power button clicked in Matching Game');
            window.showExitConfirmation('matching-game', $container.closest('.flashcard-slider'), $container, null, [], null, null);
        });

        // Khởi tạo timer
        function startTimer() {
            timerInterval = setInterval(function() {
                timeUsed++;
                var minutes = Math.floor(timeUsed / 60);
                var seconds = timeUsed % 60;
                $timer.find('.time-left').text(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                console.log('Time used:', timeUsed);
            }, 1000);
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
                        time_used: timeUsed
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
            clearInterval(timerInterval);
            var resultMessage = 'Chúc mừng! Bạn đã hoàn thành trò chơi ghép thẻ!';
            var scoreMessage = `Điểm số: ${score}/${maxScore}`;
            var matchStats = `Ghép đúng: ${correctMatches}, Ghép sai: ${incorrectMatches}`;
            var timeUsedFormatted = `Thời gian sử dụng: ${Math.floor(timeUsed / 60)}:${(timeUsed % 60 < 10 ? '0' : '') + (timeUsed % 60)}`;

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
            console.log('Result popup displayed:', { score, correctMatches, incorrectMatches, timeUsed });

            $resultPopup.find('.match-close').on('click', function() {
                console.log('Match close button clicked');
                saveScore();
                $container.remove();
                $('.flashcard-active, .flashcard-control-section, .vocabulary-list, .learning-modes').show();
            });

            $resultPopup.find('.match-replay').on('click', function() {
                console.log('Match replay button clicked');
                saveScore();
                $resultPopup.remove();
                displayFlashcardMatch($container, flashcards, onComplete);
            });
        }

        // Hiển thị trang flashcard
        function displayPage(pageIndex) {
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
                                    console.log('Matching game completed!');
                                    showResultPopup();
                                }
                            }
                            selectedTerm = null;
                            selectedDefinition = null;
                        }, 700);
                    } else {
                        $container.find('.flashcard-match-item').css('pointer-events', 'none'); // Vô hiệu hóa click
                        selectedTerm.element.addClass('incorrect');
                        selectedDefinition.element.addClass('incorrect');
                        incorrectMatches++;
                        console.log('Match incorrect:', { termId: selectedTerm.id, definitionId: selectedDefinition.id });
                        setTimeout(function() {
                            $container.find('.flashcard-match-item').removeClass('incorrect selected');
                            $container.find('.flashcard-match-item').css('pointer-events', 'auto'); // Bật lại click
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

    window.displayFlashcardMatch = displayFlashcardMatch;
    console.log('window.displayFlashcardMatch assigned:', typeof window.displayFlashcardMatch);
})(jQuery);
