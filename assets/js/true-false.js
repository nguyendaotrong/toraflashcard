(function($) {
    // Logic True/False:
    // - Nếu term và definition thuộc cùng flashcard: Chọn "Đúng" -> Đúng; Chọn "Sai" -> Sai
    // - Nếu term và definition không thuộc cùng flashcard: Chọn "Đúng" -> Sai; Chọn "Sai" -> Đúng
    // - Lưu ý: data-answer hiện tại ngược (Đúng = false, Sai = true), sẽ sửa sau khi hoàn thành các tính năng
    function displayTrueFalse($container, question, onSubmit, currentIndex, totalQuestions) {
        console.log('displayTrueFalse called with question:', question, 'currentIndex:', currentIndex, 'totalQuestions:', totalQuestions);
        $container.empty();
        $container.addClass('quiz-container true-false').css('display', 'block');
        console.log('Container state after empty:', $container.html());

        // Kiểm tra dữ liệu câu hỏi
        if (!question.term || !question.definition || !question.correctDefinition) {
            console.error('Invalid question data:', question);
            $container.append('<div class="error-message">Lỗi: Dữ liệu câu hỏi không hợp lệ</div>');
            return;
        }

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
        $powerButton.off('click').on('click', function() {
            console.log('Power button clicked in True/False', {
                slider: $container.closest('.flashcard-slider').length,
                container: $container.length,
                mode: currentIndex < totalQuestions ? 'quiz' : 'retry',
                popupExists: $container.closest('.flashcard-slider').find('.exit-confirmation-popup').length
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
        var $content = $('<div class="quiz-content true-false"></div>');
        $content.append(`<div class="question-info">Câu ${currentIndex + 1}/${totalQuestions}: True/False</div>`);
        var $termContainer = $('<div class="term-container"></div>').text(question.term || '');
        var $svgConnector = $(
            '<svg id="Capa_1" enable-background="new 0 0 497 497" height="50" viewBox="0 0 497 497" width="50" xmlns="http://www.w3.org/2000/svg">' +
            '<g><path d="m497 265.608c0-70.961-31.942-134.462-82.232-176.909-40.279-33.998-153.438-37.892-153.438-37.892l-82.012.473c-.61.258-1.347.079-1.954.342-80.382 34.882-132.545 117.531-132.545 213.605 0 127.798 95.283 214.76 223.081 214.76 38.422 0 72.357 7.656 104.247-8.915 74.182-38.546 124.853-116.088 124.853-205.464z" fill="#94ccd4"></path>' +
            '<path d="m414.77 88.697c-23.53 15.39-48.79 30.66-58.26 32.73-25.99 7.6-59.82-8.5-66.77 29.83-.2 7.4-.85 14.43-1.96 20.99-1.24 7.32-3.96 14.21-7.91 20.33s-14.463 7.906-20.583 12.106c-16.85 11.58-30.541 12.274-48.681 2.824-.46-.24-.93-.49-1.4-.74-30.22-14.81-47.973-48.87-16.643-73.76 20.59-17 17.476-46.987 3.086-65.727l-8.66-10.02c6.723-2.777 3.986-10.878 11.01-13.021 21.385-6.524 44.084-10.032 67.6-10.032 56.841 0 108.891 20.49 149.171 54.49z" fill="#b7e546"></path>' +
            '<path d="m445.066 208.328c-.129-19.101-7.841-37.381-21.444-50.801-11.605-13.278-15.619-21.189-31.569-6.53-15.118 18.805-.207 42.145-32.34 74.213-5.691 5.793-8.884 13.723-8.563 21.852-.012-.002-.007-1.436-.018-1.438 1.155 20.135 14.908 36.366 34.51 36.366 25.18-.001 59.424-29.559 59.424-73.662z" fill="#b7e546"></path>' +
            '<path d="m372.62 223.717c-5.69 5.8-8.89 13.73-8.57 21.86-.01-.01-.01-.02-.02-.02.96 16.67 15.41 30.7 31.48 35.04-3.37.92-6.69 1.39-9.87 1.39-19.6 0-40.45-16.29-41.61-36.43.01 0 .01.01.02.02-.32-8.13 2.88-16.06 8.57-21.86 32.13-32.06 13.51-57.11 28.63-75.91 9.11-8.38 17.86-8.34 25.84-4.29-1.93 1.07-3.87 2.48-5.84 4.29-15.12 18.8 3.5 43.85-28.63 75.91z" fill="#abd641"></path>' +
            '<path d="m466.803 17.508v115.506l-7.36 6.988c0 9.665-10.988 11.121-20.654 11.121l-52.829-.397c-2.458 0-4.854.776-6.844 2.218l-43.595 30.271c-3.857 2.794-9.256.038-9.256-4.724l4.092-14.559c0-6.444-5.224-11.667-11.667-11.667h-14c-9.665 0-17.501-7.835-17.501-17.501l-2.11-108.356c0-9.665 3.839-19.859 13.504-19.859l4.878-6.541h145.841c9.666-.001 17.501 7.834 17.501 17.5z" fill="#dc4955"></path>' +
            '<path d="m466.803 133.014v5.834c0 9.665-7.835 17.501-17.501 17.501h-62.63c-2.462 0-4.854.782-6.837 2.217l-47.288 34.243c-3.85 2.8-9.252.047-9.252-4.725v-20.068c0-6.444-5.224-11.667-11.667-11.667h-14.001c-9.665 0-17.501-7.835-17.501-17.501v-121.34c0-9.665 7.835-17.501 17.501-17.501h5.834v130.674c0 1.289 1.045 2.333 2.333 2.333h5.834c13.429 0 25.112 7.595 30.979 18.725 1 1.897 3.425 2.496 5.162 1.237l18.368-13.312c6.009-4.352 13.114-6.65 20.534-6.65z" fill="#d82f3c"></path>' +
            '<path d="m320.6 476.787c-130.86 0-236.95-105.78-236.95-236.26 0-77.71 35.628-145.845 93.718-188.905-84.029 34.685-143.168 117.43-143.168 213.985 0 39.347 9.82 76.4 27.144 108.842 0 0 54.989 43.55 82.795 64.014 38.358 28.23 112.89 46.439 112.89 46.439s82.932 2.814 114.732-13.646c-16.481 3.621-33.591 5.531-51.161 5.531z" fill="#6fbbc6"></path>' +
            '<path d="m372.135 471.048c-18.595-25.899-52.793-54.451-51.323-88.84.501-11.724-1.046-23.487-4.906-34.574-.061-.15-.11-.297-.159-.443-1.952-5.491-4.884-10.572-8.535-15.101-10.078-12.52-31.583-45.184-42.098-49.764-20.079-12.419-47.263-3.171-58.005 17.22-9.324 23.587-11.896 55.905-36.253 68.627-14.56 7.896-35.545 6.122-46.621-6.952-19.217-24.96-46.122-.826-62.868 13.218 6.654 12.431 33.803 21.544 42.583 32.57 36.43 45.761 68.853 63.401 122.234 72.98 49.652 9.01 100.602 14.614 145.41-8.666.18-.094.361-.182.541-.275z" fill="#b7e546"></path>' +
            '<path d="m371.67 471.277c-39.78 20.697-85.715 29.138-130.28 24.46v-.01c-75.319-7.365-144.829-54.348-180.02-121.29 13.24-11.11 32.85-28.54 49.98-22.97 39.85 74.57 118.61 125.32 209.25 125.32 17.54 0 34.62-1.9 51.07-5.51z" fill="#abd641"></path>' +
            '<path d="m423.275 270.934v115.506l-7.36 6.988c0 9.665-10.988 11.121-20.654 11.121l-52.829-.397c-2.458 0-4.854.776-6.844 2.218l-43.595 30.271c-3.857 2.794-9.256.038-9.256-4.724l4.092-14.559c0-6.444-5.224-11.667-11.667-11.667h-14.001c-9.665 0-17.501-7.835-17.501-17.501l-2.11-108.356c0-9.665 3.839-19.859 13.504-19.859l4.878-6.541h145.841c9.666-.001 17.502 7.835 17.502 17.5z" fill="#ffbf54"></path>' +
            '<path d="m423.275 386.44v5.834c0 9.666-7.835 17.501-17.501 17.501h-62.63c-2.462 0-4.854.782-6.837 2.217l-47.288 34.243c-3.85 2.8-9.252.047-9.252-4.725v-20.068c0-6.444-5.224-11.667-11.667-11.667h-14.001c-9.665 0-17.501-7.835-17.501-17.501v-121.34c0-9.665 7.835-17.501 17.501-17.501h5.834v130.674c0 1.289 1.045 2.333 2.333 2.333h5.834c13.429 0 25.112 7.595 30.979 18.725 1 1.897 3.425 2.496 5.162 1.237l18.368-13.312c6.009-4.352 13.114-6.65 20.534-6.65z" fill="#ffa442"></path>' +
            '<path d="m418.808 57.26c4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5h-38.825v-12.753c0-4.142-3.358-7.5-7.5-7.5s-7.5 3.358-7.5 7.5v12.753h-38.825c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5h15.551c3.601 15.961 10.724 30.639 20.644 43.123-7.591 7.247-16.472 13.255-26.375 17.669l-10.333 4.605c-3.784 1.686-5.484 6.12-3.798 9.903 1.244 2.792 3.984 4.449 6.855 4.449 1.02 0 2.057-.209 3.048-.651l10.333-4.605c11.399-5.08 21.635-11.977 30.4-20.293 8.765 8.316 19.001 15.213 30.4 20.293l10.333 4.605c.992.442 2.028.651 3.048.651 2.871 0 5.611-1.658 6.855-4.449 1.686-3.783-.014-8.217-3.798-9.903l-10.333-4.605c-9.904-4.413-18.784-10.422-26.375-17.669 9.92-12.484 17.042-27.162 20.643-43.123zm-46.325 31.693c-7.028-9.387-12.272-20.113-15.335-31.693h30.669c-3.063 11.58-8.306 22.306-15.334 31.693z" fill="#faf8f8"></path>' +
            '<path d="m387.386 285.507h-34.891c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5h9.945v23.5h-29.833c1.743-3.549 2.724-7.537 2.724-11.75 0-14.75-12-26.75-26.75-26.75h-21.656c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5h21.656c6.479 0 11.75 5.271 11.75 11.75s-5.271 11.75-11.75 11.75h-24.063c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5h24.063c6.479 0 11.75 5.271 11.75 11.75 0 6.589-5.161 11.75-11.75 11.75-10.362 0-22.125-1.168-30.791-9.834-2.929-2.929-7.678-2.929-10.606 0-2.929 2.929-2.929 7.678 0 10.606 12.611 12.611 28.748 14.228 41.397 14.228 14.75 0 26.75-12 26.75-26.75 0-4.213-.981-8.201-2.724-11.75h29.833v31c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-69.5h9.945c4.142 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.499-7.5z" fill="#faf8f8"></path>' +
            '<path d="m200.16 145.927-.29.24c-3.86 3.07-17.26 15.34-26.76 25.86-3.82-14.43-.5-29.75 14.32-41.52 20.59-17 12.99-50.12-1.4-68.86l-8.666-10.025c6.72-2.78 13.606-5.245 20.636-7.385 6.22 9.45 11.75 17.41 11.75 17.41 14.91 27.77 15.58 63.51-9.59 84.28z" fill="#abd641"></path>' +
            '<path d="m280.71 191.217c-.27.46-.55.91-.84 1.36-3.95 6.12-9.11 11.46-15.23 15.66-16.85 11.58-38.7 12.88-56.84 3.43-.46-.24-.93-.49-1.4-.74-28.44-13.94-47.89-50.81-23.98-75.85-7.61 22.98 10.36 49.51 34.55 60.85.49.25.98.5 1.46.74 18.96 9.45 41.8 8.15 59.41-3.43.98-.64 1.94-1.31 2.87-2.02z" fill="#abd641"></path>' +
            '<g fill="#94ccd4"><path d="m238.862 495.452c.064.007.128.015.192.022-.064-.007-.128-.014-.192-.022z"></path>' +
            '<path d="m167.135 475.042c.227.107.456.211.683.317-.228-.106-.456-.21-.683-.317z"></path>' +
            '<path d="m371.76 471.257c-4.13 2.14-8.32 4.15-12.59 6.03 4.2-1.86 8.34-3.85 12.42-5.97.03-.01.05-.03.08-.04s.06-.01.09-.02z"></path></g>' +
            '<path d="m8.053 137.009 1.468 100.637c0 9.855 8.03 17.844 17.936 17.844l56.305 1.84c2.519 0 4.974.792 7.014 2.262l38.427 32.486c3.953 2.849 9.486.039 9.486-4.817l2.428-15.705c0-6.57 5.353-11.896 11.957-11.896l18.584-.068c9.906 0 19.66-2.352 19.66-12.207v-123.721c0-9.855-8.03-17.844-17.936-17.844h-155.446c-9.906 0-9.883 21.334-9.883 31.189z" fill="#faf8f8"></path>' +
            '<path d="m104.402 139.105c-.022-.057-.044-.114-.067-.171-1.472-3.597-4.934-5.923-8.82-5.927-.004 0-.006 0-.01 0-3.881 0-7.344 2.319-8.822 5.909-.028.068-.055.137-.082.207l-33.487 88.736c-1.462 3.875.494 8.203 4.369 9.665 3.876 1.462 8.204-.494 9.665-4.369l6.509-17.247h43.945l6.577 17.269c1.14 2.993 3.988 4.833 7.01 4.833.887 0 1.79-.159 2.668-.493 3.871-1.474 5.813-5.807 4.339-9.678zm-25.085 61.803 16.211-42.957 16.361 42.957z" fill="#aad8de"></path>' +
            '<path d="m191.32 245.227v2.16c0 9.85-8.03 17.84-17.94 17.84h-14.35c-6.6 0-11.95 5.33-11.95 11.9v20.47c0 4.85-5.54 7.66-9.49 4.81l-48.45-34.92c-2.04-1.47-4.5-2.26-7.02-2.26h-64.18c-9.91 0-17.94-7.99-17.94-17.84v-123.72c0-9.86 8.03-17.85 17.94-17.85h2.06v134.41c0 2.761 2.239 5 5 5h57.12c6.72 0 13.27 2.12 18.71 6.04l22.35 16.11c2.14 1.54 5.12.6 6.08-1.85 4.66-11.87 16.25-20.3 29.77-20.3z" fill="#f0e9e6"></path></g></svg>'
        );
        var $definitionContainer = $('<div class="definition-container"></div>').text(question.definition || '');
        $content.append($termContainer);
        $content.append($svgConnector);
        $content.append($definitionContainer);
        $container.append($content);
        console.log('Content appended:', $content.html());

        // Section 3: Đáp án
        var $options = $('<div class="true-false-options custom-true-false-options"></div>');
        var $trueOption = $('<div class="true-false-option" data-answer="false"><p>Đúng</p></div>');
        var $falseOption = $('<div class="true-false-option" data-answer="true"><p>Sai</p></div>');
        console.log('Created options - true: data-answer="false" label="Đúng", false: data-answer="true" label="Sai"');
        $options.append($trueOption).append($falseOption);
        $container.append($options);
        console.log('Options appended:', $options.html());

        // Thêm hiệu ứng chọn đáp án
        $options.find('.true-false-option').on('click', function() {
            var $this = $(this);
            var displayedLabel = $this.find('p').text();
            var answer = $this.data('answer') === 'true' ? 'Sai' : 'Đúng';
            var dataValue = $this.attr('data-answer');
            console.log('Click event - data-answer (attr):', dataValue, 'displayed label:', displayedLabel, 'expected label:', answer);
            $options.find('.true-false-option').removeClass('selected');
            $this.addClass('selected');
            $container.find('.true-false-submit').show();
        });

        $container.append('<button class="true-false-submit" style="display: none;">Kiểm tra</button>');
        updateProgress($progress, currentIndex, totalQuestions);
        console.log('Container final HTML:', $container.html());

        $container.find('.true-false-submit').on('click', function() {
            // Kiểm tra đáp án:
            // - isDefinitionMatch: true nếu definition === correctDefinition
            // - isCorrect: true nếu (isDefinitionMatch && userChoice === 'Đúng') || (!isDefinitionMatch && userChoice === 'Sai')
            var $selectedOption = $container.find('.true-false-option.selected');
            var dataAnswer = $selectedOption.attr('data-answer');
            var selected = dataAnswer === 'true';
            if (typeof dataAnswer === 'undefined') {
                alert('Vui lòng chọn một đáp án!');
                return;
            }
            var userChoice = $selectedOption.find('p').text();
            console.log('Debug - term:', question.term, 'definition (đưa ra):', question.definition ? question.definition.trim() : 'undefined', 'definition (đúng):', question.correctDefinition ? question.correctDefinition.trim() : 'undefined', 'đáp án người dùng chọn:', userChoice, 'dataAnswer:', dataAnswer, 'selected:', selected);
            var isDefinitionMatch = (question.definition && question.correctDefinition && question.definition.trim() === question.correctDefinition.trim());
            var isCorrect = (isDefinitionMatch && userChoice === 'Đúng') || (!isDefinitionMatch && userChoice === 'Sai');
            console.log('Definition match:', isDefinitionMatch, 'isCorrect:', isCorrect, 'displayed label:', userChoice);
            $options.find('.true-false-option').each(function() {
                var $option = $(this);
                var value = $option.attr('data-answer') === 'true';
                if (value === selected) {
                    $option.addClass('selected').addClass(isCorrect ? 'correct' : 'incorrect');
                } else {
                    $option.addClass(!isCorrect ? 'correct' : '');
                }
            });
            $options.find('.true-false-option').off('click');
            $container.find('.true-false-submit').hide();

            var $resultContainer = $('<div></div>');
            var popupType = isCorrect ? 'correct-message' : 'incorrect-message';
            console.log('Popup loại:', popupType);
            if (isCorrect) {
                $resultContainer.addClass('correct-message');
                $resultContainer.append('<div class="title">Tuyệt vời</div>');
                $resultContainer.append('<div class="subtitle">Hãy tiếp tục phát huy nhé!</div>');
                $resultContainer.append('<div class="details">Câu hỏi đưa ra: ' + (question.term || '') + '</div>');
                $resultContainer.append('<div class="details">Đáp án đưa ra: ' + (question.definition ? question.definition.trim() : '') + '</div>');
                $resultContainer.append('<div class="details">Đáp án đúng: ' + (question.term || '') + '-' + (question.correctDefinition ? question.correctDefinition.trim() : '') + '</div>');
                $resultContainer.append('<div class="details">Đáp án bạn chọn: ' + userChoice + '</div>');
                $container.append($resultContainer);
                if (currentIndex + 1 < totalQuestions) {
                    $container.append('<button class="quiz-continue correct-container">Tiếp tục</button>');
                }
            } else {
                $resultContainer.addClass('incorrect-message');
                $resultContainer.append('<div class="title">Chưa đúng, hãy cố gắng nhé!</div>');
                $resultContainer.append('<div class="details">Câu hỏi đưa ra: ' + (question.term || '') + '</div>');
                $resultContainer.append('<div class="details">Đáp án đưa ra: ' + (question.definition ? question.definition.trim() : '') + '</div>');
                $resultContainer.append('<div class="details">Đáp án đúng: ' + (question.term || '') + '-' + (question.correctDefinition ? question.correctDefinition.trim() : '') + '</div>');
                $resultContainer.append('<div class="details">Đáp án bạn chọn: ' + userChoice + '</div>');
                $container.append($resultContainer);
                if (currentIndex + 1 < totalQuestions) {
                    $container.append('<button class="quiz-continue incorrect-container">Tiếp tục</button>');
                }
            }

            if (currentIndex + 1 === totalQuestions) {
                onSubmit(isCorrect);
            } else {
                $container.find('.quiz-continue').on('click', function() {
                    $container.find('.quiz-content').empty();
                    $container.find('.true-false-options').empty();
                    $container.find('.true-false-submit').remove();
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

    window.displayTrueFalse = displayTrueFalse;
})(jQuery);
