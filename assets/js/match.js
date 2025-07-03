(function($) {
    function displayMatch($container, question, onSubmit, currentIndex, totalQuestions) {
        $container.empty().addClass('tora-match-container').css('display', 'block');

        // Header
        var $header = $('<div class="quiz-header"></div>');
        var $headerLeft = $('<div class="quiz-header-left"></div>')
            .append('<p>KIỂM TRA</p>')
            .append('<div class="quiz-progress"><div class="progress-bar"></div></div>');
        var $headerRight = $('<div class="quiz-header-right"></div>')
            .append('<button class="action-button power-button"><i class="fa-solid fa-power-off"></i></button>');
        $header.append($headerLeft).append($headerRight);
        $container.append($header);

        // Gắn sự kiện thoát
        $header.find('.power-button').off('click').on('click', function() {
            window.showExitConfirmation(
                currentIndex < totalQuestions ? 'quiz' : 'retry',
                $container.closest('.flashcard-slider'),
                $container,
                null,
                [], // wrongQuestions (not available here, handled in flashcard.js)
                null,
                null
            );
        });

        // Nội dung câu hỏi
        var $content = $('<div class="tora-match-content"></div>')
            .append(`<div class="question-info">Câu ${currentIndex + 1}/${totalQuestions}: Match</div>`);
        var $terms = $('<div class="tora-match-terms"></div>');
        var $definitions = $('<div class="tora-match-definitions"></div>');

        // Xáo trộn terms và definitions
        var shuffledTerms = question.pairs.slice().sort(() => 0.5 - Math.random());
        var shuffledDefinitions = question.pairs.slice().sort(() => 0.5 - Math.random());

        shuffledTerms.forEach((pair, index) => {
            $terms.append(`<div class="tora-match-item term" data-id="${pair.id}" data-term="${pair.term}">${pair.term}</div>`);
        });
        shuffledDefinitions.forEach((pair, index) => {
            $definitions.append(`<div class="tora-match-item definition" data-id="${pair.id}" data-definition="${pair.definition}">${pair.definition}</div>`);
        });

        $content.append($terms).append($definitions);
        $container.append($content);

        updateProgress($header.find('.quiz-progress'), currentIndex, totalQuestions);

        // --- ADD: Make both columns equal height after render ---
        setTimeout(function() {
            toraMatchEqualHeight();
        }, 50);
        $(window).off('resize.toraMatchEqualHeight').on('resize.toraMatchEqualHeight', toraMatchEqualHeight);

        // Logic click-to-match
        var selectedTerm = null;
        var selectedDefinition = null;
        var matchedPairs = [];

        function bindClickEvents() {
            $container.find('.tora-match-item').off('click').on('click', function(e) {
                e.preventDefault();
                var $this = $(this);

                $container.find('.tora-match-item').removeClass('tora-match-item-selected');
                $this.addClass('tora-match-item-selected');

                if ($this.hasClass('term')) {
                    selectedTerm = $this;
                    selectedDefinition = null;
                } else if ($this.hasClass('definition') && selectedTerm) {
                    selectedDefinition = $this;
                    var termId = selectedTerm.data('id');
                    var defId = selectedDefinition.data('id');
                    var termText = String(selectedTerm.data('term')).trim();
                    var defText = String(selectedDefinition.data('definition')).trim();

                    var correctPair = question.correctPairs.find(p => p.id === termId);
                    var isCorrect = correctPair && correctPair.definition === defText && termId === defId;

                    if (!correctPair) {
                        isCorrect = false;
                    }

                    if (isCorrect) {
                        selectedTerm.addClass('tora-match-item-correct')[0].style.setProperty('opacity', '0.5', 'important');
                        selectedTerm.css({
                            'pointer-events': 'none',
                            'display': 'block',
                            'visibility': 'visible',
                            'z-index': '1000'
                        });
                        selectedDefinition.addClass('tora-match-item-correct')[0].style.setProperty('opacity', '0.5', 'important');
                        selectedDefinition.css({
                            'pointer-events': 'none',
                            'display': 'block',
                            'visibility': 'visible',
                            'z-index': '1000'
                        });
                        setTimeout(() => {
                            selectedTerm[0].style.setProperty('opacity', '0.5', 'important');
                            selectedDefinition[0].style.setProperty('opacity', '0.5', 'important');
                        }, 100);
                        matchedPairs.push({ id: termId, term: termText, definition: defText });
                    } else {
                        selectedTerm.addClass('tora-match-item-incorrect');
                        selectedDefinition.addClass('tora-match-item-incorrect');
                        setTimeout(() => {
                            var $termElement = $container.find(`.tora-match-item[data-id="${termId}"]`);
                            var $defElement = $container.find(`.tora-match-item[data-id="${defId}"]`);
                            if ($termElement.length && $defElement.length) {
                                $termElement.removeClass('tora-match-item-incorrect')
                                    .css({
                                        'display': 'block',
                                        'visibility': 'visible',
                                        'opacity': '1',
                                        'cursor': 'pointer',
                                        'pointer-events': 'auto',
                                        'z-index': '1000',
                                        'border': '2px solid #41c5c8'
                                    });
                                $defElement.removeClass('tora-match-item-incorrect')
                                    .css({
                                        'display': 'block',
                                        'visibility': 'visible',
                                        'opacity': '1',
                                        'cursor': 'pointer',
                                        'pointer-events': 'auto',
                                        'z-index': '1000',
                                        'border': '2px solid #41c5c8'
                                    });
                                $container.find('.tora-match-item').removeClass('tora-match-item-selected');
                            }
                            bindClickEvents();
                        }, 700);
                    }

                    selectedTerm = null;
                    selectedDefinition = null;

                    if (matchedPairs.length === question.pairs.length) {
                        $container.find('.tora-match-item').off('click');
                        var $resultContainer = $('<div class="tora-match-result tora-correct-message"></div>')
                            .append('<div class="title">Tuyệt vời</div>')
                            .append('<div class="subtitle">Bạn đã ghép đúng tất cả!</div>');
                        $container.append($resultContainer);
                        // Chỉ hiển thị nút Tiếp tục nếu không phải câu cuối
                        if (currentIndex + 1 < totalQuestions) {
                            $container.append('<button class="tora-match-continue tora-correct-container">Tiếp tục</button>');
                        }

                        // Nếu là câu cuối, gọi onSubmit ngay lập tức
                        if (currentIndex + 1 === totalQuestions) {
                            $container.find('.tora-match-continue').remove();
                            onSubmit(true);
                        } else {
                            $container.find('.tora-match-continue').on('click', function() {
                                // Reset trạng thái để làm lại
                                $container.find('.tora-match-content').empty();
                                $container.find('.tora-match-result').remove();
                                $container.find('.tora-match-continue').remove();
                                onSubmit(true);
                            });
                        }
                    }
                }
            });
        }

        bindClickEvents();
    }

    function updateProgress($progress, currentIndex, totalQuestions) {
        var progress = ((currentIndex + 1) / totalQuestions) * 100;
        $progress.find('.progress-bar').css('width', `${progress}%`);
    }

    // Hàm này sẽ làm hai cột .tora-match-terms và .tora-match-definitions cao bằng nhau
    function toraMatchEqualHeight() {
        var $terms = $('.tora-match-terms');
        var $defs = $('.tora-match-definitions');
        if (!$terms.length || !$defs.length) return;
        $terms.css('height', '');
        $defs.css('height', '');
        var maxHeight = Math.max($terms.outerHeight(), $defs.outerHeight());
        $terms.css('height', maxHeight + 'px');
        $defs.css('height', maxHeight + 'px');
    }

    window.displayMatch = displayMatch;
})(jQuery);
