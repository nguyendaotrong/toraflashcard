<?php
if (!defined('ABSPATH')) {
    exit;
}

function tora_flashcard_activate() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    // Bảng cho bộ flashcard
    $table_sets = $wpdb->prefix . 'tora_flashcard_sets';
    $sql_sets = "CREATE TABLE $table_sets (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        description text,
        course_id bigint(20) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";

    // Bảng cho flashcard
    $table_cards = $wpdb->prefix . 'tora_flashcards';
    $sql_cards = "CREATE TABLE $table_cards (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        set_id bigint(20) NOT NULL,
        term varchar(255) NOT NULL,
        definition text NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY set_id (set_id)
    ) $charset_collate;";

    // Bảng cho điểm số trò chơi ghép thẻ
    $table_scores = $wpdb->prefix . 'tora_flashcard_scores';
    $sql_scores = "CREATE TABLE $table_scores (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        set_id bigint(20) NOT NULL,
        score int NOT NULL,
        correct_matches int NOT NULL,
        incorrect_matches int NOT NULL,
        time_used int NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY set_id (set_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql_sets);
    dbDelta($sql_cards);
    dbDelta($sql_scores);

    // Ghi log nếu bảng không được tạo
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_sets'") != $table_sets) {
        error_log("Tora Flashcard: Bảng $table_sets không được tạo. Lỗi: " . $wpdb->last_error);
    }
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_cards'") != $table_cards) {
        error_log("Tora Flashcard: Bảng $table_cards không được tạo. Lỗi: " . $wpdb->last_error);
    }
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_scores'") != $table_scores) {
        error_log("Tora Flashcard: Bảng $table_scores không được tạo. Lỗi: " . $wpdb->last_error);
    }
}
?>
