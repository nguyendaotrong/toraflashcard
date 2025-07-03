<?php
if (!defined('ABSPATH')) {
    exit;
}

class Tora_Flashcard {
    public function init() {
        // Tải các file chức năng
        require_once TORA_FLASHCARD_PATH . 'includes/database.php';
        require_once TORA_FLASHCARD_PATH . 'includes/shortcode.php';
        require_once TORA_FLASHCARD_PATH . 'includes/admin.php';
        require_once TORA_FLASHCARD_PATH . 'includes/ajax.php';

        // Đăng ký hook kích hoạt
        register_activation_hook(TORA_FLASHCARD_PATH . 'tora-flashcard.php', [$this, 'activate']);

        // Tải text domain
        add_action('init', [$this, 'load_textdomain']);
    }

    public function activate() {
        require_once TORA_FLASHCARD_PATH . 'includes/database.php';
        tora_flashcard_activate();
    }

    public function load_textdomain() {
        load_plugin_textdomain('tora-flashcard', false, dirname(plugin_basename(TORA_FLASHCARD_PATH)) . '/languages');
    }
}
?>
