<?php
// wp-content/plugins/tora-flashcard/includes/ajax.php

if (!defined('ABSPATH')) {
    exit;
}

function tora_flashcard_update_set() {
    check_ajax_referer('tora_flashcard_nonce', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error(__('Bạn không có quyền thực hiện hành động này!', 'tora-flashcard'));
    }

    global $wpdb;
    $table_sets = $wpdb->prefix . 'tora_flashcard_sets';

    $id = absint($_POST['id']);
    $name = sanitize_text_field($_POST['name']);
    $description = sanitize_textarea_field($_POST['description']);
    $course_id = absint($_POST['course_id']);

    if ($id && $name) {
        $result = $wpdb->update(
            $table_sets,
            [
                'name' => $name,
                'description' => $description,
                'course_id' => $course_id,
            ],
            ['id' => $id]
        );
        if ($result !== false) {
            wp_send_json_success(__('Cập nhật bộ flashcard thành công!', 'tora-flashcard'));
        } else {
            error_log('Tora Flashcard: Lỗi cập nhật bộ flashcard ID ' . $id . ': ' . $wpdb->last_error);
            wp_send_json_error(__('Lỗi khi cập nhật bộ flashcard: ', 'tora-flashcard') . $wpdb->last_error);
        }
    } else {
        error_log('Tora Flashcard: Dữ liệu không hợp lệ khi cập nhật bộ flashcard: ID=' . $id . ', Name=' . $name);
        wp_send_json_error(__('Dữ liệu không hợp lệ! Vui lòng kiểm tra ID và tên bộ flashcard.', 'tora-flashcard'));
    }
}
add_action('wp_ajax_tora_flashcard_update_set', 'tora_flashcard_update_set');

function tora_flashcard_update_card() {
    check_ajax_referer('tora_flashcard_nonce', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error(__('Bạn không có quyền thực hiện hành động này!', 'tora-flashcard'));
    }

    global $wpdb;
    $table_cards = $wpdb->prefix . 'tora_flashcards';

    $id = absint($_POST['id']);
    $term = sanitize_text_field($_POST['term']);
    $definition = sanitize_textarea_field($_POST['definition']);

    if ($id && $term && $definition) {
        // Kiểm tra trùng lặp term trong cùng bộ
        $set_id = $wpdb->get_var($wpdb->prepare("SELECT set_id FROM $table_cards WHERE id = %d", $id));
        $existing_term = $wpdb->get_var($wpdb->prepare(
            "SELECT term FROM $table_cards WHERE set_id = %d AND term = %s AND id != %d",
            $set_id, $term, $id
        ));
        if ($existing_term) {
            error_log('Tora Flashcard: Thuật ngữ đã tồn tại khi cập nhật flashcard ID ' . $id . ': ' . $term);
            wp_send_json_error(__('Thuật ngữ đã tồn tại trong bộ flashcard!', 'tora-flashcard'));
        }

        $result = $wpdb->update(
            $table_cards,
            [
                'term' => $term,
                'definition' => $definition,
            ],
            ['id' => $id]
        );
        if ($result !== false) {
            wp_send_json_success(__('Cập nhật flashcard thành công!', 'tora-flashcard'));
        } else {
            error_log('Tora Flashcard: Lỗi cập nhật flashcard ID ' . $id . ': ' . $wpdb->last_error);
            wp_send_json_error(__('Lỗi khi cập nhật flashcard: ', 'tora-flashcard') . $wpdb->last_error);
        }
    } else {
        error_log('Tora Flashcard: Dữ liệu không hợp lệ khi cập nhật flashcard: ID=' . $id . ', Term=' . $term . ', Definition=' . $definition);
        wp_send_json_error(__('Dữ liệu không hợp lệ! Vui lòng kiểm tra ID, thuật ngữ và định nghĩa.', 'tora-flashcard'));
    }
}
add_action('wp_ajax_tora_flashcard_update_card', 'tora_flashcard_update_card');

function tora_flashcard_delete_card() {
    check_ajax_referer('tora_flashcard_nonce', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error(__('Bạn không có quyền thực hiện hành động này!', 'tora-flashcard'));
    }

    global $wpdb;
    $table_cards = $wpdb->prefix . 'tora_flashcards';
    $id = absint($_POST['id']);

    if ($id) {
        $result = $wpdb->delete($table_cards, ['id' => $id]);
        if ($result !== false) {
            wp_send_json_success(__('Xóa flashcard thành công!', 'tora-flashcard'));
        } else {
            error_log('Tora Flashcard: Lỗi xóa flashcard ID ' . $id . ': ' . $wpdb->last_error);
            wp_send_json_error(__('Lỗi khi xóa flashcard: ', 'tora-flashcard') . $wpdb->last_error);
        }
    } else {
        error_log('Tora Flashcard: ID không hợp lệ khi xóa flashcard: ID=' . $id);
        wp_send_json_error(__('ID flashcard không hợp lệ!', 'tora-flashcard'));
    }
}
add_action('wp_ajax_tora_flashcard_delete_card', 'tora_flashcard_delete_card');

function tora_flashcard_delete_set() {
    check_ajax_referer('tora_flashcard_nonce', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error(__('Bạn không có quyền thực hiện hành động này!', 'tora-flashcard'));
    }

    global $wpdb;
    $table_sets = $wpdb->prefix . 'tora_flashcard_sets';
    $table_cards = $wpdb->prefix . 'tora_flashcards';
    $table_scores = $wpdb->prefix . 'tora_flashcard_scores';
    $id = absint($_POST['id']);

    if ($id) {
        $wpdb->query('START TRANSACTION');
        $scores_deleted = $wpdb->delete($table_scores, ['set_id' => $id]);
        $cards_deleted = $wpdb->delete($table_cards, ['set_id' => $id]);
        $result = $wpdb->delete($table_sets, ['id' => $id]);
        if ($result !== false && $cards_deleted !== false && $scores_deleted !== false) {
            $wpdb->query('COMMIT');
            wp_send_json_success(__('Xóa bộ flashcard và dữ liệu liên quan thành công!', 'tora-flashcard'));
        } else {
            $wpdb->query('ROLLBACK');
            error_log('Tora Flashcard: Lỗi xóa bộ flashcard ID ' . $id . ': Sets=' . $wpdb->last_error . ', Cards=' . $cards_deleted . ', Scores=' . $scores_deleted);
            wp_send_json_error(__('Lỗi khi xóa bộ flashcard: ', 'tora-flashcard') . $wpdb->last_error);
        }
    } else {
        error_log('Tora Flashcard: ID không hợp lệ khi xóa bộ flashcard: ID=' . $id);
        wp_send_json_error(__('ID bộ flashcard không hợp lệ!', 'tora-flashcard'));
    }
}
add_action('wp_ajax_tora_flashcard_delete_set', 'tora_flashcard_delete_set');

function tora_flashcard_save_match_score() {
    check_ajax_referer('tora_flashcard_nonce', 'nonce');

    global $wpdb;
    $table_scores = $wpdb->prefix . 'tora_flashcard_scores';
    $user_id = absint($_POST['user_id']);
    $set_id = absint($_POST['set_id']);
    $score = absint($_POST['score']);
    $correct_matches = absint($_POST['correct_matches']);
    $incorrect_matches = absint($_POST['incorrect_matches']);
    $time_used = absint($_POST['time_used']);

    if ($user_id && $set_id) {
        $result = $wpdb->insert($table_scores, [
            'user_id' => $user_id,
            'set_id' => $set_id,
            'score' => $score,
            'correct_matches' => $correct_matches,
            'incorrect_matches' => $incorrect_matches,
            'time_used' => $time_used
        ]);
        if ($result !== false) {
            wp_send_json_success(__('Lưu điểm thành công!', 'tora-flashcard'));
        } else {
            error_log('Tora Flashcard: Lỗi lưu điểm cho user_id=' . $user_id . ', set_id=' . $set_id . ': ' . $wpdb->last_error);
            wp_send_json_error(__('Lỗi khi lưu điểm: ', 'tora-flashcard') . $wpdb->last_error);
        }
    } else {
        error_log('Tora Flashcard: Dữ liệu không hợp lệ khi lưu điểm: user_id=' . $user_id . ', set_id=' . $set_id);
        wp_send_json_error(__('Dữ liệu không hợp lệ! Vui lòng kiểm tra ID người dùng và bộ flashcard.', 'tora-flashcard'));
    }
}
add_action('wp_ajax_tora_flashcard_save_match_score', 'tora_flashcard_save_match_score');
?>
