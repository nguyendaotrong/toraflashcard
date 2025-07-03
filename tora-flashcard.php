<?php
/*
Plugin Name: Tora Flashcard
Description: A plugin to add flashcard and quiz functionality to LearnDash topics, compatible with BuddyBoss theme.
Version: 1.4.0
Author: Your Name
Text Domain: tora-flashcard
Domain Path: /languages
*/

// Ngăn truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Định nghĩa hằng số
define('TORA_FLASHCARD_PATH', plugin_dir_path(__FILE__));
define('TORA_FLASHCARD_URL', plugin_dir_url(__FILE__));

// Tải class chính
require_once TORA_FLASHCARD_PATH . 'includes/class-tora-flashcard.php';

// Khởi tạo plugin
function tora_flashcard_init() {
    $plugin = new Tora_Flashcard();
    $plugin->init();
}
add_action('plugins_loaded', 'tora_flashcard_init');
?>
