<?php
// wp-content/plugins/tora-flashcard/includes/admin.php

if (!defined('ABSPATH')) {
    exit;
}

function tora_flashcard_admin_menu() {
    add_menu_page(
        __('Tora Flashcard', 'tora-flashcard'),
        __('Tora Flashcard', 'tora-flashcard'),
        'manage_options',
        'tora-flashcard',
        'tora_flashcard_admin_page',
        'dashicons-book',
        30
    );
}
add_action('admin_menu', 'tora_flashcard_admin_menu');

function tora_flashcard_admin_page() {
    global $wpdb;
    $table_sets = $wpdb->prefix . 'tora_flashcard_sets';
    $table_cards = $wpdb->prefix . 'tora_flashcards';

    if (!current_user_can('manage_options')) {
        wp_die(__('Bạn không có quyền truy cập trang này.', 'tora-flashcard'));
    }

    if ($wpdb->get_var("SHOW TABLES LIKE '$table_sets'") != $table_sets) {
        echo '<div class="notice notice-error"><p>' . esc_html__('Bảng bộ flashcard không tồn tại.', 'tora-flashcard') . '</p></div>';
        return;
    }
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_cards'") != $table_cards) {
        echo '<div class="notice notice-error"><p>' . esc_html__('Bảng flashcard không tồn tại.', 'tora-flashcard') . '</p></div>';
        return;
    }

    // Xử lý tạo bộ flashcard
    if (isset($_POST['tora_create_set']) && check_admin_referer('tora_save_set')) {
        $name = sanitize_text_field($_POST['tora_set_name']);
        $description = sanitize_textarea_field($_POST['tora_set_description']);
        $course_id = absint($_POST['tora_course_id']);
        if ($name) {
            $result = $wpdb->insert($table_sets, [
                'name' => $name,
                'description' => $description,
                'course_id' => $course_id,
            ]);
            if ($result === false) {
                echo '<div class="notice notice-error"><p>' . esc_html__('Lỗi khi tạo bộ flashcard: ', 'tora-flashcard') . esc_html($wpdb->last_error) . '</p></div>';
            } else {
                echo '<div class="notice notice-success"><p>' . esc_html__('Đã tạo bộ flashcard!', 'tora-flashcard') . '</p></div>';
            }
        } else {
            echo '<div class="notice notice-error"><p>' . esc_html__('Vui lòng nhập tên bộ flashcard!', 'tora-flashcard') . '</p></div>';
        }
    }

    // Xử lý nhập nhanh flashcard
    if (isset($_POST['tora_bulk_add_card']) && check_admin_referer('tora_bulk_save_card')) {
        $set_id = absint($_POST['tora_bulk_card_set_id']);
        $bulk_data = sanitize_textarea_field($_POST['tora_bulk_cards']);
        if ($set_id && $bulk_data) {
            $lines = explode("\n", $bulk_data);
            $success_count = 0;
            $errors = [];
            $existing_terms = $wpdb->get_col($wpdb->prepare("SELECT term FROM $table_cards WHERE set_id = %d", $set_id));
            foreach ($lines as $index => $line) {
                $line = trim($line);
                if (empty($line)) continue;
                $parts = explode('|', $line);
                if (count($parts) < 2) {
                    $errors[] = sprintf(__('Dòng %d: Định dạng không hợp lệ (yêu cầu thuật ngữ|định nghĩa).', 'tora-flashcard'), $index + 1);
                    continue;
                }
                $term = sanitize_text_field(trim($parts[0]));
                $definition = sanitize_textarea_field(trim($parts[1]));
                if (empty($term) || empty($definition)) {
                    $errors[] = sprintf(__('Dòng %d: Thiếu thuật ngữ hoặc định nghĩa.', 'tora-flashcard'), $index + 1);
                    continue;
                }
                if (in_array($term, $existing_terms)) {
                    $errors[] = sprintf(__('Dòng %d: Thuật ngữ "%s" đã tồn tại trong bộ.', 'tora-flashcard'), $index + 1, $term);
                    continue;
                }
                $result = $wpdb->insert($table_cards, [
                    'set_id' => $set_id,
                    'term' => $term,
                    'definition' => $definition,
                ]);
                if ($result !== false) {
                    $success_count++;
                    $existing_terms[] = $term;
                } else {
                    $errors[] = sprintf(__('Dòng %d: Lỗi khi thêm: %s', 'tora-flashcard'), $index + 1, $wpdb->last_error);
                }
            }
            if ($success_count > 0) {
                echo '<div class="notice notice-success"><p>' . sprintf(esc_html__('Đã thêm %d flashcard!', 'tora-flashcard'), $success_count) . '</p></div>';
            }
            if (!empty($errors)) {
                echo '<div class="notice notice-error"><p>' . esc_html__('Lỗi:', 'tora-flashcard') . '<ul><li>' . implode('</li><li>', array_map('esc_html', $errors)) . '</li></ul></p></div>';
            }
            if ($success_count === 0 && empty($errors)) {
                echo '<div class="notice notice-error"><p>' . esc_html__('Không có flashcard nào được thêm. Kiểm tra định dạng dữ liệu!', 'tora-flashcard') . '</p></div>';
            }
        } else {
            echo '<div class="notice notice-error"><p>' . esc_html__('Vui lòng chọn bộ flashcard và nhập dữ liệu!', 'tora-flashcard') . '</p></div>';
        }
    }

    // Xử lý nhập flashcard đơn lẻ
    if (isset($_POST['tora_add_card']) && check_admin_referer('tora_save_card')) {
        $set_id = absint($_POST['tora_card_set_id']);
        $term = sanitize_text_field($_POST['tora_term']);
        $definition = sanitize_textarea_field($_POST['tora_definition']);
        if ($set_id && $term && $definition) {
            $existing_term = $wpdb->get_var($wpdb->prepare("SELECT term FROM $table_cards WHERE set_id = %d AND term = %s", $set_id, $term));
            if ($existing_term) {
                echo '<div class="notice notice-error"><p>' . sprintf(esc_html__('Thuật ngữ "%s" đã tồn tại trong bộ.', 'tora-flashcard'), esc_html($term)) . '</p></div>';
            } else {
                $result = $wpdb->insert($table_cards, [
                    'set_id' => $set_id,
                    'term' => $term,
                    'definition' => $definition,
                ]);
                if ($result === false) {
                    echo '<div class="notice notice-error"><p>' . esc_html__('Lỗi khi thêm flashcard: ', 'tora-flashcard') . esc_html($wpdb->last_error) . '</p></div>';
                } else {
                    echo '<div class="notice notice-success"><p>' . esc_html__('Đã thêm flashcard!', 'tora-flashcard') . '</p></div>';
                }
            }
        } else {
            echo '<div class="notice notice-error"><p>' . esc_html__('Vui lòng chọn bộ flashcard và nhập đầy đủ thông tin!', 'tora-flashcard') . '</p></div>';
        }
    }

    $sets = $wpdb->get_results("SELECT * FROM $table_sets");
    $flashcards_by_set = [];
    if ($sets) {
        foreach ($sets as $set) {
            $flashcards = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table_cards WHERE set_id = %d ORDER BY created_at DESC", $set->id));
            $flashcards_by_set[$set->id] = $flashcards;
        }
    }
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Tora Flashcard', 'tora-flashcard'); ?></h1>

        <!-- Tạo bộ flashcard -->
        <h2><?php esc_html_e('Tạo Bộ Flashcard', 'tora-flashcard'); ?></h2>
        <form method="post">
            <?php wp_nonce_field('tora_save_set'); ?>
            <p>
                <label for="tora_set_name"><?php esc_html_e('Tên bộ:', 'tora-flashcard'); ?></label><br>
                <input type="text" id="tora_set_name" name="tora_set_name" class="modal-input">
            </p>
            <p>
                <label for="tora_set_description"><?php esc_html_e('Mô tả:', 'tora-flashcard'); ?></label><br>
                <textarea id="tora_set_description" name="tora_set_description" class="modal-textarea"></textarea>
            </p>
            <p>
                <label for="tora_course_id"><?php esc_html_e('Khóa học LearnDash:', 'tora-flashcard'); ?></label><br>
                <select id="tora_course_id" name="tora_course_id" class="modal-input">
                    <option value=""><?php esc_html_e('Chọn khóa học', 'tora-flashcard'); ?></option>
                    <?php
                    $courses = get_posts(array('post_type' => 'sfwd-courses', 'posts_per_page' => -1));
                    foreach ($courses as $course) {
                        echo '<option value="' . esc_attr($course->ID) . '">' . esc_html($course->post_title) . '</option>';
                    }
                    ?>
                </select>
            </p>
            <p>
                <input type="submit" name="tora_create_set" class="button button-primary" value="<?php esc_attr_e('Tạo Bộ Flashcard', 'tora-flashcard'); ?>">
            </p>
        </form>

        <!-- Nhập nhanh flashcard -->
        <h2><?php esc_html_e('Nhập Nhanh Flashcard', 'tora-flashcard'); ?></h2>
        <form method="post">
            <?php wp_nonce_field('tora_bulk_save_card'); ?>
            <p>
                <label for="tora_bulk_card_set_id"><?php esc_html_e('Bộ Flashcard:', 'tora-flashcard'); ?></label><br>
                <select id="tora_bulk_card_set_id" name="tora_bulk_card_set_id" class="modal-input">
                    <option value=""><?php esc_html_e('Chọn bộ flashcard', 'tora-flashcard'); ?></option>
                    <?php
                    if ($sets) {
                        foreach ($sets as $set) {
                            echo '<option value="' . esc_attr($set->id) . '">' . esc_html($set->name) . '</option>';
                        }
                    } else {
                        echo '<option value="" disabled>' . esc_html__('Chưa có bộ flashcard', 'tora-flashcard') . '</option>';
                    }
                    ?>
                </select>
            </p>
            <p>
                <label for="tora_bulk_cards"><?php esc_html_e('Danh sách Flashcard (mỗi dòng: thuật ngữ|định nghĩa):', 'tora-flashcard'); ?></label><br>
                <textarea id="tora_bulk_cards" name="tora_bulk_cards" class="modal-textarea" placeholder="thuật ngữ 1|định nghĩa 1\nthuật ngữ 2|định nghĩa 2"></textarea>
            </p>
            <p>
                <input type="submit" name="tora_bulk_add_card" class="button button-primary" value="<?php esc_attr_e('Nhập Nhanh Flashcard', 'tora-flashcard'); ?>">
            </p>
        </form>

        <!-- Nhập flashcard đơn lẻ -->
        <h2><?php esc_html_e('Thêm Flashcard', 'tora-flashcard'); ?></h2>
        <form method="post">
            <?php wp_nonce_field('tora_save_card'); ?>
            <p>
                <label for="tora_card_set_id"><?php esc_html_e('Bộ Flashcard:', 'tora-flashcard'); ?></label><br>
                <select id="tora_card_set_id" name="tora_card_set_id" class="modal-input">
                    <option value=""><?php esc_html_e('Chọn bộ flashcard', 'tora-flashcard'); ?></option>
                    <?php
                    if ($sets) {
                        foreach ($sets as $set) {
                            echo '<option value="' . esc_attr($set->id) . '">' . esc_html($set->name) . '</option>';
                        }
                    } else {
                        echo '<option value="" disabled>' . esc_html__('Chưa có bộ flashcard', 'tora-flashcard') . '</option>';
                    }
                    ?>
                </select>
            </p>
            <p>
                <label for="tora_term"><?php esc_html_e('Thuật ngữ:', 'tora-flashcard'); ?></label><br>
                <input type="text" id="tora_term" name="tora_term" class="modal-input">
            </p>
            <p>
                <label for="tora_definition"><?php esc_html_e('Định nghĩa:', 'tora-flashcard'); ?></label><br>
                <textarea id="tora_definition" name="tora_definition" class="modal-textarea"></textarea>
            </p>
            <p>
                <input type="submit" name="tora_add_card" class="button button-primary" value="<?php esc_attr_e('Thêm Flashcard', 'tora-flashcard'); ?>">
            </p>
        </form>

        <!-- Danh sách bộ flashcard -->
        <h2><?php esc_html_e('Danh sách Bộ Flashcard', 'tora-flashcard'); ?></h2>
        <div class="flashcard-set-filter">
            <label for="flashcard-set-filter"><?php esc_html_e('Tìm kiếm theo tên hoặc ID:', 'tora-flashcard'); ?></label>
            <input type="text" id="flashcard-set-filter" class="filter-input" placeholder="<?php esc_attr_e('Nhập tên hoặc ID bộ flashcard', 'tora-flashcard'); ?>">
            <button type="button" class="filter-clear button"><?php esc_html_e('Xóa bộ lọc', 'tora-flashcard'); ?></button>
        </div>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th><?php esc_html_e('Tên bộ', 'tora-flashcard'); ?></th>
                    <th><?php esc_html_e('ID', 'tora-flashcard'); ?></th>
                    <th><?php esc_html_e('Mô tả', 'tora-flashcard'); ?></th>
                    <th><?php esc_html_e('Khóa học', 'tora-flashcard'); ?></th>
                    <th><?php esc_html_e('Flashcards', 'tora-flashcard'); ?></th>
                    <th><?php esc_html_e('Hành động', 'tora-flashcard'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php
                if ($sets) {
                    foreach ($sets as $set) {
                        $course = get_post($set->course_id);
                        ?>
                        <tr data-set-id="<?php echo esc_attr($set->id); ?>" data-name="<?php echo esc_attr($set->name); ?>">
                            <td><?php echo esc_html($set->name); ?></td>
                            <td><?php echo esc_html($set->id); ?></td>
                            <td><?php echo esc_html($set->description); ?></td>
                            <td><?php echo $course ? esc_html($course->post_title) : esc_html__('Không có', 'tora-flashcard'); ?></td>
                            <td>
                                <button class="toggle-flashcards" data-set-id="<?php echo esc_attr($set->id); ?>">
                                    <?php esc_html_e('Hiển thị Flashcards', 'tora-flashcard'); ?>
                                </button>
                                <div class="flashcard-list" id="flashcard-list-<?php echo esc_attr($set->id); ?>" style="display: none;">
                                    <?php
                                    if (!empty($flashcards_by_set[$set->id])) {
                                        echo '<table class="wp-list-table widefat fixed striped nested-table">';
                                        echo '<thead><tr><th>' . esc_html__('Thuật ngữ', 'tora-flashcard') . '</th><th>' . esc_html__('Định nghĩa', 'tora-flashcard') . '</th><th>' . esc_html__('Hành động', 'tora-flashcard') . '</th></tr></thead>';
                                        echo '<tbody>';
                                        foreach ($flashcards_by_set[$set->id] as $card) {
                                            echo '<tr>';
                                            echo '<td>' . esc_html($card->term) . '</td>';
                                            echo '<td>' . esc_html($card->definition) . '</td>';
                                            echo '<td>';
                                            echo '<a href="#" class="edit-card" data-id="' . esc_attr($card->id) . '" data-term="' . esc_attr($card->term) . '" data-definition="' . esc_attr($card->definition) . '">' . esc_html__('Chỉnh sửa', 'tora-flashcard') . '</a> | ';
                                            echo '<a href="#" class="delete-card" data-id="' . esc_attr($card->id) . '">' . esc_html__('Xóa', 'tora-flashcard') . '</a>';
                                            echo '</td>';
                                            echo '</tr>';
                                        }
                                        echo '</tbody>';
                                        echo '</table>';
                                    } else {
                                        echo esc_html__('Chưa có flashcard', 'tora-flashcard');
                                    }
                                    ?>
                                </div>
                            </td>
                            <td>
                                <a href="#" class="edit-set" data-id="<?php echo esc_attr($set->id); ?>" data-name="<?php echo esc_attr($set->name); ?>" data-description="<?php echo esc_attr($set->description); ?>" data-course-id="<?php echo esc_attr($set->course_id); ?>"><?php esc_html_e('Chỉnh sửa', 'tora-flashcard'); ?></a> | 
                                <a href="#" class="delete-set" data-id="<?php echo esc_attr($set->id); ?>"><?php esc_html_e('Xóa', 'tora-flashcard'); ?></a>
                            </td>
                        </tr>
                        <?php
                    }
                } else {
                    echo '<tr><td colspan="6">' . esc_html__('Chưa có bộ flashcard nào.', 'tora-flashcard') . '</td></tr>';
                }
                ?>
            </tbody>
        </table>

        <!-- Modal cho chỉnh sửa bộ flashcard -->
        <div id="editModal" class="tora-modal">
            <div class="tora-modal-content">
                <h3><?php esc_html_e('Chỉnh sửa Bộ Flashcard', 'tora-flashcard'); ?></h3>
                <form id="editSetForm">
                    <input type="hidden" id="edit_set_id" name="id">
                    <p>
                        <label for="edit_set_name"><?php esc_html_e('Tên bộ:', 'tora-flashcard'); ?></label><br>
                        <input type="text" id="edit_set_name" name="name" class="modal-input">
                    </p>
                    <p>
                        <label for="edit_set_description"><?php esc_html_e('Mô tả:', 'tora-flashcard'); ?></label><br>
                        <textarea id="edit_set_description" name="description" class="modal-textarea"></textarea>
                    </p>
                    <p>
                        <label for="edit_set_course_id"><?php esc_html_e('Khóa học:', 'tora-flashcard'); ?></label><br>
                        <select id="edit_set_course_id" name="course_id" class="modal-input">
                            <option value=""><?php esc_html_e('Chọn khóa học', 'tora-flashcard'); ?></option>
                            <?php
                            $courses = get_posts(array('post_type' => 'sfwd-courses', 'posts_per_page' => -1));
                            foreach ($courses as $course) {
                                echo '<option value="' . esc_attr($course->ID) . '">' . esc_html($course->post_title) . '</option>';
                            }
                            ?>
                        </select>
                    </p>
                    <p>
                        <button type="submit" class="button button-primary"><?php esc_html_e('Lưu', 'tora-flashcard'); ?></button>
                        <button type="button" id="closeSetModal" class="button"><?php esc_html_e('Đóng', 'tora-flashcard'); ?></button>
                    </p>
                </form>
            </div>
        </div>

        <!-- Modal cho chỉnh sửa flashcard -->
        <div id="editCardModal" class="tora-modal">
            <div class="tora-modal-content">
                <h3><?php esc_html_e('Chỉnh sửa Flashcard', 'tora-flashcard'); ?></h3>
                <form id="editCardForm">
                    <input type="hidden" id="edit_card_id" name="id">
                    <p>
                        <label for="edit_term"><?php esc_html_e('Thuật ngữ:', 'tora-flashcard'); ?></label><br>
                        <input type="text" id="edit_term" name="term" class="modal-input">
                    </p>
                    <p>
                        <label for="edit_definition"><?php esc_html_e('Định nghĩa:', 'tora-flashcard'); ?></label><br>
                        <textarea id="edit_definition" name="definition" class="modal-textarea"></textarea>
                    </p>
                    <p>
                        <button type="submit" class="button button-primary"><?php esc_html_e('Lưu', 'tora-flashcard'); ?></button>
                        <button type="button" id="closeCardModal" class="button"><?php esc_html_e('Đóng', 'tora-flashcard'); ?></button>
                    </p>
                </form>
            </div>
        </div>
    </div>
    <?php
}

function tora_flashcard_admin_scripts() {
    if (isset($_GET['page']) && $_GET['page'] === 'tora-flashcard') {
        wp_enqueue_script('jquery');
        if (file_exists(TORA_FLASHCARD_PATH . 'assets/css/admin.css')) {
            wp_enqueue_style('tora-admin-styles', TORA_FLASHCARD_URL . 'assets/css/admin.css', array(), '1.4.1');
        } else {
            error_log('Tora Flashcard: File admin.css không tồn tại.');
        }
        if (file_exists(TORA_FLASHCARD_PATH . 'assets/js/admin.js')) {
            wp_enqueue_script('tora-admin-scripts', TORA_FLASHCARD_URL . 'assets/js/admin.js', array('jquery'), '1.4.1', true);
            wp_localize_script('tora-admin-scripts', 'toraFlashcardData', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('tora_flashcard_nonce'),
                'text_show_flashcards' => __('Hiển thị Flashcards', 'tora-flashcard'),
                'text_hide_flashcards' => __('Ẩn Flashcards', 'tora-flashcard'),
                'text_no_course' => __('Không có', 'tora-flashcard'),
                'msg_update_success' => __('Cập nhật flashcard thành công!', 'tora-flashcard'),
                'msg_update_fail' => __('Cập nhật flashcard thất bại: ', 'tora-flashcard'),
                'msg_delete_success' => __('Xóa flashcard thành công!', 'tora-flashcard'),
                'msg_delete_fail' => __('Xóa flashcard thất bại: ', 'tora-flashcard'),
                'msg_set_update_success' => __('Cập nhật bộ flashcard thành công!', 'tora-flashcard'),
                'msg_set_update_fail' => __('Cập nhật bộ flashcard thất bại: ', 'tora-flashcard'),
                'msg_set_delete_success' => __('Xóa bộ flashcard và dữ liệu liên quan thành công!', 'tora-flashcard'),
                'msg_set_delete_fail' => __('Xóa bộ flashcard thất bại: ', 'tora-flashcard'),
                'msg_ajax_error' => __('Lỗi kết nối. Vui lòng thử lại.', 'tora-flashcard'),
                'msg_confirm_delete' => __('Bạn có chắc muốn xóa flashcard này?', 'tora-flashcard'),
                'msg_confirm_set_delete' => __('Bạn có chắc muốn xóa bộ flashcard này?', 'tora-flashcard'),
            ));
        } else {
            error_log('Tora Flashcard: File admin.js không tồn tại.');
        }
    }
}
add_action('admin_enqueue_scripts', 'tora_flashcard_admin_scripts');
?>
