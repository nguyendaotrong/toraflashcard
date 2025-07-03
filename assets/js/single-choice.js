(function($) {
    function displaySingleChoice($container, question, onSubmit, currentIndex, totalQuestions) {
        $container.empty();
        $container.addClass('quiz-container');
        $container.addClass('single-choice');
        $container.css('display', 'block');

        // Section 1: Header
        var $header = $('<div class="quiz-header"></div>');
        var $headerLeft = $('<div class="quiz-header-left"></div>');
        $headerLeft.append('<p>KIỂM TRA</p>');
        var $progress = $('<div class="quiz-progress"><div class="progress-bar"></div></div>');
        $headerLeft.append($progress);
        $header.append($headerLeft);
        var $headerRight = $('<div class="quiz-header-right"></div>');
        var $powerButton = $('<button class="action-button power-button"><i class="fa-solid fa-power-off"></i></button>');
        $headerRight.append($powerButton);
        $header.append($headerRight);
        $container.append($header);

        // Gắn sự kiện thoát
        // TODO: Fix issue where power button does not trigger exit confirmation popup.
        $powerButton.off('click').on('click', function() {
            console.log('Power button clicked in Single Choice', {
                slider: $container.closest('.flashcard-slider').length,
                container: $container.length,
                mode: currentIndex < totalQuestions ? 'quiz' : 'retry'
            });
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

        // Section 2: Nội dung câu hỏi
        var $content = $('<div class="quiz-content"></div>');
        $content.append(`<div class="question-info">Câu ${currentIndex + 1}/${totalQuestions}: Single Choice</div>`);
        $content.append(`<div class="quiz-question">${question.question}</div>`);
        $container.append($content);

// Section 3: Đáp án
var $options = $('<div class="quiz-options"></div>');
question.options.forEach((option, index) => {
    $options.append(`
        <div class="quiz-option single-choice-option">
            <span class="option-number">${index + 1}</span>
            <input type="radio" name="single-choice-${currentIndex}" value="${option}" id="single-choice-${currentIndex}-${index}">
            <p>${option}</p>
        </div>
    `);
});
        $container.append($options);

        // Thêm hiệu ứng chọn đáp án
        $options.find('.single-choice-option').on('click', function() {
    $options.find('.single-choice-option').removeClass('selected');
    $(this).addClass('selected');
    $(this).find('input[type="radio"]').prop('checked', true);
    $container.find('.quiz-submit').show();
});

        $container.append('<button class="quiz-submit" style="display: none;">Kiểm tra</button>');
        updateProgress($progress, currentIndex, totalQuestions);

        $container.find('.quiz-submit').on('click', function() {
            var selected = $container.find('input[type="radio"]:checked').val();
            if (!selected) {
                alert('Vui lòng chọn một đáp án!');
                return;
            }
            var isCorrect = selected === question.correctAnswer;
            $options.find('.single-choice-option').each(function() {
                var $option = $(this);
                var value = $option.find('input').val();
                if (value === selected) {
                    $option.addClass(isCorrect ? 'correct' : 'incorrect');
                } else if (value === question.correctAnswer) {
                    $option.addClass('correct');
                }
            });
            $options.find('.single-choice-option').off('click');
            $options.find('input[type="radio"]').prop('disabled', true);
            $container.find('.quiz-submit').hide();

            var $resultContainer = $('<div></div>');
            if (isCorrect) {
                $resultContainer.addClass('correct-message');
                $resultContainer.append('<div class="title">Tuyệt vời</div>');
                $resultContainer.append('<div class="subtitle">Hãy tiếp tục phát huy nhé!</div>');
                $container.append($resultContainer);
                if (currentIndex + 1 < totalQuestions) {
                    $container.append('<button class="quiz-continue correct-container">Tiếp tục</button>');
                }
            } else {
                $resultContainer.addClass('incorrect-message');
                $resultContainer.append('<div class="title">Chưa đúng, hãy cố gắng nhé!</div>');
                $resultContainer.append('<div class="label">Đáp án đúng:</div>');
                $resultContainer.append('<div class="definition">' + question.correctAnswer + '</div>');
                $container.append($resultContainer);
                if (currentIndex + 1 < totalQuestions) {
                    $container.append('<button class="quiz-continue incorrect-container">Tiếp tục</button>');
                }
            }

            if (currentIndex + 1 === totalQuestions) {
                onSubmit(isCorrect);
            } else {
                $container.find('.quiz-continue').on('click', function() {
                    $container.find('.quiz-options').empty();
                    $container.find('.quiz-content').empty();
                    $container.find('.quiz-submit').remove();
                    $container.find('.quiz-continue').remove();
                    $container.find('.correct-message, .incorrect-message').remove();
                    onSubmit(isCorrect);
                });
            }
        });
    }

    function updateProgress($progress, currentIndex, totalQuestions) {
        var progress = ((currentIndex + 1) / totalQuestions) * 100;
        $progress.find('.progress-bar').css('width', `${progress}%`);
    }

    window.displaySingleChoice = displaySingleChoice;
})(jQuery);
