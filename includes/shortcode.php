<?php
if (!defined('ABSPATH')) exit;

if (!defined('TORA_FLASHCARD_PATH') || !defined('TORA_FLASHCARD_URL')) {
    error_log('Tora Flashcard: TORA_FLASHCARD_PATH or TORA_FLASHCARD_URL not defined.');
    return;
}

function tora_flashcard_shortcode($atts) {
    global $wpdb;
    $table_sets = $wpdb->prefix . 'tora_flashcard_sets';
    $table_cards = $wpdb->prefix . 'tora_flashcards';

    $atts = shortcode_atts(['set_id' => 0], $atts, 'tora_flashcard');
    $set_id = absint($atts['set_id']);
    if (!$set_id) return '<p>' . esc_html__('ID bộ flashcard không hợp lệ.', 'tora-flashcard') . '</p>';

    $set_exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_sets WHERE id = %d", $set_id));
    if (!$set_exists) return '<p>' . esc_html__('Bộ flashcard không tồn tại. Vui lòng kiểm tra ID hợp lệ.', 'tora-flashcard') . '</p>';

    $flashcards = $wpdb->get_results(
        $wpdb->prepare("SELECT id, term, definition FROM $table_cards WHERE set_id = %d ORDER BY created_at DESC", $set_id)
    );
    if (empty($flashcards)) return '<p>' . esc_html__('Không có flashcard nào trong bộ này.', 'tora-flashcard') . '</p>';

    ob_start();
    ?>
    <div class="flashcard-container">
        <div class="flashcard-slider" data-total="<?php echo esc_attr(count($flashcards)); ?>" data-set-id="<?php echo esc_attr($set_id); ?>">
            <div class="flashcard-active">
                <?php foreach ($flashcards as $index => $card): ?>
                    <div class="flashcard-item" data-index="<?php echo esc_attr($index); ?>" data-id="<?php echo esc_attr($card->id); ?>">
                        <div class="flashcard-wrapper" style="min-height: 260px;">
                            <div class="flashcard-inner">
                                <div class="flashcard-front-content"><p><?php echo esc_html($card->term); ?></p></div>
                                <div class="flashcard-back-content"><p><?php echo esc_html($card->definition); ?></p></div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="flashcard-control-section">
                <div class="flashcard-progress"><div class="progress-bar"></div></div>
                <div class="flashcard-controls">
                    <button class="nav-button prev"><</button>
                    <div class="flashcard-counter">1/<?php echo esc_attr(count($flashcards)); ?></div>
                    <button class="nav-button next">></button>
                </div>
            </div>
            <section class="learning-modes" id="learningModesSection">
                <div class="mode-item" data-mode="learn-new-words"><div class="mode-icon"><i class="fa-solid fa-book"></i></div><span>Học từ mới</span></div>
                <div class="mode-item" data-mode="quiz"><div class="mode-icon"><i class="fa-solid fa-pen"></i></div><span>Kiểm tra từ mới</span></div>
                <div class="mode-item" data-mode="matching-game"><div class="mode-icon"><i class="fa-solid fa-puzzle-piece"></i></div><span>Trò chơi ghép thẻ</span></div>
                <div class="mode-item" data-mode="reflex-training"><div class="mode-icon"><i class="fa-solid fa-bolt"></i></div><span>Luyện phản xạ</span></div>
            </section>
            <section class="vocabulary-list">
                <div class="vocabulary-header">
                    <div class="vocabulary-title"><p>Từ vựng trong bài</p></div>
                    <div class="vocabulary-actions">
                        <div class="list-actions">
                            <button class="btn-all active" data-filter="all">Tất cả</button>
                            <button class="btn-saved" data-filter="saved">Đã lưu</button>
                        </div>
                    </div>
                </div>
                <div class="list-grid" id="vocabularyGrid">
                    <?php foreach ($flashcards as $card): ?>
                        <div class="vocab-item" data-id="<?php echo esc_attr($card->id); ?>">
                            <div class="vocab-content">
                                <span class="vocab-kanji"><?php echo esc_html($card->term); ?></span>
                                <span class="vocab-reading"><?php echo esc_html($card->definition); ?></span>
                            </div>
                            <div class="vocab-actions">
                                <button class="action-button bookmark-button" data-id="<?php echo esc_attr($card->id); ?>">
                                    <div class="bookmark-icon-circle">
                                        <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>
            <div class="learn-flashcard-data" style="display: none;">
                <?php foreach ($flashcards as $index => $card): ?>
                    <div class="learn-flashcard-item" data-index="<?php echo esc_attr($index); ?>" data-id="<?php echo esc_attr($card->id); ?>">
                        <div class="learn-flashcard-inner">
                            <div class="learn-flashcard-front"><p class="learn-term"><?php echo esc_html($card->term); ?></p></div>
                            <div class="learn-flashcard-back"><p class="learn-definition"><?php echo esc_html($card->definition); ?></p></div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('tora_flashcard', 'tora_flashcard_shortcode');

add_filter('learndash_content', function($content, $post) {
    if ($post->post_type === 'sfwd-topic' && has_shortcode($content, 'tora_flashcard')) {
        $content = do_shortcode($content);
    }
    return $content;
}, 10, 2);

function tora_flashcard_shortcode_scripts() {
    if (!is_page() && !is_single() && !is_singular('sfwd-topic')) return;
    if (!defined('TORA_FLASHCARD_PATH') || !defined('TORA_FLASHCARD_URL')) return;

    wp_enqueue_style('font-awesome-cdn', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css', [], '6.7.2');
    if (file_exists(TORA_FLASHCARD_PATH . 'assets/css/all.min.css')) {
        wp_enqueue_style('font-awesome-local', TORA_FLASHCARD_URL . 'assets/css/all.min.css', ['font-awesome-cdn'], '6.7.2');
    }

    $css_files = [
        'flashcard-base' => 'flashcard-base.css',
        'flashcard-controls' => 'flashcard-controls.css',
        'flashcard-learning-modes' => 'flashcard-learning-modes.css',
        'flashcard-vocabulary' => 'flashcard-vocabulary.css',
        'learn-new-words' => 'learn-new-words.css',
        'quiz' => 'quiz.css',
        'single-choice' => 'single-choice.css',
        'true-false' => 'true-false.css',
        'match' => 'match.css',
    ];
    foreach ($css_files as $handle => $file) {
        $file_path = TORA_FLASHCARD_PATH . 'assets/css/' . $file;
        $file_url = TORA_FLASHCARD_URL . 'assets/css/' . $file;
        if (file_exists($file_path)) {
            wp_enqueue_style("tora-{$handle}-styles", $file_url, [], '1.4.10');
        }
    }

    // Load flashcard.js trước
    $base_handle = 'tora-flashcard-scripts';
    $base_file = 'flashcard.js';
    $base_path = TORA_FLASHCARD_PATH . 'assets/js/' . $base_file;
    $base_url = TORA_FLASHCARD_URL . 'assets/js/' . $base_file;
    if (file_exists($base_path)) {
        wp_enqueue_script($base_handle, $base_url, ['jquery'], '1.4.8', true);
    }

    // Các JS phụ thuộc
    $js_files = [
        'quiz' => 'quiz.js',
        'single-choice' => 'single-choice.js',
        'true-false' => 'true-false.js',
        'match' => 'match.js',
        'flashcard-match' => 'flashcard-match.js',
        'reflex-training' => 'reflex-training.js',
    ];
    foreach ($js_files as $handle => $file) {
        $file_path = TORA_FLASHCARD_PATH . 'assets/js/' . $file;
        $file_url = TORA_FLASHCARD_URL . 'assets/js/' . $file;
        if (file_exists($file_path)) {
            $deps = [$base_handle];
            if (in_array($handle, ['single-choice', 'true-false', 'match', 'reflex-training'])) {
                $deps[] = 'tora-quiz-scripts';
            }
            wp_enqueue_script("tora-{$handle}-scripts", $file_url, $deps, '1.4.8', true);
        }
    }

    wp_localize_script('tora-flashcard-scripts', 'toraFlashcardData', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('tora_flashcard_nonce'),
        'msg_confirm_delete' => __('Bạn có chắc chắn muốn xóa không?', 'tora-flashcard'),
        'msg_delete_success' => __('Xóa thành công!', 'tora-flashcard'),
        'msg_delete_fail' => __('Xóa thất bại: ', 'tora-flashcard'),
        'msg_ajax_error' => __('Lỗi kết nối. Vui lòng thử lại.', 'tora-flashcard'),
        'msg_update_success' => __('Cập nhật thành công!', 'tora-flashcard'),
        'msg_update_fail' => __('Cập nhật thất bại: ', 'tora-flashcard'),
        'msg_set_update_success' => __('Cập nhật bộ flashcard thành công!', 'tora-flashcard'),
        'msg_set_update_fail' => __('Cập nhật bộ flashcard thất bại: ', 'tora-flashcard'),
        'msg_set_delete_success' => __('Xóa bộ flashcard thành công!', 'tora-flashcard'),
        'msg_set_delete_fail' => __('Xóa bộ flashcard thất bại: ', 'tora-flashcard'),
        'text_show_flashcards' => __('Hiển thị Flashcards', 'tora-flashcard'),
        'text_hide_flashcards' => __('Ẩn Flashcards', 'tora-flashcard'),
    ]);
}
add_action('wp_enqueue_scripts', 'tora_flashcard_shortcode_scripts');
?>