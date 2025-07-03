// wp-content/plugins/tora-flashcard/assets/js/admin.js
jQuery(document).ready(function($) {
    // Hàm hiển thị toast notification
    function showNotification(message, type = 'success') {
        const notification = $('<div>').addClass(`notification notification-${type}`).text(message);
        $('body').append(notification);
        setTimeout(() => notification.fadeOut(300, () => notification.remove()), 3000);
    }

    // Event delegation cho nút toggle danh sách flashcard
    $(document).on('click', '.toggle-flashcards', function(e) {
        e.preventDefault();
        const setId = $(this).attr('data-set-id');
        const $list = $(`#flashcard-list-${setId}`);
        const isHidden = $list.is(':hidden');
        $list.slideToggle(300);
        $(this).text(isHidden ? toraFlashcardData.text_hide_flashcards : toraFlashcardData.text_show_flashcards);
    });

    // Event delegation cho nút chỉnh sửa bộ flashcard
    $(document).on('click', '.edit-set', function(e) {
        e.preventDefault();
        const id = $(this).attr('data-id');
        const name = $(this).attr('data-name');
        const description = $(this).attr('data-description');
        const courseId = $(this).attr('data-course-id');
        console.log('Opening edit modal for set:', { id, name, description, courseId });
        $('#edit_set_id').val(id);
        $('#edit_set_name').val(name);
        $('#edit_set_description').val(description);
        $('#edit_set_course_id').val(courseId);
        $('#editModal').fadeIn(300);
    });

    // Event delegation cho nút chỉnh sửa flashcard
    $(document).on('click', '.edit-card', function(e) {
        e.preventDefault();
        const id = $(this).attr('data-id');
        const term = $(this).attr('data-term');
        const description = $(this).attr('data-definition');
        console.log('Opening edit modal for card:', { id, term, description });
        $('#edit_card_id').val(id);
        $('#edit_term').val(term);
        $('#edit_definition').val(description);
        $('#editCardModal').fadeIn(300);
    });

    // Đóng modal
    $(document).on('click', '#closeSetModal, #closeCardModal', function() {
        $(this).closest('.tora-modal').fadeOut(300);
    });

    // Xử lý form chỉnh sửa bộ flashcard
    $('#editSetForm').on('submit', function(e) {
        e.preventDefault();
        const name = $('#edit_set_name').val().trim();
        if (!name) {
            showNotification('Vui lòng nhập tên bộ flashcard!', 'error');
            return;
        }
        const formData = {
            action: 'tora_flashcard_update_set',
            nonce: toraFlashcardData.nonce,
            id: $('#edit_set_id').val(),
            name: name,
            description: $('#edit_set_description').val(),
            course_id: $('#edit_set_course_id').val()
        };
        const $row = $(`tr[data-set-id="${formData.id}"]`);
        if (!$row.length) {
            console.error(`Row with data-set-id="${formData.id}" not found`);
            showNotification('Không tìm thấy hàng để cập nhật!', 'error');
            return;
        }
        $.ajax({
            url: toraFlashcardData.ajax_url,
            type: 'POST',
            data: formData,
            beforeSend: () => $('body').append('<div class="loading">Đang xử lý...</div>'),
            success: function(response) {
                if (response.success) {
                    showNotification(toraFlashcardData.msg_set_update_success);
                    $row.find('td:eq(0)').text(formData.name);
                    $row.find('td:eq(2)').text(formData.description);
                    $row.find('td:eq(3)').text(
                        $('#edit_set_course_id option:selected').text() || toraFlashcardData.text_no_course || 'Không có'
                    );
                    const $editButton = $row.find('.edit-set');
                    if ($editButton.length) {
                        console.log('Updating edit button attributes:', {
                            name: formData.name,
                            description: formData.description,
                            courseId: formData.course_id
                        });
                        $row.attr('data-name', formData.name); // Cập nhật data-name cho lọc
                        $editButton
                            .attr('data-name', formData.name)
                            .attr('data-description', formData.description)
                            .attr('data-course-id', formData.course_id);
                    } else {
                        console.error(`Edit button for set ID="${formData.id}" not found`);
                    }
                    $('#editModal').fadeOut(300);
                    // Áp dụng lại bộ lọc sau khi cập nhật
                    $('#flashcard-set-filter').trigger('input');
                } else {
                    showNotification(toraFlashcardData.msg_set_update_fail + (response.data || ''), 'error');
                }
            },
            error: () => {
                console.error('AJAX error updating set:', formData);
                showNotification(toraFlashcardData.msg_ajax_error, 'error');
            },
            complete: () => $('body').find('.loading').remove()
        });
    });

    // Xử lý form chỉnh sửa flashcard
    $('#editCardForm').on('submit', function(e) {
        e.preventDefault();
        const term = $('#edit_term').val().trim();
        const definition = $('#edit_definition').val().trim();
        if (!term || !definition) {
            showNotification('Vui lòng nhập đầy đủ thuật ngữ và định nghĩa!', 'error');
            return;
        }
        const formData = {
            action: 'tora_flashcard_update_card',
            nonce: toraFlashcardData.nonce,
            id: $('#edit_card_id').val(),
            term: term,
            definition: definition
        };
        const $row = $(`tr:has(a.edit-card[data-id="${formData.id}"])`);
        if (!$row.length) {
            console.error(`Row with card ID="${formData.id}" not found`);
            showNotification('Không tìm thấy hàng để cập nhật!', 'error');
            return;
        }
        $.ajax({
            url: toraFlashcardData.ajax_url,
            type: 'POST',
            data: formData,
            beforeSend: () => $('body').append('<div class="loading">Đang xử lý...</div>'),
            success: function(response) {
                if (response.success) {
                    showNotification(toraFlashcardData.msg_update_success);
                    $row.find('td:eq(0)').text(formData.term);
                    $row.find('td:eq(1)').text(formData.definition);
                    const $editButton = $row.find('a.edit-card');
                    if ($editButton.length) {
                        console.log('Updating edit button attributes for card:', {
                            term: formData.term,
                            definition: formData.definition
                        });
                        $editButton
                            .attr('data-term', formData.term)
                            .attr('data-definition', formData.definition);
                    }
                    $('#editCardModal').fadeOut(300);
                } else {
                    showNotification(toraFlashcardData.msg_update_fail + (response.data || ''), 'error');
                }
            },
            error: () => {
                console.error('AJAX error updating card:', formData);
                showNotification(toraFlashcardData.msg_ajax_error, 'error');
            },
            complete: () => $('body').find('.loading').remove()
        });
    });

    // Event delegation cho nút xóa flashcard
    $(document).on('click', '.delete-card', function(e) {
        e.preventDefault();
        const id = $(this).attr('data-id');
        if (confirm(toraFlashcardData.msg_confirm_delete)) {
            $.ajax({
                url: toraFlashcardData.ajax_url,
                type: 'POST',
                data: {
                    action: 'tora_flashcard_delete_card',
                    nonce: toraFlashcardData.nonce,
                    id: id
                },
                beforeSend: () => $('body').append('<div class="loading">Đang xóa...</div>'),
                success: function(response) {
                    if (response.success) {
                        showNotification(toraFlashcardData.msg_delete_success);
                        $(`tr:has(a.delete-card[data-id="${id}"])`).remove();
                    } else {
                        showNotification(toraFlashcardData.msg_delete_fail + (response.data || ''), 'error');
                    }
                },
                error: () => {
                    console.error('AJAX error deleting card:', id);
                    showNotification(toraFlashcardData.msg_ajax_error, 'error');
                },
                complete: () => $('body').find('.loading').remove()
            });
        }
    });

    // Event delegation cho nút xóa bộ flashcard
    $(document).on('click', '.delete-set', function(e) {
        e.preventDefault();
        const id = $(this).attr('data-id');
        if (confirm(toraFlashcardData.msg_confirm_set_delete + ' (Bao gồm tất cả flashcard và điểm số liên quan)')) {
            $.ajax({
                url: toraFlashcardData.ajax_url,
                type: 'POST',
                data: {
                    action: 'tora_flashcard_delete_set',
                    nonce: toraFlashcardData.nonce,
                    id: id
                },
                beforeSend: () => $('body').append('<div class="loading">Đang xóa...</div>'),
                success: function(response) {
                    if (response.success) {
                        showNotification(toraFlashcardData.msg_set_delete_success);
                        $(`tr[data-set-id="${id}"]`).remove();
                    } else {
                        showNotification(toraFlashcardData.msg_set_delete_fail + (response.data || ''), 'error');
                    }
                },
                error: () => {
                    console.error('AJAX error deleting set:', id);
                    showNotification(toraFlashcardData.msg_ajax_error, 'error');
                },
                complete: () => $('body').find('.loading').remove()
            });
        }
    });

    // Xử lý lọc bộ flashcard theo tên hoặc ID
    $('#flashcard-set-filter').on('input', function() {
        const filter = $(this).val().toLowerCase().trim();
        const $rows = $('.wp-list-table tbody tr[data-set-id]');
        if (filter === '') {
            $rows.show();
        } else {
            $rows.each(function() {
                const name = $(this).attr('data-name').toLowerCase();
                const id = $(this).attr('data-set-id');
                $(this).toggle(name.includes(filter) || id.includes(filter));
            });
        }
    });

    // Xóa bộ lọc
    $('.filter-clear').on('click', function() {
        $('#flashcard-set-filter').val('').trigger('input');
    });
});
